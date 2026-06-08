const express = require('express');
const fs      = require('fs');
const path    = require('path');
const dotenv  = require('dotenv');
dotenv.config();


const app      = express();
const PORT     = Number(process.env.PORT) || 3000;

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const configuredJson = process.env.JSON_URL;
const REMOTE_JSON_URL = isHttpUrl(configuredJson) ? configuredJson : null;
const DATA_FILE = REMOTE_JSON_URL ? null : path.resolve(__dirname, configuredJson || 'clients.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Seed data if clients.json doesn't exist yet
const SEED = [
  { id: 'client_001', name: 'Promoting Women in Tourism', handle: '@promotingwomenintourism', channel: 'Instagram', url: '', contact: '', status: 'new', weak: '', notes: '', score: 3, date: '2026-06-07' },
  { id: 'client_002', name: 'CHRRASDA',                   handle: '@chrrasda',               channel: 'LinkedIn',  url: '', contact: '', status: 'new', weak: '', notes: 'Center for Human Rights Research and Advocacy for Sustainable Development in Africa', score: 3, date: '2026-06-07' },
  { id: 'client_003', name: 'NAD Zanzibar',               handle: '@nad_zanzibar',           channel: 'Instagram', url: '', contact: '', status: 'new', weak: '', notes: '', score: 3, date: '2026-06-07' },
  { id: 'client_004', name: 'Zayorio Znz',                handle: '@zayorio_znz',            channel: 'Instagram', url: '', contact: '', status: 'new', weak: '', notes: '', score: 3, date: '2026-06-07' },
];

async function ensureDataFile() {
  if (REMOTE_JSON_URL) return;
  if (fs.existsSync(DATA_FILE)) return;

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
  console.log(`✓ Created ${path.basename(DATA_FILE)} with seed data`);
}

async function readClients() {
  if (REMOTE_JSON_URL) {
    const remoteRes = await fetch(REMOTE_JSON_URL);
    if (!remoteRes.ok) throw new Error(`HTTP ${remoteRes.status}`);

    const clients = await remoteRes.json();
    if (!Array.isArray(clients)) throw new Error('remote JSON is not an array');
    return clients;
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

async function writeClients(clients) {
  if (REMOTE_JSON_URL) {
    const remoteRes = await fetch(REMOTE_JSON_URL, {
      method: process.env.JSON_WRITE_METHOD || 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clients, null, 2),
    });

    if (!remoteRes.ok) throw new Error(`HTTP ${remoteRes.status}`);
    return;
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(clients, null, 2));
}

// GET all clients
app.get('/api/clients', async (req, res) => {
  try {
    res.json(await readClients());
  } catch (e) {
    res.status(500).json({ error: 'Could not read clients JSON', detail: e.message });
  }
});

// POST save all clients (full replace — auto-save on every change)
app.post('/api/clients', async (req, res) => {
  try {
    const clients = req.body;
    if (!Array.isArray(clients)) return res.status(400).json({ error: 'Expected array' });
    await writeClients(clients);
    res.json({ ok: true, saved: clients.length });
  } catch (e) {
    res.status(500).json({ error: 'Could not write clients JSON', detail: e.message });
  }
});

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n✅ ClientTrack running → http://localhost:${PORT}`);
      if (REMOTE_JSON_URL) {
        console.log(`🌐 JSON source         → ${REMOTE_JSON_URL}`);
        console.log(`✍️  JSON write method  → ${process.env.JSON_WRITE_METHOD || 'PUT'}\n`);
      } else {
        console.log(`📁 Data file          → ${DATA_FILE}\n`);
      }
    });
  })
  .catch((e) => {
    console.error('Could not start server');
    console.error(e);
    process.exit(1);
  });
