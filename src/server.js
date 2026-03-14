import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { loadNiches } from './utils/config.js';
import './scheduler.js'; // Start cron job


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Helper to read end of a file
function readLastLines(file, maxLines = 100) {
  try {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, 'utf-8');
    const lines = data.split('\n').filter(Boolean);
    return lines.slice(-maxLines);
  } catch (err) {
    return [`Error reading log: ${err.message}`];
  }
}

app.get('/api/status', (req, res) => {
  const niches = loadNiches();
  res.json({ niches, active: niches.filter(n => n.active).length });
});

app.get('/api/logs', (req, res) => {
  const logFile = path.join(__dirname, '../../logs/engine.log');
  const lines = readLastLines(logFile, 50);
  res.json({ logs: lines });
});

// Single active run tracking
let activeRun = null;

app.post('/api/run', (req, res) => {
  const { niche } = req.body;
  if (activeRun) {
    return res.status(400).json({ error: 'A run is already in progress.' });
  }

  const args = niche === 'all' ? ['run.js', '--all'] : ['run.js', '--niche', niche];
  
  activeRun = spawn('node', args, {
    cwd: path.join(__dirname, '../'),
    stdio: 'ignore' // It logs to engine.log anyway via winston
  });

  activeRun.on('exit', () => {
    activeRun = null;
  });

  res.json({ message: `Triggered run for ${niche}` });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Dashboard] Server running on port ${PORT}`);
});
