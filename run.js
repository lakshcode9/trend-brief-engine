// run.js — Main orchestrator / CLI entry point
// Usage: node run.js --niche "AI in healthcare"
// Usage: node run.js --all        (runs all active niches)
// Usage: node run.js --scheduler  (starts cron mode)
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { getNiche, loadNiches, getOutputDir } from './src/utils/config.js';
import { getTrendSignals } from './src/trends/index.js';
import { buildResearchPrompts, fetchPerplexityResearch, parseResearchResponse, saveResearchResults } from './src/research/index.js';
import { generateMarketingCopy } from './src/gumroad/marketing.js';
import { generatePDF } from './src/report/index.js';
import { publishToGumroad } from './src/gumroad/index.js';
import logger from './src/utils/logger.js';

/**
 * Run the full pipeline for a single niche.
 * signal → research → generate → upload
 */
export async function runPipeline(nicheName) {
  const startTime = Date.now();
  const niche = getNiche(nicheName);
  
  logger.info(`\n${'═'.repeat(60)}`);
  logger.info(`BRIEFEDGE PIPELINE — "${niche.name}"`);
  logger.info(`${'═'.repeat(60)}`);

  // Step 1: Trend Signals
  logger.info(`\n📡 Step 1/4: Detecting trend signals...`);
  const trendSignals = await getTrendSignals(niche.name);
  
  // Save trends to output
  const outputDir = getOutputDir(niche.slug);
  const trendsPath = path.join(outputDir, 'trends.json');
  fs.writeFileSync(trendsPath, JSON.stringify(trendSignals, null, 2));
  logger.info(`Trends saved to ${trendsPath}`);

  // Step 2: Research via Perplexity
  logger.info(`\n🔬 Step 2/4: Deep research via Perplexity...`);
  const prompts = buildResearchPrompts(trendSignals);
  
  const researchedTrends = [];

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    logger.info(`   Researching Trend ${i + 1}/${prompts.length}: "${p.trend}"...`);
    
    // Fetch from Perplexity API
    const rawText = await fetchPerplexityResearch(p.prompt);
    
    // Parse into structured sections
    const structured = rawText 
      ? parseResearchResponse(p.trend, rawText)
      : { 
          trend: p.trend, 
          overview: 'Research failed to generate.',
          keyPlayers: 'N/A', marketSize: 'N/A', risks: 'N/A', threeMonthOutlook: 'N/A', monetization: 'N/A'
        };
        
    // Merge with original trend data
    researchedTrends.push({
      ...trendSignals.trends[i],
      ...structured
    });
    
    // Slight delay to be kind to API rate limits
    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const researchResults = {
    niche: niche.name,
    slug: niche.slug,
    generatedAt: new Date().toISOString(),
    trends: researchedTrends
  };

  saveResearchResults(niche.slug, researchResults);

  // Step 3: Marketing Copy
  logger.info(`\n✍️ Step 3/5: Generating high-converting sales copy...`);
  const marketingCopy = await generateMarketingCopy(researchResults);

  // Step 4: Generate PDF + Thumbnail
  logger.info(`\n📄 Step 4/5: Generating PDF report & thumbnail...`);
  const { pdfPath, thumbnailPath } = await generatePDF(researchResults);

  // Step 5: Publish to Gumroad
  logger.info(`\n🛒 Step 5/5: Publishing to Gumroad...`);
  const product = await publishToGumroad(niche.name, niche.slug, pdfPath, researchResults.trends, marketingCopy, thumbnailPath);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(`\n${'═'.repeat(60)}`);
  logger.info(`✅ PIPELINE COMPLETE — "${niche.name}" in ${duration}s`);
  logger.info(`   PDF: ${pdfPath}`);
  logger.info(`   Thumbnail: ${thumbnailPath}`);
  logger.info(`   Gumroad: ${product?.short_url || 'skipped'}`);
  logger.info(`${'═'.repeat(60)}\n`);

  return { pdfPath, thumbnailPath, product, duration };
}

// CLI entry point
const args = minimist(process.argv.slice(2));

if (args.scheduler) {
  // Start cron scheduler mode
  import('./src/scheduler.js');
} else if (args.all) {
  // Run all active niches
  const niches = loadNiches().filter(n => n.active);
  logger.info(`Running pipeline for ${niches.length} active niches...`);
  
  (async () => {
    for (const niche of niches) {
      try {
        await runPipeline(niche.name);
      } catch (err) {
        logger.error(`Failed: "${niche.name}" — ${err.message}`);
      }
    }
  })();
} else if (args.niche) {
  // Run single niche
  runPipeline(args.niche).catch(err => {
    logger.error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
} else {
  console.log(`
╔══════════════════════════════════════════════════╗
║          BriefEdge — Trend Brief Engine          ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Usage:                                          ║
║    node run.js --niche "AI in healthcare"        ║
║    node run.js --all                             ║
║    node run.js --scheduler                       ║
║                                                  ║
║  Options:                                        ║
║    --niche <name>   Run pipeline for one niche   ║
║    --all            Run all active niches         ║
║    --scheduler      Start cron scheduler          ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
}
