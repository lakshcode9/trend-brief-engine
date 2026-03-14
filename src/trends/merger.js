// src/trends/merger.js — Cross-reference + merge Google Trends and Reddit signals
import logger from '../utils/logger.js';

/**
 * Merges signals from Google Trends and Reddit.
 * Trends appearing in BOTH sources get boosted.
 * Returns top N scored trends as structured JSON.
 */
export function mergeAndScoreSignals(googleSignals, redditSignals, topN = 5) {
  logger.info(`[Merger] Merging ${googleSignals.length} Google + ${redditSignals.length} Reddit signals`);

  // Normalize all signals into a unified format
  const allSignals = [];

  // Add Google signals
  for (const s of googleSignals) {
    allSignals.push({
      trend: s.query,
      sources: ['google_trends'],
      googleScore: s.compositeScore,
      redditScore: 0,
      mergedScore: s.compositeScore,
      google: s,
      reddit: null
    });
  }

  // Try to match Reddit signals to existing Google signals or add new
  for (const s of redditSignals) {
    const titleWords = s.query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    // Find best matching Google signal
    let bestMatch = null;
    let bestMatchScore = 0;

    for (const existing of allSignals) {
      if (!existing.sources.includes('google_trends')) continue;
      
      const existingWords = existing.trend.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const overlap = titleWords.filter(w => 
        existingWords.some(ew => ew.includes(w) || w.includes(ew))
      ).length;
      
      const matchScore = overlap / Math.max(titleWords.length, existingWords.length, 1);
      
      if (matchScore > bestMatchScore && matchScore > 0.3) {
        bestMatch = existing;
        bestMatchScore = matchScore;
      }
    }

    if (bestMatch) {
      // Cross-match found — boost!
      bestMatch.sources.push('reddit');
      bestMatch.redditScore = s.compositeScore;
      bestMatch.reddit = s;
      // Cross-source boost: 40% bonus
      bestMatch.mergedScore = (bestMatch.googleScore * 0.5 + s.compositeScore * 0.5) * 1.4;
      logger.info(`[Merger] ✓ Cross-match: "${bestMatch.trend}" ↔ "${s.query}" (boost: 1.4x)`);
    } else {
      // Standalone Reddit signal
      allSignals.push({
        trend: s.query,
        sources: ['reddit'],
        googleScore: 0,
        redditScore: s.compositeScore,
        mergedScore: s.compositeScore,
        google: null,
        reddit: s
      });
    }
  }

  // Sort by merged score descending
  allSignals.sort((a, b) => b.mergedScore - a.mergedScore);

  // Take top N
  const topTrends = allSignals.slice(0, topN).map((t, i) => ({
    rank: i + 1,
    trend: t.trend,
    mergedScore: Math.round(t.mergedScore * 1000) / 1000,
    sources: t.sources,
    crossReferenced: t.sources.length > 1,
    scores: {
      google: Math.round(t.googleScore * 1000) / 1000,
      reddit: Math.round(t.redditScore * 1000) / 1000
    },
    evidence: {
      google: t.google ? {
        volumeScore: t.google.volumeScore,
        velocityScore: t.google.velocityScore,
        risingValue: t.google.risingValue
      } : null,
      reddit: t.reddit ? {
        upvotes: t.reddit.rawData?.upvotes,
        comments: t.reddit.rawData?.comments,
        subreddit: t.reddit.subreddit,
        url: t.reddit.rawData?.url
      } : null
    }
  }));

  logger.info(`[Merger] Top ${topN} trends selected. Cross-referenced: ${topTrends.filter(t => t.crossReferenced).length}`);
  return topTrends;
}
