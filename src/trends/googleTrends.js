// src/trends/googleTrends.js — Layer A: Google Trends via Apify
import { ApifyClient } from 'apify-client';
import { APIFY_API_KEY } from '../utils/config.js';
import logger from '../utils/logger.js';

const client = new ApifyClient({ token: APIFY_API_KEY });

/**
 * Query Google Trends for a niche via Apify actor.
 * Returns scored trend signals.
 * 
 * Actor: apify/google-trends-scraper
 * Output fields:
 *   - interestOverTime_timelineData: [{ value: [n], time, formattedTime }]
 *   - relatedQueries_rising: [{ query, value, formattedValue }]
 *   - relatedQueries_top: [{ query, value, formattedValue }]
 *   - relatedTopics_rising: [{ topic: { title }, value, formattedValue }]
 */
export async function fetchGoogleTrends(nicheName) {
  logger.info(`[GoogleTrends] Querying trends for: "${nicheName}"`);

  const input = {
    searchTerms: [nicheName],
    timeRange: '',
    geo: '',
    isMultiple: false,
    isPublic: false,
    category: '',
    extendOutputFunction: '',
  };

  let items = [];
  try {
    const run = await client.actor('apify/google-trends-scraper').call(input, {
      waitSecs: 120,
      memory: 1024
    });
    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    items = dataset.items || [];
  } catch (err) {
    logger.error(`[GoogleTrends] Apify actor error: ${err.message}`);
    return [];
  }

  if (!items || items.length === 0) {
    logger.warn(`[GoogleTrends] No data returned for "${nicheName}"`);
    return [];
  }

  logger.info(`[GoogleTrends] Got ${items.length} raw data items for "${nicheName}"`);

  const signals = [];

  for (const item of items) {
    // Parse interest over time for velocity scoring
    const timeline = item.interestOverTime_timelineData || [];
    const recentValues = timeline.slice(-4); // Last 4 data points
    const olderValues = timeline.slice(-12, -4); // 4-12 periods ago

    const recentAvg = recentValues.length > 0
      ? recentValues.reduce((sum, v) => sum + (v.value?.[0] || 0), 0) / recentValues.length
      : 0;
    const olderAvg = olderValues.length > 0
      ? olderValues.reduce((sum, v) => sum + (v.value?.[0] || 0), 0) / olderValues.length
      : 1;

    const velocity = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;

    // Rising related queries (best signal for emerging trends)
    const risingQueries = item.relatedQueries_rising || [];
    for (const query of risingQueries) {
      const queryText = query.query || '';
      const queryValue = parseInt(query.value) || 0;

      if (!queryText) continue;

      signals.push({
        source: 'google_trends',
        query: queryText,
        volumeScore: Math.min(recentAvg / 100, 1),
        velocityScore: Math.min(Math.max(velocity, 0), 1),
        recencyScore: 0.8,
        risingValue: queryValue,
        formattedRisingValue: query.formattedValue || '',
        rawData: {
          recentAvg: Math.round(recentAvg * 10) / 10,
          olderAvg: Math.round(olderAvg * 10) / 10,
          velocity: Math.round(velocity * 100) / 100,
          risingValue: query.formattedValue || queryValue
        }
      });
    }

    // Also extract rising topics
    const risingTopics = item.relatedTopics_rising || [];
    for (const topic of risingTopics) {
      const title = topic.topic?.title || '';
      const topicValue = parseInt(topic.value) || 0;

      if (!title) continue;

      signals.push({
        source: 'google_trends',
        query: title,
        volumeScore: Math.min(recentAvg / 100, 1),
        velocityScore: Math.min(Math.max(velocity, 0), 1),
        recencyScore: 0.75,
        risingValue: topicValue,
        formattedRisingValue: topic.formattedValue || '',
        rawData: {
          type: 'rising_topic',
          topicType: topic.topic?.type || '',
          recentAvg: Math.round(recentAvg * 10) / 10,
          risingValue: topic.formattedValue || topicValue
        }
      });
    }

    // Add the main search term as a signal
    signals.push({
      source: 'google_trends',
      query: item.searchTerm || nicheName,
      volumeScore: Math.min(recentAvg / 100, 1),
      velocityScore: Math.min(Math.max(velocity, 0), 1),
      recencyScore: 0.9,
      risingValue: 0,
      rawData: {
        type: 'primary_term',
        recentAvg: Math.round(recentAvg * 10) / 10,
        olderAvg: Math.round(olderAvg * 10) / 10,
        velocity: Math.round(velocity * 100) / 100,
        timelinePoints: timeline.length
      }
    });
  }

  // Compute composite score
  for (const s of signals) {
    // Boost based on rising value magnitude
    const risingBoost = s.risingValue > 1000 ? 0.2 : (s.risingValue > 100 ? 0.1 : 0);
    
    s.compositeScore = (
      s.volumeScore * 0.25 +
      s.velocityScore * 0.35 +
      s.recencyScore * 0.25 +
      risingBoost * 0.15
    );
  }

  // Sort by composite score descending
  signals.sort((a, b) => b.compositeScore - a.compositeScore);

  logger.info(`[GoogleTrends] Extracted ${signals.length} signals for "${nicheName}"`);
  return signals;
}
