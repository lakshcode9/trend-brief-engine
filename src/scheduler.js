// src/scheduler.js — Cron scheduler for autonomous runs
import cron from 'node-cron';
import { loadNiches } from './utils/config.js';
import logger from './utils/logger.js';
import { runPipeline } from '../run.js';

// Every Monday at 6:00 AM server time
const SCHEDULE = '0 6 * * 1';

logger.info(`[Scheduler] Starting BriefEdge cron scheduler`);
logger.info(`[Scheduler] Schedule: ${SCHEDULE} (Every Monday 6 AM)`);

cron.schedule(SCHEDULE, async () => {
  logger.info(`\n${'═'.repeat(60)}`);
  logger.info(`[Scheduler] Weekly run triggered at ${new Date().toISOString()}`);
  logger.info(`${'═'.repeat(60)}`);

  const niches = loadNiches().filter(n => n.active);
  logger.info(`[Scheduler] Processing ${niches.length} active niches`);

  for (const niche of niches) {
    try {
      logger.info(`\n[Scheduler] Starting pipeline for: "${niche.name}"`);
      await runPipeline(niche.name);
      logger.info(`[Scheduler] ✓ Completed: "${niche.name}"`);
    } catch (err) {
      logger.error(`[Scheduler] ✗ Failed: "${niche.name}" — ${err.message}`);
    }
  }

  logger.info(`\n[Scheduler] Weekly run complete at ${new Date().toISOString()}`);
});

logger.info(`[Scheduler] Cron job scheduled. Waiting for next Monday 6 AM...`);
