import { inject, pageview, track } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Usage analytics for the prototype, built on Vercel Web Analytics (cookieless, no personal data).
 *
 * The app never changes its URL, so every screen and tour step is reported as a virtual pageview
 * (`/app/…`, `/tour/…`). Key actions are sent twice: as a custom event (reported on Vercel Pro) and
 * mirrored as an `/event/…` pageview so the full funnel is visible on the free Hobby plan too.
 *
 * Add `?debug-analytics` to the URL to log every call to the console.
 */

type Props = Record<string, string | number | boolean | null>;

const debug =
  import.meta.env.DEV || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug-analytics'));

let started = false;
let startedAt = 0;
let furthestStep = 0;
let ended = false;

function log(kind: string, name: string, props?: Props) {
  if (debug) console.info(`[analytics] ${kind}`, name, props ?? '');
}

export function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function initAnalytics() {
  if (started || typeof window === 'undefined') return;
  started = true;
  startedAt = Date.now();
  // We report virtual pageviews ourselves, so the script must not double-count history changes.
  inject({ disableAutoTrack: true, mode: import.meta.env.DEV ? 'development' : 'production', debug: false });
  injectSpeedInsights({ debug: false });
  const onHide = () => {
    if (document.visibilityState === 'hidden') endSession();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', endSession);
}

/** Reports a screen or tour step as a pageview. */
export function trackView(path: string) {
  log('view', path);
  pageview({ path, route: path });
}

/** Reports a key action as a custom event, mirrored as an `/event/…` pageview. */
export function trackEvent(name: string, props?: Props, detail?: string) {
  log('event', name, props);
  track(name, props);
  pageview({ path: `/event/${slug(name)}${detail ? `/${slug(detail)}` : ''}` });
}

export function noteTourStep(step: number) {
  furthestStep = Math.max(furthestStep, step);
}

function durationBucket(seconds: number) {
  if (seconds < 30) return 'under-30s';
  if (seconds < 120) return '30s-2m';
  if (seconds < 300) return '2-5m';
  if (seconds < 600) return '5-10m';
  return 'over-10m';
}

/** Sends one end-of-session summary, bucketed so it stays readable on the Hobby plan. */
function endSession() {
  if (ended || !started) return;
  ended = true;
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  trackEvent('Session Ended', { seconds, furthestStep }, durationBucket(seconds));
}
