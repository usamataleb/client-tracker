const express = require('express');
const path    = require('path');
const dotenv  = require('dotenv');
dotenv.config();


const app      = express();
const PORT     = Number(process.env.PORT) || 3000;

const PHP_URL    = process.env.PHP_URL;
const SECRET_KEY = process.env.SECRET_KEY 


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/clients → fetch from PHP on server
app.get('/api/clients', async (req, res) => {
  try {
    const r = await fetch(PHP_URL, {
      headers: { 'X-Secret-Key': SECRET_KEY }
    });
    if (!r.ok) throw new Error(`PHP responded ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error('GET error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clients → save to PHP on server
app.post('/api/clients', async (req, res) => {
  try {
    const r = await fetch(PHP_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-Secret-Key':  SECRET_KEY
      },
      body: JSON.stringify(req.body)
    });
    if (!r.ok) throw new Error(`PHP responded ${r.status}`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error('POST error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ ClientTrack running  → http://localhost:${PORT}`);
  console.log(`🌐 Remote data sync    → ${PHP_URL}\n`);
});
