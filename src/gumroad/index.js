// src/gumroad/index.js — Gumroad Integration
// Standalone: node src/gumroad/index.js --niche "AI in healthcare"
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import axios from 'axios';
import FormData from 'form-data';
import { getNiche, getOutputDir, GUMROAD_ACCESS_TOKEN } from '../utils/config.js';
import logger from '../utils/logger.js';
import minimist from 'minimist';

const GUMROAD_API = 'https://api.gumroad.com/v2';

/**
 * Upload PDF and create/update Gumroad product listing.
 */
export async function publishToGumroad(niche, slug, pdfPath, trends, marketingCopy = null, thumbnailPath = null) {
  logger.info(`[Gumroad] Publishing "${niche}" report to Gumroad`);

  if (!GUMROAD_ACCESS_TOKEN || GUMROAD_ACCESS_TOKEN === 'your_gumroad_access_token_here') {
    logger.warn('[Gumroad] No access token configured. Skipping upload.');
    return null;
  }

  const nicheConfig = getNiche(niche);
  const price = nicheConfig.price || 2900; // cents

  // Use marketing copy if provided, otherwise fallback to generic
  const name = marketingCopy?.title || `${niche} Trend Brief — ${dayjs().format('MMMM YYYY')}`;
  const summary = marketingCopy?.summary || `Deep dive into the top emerging trends in ${niche}.`;
  
  let description = marketingCopy?.description;
  if (!description) {
    const trendNames = trends.slice(0, 3).map(t => t.trend).join(', ');
    description = `This month's ${niche} intelligence brief covers the top emerging trends reshaping the industry — including ${trendNames}. Each trend is analyzed with real data, key players, market sizing, risk assessment, and a 3-month outlook.\n\nBuilt for founders, investors, and operators who need to stay ahead of the curve without drowning in noise. 8-12 pages of actionable intelligence, delivered monthly.`;
  }

  // Check if product already exists
  const existingProduct = await findExistingProduct(niche);

  if (existingProduct) {
    logger.info(`[Gumroad] Updating existing product: ${existingProduct.id}`);
    return await updateProduct(existingProduct.id, {
      name,
      description,
      summary,
      price,
      pdfPath,
      thumbnailPath
    });
  } else {
    logger.info(`[Gumroad] Creating new product listing`);
    return await createProduct({
      name,
      description,
      summary,
      price,
      pdfPath,
      thumbnailPath
    });
  }
}

async function findExistingProduct(nicheName) {
  try {
    const res = await axios.get(`${GUMROAD_API}/products`, {
      headers: { Authorization: `Bearer ${GUMROAD_ACCESS_TOKEN}` }
    });
    const data = res.data;
    if (!data.success) return null;

    return data.products?.find(p => 
      p.name?.toLowerCase().includes(nicheName.toLowerCase())
    ) || null;
  } catch (err) {
    logger.error(`[Gumroad] Error checking products: ${err.message}`);
    return null;
  }
}

async function createProduct({ name, description, summary, price, pdfPath, thumbnailPath }) {
  const form = new FormData();
  form.append('access_token', GUMROAD_ACCESS_TOKEN);
  form.append('name', name);
  form.append('description', description);
  form.append('summary', summary);
  form.append('price', price);
  form.append('url', name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  // Attach PDF file
  if (fs.existsSync(pdfPath)) {
    form.append('file', fs.createReadStream(pdfPath));
  }

  // Attach thumbnail as preview image
  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    form.append('preview', fs.createReadStream(thumbnailPath));
    logger.info('[Gumroad] Attaching thumbnail image');
  }

  try {
    const res = await axios.post(`${GUMROAD_API}/products`, form, {
      headers: form.getHeaders()
    });
    const data = res.data;
    if (data.success) {
      logger.info(`[Gumroad] ✓ Product created: ${data.product.short_url}`);
      return data.product;
    } else {
      logger.error(`[Gumroad] Create failed: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (err) {
    const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logger.error(`[Gumroad] Create error: ${errorMsg}`);
    return null;
  }
}

async function updateProduct(productId, { name, description, summary, price, pdfPath, thumbnailPath }) {
  const form = new FormData();
  form.append('access_token', GUMROAD_ACCESS_TOKEN);
  form.append('name', name);
  form.append('description', description);
  form.append('summary', summary);
  form.append('price', price);

  if (fs.existsSync(pdfPath)) {
    form.append('file', fs.createReadStream(pdfPath));
  }

  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    form.append('preview', fs.createReadStream(thumbnailPath));
    logger.info('[Gumroad] Attaching thumbnail image');
  }

  try {
    const res = await axios.put(`${GUMROAD_API}/products/${productId}`, form, {
      headers: form.getHeaders()
    });
    const data = res.data;
    if (data.success) {
      logger.info(`[Gumroad] ✓ Product updated: ${data.product.short_url}`);
      return data.product;
    } else {
      logger.error(`[Gumroad] Update failed: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (err) {
    const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logger.error(`[Gumroad] Update error: ${errorMsg}`);
    return null;
  }
}


