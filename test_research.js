import { buildResearchPrompts, fetchPerplexityResearch, parseResearchResponse, saveResearchResults } from './src/research/index.js';
import { generatePDF } from './src/report/index.js';
import logger from './src/utils/logger.js';

const trendSignals = {
  niche: "AI in healthcare",
  slug: "ai-in-healthcare",
  timestamp: new Date().toISOString(),
  trendCount: 2,
  trends: [
    {
      rank: 1,
      trend: "LLM-as-judge in medical diagnostics",
      mergedScore: 0.95,
      sources: ["reddit"]
    },
    {
      rank: 2,
      trend: "Ambient AI medical scribing",
      mergedScore: 0.88,
      sources: ["google_trends"]
    }
  ]
};

async function testResearchAndPDF() {
  logger.info(`🔬 Deep research via Perplexity...`);
  const prompts = buildResearchPrompts(trendSignals);
  const researchedTrends = [];

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    logger.info(`Researching Trend ${i + 1}/${prompts.length}: "${p.trend}"...`);
    const rawText = await fetchPerplexityResearch(p.prompt);
    
    const structured = rawText 
      ? parseResearchResponse(p.trend, rawText)
      : { 
          trend: p.trend, 
          overview: 'Research failed.',
          keyPlayers: 'N/A', marketSize: 'N/A', risks: 'N/A', threeMonthOutlook: 'N/A', monetization: 'N/A'
        };
        
    researchedTrends.push({
      ...trendSignals.trends[i],
      ...structured
    });
  }

  const researchResults = {
    niche: trendSignals.niche,
    slug: trendSignals.slug,
    generatedAt: new Date().toISOString(),
    trends: researchedTrends
  };

  saveResearchResults(trendSignals.slug, researchResults);

  logger.info(`📄 Generating PDF report...`);
  const pdfPath = await generatePDF(researchResults);
  logger.info(`✅ Success! PDF: ${pdfPath}`);
}

testResearchAndPDF();
