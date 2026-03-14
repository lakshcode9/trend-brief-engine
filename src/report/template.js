// src/report/template.js — HTML template for BriefEdge PDF report
import dayjs from 'dayjs';

/**
 * Generate full HTML for the BriefEdge report.
 */
export function generateReportHTML(researchData) {
  const { niche, trends } = researchData;
  const monthYear = dayjs().format('MMMM YYYY');
  
  // Executive summary — extract top 3 bullet points
  const execBullets = trends.slice(0, 3).map(t => {
    const overview = t.overview || t.trend;
    return overview.split('.')[0] + '.';
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${niche} Trend Brief — ${monthYear}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #1a1a2e;
      line-height: 1.7;
      font-size: 11pt;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 40px 50px;
      page-break-after: always;
      position: relative;
    }

    /* COVER PAGE */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      background: linear-gradient(160deg, #0a0a1a 0%, #0f1629 30%, #1a1040 60%, #0d1f3c 100%);
      color: white;
      padding: 70px;
      overflow: hidden;
    }
    .cover::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(100,255,218,0.08) 0%, transparent 70%);
      border-radius: 50%;
    }
    .cover::after {
      content: '';
      position: absolute;
      bottom: -80px;
      left: -80px;
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
      border-radius: 50%;
    }
    .cover .brand {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 5px;
      text-transform: uppercase;
      color: #64ffda;
      margin-bottom: 50px;
      padding: 8px 16px;
      border: 1px solid rgba(100,255,218,0.25);
      border-radius: 4px;
      z-index: 1;
    }
    .cover h1 {
      font-size: 46px;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 18px;
      max-width: 520px;
      z-index: 1;
      background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .cover .subtitle {
      font-size: 17px;
      font-weight: 300;
      color: #94a3b8;
      margin-bottom: 50px;
      z-index: 1;
      max-width: 400px;
      line-height: 1.5;
    }
    .cover .cover-meta {
      display: flex;
      gap: 25px;
      align-items: center;
      z-index: 1;
    }
    .cover .date {
      font-size: 14px;
      color: #64ffda;
      font-weight: 600;
    }
    .cover .trend-badge {
      font-size: 12px;
      color: #e0e7ff;
      background: rgba(99,102,241,0.2);
      border: 1px solid rgba(99,102,241,0.35);
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 500;
    }
    .cover .corner {
      position: absolute;
      bottom: 50px;
      right: 50px;
      width: 140px;
      height: 140px;
      border: 2px solid rgba(100, 255, 218, 0.2);
      border-radius: 50%;
      z-index: 1;
    }
    .cover .corner::before {
      content: '';
      position: absolute;
      top: -30px;
      left: -30px;
      width: 200px;
      height: 200px;
      border: 1px solid rgba(100, 255, 218, 0.06);
      border-radius: 50%;
    }
    .cover .corner::after {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      width: 100px;
      height: 100px;
      border: 1px solid rgba(100, 255, 218, 0.12);
      border-radius: 50%;
    }
    .cover .geo-line {
      position: absolute;
      top: 0;
      right: 180px;
      width: 1px;
      height: 100%;
      background: linear-gradient(to bottom, transparent, rgba(100,255,218,0.1), transparent);
    }
    .cover .geo-line-2 {
      position: absolute;
      bottom: 120px;
      left: 0;
      width: 100%;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(99,102,241,0.1), transparent);
    }

    /* EXECUTIVE SUMMARY */
    .exec-summary {
      padding-top: 60px;
    }
    .exec-summary h2 {
      font-size: 24px;
      font-weight: 700;
      color: #0f0f23;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 3px solid #64ffda;
      display: inline-block;
    }
    .exec-summary .bullet {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      padding: 15px 20px;
      background: #f8f9fa;
      border-left: 4px solid #16213e;
      border-radius: 0 8px 8px 0;
    }
    .exec-summary .bullet-num {
      font-size: 28px;
      font-weight: 800;
      color: #64ffda;
      margin-right: 15px;
      min-width: 30px;
    }
    .exec-summary .bullet p {
      font-size: 13px;
      line-height: 1.6;
    }

    /* TREND SECTIONS */
    .trend-section {
      padding-top: 40px;
    }
    .trend-header {
      display: flex;
      align-items: center;
      margin-bottom: 25px;
    }
    .trend-number {
      font-size: 48px;
      font-weight: 800;
      color: #e0e0e0;
      margin-right: 20px;
      line-height: 1;
    }
    .trend-title {
      font-size: 22px;
      font-weight: 700;
      color: #0f0f23;
    }
    .trend-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
    }
    .tag {
      display: inline-block;
      padding: 4px 12px;
      background: #e8f5e8;
      color: #2e7d32;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .tag.cross-ref {
      background: #e3f2fd;
      color: #1565c0;
    }

    .subsection {
      margin-bottom: 20px;
    }
    .subsection h3 {
      font-size: 14px;
      font-weight: 700;
      color: #16213e;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .subsection p, .subsection ul {
      font-size: 11pt;
      color: #333;
      line-height: 1.7;
    }
    .subsection ul {
      padding-left: 20px;
    }
    .subsection li {
      margin-bottom: 5px;
    }

    .callout {
      background: #16213e;
      color: white;
      padding: 20px 25px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 15px;
      font-weight: 500;
      line-height: 1.5;
    }
    .callout .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #64ffda;
      display: block;
      margin-bottom: 8px;
    }

    /* OUTLOOK PAGE */
    .outlook h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 25px;
      padding-bottom: 10px;
      border-bottom: 3px solid #64ffda;
      display: inline-block;
    }
    .outlook-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    .outlook-card {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-top: 3px solid #16213e;
    }
    .outlook-card h4 {
      font-size: 13px;
      font-weight: 700;
      color: #16213e;
      margin-bottom: 10px;
    }
    .outlook-card p {
      font-size: 11px;
      color: #555;
      line-height: 1.6;
    }

    /* SOURCES / FOOTER */
    .sources {
      padding-top: 40px;
    }
    .sources h2 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #64ffda;
      display: inline-block;
    }
    .sources ul {
      list-style: none;
      padding: 0;
    }
    .sources li {
      font-size: 10px;
      color: #666;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }

    .footer {
      position: absolute;
      bottom: 30px;
      left: 50px;
      right: 50px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #999;
    }

    @media print {
      .page { page-break-after: always; }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page cover">
    <div class="geo-line"></div>
    <div class="geo-line-2"></div>
    <div class="brand">BriefEdge</div>
    <h1>${niche} Trend Brief</h1>
    <div class="subtitle">Data-driven niche intelligence report — emerging trends, key players, and monetization angles.</div>
    <div class="cover-meta">
      <div class="date">${monthYear}</div>
      <div class="trend-badge">${trends.length} Trends Analyzed</div>
    </div>
    <div class="corner"></div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div class="page exec-summary">
    <h2>Executive Summary</h2>
    ${execBullets.map((b, i) => `
    <div class="bullet">
      <span class="bullet-num">${i + 1}</span>
      <p>${b}</p>
    </div>`).join('')}
    <div class="callout">
      <span class="label">Key Insight</span>
      This report covers ${trends.length} emerging trends in ${niche}, 
      identified through cross-referencing Google Trends velocity data with 
      Reddit community signals from ${dayjs().format('MMMM YYYY')}.
    </div>
    <div class="footer">
      <span>BriefEdge — ${niche}</span>
      <span>Page 2</span>
    </div>
  </div>

  <!-- TREND SECTIONS -->
  ${trends.map((trend, i) => `
  <div class="page trend-section">
    <div class="trend-header">
      <span class="trend-number">0${i + 1}</span>
      <span class="trend-title">${trend.trend}</span>
    </div>
    <div class="trend-meta">
      <span class="tag">Score: ${(trend.mergedScore || 0).toFixed(2)}</span>
      ${trend.crossReferenced ? '<span class="tag cross-ref">✓ Cross-Referenced</span>' : ''}
      ${trend.sources ? trend.sources.map(s => `<span class="tag">${s}</span>`).join('') : ''}
    </div>

    <div class="subsection">
      <h3>What It Is & Why It's Rising</h3>
      <p>${trend.overview || 'Analysis based on current trend data and market signals.'}</p>
    </div>

    <div class="subsection">
      <h3>Key Players & Companies</h3>
      <p>${trend.keyPlayers || 'Key stakeholders identified through trend analysis.'}</p>
    </div>

    ${trend.marketSize ? `
    <div class="callout">
      <span class="label">Market Signal</span>
      ${trend.marketSize}
    </div>` : ''}

    <div class="footer">
      <span>BriefEdge — ${niche}</span>
      <span>Page ${3 + i * 2}</span>
    </div>
  </div>

  <div class="page trend-section">
    <div class="subsection">
      <h3>Risks & Headwinds</h3>
      <p>${trend.risks || 'Risk assessment pending detailed analysis.'}</p>
    </div>

    <div class="subsection">
      <h3>Monetization Angle</h3>
      <p>${trend.monetization || 'Monetization opportunities identified in this space.'}</p>
    </div>

    <div class="subsection">
      <h3>3-Month Outlook</h3>
      <p>${trend.threeMonthOutlook || 'Short-term trajectory analysis based on current signals.'}</p>
    </div>

    <div class="footer">
      <span>BriefEdge — ${niche}</span>
      <span>Page ${4 + i * 2}</span>
    </div>
  </div>
  `).join('')}

  <!-- 3-MONTH OUTLOOK SUMMARY -->
  <div class="page outlook">
    <h2>3-Month Outlook Summary</h2>
    <p style="color: #666; margin-bottom: 20px;">
      Based on velocity and volume data from Google Trends and Reddit community signals.
    </p>
    <div class="outlook-grid">
      ${trends.map(t => `
      <div class="outlook-card">
        <h4>${t.trend}</h4>
        <p>${(t.threeMonthOutlook || 'Monitor for continued growth signals.').substring(0, 200)}</p>
      </div>`).join('')}
    </div>
    <div class="footer">
      <span>BriefEdge — ${niche}</span>
      <span>Page ${3 + trends.length * 2}</span>
    </div>
  </div>

  <!-- SOURCES -->
  <div class="page sources">
    <h2>Sources & Methodology</h2>
    <p style="margin-bottom: 20px; color: #666; font-size: 12px;">
      This report was generated using BriefEdge's proprietary trend detection engine,
      which cross-references multiple data sources to identify and validate emerging trends.
    </p>
    <ul>
      <li><strong>Google Trends</strong> — Interest over time data, rising related queries, velocity analysis</li>
      <li><strong>Reddit Community Signals</strong> — Hot and rising posts, upvote velocity, cross-subreddit validation</li>
      <li><strong>Perplexity AI Research</strong> — Deep analysis, market data, company identification</li>
    </ul>
    
    <div style="margin-top: 40px; padding: 30px; background: #f8f9fa; border-radius: 8px; text-align: center;">
      <p style="font-size: 18px; font-weight: 700; color: #16213e; margin-bottom: 10px;">BriefEdge</p>
      <p style="font-size: 12px; color: #666;">Niche Intelligence Reports — Generated ${dayjs().format('MMMM D, YYYY')}</p>
      <p style="font-size: 11px; color: #999; margin-top: 10px;">© ${dayjs().format('YYYY')} BriefEdge. All rights reserved.</p>
    </div>
    <div class="footer">
      <span>BriefEdge — ${niche}</span>
      <span>Page ${4 + trends.length * 2}</span>
    </div>
  </div>

</body>
</html>`;
}
