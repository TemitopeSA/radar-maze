import { useEffect, useState } from 'react';
import { slug, trackEvent, trackView } from '../../analytics';
import { ArrowLeft, ArrowRight, Check, CircleCheck, LoaderCircle, Minus, Plus, Rocket, ShieldCheck, Sparkles, Trash2, TriangleAlert, Users } from 'lucide-react';
import { BIAS_REWRITE, LEADING_QUESTION, METHODS, useStore, type MethodId } from '../../state/store';
import { HERO_ID } from '../../data/seed';
import { PageHeader } from '../../components/PageHeader';
import { Toggle } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { useTour } from '../tour/TourProvider';

const STEPS = ['Objective', 'Questions', 'Recruitment', 'Review & launch'];

export function StudyBuilder() {
  const { state, dispatch } = useStore();
  const { builder } = state;
  const hero = state.assumptions.find((a) => a.id === HERO_ID)!;
  const setStep = (step: number) => dispatch({ type: 'builder/set', patch: { step } });

  useEffect(() => {
    trackView(`/app/builder/${builder.step + 1}-${slug(STEPS[builder.step])}`);
  }, [builder.step]);

  return (
    <div className="page page--narrow">
      <PageHeader
        crumbs={[
          { label: 'Assumptions', onClick: () => dispatch({ type: 'navigate', screen: 'assumptions' }) },
          { label: 'Pricing', onClick: () => dispatch({ type: 'openAssumption', id: HERO_ID }) },
          { label: 'Re-test' },
        ]}
        onBack={() => dispatch({ type: 'openAssumption', id: HERO_ID })}
        kicker="Maze AI study builder"
        title="Re-test with Maze"
        description={<>Testing: <em>“{hero.versions[0].statement}”</em></>}
      />

      <ol className="stepper" aria-label="Study builder progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`stepper__item ${i === builder.step ? 'is-current' : ''} ${i < builder.step ? 'is-done' : ''}`}>
            <button onClick={() => setStep(i)} aria-current={i === builder.step ? 'step' : undefined}>
              <span className="stepper__num">{i < builder.step ? <Check size={12} aria-hidden /> : i + 1}</span>
              <span>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="card builder-card">
        {builder.step === 0 && <ObjectiveStep />}
        {builder.step === 1 && <QuestionsStep />}
        {builder.step === 2 && <RecruitmentStep />}
        {builder.step === 3 && <ReviewStep />}
      </div>

      {builder.step < 3 && (
        <div className="builder-nav">
          <button className="btn btn--ghost" onClick={() => (builder.step === 0 ? dispatch({ type: 'openAssumption', id: HERO_ID }) : setStep(builder.step - 1))}>
            <ArrowLeft size={16} aria-hidden /> {builder.step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button className="btn btn--primary" onClick={() => setStep(builder.step + 1)} disabled={builder.step === 0 && !builder.objective.trim()}>
            Continue to {STEPS[builder.step + 1].toLowerCase()} <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

function ObjectiveStep() {
  const { state, dispatch } = useStore();
  const { builder } = state;
  const [showAlternatives, setShowAlternatives] = useState(builder.method !== 'interviews-survey');
  const recommended = METHODS['interviews-survey'];
  return (
    <div className="stack-lg">
      <div className="field">
        <label htmlFor="objective" className="field__label">What do you want to learn?</label>
        <textarea id="objective" rows={3} value={builder.objective} onChange={(e) => dispatch({ type: 'builder/set', patch: { objective: e.target.value } })} />
        <span className="field__help">Maze AI drafted this from the drifting assumption and its evidence. Edit it freely.</span>
      </div>
      <div>
        <div className="kicker kicker--ai"><Sparkles size={12} aria-hidden /> Recommended method</div>
        <button
          className={`method method--recommended ${builder.method === 'interviews-survey' ? 'is-selected' : ''}`}
          onClick={() => { trackEvent('Method Selected', { method: 'interviews-survey' }, 'interviews-survey'); dispatch({ type: 'builder/set', patch: { method: 'interviews-survey' } }); }}
          aria-pressed={builder.method === 'interviews-survey'}
        >
          <span className="method__radio" aria-hidden>{builder.method === 'interviews-survey' && <Check size={12} />}</span>
          <span>
            <span className="method__title">{recommended.label}</span>
            <span className="method__desc">{recommended.description}</span>
            <span className="method__meta">About 15 minutes per participant · Results in 1–2 days</span>
          </span>
        </button>
        {!showAlternatives ? (
          <button className="link-btn method-alt-toggle" onClick={() => { trackEvent('Alternative Methods Shown'); setShowAlternatives(true); }}>Choose a different method</button>
        ) : (
          <div className="method-alts" role="group" aria-label="Alternative methods">
            {(['interviews', 'survey', 'prototype'] as MethodId[]).map((id) => (
              <button key={id} className={`method method--alt ${builder.method === id ? 'is-selected' : ''}`} onClick={() => { trackEvent('Method Selected', { method: id }, id); dispatch({ type: 'builder/set', patch: { method: id } }); }} aria-pressed={builder.method === id}>
                <span className="method__radio" aria-hidden>{builder.method === id && <Check size={12} />}</span>
                <span>
                  <span className="method__title">{METHODS[id].label}</span>
                  <span className="method__desc">{METHODS[id].description}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionsStep() {
  const { state, dispatch } = useStore();
  const { builder } = state;
  const resolveBias = (resolution: 'accepted' | 'kept') => {
    trackEvent('Bias Check Resolved', { resolution }, resolution);
    dispatch({ type: 'builder/bias', resolution });
  };
  return (
    <div className="stack">
      <div className="step-intro">
        <h2 className="card__title">Research questions</h2>
        <p className="muted">Maze AI drafted these from your objective. Edit any question; Maze checks them for bias as you go.</p>
      </div>
      <div className="bias-summary">
        {builder.bias === 'pending' ? (
          <span className="bias-summary__warn"><TriangleAlert size={14} aria-hidden /> Bias check: 1 leading question found</span>
        ) : (
          <span className="bias-summary__ok"><ShieldCheck size={14} aria-hidden /> Bias check: {builder.bias === 'accepted' ? 'no issues found' : '1 question kept as written'}</span>
        )}
      </div>
      <ol className="questions">
        {builder.questions.map((q, i) => (
          <li key={q.id} className={`question ${q.flagged && builder.bias === 'pending' ? 'question--flagged' : ''}`} data-tour={q.flagged ? 'bias-check' : undefined}>
            <div className="question__row">
              <span className="question__num">{i + 1}</span>
              <input
                className="input"
                value={q.text}
                onChange={(e) => dispatch({ type: 'builder/question', id: q.id, text: e.target.value })}
                aria-label={`Question ${i + 1}`}
                placeholder="Write a question"
              />
              {!q.flagged && (
                <button className="icon-btn" aria-label={`Remove question ${i + 1}`} onClick={() => dispatch({ type: 'builder/removeQuestion', id: q.id })} disabled={builder.questions.length <= 3}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {q.flagged && builder.bias === 'pending' && (
              <div className="bias-card" role="group" aria-label="Bias check suggestion">
                <div className="kicker kicker--ai"><Sparkles size={12} aria-hidden /> Maze AI · Bias check</div>
                <p><strong>Leading question.</strong> This question assumes low fees are important before the participant has said so.</p>
                <div className="bias-card__rewrite">
                  <span className="muted small">Suggested rewrite</span>
                  <p>{BIAS_REWRITE}</p>
                </div>
                <div className="row-actions row-actions--start">
                  <button className="btn btn--primary btn--sm" onClick={() => resolveBias('accepted')}>
                    <Check size={14} aria-hidden /> Accept rewrite
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => resolveBias('kept')}>Keep original</button>
                </div>
              </div>
            )}
            {q.flagged && builder.bias === 'accepted' && (
              <div className="bias-result" role="status">
                <CircleCheck size={14} aria-hidden />
                <div>
                  <strong>Rewritten.</strong> Was: <span className="struck">{LEADING_QUESTION}</span>
                  <div className="muted small">The new wording lets participants name their own reasons, so price only shows up if it really matters to them.</div>
                </div>
                <button className="link-btn link-btn--muted" onClick={() => resolveBias('kept')}>Undo</button>
              </div>
            )}
            {q.flagged && builder.bias === 'kept' && (
              <div className="bias-result bias-result--kept" role="status">
                <TriangleAlert size={14} aria-hidden />
                <div>Kept as written. Answers to this question may overstate the role of price.</div>
                <button className="link-btn" onClick={() => resolveBias('accepted')}>Use rewrite</button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <button className="btn btn--ghost btn--sm add-question" onClick={() => dispatch({ type: 'builder/addQuestion' })}>
        <Plus size={14} aria-hidden /> Add question
      </button>
    </div>
  );
}

function RecruitmentStep() {
  const { state, dispatch } = useStore();
  const { builder } = state;
  const toast = useToast();
  const [draft, setDraft] = useState<string | null>(null);
  const setSize = (n: number) => {
    setDraft(null);
    dispatch({ type: 'builder/set', patch: { sampleSize: Math.min(200, Math.max(10, Math.round(n) || 10)) } });
  };
  return (
    <div className="recruit">
      <div className="stack-lg">
        <div className="step-intro">
          <h2 className="card__title">Recruitment</h2>
          <p className="muted">Who should take part?</p>
        </div>
        <div className="field">
          <span className="field__label">Source</span>
          <div className="segmented" role="radiogroup" aria-label="Participant source">
            <button role="radio" aria-checked className="segmented__opt is-selected">Maze panel</button>
            <button role="radio" aria-checked={false} className="segmented__opt" onClick={() => toast('Recruiting your own customers is outside this concept.', 'info')}>Your customers</button>
          </div>
        </div>
        <div className="field">
          <span className="field__label">Audience</span>
          <div className="chips">
            <span className="chip">SMB owners</span>
            <span className="chip">United States</span>
            <span className="chip">1–50 employees</span>
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="sample">Sample size</label>
          <div className="stepper-input">
            <button className="icon-btn icon-btn--bordered" onClick={() => setSize(builder.sampleSize - 10)} aria-label="Decrease sample size by 10"><Minus size={16} /></button>
            <input
              id="sample"
              className="input"
              type="number"
              inputMode="numeric"
              min={10}
              max={200}
              value={draft ?? builder.sampleSize}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => draft !== null && setSize(Number(draft))}
              onKeyDown={(e) => e.key === 'Enter' && draft !== null && setSize(Number(draft))}
              aria-describedby="sample-help"
            />
            <button className="icon-btn icon-btn--bordered" onClick={() => setSize(builder.sampleSize + 10)} aria-label="Increase sample size by 10"><Plus size={16} /></button>
          </div>
          <span id="sample-help" className="field__help">Between 10 and 200. 40 is enough to compare four drivers with reasonable confidence.</span>
        </div>
        <div className="fresh-eyes">
          <div>
            <label htmlFor="fresh" className="field__label">Fresh Eyes</label>
            <p className="muted small">Exclude anyone who took a Lumen study in the last 90 days.</p>
          </div>
          <Toggle id="fresh" checked={builder.freshEyes} onChange={(v) => { trackEvent('Fresh Eyes Toggled', { on: v }, v ? 'on' : 'off'); dispatch({ type: 'builder/set', patch: { freshEyes: v } }); }} label="Fresh Eyes" />
        </div>
      </div>
      <aside className="audience-summary" aria-label="Audience summary">
        <Users size={18} aria-hidden />
        <div className="audience-summary__big">{builder.sampleSize}</div>
        <div>SMB owners · US · 1–50 employees</div>
        <ul className="plain-list small">
          <li>Source: Maze panel</li>
          <li>{builder.freshEyes ? 'Fresh Eyes on: excludes 312 recent Lumen participants' : 'Fresh Eyes off: past participants may join'}</li>
          <li>Estimated time to fill: {builder.sampleSize <= 60 ? '1 day' : '2–3 days'}</li>
        </ul>
      </aside>
    </div>
  );
}

function ReviewStep() {
  const { state, dispatch } = useStore();
  const { builder } = state;
  const tour = useTour();
  const [launching, setLaunching] = useState(false);
  const done = state.research.phase !== 'idle';
  const questions = builder.questions.filter((q) => q.text.trim());

  const launch = () => {
    if (done) {
      dispatch({ type: 'navigate', screen: state.research.phase === 'done' ? 'results' : 'progress' });
      tour.signal('launch');
      return;
    }
    trackEvent('Study Launched', { sample: builder.sampleSize, method: builder.method }, builder.method);
    setLaunching(true);
    window.setTimeout(() => {
      dispatch({ type: 'research/launch' });
      dispatch({ type: 'navigate', screen: 'progress' });
      tour.signal('launch');
    }, 900);
  };

  return (
    <div className="stack-lg">
      <div className="step-intro">
        <h2 className="card__title">Review and launch</h2>
        <p className="muted">Check the study before it goes to participants.</p>
      </div>
      <dl className="review">
        <div><dt>Objective</dt><dd>{builder.objective}</dd><button className="link-btn" onClick={() => dispatch({ type: 'builder/set', patch: { step: 0 } })}>Edit</button></div>
        <div><dt>Method</dt><dd>{METHODS[builder.method].label}</dd><button className="link-btn" onClick={() => dispatch({ type: 'builder/set', patch: { step: 0 } })}>Edit</button></div>
        <div>
          <dt>Questions</dt>
          <dd>
            <ol className="review__questions">{questions.map((q) => <li key={q.id}>{q.text}</li>)}</ol>
            {builder.bias === 'kept' && <p className="text-drifting small"><TriangleAlert size={12} aria-hidden className="inline-icon" /> 1 leading question kept as written</p>}
            {builder.bias === 'pending' && <p className="text-drifting small"><TriangleAlert size={12} aria-hidden className="inline-icon" /> 1 leading question not yet reviewed</p>}
          </dd>
          <button className="link-btn" onClick={() => dispatch({ type: 'builder/set', patch: { step: 1 } })}>Edit</button>
        </div>
        <div><dt>Audience</dt><dd>SMB owners, US, 1–50 employees · Maze panel</dd><button className="link-btn" onClick={() => dispatch({ type: 'builder/set', patch: { step: 2 } })}>Edit</button></div>
        <div><dt>Participants</dt><dd>{builder.sampleSize}</dd><button className="link-btn" onClick={() => dispatch({ type: 'builder/set', patch: { step: 2 } })}>Edit</button></div>
        <div><dt>Fresh Eyes</dt><dd>{builder.freshEyes ? 'On · excludes anyone from a Lumen study in the last 90 days' : 'Off'}</dd><button className="link-btn" onClick={() => dispatch({ type: 'builder/set', patch: { step: 2 } })}>Edit</button></div>
      </dl>
      <div className="launch-bar">
        <button className="btn btn--ghost" onClick={() => dispatch({ type: 'builder/set', patch: { step: 2 } })}>
          <ArrowLeft size={16} aria-hidden /> Back
        </button>
        <div className="launch-bar__right">
          <span className="muted small">Simulated launch. No real participants are contacted.</span>
          <button className="btn btn--primary btn--lg" data-tour="launch-study" onClick={launch} disabled={launching || questions.length === 0}>
            {launching ? <LoaderCircle size={16} className="spin" aria-hidden /> : <Rocket size={16} aria-hidden />}
            {launching ? 'Launching…' : done ? 'View study' : 'Launch study'}
          </button>
        </div>
      </div>
    </div>
  );
}
