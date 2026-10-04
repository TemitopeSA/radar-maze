import type { Dispatch } from 'react';
import { HERO_ID } from '../../data/seed';
import type { Action, AppState } from '../../state/store';

export type Placement = 'right' | 'left' | 'bottom' | 'top';

export interface TourStep {
  id: string;
  title: string;
  body: string | ((state: AppState) => string);
  /** Value of the data-tour attribute to spotlight. Omit for a centered card. */
  target?: string;
  placement?: Placement;
  /** Puts the app in the right state for this step. Must be idempotent. */
  prepare: (state: AppState, dispatch: Dispatch<Action>) => void;
  gate?: {
    signal: string;
    hint: string;
    /** When true the requirement is already met (for example when replaying). */
    satisfied?: (state: AppState) => boolean;
    /** Move to the next step as soon as the signal fires. */
    autoAdvance?: boolean;
    doneHint?: string;
  };
  hint?: string;
  waitingHint?: string;
}

const go = (screen: AppState['screen']) => (state: AppState, dispatch: Dispatch<Action>) => {
  if (state.screen !== screen) dispatch({ type: 'navigate', screen });
};

const openHero = (tab: AppState['detailTab']) => (state: AppState, dispatch: Dispatch<Action>) => {
  if (state.screen !== 'detail' || state.selectedId !== HERO_ID || state.detailTab !== tab) {
    dispatch({ type: 'openAssumption', id: HERO_ID, tab });
  }
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Meet Lumen',
    body: 'Lumen helps small businesses get paid. Its team has bet its pricing strategy on one belief: customers pick Lumen because it’s the cheapest. Let’s see if that’s still true.',
    prepare: go('home'),
  },
  {
    id: 'nav',
    title: 'Assumptions, a new space in Maze',
    body: 'A new home for the beliefs your roadmap is built on.',
    target: 'nav-assumptions',
    placement: 'right',
    prepare: go('home'),
  },
  {
    id: 'home-alert',
    title: 'Maze tells you when to look again',
    body: 'Maze watches your assumptions and helps you spot when the evidence starts to change.',
    target: 'home-alert',
    placement: 'bottom',
    prepare: go('home'),
  },
  {
    id: 'tiles',
    title: 'Every belief, accounted for',
    body: 'Every assumption has an owner, a confidence score, and a point when it should be checked again.',
    target: 'summary-tiles',
    placement: 'bottom',
    prepare: go('assumptions'),
  },
  {
    id: 'radar',
    title: 'The radar',
    body: 'See confidence and freshness together. Assumptions that are weakening or overdue deserve a closer look.',
    target: 'radar',
    placement: 'right',
    prepare: go('assumptions'),
  },
  {
    id: 'hero-row',
    title: 'One belief is drifting',
    body: (s) =>
      s.journey.accepted
        ? 'This is the pricing assumption you already re-tested. It was drifting; now it’s backed by fresh evidence. Open it to see how it changed.'
        : 'This one is drifting. Your team believes price is the main reason customers choose Lumen, but recent evidence tells a different story.',
    target: 'hero-row',
    placement: 'bottom',
    prepare: (state, dispatch) => {
      go('assumptions')(state, dispatch);
      const f = state.filters;
      if (f.query || f.status !== 'all' || f.category !== 'all' || f.sort !== 'default') dispatch({ type: 'clearFilters' });
    },
    gate: { signal: 'open-hero', hint: 'Click the assumption to open it.', autoAdvance: true },
  },
  {
    id: 'chart',
    title: 'Watch confidence change',
    body: (s) =>
      s.journey.accepted
        ? 'Confidence fell from 78 to 41 in six weeks, then recovered to the re-tested belief. The signal showed up before it became a bigger problem.'
        : 'Confidence fell from 78 to 41 in six weeks. The signal is visible before the belief becomes a bigger problem.',
    target: 'confidence-chart',
    placement: 'bottom',
    prepare: openHero('overview'),
  },
  {
    id: 'ai',
    title: 'Why Maze flagged this',
    body: 'No black box. Maze explains the signal, shows what changed, and points to the evidence behind it.',
    target: 'ai-signal',
    placement: 'left',
    prepare: openHero('overview'),
  },
  {
    id: 'evidence',
    title: 'Hear the shift',
    body: 'Hear the shift in customers’ own words: early feedback focuses on price; recent feedback emphasizes speed and trust.',
    target: 'evidence-timeline',
    placement: 'top',
    prepare: openHero('evidence'),
  },
  {
    id: 'retest',
    title: 'Re-test with Maze',
    body: 'Turn uncertainty into a focused study without starting from scratch.',
    target: 'retest-cta',
    placement: 'bottom',
    prepare: openHero('overview'),
    gate: { signal: 'retest', hint: 'Click Re-test with Maze to continue.', autoAdvance: true },
  },
  {
    id: 'bias',
    title: 'Catch leading questions',
    body: 'Research quality matters. Maze helps you spot leading questions before they influence the answers.',
    target: 'bias-check',
    placement: 'right',
    hint: 'Accept the suggested rewrite, then click Next.',
    prepare: (state, dispatch) => {
      go('builder')(state, dispatch);
      if (state.builder.step !== 1) dispatch({ type: 'builder/set', patch: { step: 1 } });
    },
  },
  {
    id: 'launch',
    title: 'Launch the study',
    body: '40 SMB owners from the Maze panel, with Fresh Eyes keeping out anyone who joined a Lumen study in the last 90 days.',
    target: 'launch-study',
    placement: 'top',
    prepare: (state, dispatch) => {
      go('builder')(state, dispatch);
      if (state.builder.step !== 3) dispatch({ type: 'builder/set', patch: { step: 3 } });
    },
    gate: { signal: 'launch', hint: 'Click Launch study to continue.', satisfied: (s) => s.research.phase !== 'idle', autoAdvance: true },
  },
  {
    id: 'accept',
    title: 'Update the belief',
    body: 'The evidence suggests a new belief. Accept it to version the assumption and flag the pricing decision for review.',
    target: 'update-card',
    placement: 'left',
    waitingHint: 'Responses are coming in. Use Skip ahead if you don’t want to wait.',
    prepare: (state, dispatch) => {
      if (state.research.phase === 'idle') {
        dispatch({ type: 'research/launch' });
        dispatch({ type: 'navigate', screen: 'progress' });
      } else if (state.research.phase === 'running') go('progress')(state, dispatch);
      else go('results')(state, dispatch);
    },
    gate: {
      signal: 'accept',
      hint: 'Click Accept update to continue.',
      satisfied: (s) => s.journey.accepted,
      doneHint: 'Updated. The assumption is now v2 and the pricing decision is flagged for review.',
    },
  },
  {
    id: 'wrap',
    title: 'The full loop',
    body: 'Assumption Radar connects what your team believes to what customers say and what your team does next.',
    target: 'wrap-loop',
    placement: 'right',
    prepare: go('wrapup'),
  },
];
