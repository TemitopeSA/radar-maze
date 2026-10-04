import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CircleCheck, Hourglass, MousePointerClick } from 'lucide-react';
import { useStore } from '../../state/store';
import { dialogStack, trapTab } from '../../components/Modal';
import { useTour } from './TourProvider';
import { TOUR_STEPS, type Placement } from './tourSteps';

interface Box { top: number; left: number; width: number; height: number }

const PAD = 6;
const GAP = 14;
const MARGIN = 16;

function sameBox(a: Box | null, b: Box | null) {
  if (!a || !b) return a === b;
  return Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;
}

function findTarget(id?: string) {
  return id ? document.querySelector<HTMLElement>(`[data-tour="${id}"]`) : null;
}

/** Picks the first side with room for the card, falling back to a docked corner. */
function placeCard(hole: Box, card: { w: number; h: number }, preferred: Placement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const order: Placement[] = [preferred, ...(['right', 'bottom', 'left', 'top'] as Placement[]).filter((p) => p !== preferred)];
  const clampX = (x: number) => Math.min(Math.max(x, MARGIN), vw - card.w - MARGIN);
  const clampY = (y: number) => Math.min(Math.max(y, MARGIN), vh - card.h - MARGIN);
  for (const p of order) {
    if (p === 'right' && hole.left + hole.width + GAP + card.w <= vw - MARGIN)
      return { left: hole.left + hole.width + GAP, top: clampY(hole.top + hole.height / 2 - card.h / 2) };
    if (p === 'left' && hole.left - GAP - card.w >= MARGIN)
      return { left: hole.left - GAP - card.w, top: clampY(hole.top + hole.height / 2 - card.h / 2) };
    if (p === 'bottom' && hole.top + hole.height + GAP + card.h <= vh - MARGIN)
      return { left: clampX(hole.left + hole.width / 2 - card.w / 2), top: hole.top + hole.height + GAP };
    if (p === 'top' && hole.top - GAP - card.h >= MARGIN)
      return { left: clampX(hole.left + hole.width / 2 - card.w / 2), top: hole.top - GAP - card.h };
  }
  return { left: vw - card.w - MARGIN, top: vh - card.h - MARGIN };
}

export function TourOverlay() {
  const { state } = useStore();
  const tour = useTour();
  const step = TOUR_STEPS[tour.index];
  const [hole, setHole] = useState<Box | null>(null);
  const [cardSize, setCardSize] = useState({ w: 360, h: 220 });
  const cardRef = useRef<HTMLDivElement>(null);
  const holeRef = useRef<Box | null>(null);

  // Track the target's live position every frame: robust to scrolling, resizing and layout changes.
  useEffect(() => {
    if (!tour.active) return;
    let raf = 0;
    let scrolled = false;
    const measure = () => {
      const el = findTarget(step.target);
      let next: Box | null = null;
      if (el) {
        let r = el.getBoundingClientRect();
        if (!scrolled) {
          scrolled = true;
          if (r.top < 72 || r.bottom > window.innerHeight - 24) {
            el.scrollIntoView({ block: r.height > window.innerHeight - 160 ? 'start' : 'center', behavior: 'smooth' });
          }
        }
        r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
      }
      if (!sameBox(holeRef.current, next)) {
        holeRef.current = next;
        setHole(next);
      }
    };
    const loop = () => {
      measure();
      raf = requestAnimationFrame(loop);
    };
    // rAF keeps the spotlight glued to the target; the interval and listeners cover throttled frames.
    const interval = window.setInterval(measure, 120);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [tour.active, step.target, tour.index]);

  // Measure the card so placement can keep it on screen; content changes per step resize it.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!tour.active || !el) return;
    const update = () => setCardSize((s) => (s.w === el.offsetWidth && s.h === el.offsetHeight ? s : { w: el.offsetWidth, h: el.offsetHeight }));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tour.active]);

  // Move focus into the card whenever the step changes.
  useEffect(() => {
    if (tour.active) cardRef.current?.focus({ preventScroll: true });
  }, [tour.active, tour.index]);

  // Keyboard shortcuts, attached once per activation.
  const tourRef = useRef(tour);
  useLayoutEffect(() => {
    tourRef.current = tour;
  });
  useEffect(() => {
    if (!tour.active) return;
    const onKey = (e: KeyboardEvent) => {
      if (dialogStack.count > 0) return;
      const t = tourRef.current;
      const el = document.activeElement as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      const inCard = !!el && !!cardRef.current?.contains(el);
      if (e.key === 'Escape') {
        e.preventDefault();
        t.skip('escape');
      } else if (typing) {
        return;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        t.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        t.back();
      } else if (e.key === 'Enter' && (el === document.body || el === cardRef.current)) {
        e.preventDefault();
        t.next();
      } else if (e.key === 'Tab' && inCard && cardRef.current) {
        const target = findTarget(TOUR_STEPS[t.index].target);
        const focusTarget = target && TOUR_STEPS[t.index].gate ? [target.matches('button, [tabindex], a') ? target : target.querySelector<HTMLElement>('button, [tabindex="0"], a')].filter(Boolean) as HTMLElement[] : [];
        trapTab(e, cardRef.current, focusTarget);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tour.active]);

  if (!tour.active) return null;

  const body = typeof step.body === 'function' ? step.body(state) : step.body;
  const total = TOUR_STEPS.length;
  const gateMet = tour.canAdvance;
  const waiting = !!step.target && !hole;
  const centered = !step.target;
  const isLast = tour.index === total - 1;

  let cardStyle: React.CSSProperties;
  if (centered) cardStyle = { left: `calc(50% - ${cardSize.w / 2}px)`, top: `calc(50% - ${cardSize.h / 2}px)` };
  else if (hole) cardStyle = placeCard(hole, cardSize, step.placement ?? 'bottom');
  else cardStyle = { right: 24, bottom: 88 };

  const blockers = hole
    ? [
        { top: 0, left: 0, width: '100%', height: Math.max(0, hole.top) },
        { top: hole.top + hole.height, left: 0, width: '100%', bottom: 0 },
        { top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height },
        { top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height },
      ]
    : centered
      ? [{ top: 0, left: 0, right: 0, bottom: 0 }]
      : [];

  return createPortal(
    <div className="tour">
      {blockers.map((b, i) => (
        <div key={i} className="tour__blocker" style={b} aria-hidden />
      ))}
      {hole && (
        <div
          className={`tour__spotlight ${step.gate && !gateMet ? 'tour__spotlight--pulse' : ''}`}
          style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
          aria-hidden
        />
      )}
      {centered && <div className="tour__dim" aria-hidden />}
      <div
        ref={cardRef}
        className={`tour__card ${waiting ? 'tour__card--docked' : ''}`}
        style={cardStyle}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
      >
        <div className="tour__meta">
          <span className="kicker kicker--blue">Step {tour.index + 1} of {total}</span>
          <button className="link-btn link-btn--muted" onClick={() => tour.skip()}>Skip tour</button>
        </div>
        <div className="tour__progress" aria-hidden>
          <span style={{ width: `${((tour.index + 1) / total) * 100}%` }} />
        </div>
        <h2 id="tour-title" className="tour__title">{step.title}</h2>
        <p id="tour-body" className="tour__body">{body}</p>
        {waiting && step.waitingHint && (
          <p className="tour__hint tour__hint--wait"><Hourglass size={14} aria-hidden /> {step.waitingHint}</p>
        )}
        {!waiting && step.gate && !gateMet && (
          <p className="tour__hint"><MousePointerClick size={14} aria-hidden /> {step.gate.hint}</p>
        )}
        {step.gate && gateMet && step.gate.doneHint && (
          <p className="tour__hint tour__hint--done"><CircleCheck size={14} aria-hidden /> {step.gate.doneHint}</p>
        )}
        {!step.gate && step.hint && !waiting && <p className="tour__hint"><MousePointerClick size={14} aria-hidden /> {step.hint}</p>}
        <div className="tour__actions">
          <button className="btn btn--ghost btn--sm" onClick={tour.back} disabled={tour.index === 0}>
            <ArrowLeft size={14} aria-hidden /> Back
          </button>
          {isLast && (
            <button className="btn btn--secondary btn--sm" onClick={() => tour.openWelcome('restart')}>
              Restart tour
            </button>
          )}
          <button
            className="btn btn--primary btn--sm"
            onClick={tour.next}
            disabled={!gateMet}
            aria-disabled={!gateMet}
            title={!gateMet ? step.gate?.hint : undefined}
          >
            {isLast ? 'Explore freely' : 'Next'} {!isLast && <ArrowRight size={14} aria-hidden />}
          </button>
        </div>
        <p className="tour__keys" aria-hidden>
          <kbd>←</kbd> <kbd>→</kbd> to move · <kbd>Esc</kbd> to exit
        </p>
      </div>
    </div>,
    document.body,
  );
}
