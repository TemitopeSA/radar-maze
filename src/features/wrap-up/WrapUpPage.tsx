import { useState } from 'react';
import { trackEvent } from '../../analytics';
import { Check, Compass, Eye, FlaskConical, GitBranch, Radar, RotateCcw, Target } from 'lucide-react';
import { useStore } from '../../state/store';
import { HERO_ID } from '../../data/seed';
import { PageHeader } from '../../components/PageHeader';
import { useTour } from '../tour/TourProvider';

const STAGES = [
  { id: 'baseline', label: 'Baseline', icon: Target, recap: 'Capture what your team believes and why.' },
  { id: 'monitor', label: 'Monitor', icon: Radar, recap: 'Track confidence as new evidence arrives.' },
  { id: 'surface', label: 'Surface', icon: Eye, recap: 'Detect assumptions that may no longer hold.' },
  { id: 'research', label: 'Research', icon: FlaskConical, recap: 'Investigate uncertainty with a targeted study.' },
  { id: 'decide', label: 'Decide', icon: GitBranch, recap: 'Update beliefs and flag the decisions they affect.' },
] as const;

const SIZE = 340;
const R = 128;

export function WrapUpPage() {
  const { state, dispatch } = useStore();
  const tour = useTour();
  const hero = state.assumptions.find((a) => a.id === HERO_ID)!;
  const owners = new Set(state.assumptions.map((a) => a.owner.name)).size;
  const { journey } = state;

  const done: Record<(typeof STAGES)[number]['id'], boolean> = {
    baseline: true,
    monitor: true,
    surface: journey.openedHero,
    research: journey.launched,
    decide: journey.accepted,
  };
  const story: Record<(typeof STAGES)[number]['id'], string> = {
    baseline: `${state.assumptions.length} assumptions tracked across ${owners} owners, including the belief that price wins customers (confidence 78).`,
    monitor: 'Confidence in the pricing assumption fell from 78 to 41 over six weeks as three new studies came in.',
    surface: journey.openedHero
      ? 'You opened the drifting assumption, saw why Maze flagged it, and heard the shift in customers’ own words.'
      : 'Not yet. Open the drifting pricing assumption to see why Maze flagged it.',
    research: journey.launched
      ? `You re-tested with ${state.builder.sampleSize} SMB owners${state.builder.bias === 'accepted' ? ' after removing a leading question' : ''}.`
      : 'Not yet. Re-test the pricing assumption with Maze.',
    decide: journey.accepted
      ? `You accepted v2 (“${hero.statement}”, confidence ${hero.confidence}) and flagged the Q2 pricing page for review.`
      : 'Not yet. Accept the suggested update to version the belief and flag the decisions it affects.',
  };
  const firstOpen = STAGES.findIndex((s) => !done[s.id]);
  const [selected, setSelected] = useState(firstOpen === -1 ? 4 : firstOpen);
  const completedCount = STAGES.filter((s) => done[s.id]).length;

  const pos = (i: number) => {
    const angle = -Math.PI / 2 + (i / STAGES.length) * Math.PI * 2;
    return { x: SIZE / 2 + R * Math.cos(angle), y: SIZE / 2 + R * Math.sin(angle), angle };
  };
  const arc = (i: number) => {
    const a0 = -Math.PI / 2 + (i / STAGES.length) * Math.PI * 2 + 0.26;
    const a1 = -Math.PI / 2 + ((i + 1) / STAGES.length) * Math.PI * 2 - 0.26;
    const p0 = { x: SIZE / 2 + R * Math.cos(a0), y: SIZE / 2 + R * Math.sin(a0) };
    const p1 = { x: SIZE / 2 + R * Math.cos(a1), y: SIZE / 2 + R * Math.sin(a1) };
    return `M${p0.x},${p0.y} A${R},${R} 0 0 1 ${p1.x},${p1.y}`;
  };
  const stage = STAGES[selected];
  const selectStage = (i: number) => {
    trackEvent('Loop Stage Viewed', { stage: STAGES[i].id }, STAGES[i].id);
    setSelected(i);
  };

  return (
    <div className="page">
      <PageHeader
        kicker="Assumption Radar"
        title="From assumptions to better decisions"
        description="Assumption Radar connects what your team believes to what customers say and what your team does next."
      />
      <section className="card wrap" aria-labelledby="loop-title">
        <h2 id="loop-title" className="sr-only">The five-stage loop</h2>
        <div className="wrap__loop" data-tour="wrap-loop">
          <div className="loop">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" aria-hidden>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--maze-neutral-400)" />
                </marker>
                <marker id="arrow-done" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--maze-blue-500)" />
                </marker>
              </defs>
              {STAGES.map((s, i) => {
                const complete = done[s.id] && done[STAGES[(i + 1) % STAGES.length].id];
                return <path key={s.id} d={arc(i)} fill="none" stroke={complete ? 'var(--maze-blue-500)' : 'var(--maze-neutral-300)'} strokeWidth={2} strokeDasharray={complete ? undefined : '4 4'} markerEnd={complete ? 'url(#arrow-done)' : 'url(#arrow)'} />;
              })}
            </svg>
            <div className="loop__center">
              <strong>{completedCount}/5</strong>
              <span className="muted small">stages completed</span>
            </div>
            {STAGES.map((s, i) => {
              const p = pos(i);
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  className={`loop__node ${done[s.id] ? 'is-done' : ''} ${selected === i ? 'is-selected' : ''}`}
                  style={{ left: `${(p.x / SIZE) * 100}%`, top: `${(p.y / SIZE) * 100}%` }}
                  onClick={() => selectStage(i)}
                  aria-pressed={selected === i}
                  aria-label={`${i + 1}. ${s.label}${done[s.id] ? ', completed' : ''}`}
                >
                  <span className="loop__icon">{done[s.id] ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}</span>
                  <span className="loop__label">{s.label}</span>
                </button>
              );
            })}
          </div>
          <ol className="loop-list">
            {STAGES.map((s, i) => (
              <li key={s.id} className={`loop-list__item ${selected === i ? 'is-selected' : ''} ${done[s.id] ? 'is-done' : ''}`}>
                <button onClick={() => selectStage(i)}>
                  <span className="loop-list__num">{i + 1}</span>
                  <span>
                    <strong>{s.label}:</strong> <span className="muted">{s.recap}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <aside className="wrap__detail" aria-live="polite">
          <div className="kicker kicker--blue">Stage {selected + 1} · {stage.label}</div>
          <h3 className="wrap__recap">{stage.recap}</h3>
          <div className={`journey ${done[stage.id] ? 'journey--done' : ''}`}>
            <span className="side-title">{done[stage.id] ? 'In your journey' : 'Still to do'}</span>
            <p>{story[stage.id]}</p>
          </div>
          <div className="wrap__actions">
            <button className="btn btn--secondary" onClick={() => { trackEvent('Restart Tour Clicked', { source: 'wrap-up' }); tour.openWelcome('restart'); }}>
              <RotateCcw size={16} aria-hidden /> Restart tour
            </button>
            <button
              className="btn btn--primary"
              onClick={() => {
                tour.skip('explore');
                trackEvent('Explore Freely', { source: 'wrap-up' });
                dispatch({ type: 'navigate', screen: 'assumptions' });
              }}
            >
              <Compass size={16} aria-hidden /> Explore freely
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
