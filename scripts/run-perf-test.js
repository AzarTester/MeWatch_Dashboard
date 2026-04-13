#!/usr/bin/env node
'use strict';

const lighthouse = require('lighthouse').default;
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const TARGET_URL = process.env.TARGET_URL || 'https://www.mewatch.sg/';
const RESULTS_FILE = path.join(__dirname, '..', 'results', 'perf-results.json');

const DEVICE_CONFIGS = {
  desktop: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  },
  mobile: {
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
    },
  },
};

async function runLighthouse(url, deviceKey) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const config = DEVICE_CONFIGS[deviceKey];
  const options = {
    logLevel: 'error',
    output: 'json',
    port: chrome.port,
    ...config,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  };

  console.log(`Running Lighthouse for ${deviceKey}...`);
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  const lhr = runnerResult.lhr;
  const cats = lhr.categories;
  const audits = lhr.audits;

  const score = (key) => Math.round((cats[key]?.score ?? 0) * 100);
  const ms = (key) => audits[key]?.numericValue ?? null;
  const kb = (key) => {
    const v = audits[key]?.numericValue ?? null;
    return v !== null ? Math.round(v / 1024) : null;
  };

  return {
    timestamp: new Date().toISOString(),
    url,
    device: deviceKey,
    scores: {
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
    },
    vitals: {
      fcp: ms('first-contentful-paint'),
      lcp: ms('largest-contentful-paint'),
      tbt: ms('total-blocking-time'),
      cls: audits['cumulative-layout-shift']?.numericValue ?? null,
      tti: ms('interactive'),
      si: ms('speed-index'),
    },
    resources: {
      totalTransferKb: kb('total-byte-weight'),
      unusedJsKb: kb('unused-javascript'),
      unusedCssKb: kb('unused-css-rules'),
      unoptimizedImagesKb: kb('uses-optimized-images'),
      renderBlockingKb: kb('render-blocking-resources'),
      thirdPartyKb: (() => {
        const tp = audits['third-party-summary'];
        if (!tp || !tp.details || !tp.details.items) return null;
        const total = tp.details.items.reduce(
          (sum, item) => sum + (item.transferSize || 0),
          0
        );
        return Math.round(total / 1024);
      })(),
    },
  };
}

async function main() {
  console.log(`Target: ${TARGET_URL}`);
  const results = [];

  for (const device of ['desktop', 'mobile']) {
    try {
      const result = await runLighthouse(TARGET_URL, device);
      results.push(result);
      console.log(
        `  ${device}: perf=${result.scores.performance} lcp=${result.vitals.lcp?.toFixed(0)}ms`
      );
    } catch (err) {
      console.error(`  ${device} failed:`, err.message);
    }
  }

  // Load existing results
  let existing = [];
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    } catch (_) {
      existing = [];
    }
  }

  const updated = [...existing, ...results];
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(updated, null, 2));
  console.log(`Saved ${results.length} results. Total: ${updated.length} runs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
