import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { TOUR_STEPS } from './tourSteps';

interface TourContextValue {
  active: boolean;
  index: number;
  visited: Set<number>;
  completed: boolean;
  welcome: null | 'first' | 'restart';
  canAdvance: boolean;
  goTo: (index: number) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  signal: (name: string) => void;
  openWelcome: (mode: 'first' | 'restart') => void;
  closeWelcome: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

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
  stateRef.current = state;
  const indexRef = useRef(index);
  indexRef.current = index;
  const activeRef = useRef(active);
  activeRef.current = active;

  const goTo = useCallback(
    (i: number) => {
      const step = TOUR_STEPS[i];
      if (!step) return;
      step.prepare(stateRef.current, dispatch);
      setIndex(i);
      setActive(true);
      setSignalled(null);
      setVisited((v) => new Set(v).add(i));
    },
    [dispatch],
  );

  const step = TOUR_STEPS[index];
  const gateMet = !step.gate || signalled === step.gate.signal || !!step.gate.satisfied?.(state);
  const canAdvance = active && gateMet;

  const finish = useCallback(() => {
    setActive(false);
    setCompleted(true);
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

  const skip = useCallback(() => setActive(false), []);

  const signal = useCallback(
    (name: string) => {
      if (!activeRef.current) return;
      const current = TOUR_STEPS[indexRef.current];
      if (current.gate?.signal !== name) return;
      setSignalled(name);
      if (current.gate.autoAdvance) {
        // Let the click's own navigation commit before the next step prepares the screen.
        window.setTimeout(() => goTo(indexRef.current + 1), 0);
      }
    },
    [goTo],
  );

  const openWelcome = useCallback((mode: 'first' | 'restart') => {
    setActive(false);
    setWelcome(mode);
  }, []);
  const closeWelcome = useCallback(() => setWelcome(null), []);

  useEffect(() => {
    if (!active) setSignalled(null);
  }, [active]);

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
