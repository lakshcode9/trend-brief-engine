// src/utils/config.js — loads .env and niches.json
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

dotenv.config({ path: path.join(ROOT, '.env') });

export function loadNiches() {
  const raw = fs.readFileSync(path.join(ROOT, 'niches.json'), 'utf-8');
  return JSON.parse(raw);
}

export function getNiche(name) {
  const niches = loadNiches();
  const niche = niches.find(
    n => n.name.toLowerCase() === name.toLowerCase() || n.slug === name
  );
  if (!niche) throw new Error(`Niche not found: ${name}`);
  return niche;
}

export function getOutputDir(slug) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dir = path.join(ROOT, 'output', slug, ym);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const APIFY_API_KEY = process.env.APIFY_API_KEY;
export const GUMROAD_ACCESS_TOKEN = process.env.GUMROAD_ACCESS_TOKEN;
export const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
export { ROOT };
