import { fetchPerplexityResearch } from '../research/index.js';
import logger from '../utils/logger.js';

/**
 * Generate high-converting marketing copy for a Gumroad listing.
 * @param {Object} researchData - The final research object containing trends.
 * @returns {Object} - { title, description, summary, tags }
 */
export async function generateMarketingCopy(researchData) {
  const { niche, trends } = researchData;
  logger.info(`[Marketing] Generating sales copy for "${niche}" brief...`);

  const topTrendsList = trends.slice(0, 3).map(t => t.trend).join(', ');
  
  const prompt = `You are a world-class direct response copywriter for high-end business intelligence reports. 
I am selling a "Niche Intelligence Brief" on the niche: "${niche}".
The report covers top emerging trends including: ${topTrendsList}.

Generate the following Gumroad listing assets:

1. **A Viral/Compelling Title**: Must be under 80 characters. Should promise high ROI or "early access" to trends. (e.g., "The 2026 AI Healthcare Blueprint" or "Niche Leak: 5 Emerging Trends in Healthcare")
2. **A Benefit-Driven Summary**: A 1-sentence "hook" for the preview.
3. **A Long-Form Sales Description (Markdown)**: 
   - Start with a "Why this matters now" hook.
   - Use bullet points to highlight the "Unearthed Opportunities" (the trends).
   - Promise specific data: "Key Players, Market Size, and 3-Month Outlooks."
   - End with a strong Call to Action.
4. **5-8 SEO Tags**: Relevant to the niche and digital products.

Return the result in this exact JSON format:
{
  "title": "...",
  "summary": "...",
  "description": "...",
  "tags": ["tag1", "tag2", ...]
}`;

  const rawResponse = await fetchPerplexityResearch(prompt);
  
  if (!rawResponse) {
    logger.error('[Marketing] Failed to generate copy from Perplexity.');
    return {
      title: `${niche} Intelligence Report: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      summary: `Deep dive into the top emerging trends in ${niche}.`,
      description: `Stay ahead of the curve with our latest intelligence report on ${niche}. Includes key players, market risks, and 3-month outlooks.`,
      tags: [niche, 'trends', 'business intelligence']
    };
  }

  try {
    // Attempt to extract JSON from the response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    logger.error(`[Marketing] Error parsing marketing JSON: ${err.message}`);
  }

  // Fallback if parsing fails
  return {
    title: `${niche} Intelligence Report`,
    summary: `Deep research into ${niche} trends.`,
    description: rawResponse,
    tags: [niche, 'trends']
  };
}
