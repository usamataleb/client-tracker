const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app      = express();
const PORT     = 3000;
const DATA_FILE = path.join(__dirname, 'clients.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Seed data if clients.json doesn't exist yet
const SEED = [
  { id: 'client_001', name: 'Promoting Women in Tourism', handle: '@promotingwomenintourism', channel: 'Instagram', url: '', contact: '', status: 'new', weak: '', notes: '', score: 3, date: '2026-06-07' },
  { id: 'client_002', name: 'CHRRASDA',                   handle: '@chrrasda',               channel: 'LinkedIn',  url: '', contact: '', status: 'new', weak: '', notes: 'Center for Human Rights Research and Advocacy for Sustainable Development in Africa', score: 3, date: '2026-06-07' },
  { id: 'client_003', name: 'NAD Zanzibar',               handle: '@nad_zanzibar',           channel: 'Instagram', url: '', contact: '', status: 'new', weak: '', notes: '', score: 3, date: '2026-06-07' },
  { id: 'client_004', name: 'Zayorio Znz',                handle: '@zayorio_znz',            channel: 'Instagram', url: '', contact: '', status: 'new', weak: '', notes: '', score: 3, date: '2026-06-07' },
];

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
  console.log('✓ Created clients.json with seed data');
}

// GET all clients
app.get('/api/clients', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Could not read clients.json' });
  }
});

// POST save all clients (full replace — auto-save on every change)
app.post('/api/clients', (req, res) => {
  try {
    const clients = req.body;
    if (!Array.isArray(clients)) return res.status(400).json({ error: 'Expected array' });
    fs.writeFileSync(DATA_FILE, JSON.stringify(clients, null, 2));
    res.json({ ok: true, saved: clients.length });
  } catch (e) {
    res.status(500).json({ error: 'Could not write clients.json' });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ ClientTrack running → http://localhost:${PORT}`);
  console.log(`📁 Data file          → ${DATA_FILE}\n`);
});
