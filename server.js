const express = require('express');
const fs      = require('fs');
const path    = require('path');
const dotenv  = require('dotenv');
dotenv.config();


const app      = express();
const PORT     = Number(process.env.PORT) || 3000;
const LOCAL_JSON_PATH = process.env.LOCAL_JSON_PATH || 'clients.json';

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const configuredJson = process.env.JSON_URL;
const requestedSource = (process.env.DATA_SOURCE || '').toLowerCase();
const hasRemoteJson = isHttpUrl(configuredJson);
const localJsonFile = path.resolve(__dirname, LOCAL_JSON_PATH);
const useExistingLocalJson = requestedSource === 'local' && fs.existsSync(localJsonFile);
const USE_LOCAL_JSON = useExistingLocalJson || (!hasRemoteJson && requestedSource !== 'remote');
const REMOTE_JSON_URL = USE_LOCAL_JSON ? null : configuredJson;
const DATA_FILE = USE_LOCAL_JSON ? localJsonFile : path.resolve(__dirname, configuredJson || LOCAL_JSON_PATH);

if (!USE_LOCAL_JSON && !hasRemoteJson) {
  console.error('DATA_SOURCE=remote needs JSON_URL to be an http:// or https:// URL');
  process.exit(1);
}

if (requestedSource === 'local' && !useExistingLocalJson && hasRemoteJson) {
  console.warn(`⚠ Local JSON not found at ${localJsonFile}; using remote JSON instead`);
}

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
  if (!USE_LOCAL_JSON) return;
  if (fs.existsSync(DATA_FILE)) return;

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
  console.log(`✓ Created ${path.basename(DATA_FILE)} with seed data`);
}

async function readClients() {
  if (!USE_LOCAL_JSON) {
    const remoteRes = await fetch(REMOTE_JSON_URL);
    if (!remoteRes.ok) throw new Error(`HTTP ${remoteRes.status}`);

    const clients = await remoteRes.json();
    if (!Array.isArray(clients)) throw new Error('remote JSON is not an array');
    return clients;
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

async function writeClients(clients) {
  if (!USE_LOCAL_JSON) {
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
      if (!USE_LOCAL_JSON) {
        console.log(`🌐 JSON source         → ${REMOTE_JSON_URL}`);
        console.log(`✍️  JSON write method  → ${process.env.JSON_WRITE_METHOD || 'PUT'}\n`);
      } else {
        console.log('📌 JSON source         → local');
        console.log(`📁 Data file          → ${DATA_FILE}\n`);
      }
    });
  })
  .catch((e) => {
    console.error('Could not start server');
    console.error(e);
    process.exit(1);
  });
