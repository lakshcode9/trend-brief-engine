// src/report/index.js — PDF Generation via Puppeteer
// Standalone: node src/report/index.js --niche "AI in healthcare"
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { getNiche, getOutputDir } from '../utils/config.js';
import { generateReportHTML } from './template.js';
import logger from '../utils/logger.js';
import minimist from 'minimist';

/**
 * Generate PDF report from research data.
 * @param {object} researchData — { niche, trends: [{trend, overview, keyPlayers, ...}] }
 * @returns {string} path to generated PDF
 */
export async function generatePDF(researchData) {
  const { niche, slug } = researchData;
  logger.info(`[Report] Generating PDF for "${niche}"`);

  const html = generateReportHTML(researchData);
  const outputDir = getOutputDir(slug);

  // Save HTML for debugging
  const htmlPath = path.join(outputDir, 'report.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  const pdfPath = path.join(outputDir, 'report.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  // Capture thumbnail from the cover page
  const thumbnailPath = path.join(outputDir, 'thumbnail.png');
  // Set viewport to A4 dimensions at 2x for crisp image
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({
    path: thumbnailPath,
    clip: { x: 0, y: 0, width: 794, height: 1123 }
  });
  logger.info(`[Report] Thumbnail saved to ${thumbnailPath}`);

  await browser.close();

  logger.info(`[Report] PDF saved to ${pdfPath}`);
  return { pdfPath, thumbnailPath };
}

// CLI mode
const args = minimist(process.argv.slice(2));
if (args.niche) {
  const niche = getNiche(args.niche);
  const outputDir = getOutputDir(niche.slug);
  const researchPath = path.join(outputDir, 'research.json');
  
  if (fs.existsSync(researchPath)) {
    const data = JSON.parse(fs.readFileSync(researchPath, 'utf-8'));
    generatePDF(data)
      .then(pdfPath => console.log(`\n📄 PDF generated: ${pdfPath}`))
      .catch(err => {
        console.error('PDF generation failed:', err.message);
        process.exit(1);
      });
  } else {
    console.log(`No research data found at ${researchPath}`);
    console.log('Run the research module first.');
  }
}
