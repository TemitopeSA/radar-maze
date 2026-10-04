# Assumption Radar — a Maze concept prototype

A clickable, high-fidelity concept for a Maze feature that tracks the assumptions behind product decisions, detects when they drift, re-tests them with research, and flags the decisions they affect. Includes a 14-step guided tour that drives the real interface.

**Live:** https://radar-maze.vercel.app

> Concept prototype with fictional data. Not a Maze product, and not connected to any real Maze account or customer data.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm run lint
```

Stack: React 19, TypeScript, Vite, lucide-react. All data is local and deterministic (`src/data/seed.ts`); state lives in memory (`src/state/store.tsx`) and resets on refresh.

## The story

Lumen (a fictional fintech for small businesses) believes *“SMB owners choose Lumen mainly because it's the cheapest option.”* Confidence falls from 78 to 41 over six weeks, Maze flags it as Drifting, and the viewer — Dana Mercer, Head of Product — investigates the evidence, re-tests it with an AI-moderated study, accepts an updated belief (v2, confidence 82), and sees the Q2 pricing-page decision flagged for review.

## Usage analytics

The prototype reports how viewers use it through **Vercel Web Analytics** and **Speed Insights** (cookieless, no personal data). See `src/analytics.ts`.

**One-time setup:** in the Vercel dashboard, open the `radar-maze` project → **Analytics** → **Enable**. Speed Insights is already on.

Because the app never changes its URL, every screen, tour step and key action is reported as a *virtual pageview*. These show up under **Pages** on every plan, including Hobby:

| Path prefix | What it measures |
|---|---|
| `/app/home`, `/app/assumptions`, `/app/assumption/pricing-hero`, `/app/assumption/pricing-hero/evidence`, `/app/builder/1-objective` … `/app/builder/4-review-launch`, `/app/progress`, `/app/results`, `/app/wrapup` | Screens reached (the product funnel) |
| `/tour/01-welcome` … `/tour/14-wrap`, `/tour/complete` | Tour funnel and drop-off by step |
| `/event/tour-started/welcome`, `/event/welcome-dismissed/first-visit`, `/event/tour-skipped/06-hero-row`, `/event/tour-gate-completed/accept` … | Key actions (with the most useful detail in the path) |
| `/event/session-ended/2-5m` | Time spent, bucketed: `under-30s`, `30s-2m`, `2-5m`, `5-10m`, `over-10m` |
| `/event/out-of-scope-click/<feature>` | Interest in areas outside the concept (Projects, Search, Templates…) |

The same actions are also sent as **custom events** with properties (for example `Update Accepted {edited, confidence}`, `Study Launched {sample, method}`). Custom events appear under **Events** on Vercel Pro and above; on Hobby, use the `/event/…` pages.

Useful reads:

- **Tour completion rate:** `/tour/complete` ÷ `/tour/01-welcome`.
- **Where people drop off:** compare visitors on consecutive `/tour/NN-…` pages, or look at `/event/tour-skipped/<step>`.
- **Did they reach the payoff?** `/event/update-accepted/…` and `/app/wrapup`.
- **Engagement:** `/event/session-ended/<bucket>`.

Add `?debug-analytics` to the URL to log every analytics call to the browser console.

### Event reference

Tour: `Tour Started {source}`, `Welcome Dismissed`, `Tour Gate Completed {gate}`, `Tour Skipped {step, reason}`, `Tour Completed`, `Tour Restarted {resetData}`, `Guide Step Jump {step}`, `Demo Data Reset`.

Product: `Home Alert Clicked`, `Study Preview Opened`, `Assumption Opened {source, hero}`, `Assumptions Filtered {by}`, `Assumptions Sorted`, `Assumptions Searched`, `Assumption Added`, `Sample PRD Loaded`, `Assumptions Imported {count}`, `Signal Feedback {kind}`, `Clip Viewed {era}`, `Decision Review Opened {source}`, `Decision Marked For Review`, `Re-test Clicked`, `Method Selected`, `Alternative Methods Shown`, `Bias Check Resolved {resolution}`, `Fresh Eyes Toggled`, `Study Launched {sample, method}`, `Research Skipped Ahead`, `Update Edit Opened`, `Update Edited`, `Update Accepted {edited, confidence}`, `Share Opened {source}`, `Share Channel Viewed`, `Summary Copied`, `Full Loop Opened`, `Loop Stage Viewed`, `Explore Freely`, `Restart Tour Clicked`, `Out Of Scope Click {feature}`, `Session Ended {seconds, furthestStep}`.
