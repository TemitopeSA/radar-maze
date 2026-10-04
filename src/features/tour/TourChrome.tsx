import { useState } from 'react';
import { Check, Compass, Play, RotateCcw } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Menu } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { useStore } from '../../state/store';
import { useTour } from './TourProvider';
import { TOUR_STEPS } from './tourSteps';

export function WelcomeModal() {
  const { state, dispatch } = useStore();
  const tour = useTour();
  if (!tour.welcome) return null;
  const dirty = state.journey.launched || state.journey.accepted;
  const start = (reset: boolean) => {
    if (reset) dispatch({ type: 'reset' });
    tour.closeWelcome();
    // Wait a tick so a reset commits before the first step prepares the app.
    window.setTimeout(() => tour.goTo(0), 0);
  };
  return (
    <Modal
      title="What if Maze could tell you when your product bets stop being true?"
      kicker="Introducing Assumption Radar"
      onClose={tour.closeWelcome}
      size="md"
      closeOnBackdrop={false}
      footer={
        tour.welcome === 'restart' && dirty ? (
          <>
            <button className="btn btn--ghost" onClick={tour.closeWelcome}>Cancel</button>
            <button className="btn btn--secondary" onClick={() => start(false)}>Keep my changes</button>
            <button className="btn btn--primary" onClick={() => start(true)} data-autofocus>
              <RotateCcw size={16} aria-hidden /> Reset demo data and start
            </button>
          </>
        ) : (
          <>
            <button className="btn btn--ghost" onClick={tour.closeWelcome}>I’ll explore</button>
            <button className="btn btn--primary" onClick={() => start(false)} data-autofocus>
              <Play size={16} aria-hidden /> Start the tour
            </button>
          </>
        )
      }
    >
      <div className="welcome">
        <div className="welcome__visual" aria-hidden>
          <svg viewBox="0 0 320 120" width="100%" height="120">
            <defs>
              <linearGradient id="wfade" x1="0" x2="1">
                <stop offset="0" stopColor="var(--maze-blue-200)" />
                <stop offset="1" stopColor="var(--maze-blue-100)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="320" height="120" rx="8" fill="url(#wfade)" />
            {[30, 60, 90].map((y) => (
              <line key={y} x1="24" x2="296" y1={y} y2={y} stroke="var(--maze-blue-300)" strokeOpacity="0.5" strokeDasharray="2 4" />
            ))}
            <polyline points="24,34 62,34 100,42 138,52 176,62 214,74 252,86 296,98" fill="none" stroke="var(--maze-amber-400)" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="214" cy="74" r="6" fill="var(--maze-neutral-000)" stroke="var(--maze-amber-500)" strokeWidth="2" />
            <circle cx="296" cy="98" r="4" fill="var(--maze-amber-500)" />
            <text x="24" y="22" fontSize="11" fill="var(--maze-blue-700)" fontWeight="600">78</text>
            <text x="282" y="86" fontSize="11" fill="var(--maze-amber-500)" fontWeight="600">41</text>
          </svg>
        </div>
        <p>
          You’re <strong>Dana Okafor</strong>, Head of Product at <strong>Lumen</strong>. Your team has been betting on low prices to win customers. New research suggests something may have changed. Let’s investigate.
        </p>
        {tour.welcome === 'restart' && dirty && (
          <p className="notice">
            You’ve already re-tested the pricing assumption in this session. Reset the demo data to replay the story from the beginning, or keep your changes and tour the updated state.
          </p>
        )}
        <p className="fine-print">Concept prototype with fictional data. Not a Maze product.</p>
      </div>
    </Modal>
  );
}

export function GuideButton() {
  const tour = useTour();
  const { dispatch } = useStore();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="guide">
      <Menu
        label="Guided tour"
        align="right"
        trigger={(props) => (
          <button className="guide__btn" {...props}>
            <Compass size={16} aria-hidden /> Guide
          </button>
        )}
      >
        {(close) => (
          <div className="guide__menu">
            <button
              role="menuitem"
              className="menu__item menu__item--strong"
              onClick={() => {
                close();
                tour.goTo(tour.active || tour.visited.size === 0 || tour.completed ? 0 : tour.index);
              }}
            >
              <Play size={16} aria-hidden />
              <span className="menu__label">{tour.visited.size > 0 && !tour.completed && !tour.active ? 'Resume tour' : 'Start tour'}</span>
            </button>
            <div className="menu__sep" />
            <div className="menu__heading">Jump to a step</div>
            <ol className="guide__steps">
              {TOUR_STEPS.map((s, i) => (
                <li key={s.id}>
                  <button
                    role="menuitem"
                    className={`menu__item guide__step ${tour.active && tour.index === i ? 'is-current' : ''}`}
                    onClick={() => {
                      close();
                      tour.goTo(i);
                    }}
                  >
                    <span className={`guide__num ${tour.visited.has(i) ? 'is-visited' : ''}`}>
                      {tour.visited.has(i) ? <Check size={11} aria-hidden /> : i + 1}
                    </span>
                    <span className="menu__label">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="menu__sep" />
            <button
              role="menuitem"
              className="menu__item"
              onClick={() => {
                close();
                setConfirmReset(true);
              }}
            >
              <RotateCcw size={16} aria-hidden />
              <span className="menu__label">Reset demo data</span>
            </button>
          </div>
        )}
      </Menu>
      {confirmReset && (
        <Modal
          title="Reset demo data?"
          size="sm"
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button
                className="btn btn--primary"
                data-autofocus
                onClick={() => {
                  tour.skip();
                  dispatch({ type: 'reset' });
                  setConfirmReset(false);
                  toast('Demo data reset. Lumen is back to the start of the story.');
                }}
              >
                Reset data
              </button>
            </>
          }
        >
          <p>This restores the original 14 assumptions, removes the re-test study, and clears any assumptions you added. Your tour progress stays as it is.</p>
        </Modal>
      )}
    </div>
  );
}
