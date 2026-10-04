import { useEffect } from 'react';
import { trackEvent } from '../../analytics';
import { CircleCheck, FastForward, LoaderCircle } from 'lucide-react';
import { useStore } from '../../state/store';
import { PageHeader } from '../../components/PageHeader';

const BUSINESSES = ['Catering', 'Dental practice', 'Bike repair', 'Hair salon', 'Bookkeeping firm', 'Yoga studio', 'Food truck', 'Landscaping', 'Print shop', 'Pet grooming', 'Café', 'Electrician', 'Florist', 'Tutoring'];
const STATES = ['TX', 'OH', 'CA', 'GA', 'NY', 'WA', 'IL', 'FL', 'AZ', 'CO', 'NC', 'MI'];

/** Drives the deterministic response simulation while a study is running, on any screen. */
export function useResearchSimulation() {
  const { state, dispatch } = useStore();
  const running = state.research.phase === 'running';
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => dispatch({ type: 'research/tick' }), 85);
    return () => window.clearInterval(id);
  }, [running, dispatch]);
}

export function ResearchProgress() {
  const { state, dispatch } = useStore();
  const { research, builder } = state;
  const done = research.phase === 'done';
  const pct = Math.round((research.responses / builder.sampleSize) * 100);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => dispatch({ type: 'navigate', screen: 'results' }), 900);
    return () => window.clearTimeout(t);
  }, [done, dispatch]);

  const recent = Array.from({ length: Math.min(5, research.responses) }, (_, i) => research.responses - i).map((n) => ({
    n,
    label: `${BUSINESSES[n % BUSINESSES.length]} owner · ${STATES[(n * 7) % STATES.length]} · ${(n % 9) * 3 + 3} employees`,
  }));

  return (
    <div className="page page--narrow">
      <PageHeader kicker="Re-test · AI-moderated interviews + short survey" title="What drives SMB owners to choose Lumen?" />
      <section className="card progress-card" aria-live="polite">
        <div className="progress-card__status">
          {done ? <CircleCheck size={20} className="text-holding" aria-hidden /> : <LoaderCircle size={20} className="spin text-primary" aria-hidden />}
          <div>
            <h2 className="card__title">{done ? 'All responses are in' : 'Collecting responses…'}</h2>
            <p className="muted small">{done ? 'Maze AI is summarizing the results.' : 'Maze AI is interviewing participants from the Maze panel.'}</p>
          </div>
          <div className="progress-card__count" aria-label={`${research.responses} of ${builder.sampleSize} responses`}>
            <strong>{research.responses}</strong>/{builder.sampleSize}
          </div>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={builder.sampleSize} aria-valuenow={research.responses} aria-label="Responses collected">
          <span style={{ width: `${pct}%` }} />
        </div>
        <ul className="feed" aria-label="Latest participants">
          {recent.map((r) => (
            <li key={r.n} className="feed__item">
              <span className="feed__dot" aria-hidden />
              <span>Participant {String(r.n).padStart(2, '0')} completed</span>
              <span className="muted small">{r.label}</span>
            </li>
          ))}
        </ul>
        <div className="progress-card__foot">
          <span className="muted small">Simulated study. No real participants are being contacted.</span>
          {!done && (
            <button className="btn btn--secondary" onClick={() => { trackEvent('Research Skipped Ahead', { responses: research.responses }); dispatch({ type: 'research/complete' }); }}>
              <FastForward size={16} aria-hidden /> Skip ahead
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
