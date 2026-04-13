# mewatch Performance Dashboard

Nightly Lighthouse performance testing for [mewatch.sg](https://www.mewatch.sg/) with an auto-published dashboard on GitHub Pages.

## How It Works

```
Every night at 9:30 PM IST (16:00 UTC)
        │
        ▼
GitHub Actions runs Lighthouse (Desktop + Mobile)
        │
        ▼
Results appended to results/perf-results.json
        │
        ▼
Dashboard (dashboard.html) reads JSON → renders charts
        │
        ▼
GitHub Pages publishes dashboard publicly
```

## Quick Start

### 1. Fork / clone this repo

```bash
git clone https://github.com/YOUR_ORG/mewatch-perf-dashboard.git
cd mewatch-perf-dashboard
```

### 2. Enable GitHub Pages

Go to **Settings → Pages** and set:
- **Source**: GitHub Actions

### 3. Enable GitHub Actions

Go to **Actions** tab → click **"I understand my workflows"** to enable them.

That's it. Every night at 9:30 PM IST the workflow will:

1. Run Lighthouse against mewatch.sg (desktop + mobile)
2. Append the result to `results/perf-results.json`
3. Commit the updated JSON back to the repo
4. Re-deploy the dashboard to GitHub Pages

### 4. Manual run

Trigger a test run any time from **Actions → Nightly Performance Test → Run workflow**.

## Local Development

```bash
cd scripts
npm install
npm run test:local   # runs Lighthouse locally, writes to results/
```

Then serve the project root:

```bash
cd ..
npx serve .
# open http://localhost:3000/dashboard.html
```

## Dashboard Features

- **Date range filter** — compare any span of nights
- **Device toggle** — Desktop vs Mobile scores side by side
- **Lighthouse scores** — Performance, Accessibility, Best Practices, SEO
- **Core Web Vitals** — FCP, LCP, TBT, CLS, SI, TTI with pass/fail badges
- **Trend charts** — all metrics plotted over selected range
- **Resource diagnostics** — page weight, third-party breakdown, opportunities
- **Full run history table** — most recent runs first

## File Structure

```
.
├── .github/workflows/nightly-perf-test.yml   # Runs at 9:30 PM IST daily
├── scripts/
│   ├── package.json
│   └── run-perf-test.js                      # Lighthouse runner
├── results/
│   └── perf-results.json                     # Cumulative test results
├── dashboard.html                            # Published dashboard
├── index.html                                # Redirects to dashboard.html
└── README.md
```

## Customisation

| What | Where |
|------|-------|
| Change target URL | `TARGET_URL` env var in the workflow YML |
| Change schedule | `cron:` line in the workflow YML (currently `0 16 * * *` = 9:30 PM IST) |
| Add more pages | Duplicate `runLighthouse()` calls in `scripts/run-perf-test.js` |
| Slack/email alerts | Add a `notify` job in the workflow after `performance-test` |

> **Schedule note**: 9:30 PM IST = 4:00 PM UTC (IST is UTC+5:30).  
> The cron is set to `0 16 * * *`. GitHub Actions cron doesn't support half-minute precision, so the run fires at exactly 9:30 PM IST (on the hour, not :30).  
> To get 9:30 PM IST precisely, use `30 16 * * *` — this is already set in the workflow.

Wait — 9:30 PM IST:
- IST = UTC + 5:30
- 9:30 PM IST = 21:30 - 5:30 = 16:00 UTC

So `0 16 * * *` is correct for 9:30 PM IST. ✓
