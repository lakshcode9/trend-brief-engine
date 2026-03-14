# BriefEdge — Trend Brief Engine

Autonomous niche intelligence report engine. Detects trends via Google Trends + Reddit, deep-dives with Perplexity AI, generates premium PDF reports with branded thumbnails, and auto-publishes to Gumroad with AI-written sales copy.

## Quick Start

### 1. Fill `.env` (3 keys)

```bash
# Get from https://console.apify.com/account/integrations
APIFY_API_KEY=your_key

# Get from https://app.gumroad.com/settings/advanced#application-form
GUMROAD_ACCESS_TOKEN=your_token

# Get from https://docs.perplexity.ai
PERPLEXITY_API_KEY=your_key
```

### 2. Install & Run

```bash
npm install
node run.js --niche "AI in healthcare"
```

## Commands

| Command | Description |
|---------|-------------|
| `node run.js --niche "AI in healthcare"` | Run full pipeline for one niche |
| `node run.js --all` | Run all active niches |
| `node run.js --scheduler` | Start Monday 6 AM cron job |

## Pipeline (5 Steps)

```
1. 📡 Trend Signals     → Google Trends (Apify) + Reddit (Apify) → cross-reference + score
2. 🔬 Deep Research      → Perplexity AI (sonar) → structured analysis per trend
3. ✍️ Marketing Copy     → Perplexity AI → viral title, summary, long-form description
4. 📄 PDF + Thumbnail    → Puppeteer → branded A4 report + 2x cover screenshot
5. 🛒 Gumroad Publish    → Auto-create/update product with PDF, thumbnail, and AI copy
```

## Adding/Removing Niches

Edit `niches.json`:

```json
{
  "name": "Your Niche",
  "slug": "your-niche",
  "price": 2900,
  "active": true,
  "subreddits": ["sub1", "sub2"]
}
```

Set `"active": false` to disable a niche without deleting it.

## Output Structure

```
output/
  ai-in-healthcare/
    2026-03/
      trends.json       — raw trend signals
      research.json     — Perplexity deep-dive data
      report.html       — HTML source (debug)
      report.pdf        — final branded report
      thumbnail.png     — cover page screenshot (Gumroad preview)
```

## Project Structure

```
src/
  trends/           — Google Trends + Reddit signal detection
  research/         — Perplexity API integration + response parsing
  report/           — HTML template + Puppeteer PDF + thumbnail capture
  gumroad/          — Product publishing + AI marketing copy generation
  utils/            — Config, logger, helpers
  scheduler.js      — node-cron weekly scheduler
run.js              — CLI orchestrator entry point
niches.json         — niche configuration
```

## DigitalOcean Deployment

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Chromium for Puppeteer
sudo apt-get install -y chromium-browser

# Clone and setup
git clone YOUR_REPO_URL /opt/trend-brief-engine
cd /opt/trend-brief-engine
npm install
cp .env.example .env  # then edit with your keys
nano .env

# Test a single run
node run.js --niche "AI in healthcare"

# Setup systemd service for cron
sudo tee /etc/systemd/system/briefedge.service > /dev/null <<EOF
[Unit]
Description=BriefEdge Trend Engine
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /opt/trend-brief-engine/run.js --scheduler
WorkingDirectory=/opt/trend-brief-engine
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable briefedge
sudo systemctl start briefedge
```

### Verify

```bash
sudo systemctl status briefedge
journalctl -u briefedge -f
```

## Cost

~$0.25/report (Apify compute + Perplexity API). Sells for $29 on Gumroad. **~115x margin.**
