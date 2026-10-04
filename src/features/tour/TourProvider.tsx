import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { noteTourStep, trackEvent, trackView } from '../../analytics';
import { TOUR_STEPS } from './tourSteps';

export type TourSource = 'welcome' | 'guide' | 'restart';

interface TourContextValue {
  active: boolean;
  index: number;
  visited: Set<number>;
  completed: boolean;
  welcome: null | 'first' | 'restart';
  canAdvance: boolean;
  goTo: (index: number, source?: TourSource) => void;
  next: () => void;
  back: () => void;
  skip: (reason?: 'button' | 'escape' | 'explore') => void;
  finish: () => void;
  signal: (name: string) => void;
  openWelcome: (mode: 'first' | 'restart') => void;
  closeWelcome: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const stepPath = (i: number) => `/tour/${String(i + 1).padStart(2, '0')}-${TOUR_STEPS[i].id}`;

export function TourProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [welcome, setWelcome] = useState<null | 'first' | 'restart'>('first');
  const [signalled, setSignalled] = useState<string | null>(null);

  // Steps read the latest state when they prepare the app, without re-creating callbacks every render.
  const stateRef = useRef(state);
  const indexRef = useRef(index);
  const activeRef = useRef(active);
  useLayoutEffect(() => {
    stateRef.current = state;
    indexRef.current = index;
    activeRef.current = active;
  });

  const goTo = useCallback(
    (i: number, source?: TourSource) => {
      const step = TOUR_STEPS[i];
      if (!step) return;
      if (source) trackEvent('Tour Started', { source, step: i + 1 }, source);
      step.prepare(stateRef.current, dispatch);
      indexRef.current = i;
      activeRef.current = true;
      setIndex(i);
      setActive(true);
      setSignalled(null);
      setVisited((v) => new Set(v).add(i));
      noteTourStep(i + 1);
      trackView(stepPath(i));
    },
    [dispatch],
  );

  const step = TOUR_STEPS[index];
  const gateMet = !step.gate || signalled === step.gate.signal || !!step.gate.satisfied?.(state);
  const canAdvance = active && gateMet;

  const finish = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    setSignalled(null);
    setCompleted(true);
    trackEvent('Tour Completed');
    trackView('/tour/complete');
    if (stateRef.current.screen !== 'wrapup') dispatch({ type: 'navigate', screen: 'wrapup' });
  }, [dispatch]);

  const next = useCallback(() => {
    if (!canAdvance) return;
    if (indexRef.current === TOUR_STEPS.length - 1) finish();
    else goTo(indexRef.current + 1);
  }, [canAdvance, finish, goTo]);

  const back = useCallback(() => {
    if (indexRef.current > 0) goTo(indexRef.current - 1);
  }, [goTo]);

  const skip = useCallback((reason: 'button' | 'escape' | 'explore' = 'button') => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setActive(false);
    setSignalled(null);
    const i = indexRef.current;
    trackEvent('Tour Skipped', { step: i + 1, reason }, `${String(i + 1).padStart(2, '0')}-${TOUR_STEPS[i].id}`);
  }, []);

  const signal = useCallback(
    (name: string) => {
      if (!activeRef.current) return;
      const current = TOUR_STEPS[indexRef.current];
      if (current.gate?.signal !== name) return;
      setSignalled(name);
      trackEvent('Tour Gate Completed', { gate: name }, name);
      if (current.gate.autoAdvance) {
        // Let the click's own navigation commit before the next step prepares the screen.
        window.setTimeout(() => goTo(indexRef.current + 1), 0);
      }
    },
    [goTo],
  );

  const openWelcome = useCallback((mode: 'first' | 'restart') => {
    activeRef.current = false;
    setActive(false);
    setSignalled(null);
    setWelcome(mode);
  }, []);
  const closeWelcome = useCallback(() => setWelcome(null), []);

  const value = useMemo(
    () => ({ active, index, visited, completed, welcome, canAdvance, goTo, next, back, skip, finish, signal, openWelcome, closeWelcome }),
    [active, index, visited, completed, welcome, canAdvance, goTo, next, back, skip, finish, signal, openWelcome, closeWelcome],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}
