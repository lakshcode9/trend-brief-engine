// src/trends/index.js — Trend Signal Module entry point
// Can be run standalone: node src/trends/index.js --niche "AI in healthcare"
import { fetchGoogleTrends } from './googleTrends.js';
import { fetchRedditSignals } from './redditSignals.js';
import { mergeAndScoreSignals } from './merger.js';
import { getNiche } from '../utils/config.js';
import logger from '../utils/logger.js';
import minimist from 'minimist';

/**
 * Full trend signal pipeline for a niche.
 * Returns top 5 scored trends as structured JSON.
 */
export async function getTrendSignals(nicheName) {
  const niche = getNiche(nicheName);
  logger.info(`\n${'='.repeat(60)}`);
  logger.info(`TREND SIGNAL MODULE — "${niche.name}"`);
  logger.info(`${'='.repeat(60)}`);

  // Layer A: Google Trends
  logger.info(`\n--- Layer A: Google Trends ---`);
  const googleSignals = await fetchGoogleTrends(niche.name);

  // Layer B: Reddit Signals
  logger.info(`\n--- Layer B: Reddit Signals ---`);
  const redditSignals = await fetchRedditSignals(niche.name, niche.subreddits);

  // Merge and score
  logger.info(`\n--- Merging Signals ---`);
  const topTrends = mergeAndScoreSignals(googleSignals, redditSignals, 5);

  return {
    niche: niche.name,
    slug: niche.slug,
    timestamp: new Date().toISOString(),
    trendCount: topTrends.length,
    trends: topTrends
  };
}


