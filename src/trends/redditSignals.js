// src/trends/redditSignals.js — Layer B: Reddit Signals via Apify
import { ApifyClient } from 'apify-client';
import { APIFY_API_KEY } from '../utils/config.js';
import logger from '../utils/logger.js';

const client = new ApifyClient({ token: APIFY_API_KEY });

/**
 * Query Reddit via Apify actor (trudax/reddit-scraper) for hot/rising posts.
 * 
 * Input format:
 *   - startUrls: [{ url: "https://www.reddit.com/r/subreddit/hot" }]
 *   - OR searches: ["keyword"]
 *   - maxPostCount, maxItems, maxComments
 *   - proxy: { useApifyProxy: true }
 * 
 * Output fields (post):
 *   - title, communityName, parsedCommunityName
 *   - upVotes, numberOfComments
 *   - createdAt (ISO date string)
 *   - url, dataType ("post" | "comment")
 */
export async function fetchRedditSignals(nicheName, subreddits) {
  logger.info(`[Reddit] Querying ${subreddits.length} subreddits for: "${nicheName}"`);

  // Build startUrls for hot sorting per subreddit
  const urls = subreddits.map(sub => ({
    url: `https://www.reddit.com/r/${sub}/hot/`
  }));

  const input = {
    startUrls: urls,
    maxItems: 50,
    maxPostCount: 15,
    maxComments: 0,
    maxCommunitiesCount: 0,
    maxUserCount: 0,
    scrollTimeout: 40,
    proxy: {
      useApifyProxy: true
    }
  };

  let items = [];
  try {
    const run = await client.actor('trudax/reddit-scraper').call(input, {
      waitSecs: 180,
      memory: 1024
    });
    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    items = dataset.items || [];
  } catch (err) {
    logger.error(`[Reddit] Apify actor error: ${err.message}`);
    return [];
  }

  if (!items.length) {
    logger.warn(`[Reddit] No posts returned for "${nicheName}"`);
    return [];
  }

  // Filter to posts only (exclude comments)
  const posts = items.filter(i => i.dataType === 'post' || !i.parentId);
  logger.info(`[Reddit] Got ${posts.length} posts from ${items.length} total items`);

  // Score each post
  const now = Date.now();
  const signals = [];

  for (const post of posts) {
    const title = post.title || '';
    if (!title) continue;

    const upvotes = post.upVotes || 0;
    const comments = post.numberOfComments || 0;
    const createdAt = post.createdAt ? new Date(post.createdAt).getTime() : now;
    const subreddit = post.parsedCommunityName || post.communityName?.replace('r/', '') || '';

    // Compute age in hours
    const ageHours = Math.max((now - createdAt) / (1000 * 60 * 60), 0.1);

    // Upvote velocity = upvotes per hour
    const upvoteVelocity = upvotes / ageHours;

    // Recency score — posts < 24h old get higher scores
    const recencyScore = Math.max(0, 1 - (ageHours / 168)); // 168h = 1 week

    // Volume score — normalized upvotes (cap at 5000)
    const volumeScore = Math.min(upvotes / 5000, 1);

    // Comment engagement — normalized (cap at 500)
    const commentScore = Math.min(comments / 500, 1);

    // Velocity score — normalized (cap at 100 upvotes/hour)
    const velocityScore = Math.min(upvoteVelocity / 100, 1);

    const compositeScore = (
      volumeScore * 0.2 +
      velocityScore * 0.3 +
      recencyScore * 0.25 +
      commentScore * 0.25
    );

    signals.push({
      source: 'reddit',
      query: title,
      subreddit,
      volumeScore: Math.round(volumeScore * 1000) / 1000,
      velocityScore: Math.round(velocityScore * 1000) / 1000,
      recencyScore: Math.round(recencyScore * 1000) / 1000,
      commentScore: Math.round(commentScore * 1000) / 1000,
      compositeScore: Math.round(compositeScore * 1000) / 1000,
      rawData: {
        upvotes,
        comments,
        ageHours: Math.round(ageHours * 10) / 10,
        upvoteVelocity: Math.round(upvoteVelocity * 10) / 10,
        url: post.url || ''
      }
    });
  }

  // Sort by composite score descending
  signals.sort((a, b) => b.compositeScore - a.compositeScore);

  // Track cross-subreddit appearances
  const topicClusters = {};
  for (const s of signals) {
    // Simple keyword clustering
    const keywords = s.query.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    
    for (const kw of keywords) {
      if (!topicClusters[kw]) topicClusters[kw] = new Set();
      topicClusters[kw].add(s.subreddit);
    }
  }

  // Boost signals with cross-subreddit keywords
  for (const s of signals) {
    const keywords = s.query.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    
    let maxCross = 1;
    for (const kw of keywords) {
      const count = topicClusters[kw]?.size || 1;
      if (count > maxCross) maxCross = count;
    }

    if (maxCross > 1) {
      s.compositeScore *= (1 + 0.15 * (maxCross - 1));
      s.compositeScore = Math.round(s.compositeScore * 1000) / 1000;
      s.crossSubredditCount = maxCross;
    }
  }

  // Re-sort after boosting
  signals.sort((a, b) => b.compositeScore - a.compositeScore);

  logger.info(`[Reddit] Extracted ${signals.length} scored signals for "${nicheName}"`);
  return signals;
}
