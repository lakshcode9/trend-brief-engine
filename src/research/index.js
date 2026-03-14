// src/research/index.js — Research Module via Perplexity MCP
// Standalone: node src/research/index.js --niche "AI in healthcare"
// NOTE: This module is designed to be called from the orchestrator
// which has MCP access. When run standalone, it reads cached trends.
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { getNiche, getOutputDir, PERPLEXITY_API_KEY } from '../utils/config.js';
import logger from '../utils/logger.js';
import minimist from 'minimist';

/**
 * Build research prompts for Perplexity from trend signals.
 * Returns structured research queries per trend.
 */
export function buildResearchPrompts(trendSignals) {
  const { niche, trends } = trendSignals;
  
  return trends.map(trend => ({
    trend: trend.trend,
    rank: trend.rank,
    prompt: `Provide a comprehensive analysis of the trend "${trend.trend}" in the context of "${niche}". Include:

1. **What this trend is and why it's rising right now** — Give specific recent events, product launches, or market shifts driving this.

2. **Key players and companies to watch** — Name 5-8 specific companies, startups, or organizations at the forefront.

3. **Market size and growth signals** — Include any available market data, funding rounds, or growth metrics.

4. **Risks and headwinds** — What could slow this trend down? Regulatory, technical, or market risks.

5. **3-month outlook** — What should we expect in the next quarter?

6. **Monetization angle** — Who is making money from this and how? Include specific business models.

Be specific with names, numbers, and dates. Cite real companies and data points.`
  }));
}

/**
 * Perform deep research using the Perplexity API.
 * Uses the sonar-reasoning model for comprehensive analysis.
 */
export async function fetchPerplexityResearch(promptText) {
  logger.info(`[Research] Querying Perplexity API...`);
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is missing in .env');
  }

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { 
          role: 'user', 
          content: 'You are an elite market researcher and trend analyst. Provide specific names, companies, and actionable data.\n\n' + promptText 
        }
      ],
      max_tokens: 3000,
      temperature: 0.2
    })
  };

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', options);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    logger.error(`[Research] Perplexity API error: ${err.message}`);
    console.error('PERPLEXITY CATCH:', err);
    return null;
  }
}

/**
 * Process Perplexity response into structured JSON.
 * This parses the raw text response from Perplexity MCP.
 */
export function parseResearchResponse(trendName, rawResponse) {
  // Extract sections from the response
  const sections = {
    trend: trendName,
    overview: '',
    keyPlayers: '',
    marketSize: '',
    risks: '',
    threeMonthOutlook: '',
    monetization: '',
    rawResponse: rawResponse
  };

  const text = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse);
  
  // Split by numbered sections or headers
  const sectionPatterns = [
    { key: 'overview', patterns: [/what this trend/i, /why it's rising/i, /1\.\s*\*?\*?what/i] },
    { key: 'keyPlayers', patterns: [/key players/i, /companies to watch/i, /2\.\s*\*?\*?key/i] },
    { key: 'marketSize', patterns: [/market size/i, /growth signals/i, /3\.\s*\*?\*?market/i] },
    { key: 'risks', patterns: [/risks/i, /headwinds/i, /4\.\s*\*?\*?risks/i] },
    { key: 'threeMonthOutlook', patterns: [/3-month/i, /three.month/i, /outlook/i, /5\.\s*\*?\*?3/i] },
    { key: 'monetization', patterns: [/monetization/i, /making money/i, /6\.\s*\*?\*?monetization/i] }
  ];

  // Simple section extraction by splitting on numbered headers or bold titles
  const lines = text.split('\n');
  let currentSection = 'overview';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    for (const sp of sectionPatterns) {
      if (sp.patterns.some(p => p.test(trimmedLine))) {
        currentSection = sp.key;
        break;
      }
    }
    
    if (sections[currentSection] !== undefined && currentSection !== 'rawResponse' && currentSection !== 'trend') {
      // Don't add the header line itself to the content if it's just a title
      const isHeader = sectionPatterns.some(sp => sp.patterns.some(p => p.test(trimmedLine)));
      if (!isHeader) {
        sections[currentSection] += trimmedLine + '\n';
      }
    }
  }

  // Clean up empty sections
  for (const key of Object.keys(sections)) {
    if (typeof sections[key] === 'string') {
      sections[key] = sections[key].trim();
    }
  }

  return sections;
}

/**
 * Save research results to output directory.
 */
export function saveResearchResults(slug, researchData) {
  const outputDir = getOutputDir(slug);
  const filePath = path.join(outputDir, 'research.json');
  fs.writeFileSync(filePath, JSON.stringify(researchData, null, 2));
  logger.info(`[Research] Saved research results to ${filePath}`);
  return filePath;
}


