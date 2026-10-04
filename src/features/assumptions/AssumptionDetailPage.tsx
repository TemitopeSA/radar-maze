import { useState } from 'react';
import {
  Archive, ArrowRight, Bell, CalendarClock, CircleCheck, Ellipsis, FlaskConical, GitBranch, Link2, MessageSquare, PenLine, Radar, Sparkles,
  ThumbsDown, ThumbsUp, TrendingDown, UserRound,
} from 'lucide-react';
import { useStore, type DetailTab } from '../../state/store';
import { formatDate, formatRelative, isPast } from '../../data/format';
import { HERO_ID, RETEST_STUDY_ID } from '../../data/seed';
import type { Assumption, EventKind } from '../../data/types';
import { PageHeader } from '../../components/PageHeader';
import { ConfidenceChart } from '../../components/ConfidenceChart';
import { QuoteCard } from '../../components/QuoteCard';
import { DecisionBadge, Menu, MenuItem, Owner, StatusBadge } from '../../components/ui';
import { useToast, COMING_SOON } from '../../components/Toast';
import { useTour } from '../tour/TourProvider';
import { DecisionReviewPanel } from '../decisions/DecisionReviewPanel';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'history', label: 'History' },
];

export function AssumptionDetailPage() {
  const { state, dispatch } = useStore();
  const tour = useTour();
  const toast = useToast();
  const a = state.assumptions.find((x) => x.id === state.selectedId) ?? state.assumptions[0];
  const isHero = a.id === HERO_ID;
  const decisions = state.decisions.filter((d) => a.decisionIds.includes(d.id));
  const quotes = state.quotes.filter((q) => q.assumptionId === a.id);

  const retest = () => {
    if (!isHero) {
      toast('In this concept, the re-test flow is built for the pricing assumption. Open it from the Assumptions list to try it.', 'info');
      return;
    }
    dispatch({ type: 'navigate', screen: state.research.phase === 'done' && !state.journey.accepted && !tour.active ? 'results' : 'builder' });
    tour.signal('retest');
  };

  const counts: Partial<Record<DetailTab, number>> = { evidence: quotes.length, decisions: decisions.length };

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: 'Assumptions', onClick: () => dispatch({ type: 'navigate', screen: 'assumptions' }) }, { label: a.category }]}
        onBack={() => dispatch({ type: 'navigate', screen: 'assumptions' })}
        title={a.statement}
        actions={
          <>
            <Menu
              label="More actions"
              trigger={(props) => (
                <button className="icon-btn icon-btn--bordered" aria-label="More actions" {...props}>
                  <Ellipsis size={18} />
                </button>
              )}
            >
              {(close) => (
                <>
                  <MenuItem icon={<PenLine size={16} aria-hidden />} onSelect={() => { close(); toast(`Editing assumptions directly: ${COMING_SOON}`, 'info'); }}>Edit assumption</MenuItem>
                  <MenuItem icon={<UserRound size={16} aria-hidden />} onSelect={() => { close(); toast(`Changing owners: ${COMING_SOON}`, 'info'); }}>Change owner</MenuItem>
                  <MenuItem icon={<Bell size={16} aria-hidden />} onSelect={() => { close(); toast(`You’ll be notified when ${isHero ? 'this assumption' : 'it'} changes status.`); }}>Watch for changes</MenuItem>
                  <MenuItem icon={<Archive size={16} aria-hidden />} onSelect={() => { close(); toast(`Archiving: ${COMING_SOON}`, 'info'); }}>Archive</MenuItem>
                </>
              )}
            </Menu>
            <button className="btn btn--primary" data-tour="retest-cta" onClick={retest}>
              <FlaskConical size={16} aria-hidden /> Re-test with Maze
            </button>
          </>
        }
      />

      <div className="detail-meta">
        <div className="detail-meta__item">
          <span className="detail-meta__label">Status</span>
          <StatusBadge status={a.status} />
        </div>
        <div className="detail-meta__item">
          <span className="detail-meta__label">Confidence</span>
          <span className="detail-meta__value">
            <strong className="big-number">{a.confidence}</strong>
            {a.history[0] !== a.confidence && (
              <span className={`delta ${a.confidence < a.history[0] ? 'delta--down' : 'delta--up'}`}>
                {a.confidence < a.history[0] ? <TrendingDown size={14} aria-hidden /> : null}
                {a.retestPoint ? `from 41 after re-test` : `${a.confidence - a.history[0]} in 8 weeks`}
              </span>
            )}
          </span>
        </div>
        <div className="detail-meta__item">
          <span className="detail-meta__label">Owner</span>
          <Owner person={a.owner} />
        </div>
        <div className="detail-meta__item">
          <span className="detail-meta__label">Last validated</span>
          <span>{formatDate(a.lastValidated)} <span className="muted">· {formatRelative(a.lastValidated)}</span></span>
        </div>
        <div className="detail-meta__item">
          <span className="detail-meta__label">Check again by</span>
          <span className={isPast(a.expiresOn) ? 'text-expired' : ''}>
            <CalendarClock size={14} aria-hidden className="inline-icon" /> {a.expiresOn ? formatDate(a.expiresOn) : 'Not set'}
          </span>
        </div>
        <div className="detail-meta__item">
          <span className="detail-meta__label">Version</span>
          <span>v{a.versions.length}</span>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Assumption sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={state.detailTab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={state.detailTab === t.id ? 0 : -1}
            className={`tabs__tab ${state.detailTab === t.id ? 'is-active' : ''}`}
            onClick={() => dispatch({ type: 'setTab', tab: t.id })}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.stopPropagation();
              const i = TABS.findIndex((x) => x.id === t.id);
              const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
              dispatch({ type: 'setTab', tab: next.id });
              document.getElementById(`tab-${next.id}`)?.focus();
            }}
          >
            {t.label}
            {counts[t.id] !== undefined && <span className="tabs__count">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${state.detailTab}`} aria-labelledby={`tab-${state.detailTab}`} className="tab-panel" key={state.detailTab}>
        {state.detailTab === 'overview' && <Overview a={a} />}
        {state.detailTab === 'evidence' && <Evidence a={a} />}
        {state.detailTab === 'decisions' && <Decisions a={a} />}
        {state.detailTab === 'history' && <History a={a} />}
      </div>
    </div>
  );
}

function Overview({ a }: { a: Assumption }) {
  const { state, dispatch } = useStore();
  const isHero = a.id === HERO_ID;
  const decisions = state.decisions.filter((d) => a.decisionIds.includes(d.id));
  const explanation = isHero
    ? a.retestPoint
      ? `Confidence fell from 78 to 41 over six weeks as price mentions dropped. Your re-test with ${state.builder.sampleSize} SMB owners confirmed the shift, and the updated belief starts at ${a.confidence}.`
      : 'Confidence held at 78 until mid-August, then fell each week as new studies came in. Maze flagged the drift on September 14, when it dropped below 60.'
    : a.status === 'Untested'
      ? 'This assumption has no linked evidence yet, so its confidence is the team’s starting estimate.'
      : `Confidence has moved ${Math.abs(a.confidence - a.history[0])} points over the last eight weeks.`;

  return (
    <div className="overview-grid">
      <section className="card chart-card" data-tour="confidence-chart" aria-labelledby="chart-title">
        <div className="card__head">
          <div>
            <h2 id="chart-title" className="card__title">Confidence history</h2>
            <p className="card__sub">{explanation}</p>
          </div>
          <span className="muted nowrap">Last 8 weeks</span>
        </div>
        <ConfidenceChart assumption={a} />
      </section>

      <SignalCard a={a} />

      <section className="card glance">
        <h2 className="card__title">At a glance</h2>
        <dl className="dl dl--stack">
          <div><dt>Category</dt><dd><span className="tag">{a.category}</span></dd></div>
          <div><dt>Linked evidence</dt><dd>{a.evidenceCount} items from {a.studyIds.length} {a.studyIds.length === 1 ? 'study' : 'studies'}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(a.createdAt)}</dd></div>
        </dl>
        {decisions.length > 0 && (
          <>
            <h3 className="side-title">Decisions that depend on this</h3>
            <ul className="plain-list">
              {decisions.map((d) => (
                <li key={d.id}>
                  <button className="glance-decision" onClick={() => dispatch({ type: 'setTab', tab: 'decisions' })}>
                    <span>{d.title}</span>
                    <DecisionBadge status={d.status} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function SignalCard({ a }: { a: Assumption }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [disagreeOpen, setDisagreeOpen] = useState(false);
  const [reason, setReason] = useState('The sample doesn’t match our customers');
  const [note, setNote] = useState('');
  const isHero = a.id === HERO_ID;
  const feedback = state.signalFeedback;

  if (!isHero) {
    const text: Record<Assumption['status'], string> = {
      Holding: 'No signal right now. Recent evidence is consistent with this assumption.',
      Drifting: 'Mentions that support this belief are declining in recent studies. Review the evidence before the next planning cycle.',
      Expired: `It has been ${formatRelative(a.lastValidated).toLowerCase()} since this was last validated, past its check-again date.`,
      Untested: 'No research supports or challenges this belief yet. Decisions that depend on it carry extra risk.',
    };
    return (
      <section className="card ai-card" aria-labelledby="ai-title">
        <div className="kicker kicker--ai"><Sparkles size={12} aria-hidden /> Maze AI · {a.status === 'Holding' ? 'No signal' : 'Signal'}</div>
        <h2 id="ai-title" className="card__title">What Maze sees</h2>
        <p>{text[a.status]}</p>
      </section>
    );
  }

  if (a.retestPoint) {
    return (
      <section className="card ai-card" data-tour="ai-signal" aria-labelledby="ai-title">
        <div className="kicker kicker--ai"><CircleCheck size={12} aria-hidden /> Maze AI · Signal resolved</div>
        <h2 id="ai-title" className="card__title">Your re-test confirmed the shift</h2>
        <p>Payout speed (46%) and trust (27%) now outrank price (18%) as reasons SMB owners choose Lumen. The belief was updated to v2 and the Q2 pricing page decision is flagged for review.</p>
        <button className="link-btn" onClick={() => dispatch({ type: 'navigate', screen: 'results' })}>See study results <ArrowRight size={14} aria-hidden /></button>
      </section>
    );
  }

  return (
    <section className="card ai-card" data-tour="ai-signal" aria-labelledby="ai-title">
      <div className="kicker kicker--ai"><Sparkles size={12} aria-hidden /> Maze AI · Signal detected</div>
      <h2 id="ai-title" className="card__title">Why Maze flagged this</h2>
      <p>
        Across 3 recent studies (212 participants), mentions of price as the main reason dropped from <strong>64%</strong> to <strong>22%</strong>. Speed of payouts became the top theme.
      </p>
      <div className="shift" aria-label="Main reason for choosing Lumen, before and after">
        <div className="shift__head">
          <span />
          <span>Nov 2025<br /><span className="muted">186 people</span></span>
          <span>Aug–Sep 2026<br /><span className="muted">212 people</span></span>
        </div>
        {[
          { label: 'Price', before: 64, after: 22 },
          { label: 'Payout speed', before: 14, after: 41 },
          { label: 'Trust', before: 9, after: 24 },
        ].map((r) => (
          <div className="shift__row" key={r.label}>
            <span>{r.label}</span>
            <span className="shift__val"><span className="shift__bar" style={{ width: `${r.before}%` }} />{r.before}%</span>
            <span className="shift__val"><span className="shift__bar shift__bar--after" style={{ width: `${r.after}%` }} />{r.after}%</span>
          </div>
        ))}
      </div>
      <p className="muted small">
        Sources: Switching stories interviews (64), Payout experience survey (118), Instant payouts prototype test (30). Compared with the November 2025 pricing survey.
      </p>
      <div className="signal-strength">
        <div className="signal-strength__head">
          <strong>How confident is this signal?</strong>
          <span className="meter" aria-label="Signal strength: moderate to high, 4 of 5">
            {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= 4 ? 'is-on' : ''} />)}
            <span className="meter__label">Moderate–high</span>
          </span>
        </div>
        <p className="muted small">
          The shift shows up in three studies using different methods. It’s a research signal, not proof of cause: recent samples include more owners who joined in 2026, and survey wording differed from November.
        </p>
      </div>
      {feedback ? (
        <p className={`feedback-done ${feedback.kind === 'agree' ? '' : 'feedback-done--alt'}`} role="status">
          <CircleCheck size={16} aria-hidden />
          {feedback.kind === 'agree'
            ? 'Thanks. You confirmed this signal, so Maze will weight similar patterns more heavily.'
            : 'Marked for investigation. Priya Raman (Research Lead) has been asked to look at the sample.'}
        </p>
      ) : disagreeOpen ? (
        <form
          className="feedback-form"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'signal/feedback', kind: 'disagree', note: `${reason}${note ? `: ${note}` : ''}` });
            toast('Signal marked for investigation.');
          }}
        >
          <fieldset>
            <legend className="field__label">What seems off?</legend>
            {['The sample doesn’t match our customers', 'We need more evidence first', 'Something else'].map((r) => (
              <label key={r} className="radio">
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /> {r}
              </label>
            ))}
          </fieldset>
          <textarea rows={2} placeholder="Add a note for the research team (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
          <div className="row-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDisagreeOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--secondary btn--sm">Mark for investigation</button>
          </div>
        </form>
      ) : (
        <div className="row-actions row-actions--start">
          <button className="btn btn--secondary btn--sm" onClick={() => { dispatch({ type: 'signal/feedback', kind: 'agree' }); toast('Thanks for confirming the signal.'); }}>
            <ThumbsUp size={14} aria-hidden /> Looks right
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setDisagreeOpen(true)}>
            <ThumbsDown size={14} aria-hidden /> Not convinced
          </button>
        </div>
      )}
    </section>
  );
}

function Evidence({ a }: { a: Assumption }) {
  const { state } = useStore();
  const studies = state.studies.filter((s) => a.studyIds.includes(s.id));
  const quotes = state.quotes.filter((q) => q.assumptionId === a.id);
  const groups = [
    { era: 'retest' as const, title: 'From your re-test', sub: `${formatDate(state.studies.find((s) => s.id === RETEST_STUDY_ID)?.date)} · simulated study` },
    { era: 'recent' as const, title: 'Recent evidence', sub: a.id === HERO_ID ? 'Aug–Sep 2026 · payout speed and trust lead' : 'Last 3 months' },
    { era: 'earlier' as const, title: 'Earlier evidence', sub: a.id === HERO_ID ? 'Nov 2025 · price leads' : 'Older than 3 months' },
  ].filter((g) => quotes.some((q) => q.era === g.era));

  return (
    <div className="stack-lg">
      <section aria-labelledby="studies-title">
        <h2 id="studies-title" className="section-title">Linked studies <span className="muted">· {studies.length}</span></h2>
        {studies.length === 0 ? (
          <div className="card empty"><p><strong>No evidence linked yet.</strong></p><p className="muted">Run a study or link an existing one to start tracking confidence.</p></div>
        ) : (
          <div className="study-grid">
            {studies.map((s) => (
              <article key={s.id} className={`card study-card ${s.id === RETEST_STUDY_ID ? 'study-card--new' : ''}`}>
                <div className="muted small">{s.type}</div>
                <h3 className="study-card__title">{s.name}</h3>
                <div className="muted small">{formatDate(s.date)} · {s.participants} participants{s.simulated && ' · Simulated'}</div>
              </article>
            ))}
          </div>
        )}
      </section>
      {quotes.length > 0 && (
        <section aria-labelledby="quotes-title" data-tour="evidence-timeline" className="evidence-timeline">
          <h2 id="quotes-title" className="section-title">What participants said</h2>
          {a.id === HERO_ID && (
            <p className="muted evidence-intro">Read from the bottom up: earlier feedback is about cost; recent feedback is about getting paid fast and reliably.</p>
          )}
          <div className={`evidence-columns evidence-columns--${groups.length}`}>
            {groups.map((g) => (
              <div key={g.era} className={`evidence-col evidence-col--${g.era}`}>
                <div className="evidence-col__head">
                  <h3>{g.title}</h3>
                  <span className="muted small">{g.sub}</span>
                </div>
                <div className="stack">
                  {quotes.filter((q) => q.era === g.era).map((q) => (
                    <QuoteCard key={q.id} quote={q} study={state.studies.find((s) => s.id === q.studyId)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Decisions({ a }: { a: Assumption }) {
  const { state } = useStore();
  const [reviewing, setReviewing] = useState<string | null>(null);
  const decisions = state.decisions.filter((d) => a.decisionIds.includes(d.id));
  if (decisions.length === 0) {
    return <div className="card empty"><p><strong>No decisions depend on this assumption.</strong></p><p className="muted">Link a roadmap decision to see when it might be at risk.</p></div>;
  }
  return (
    <div className="stack">
      {decisions.map((d) => (
        <article key={d.id} className={`card decision-card decision-card--${d.status === 'At risk' ? 'risk' : d.status === 'Needs review' ? 'review' : 'ok'}`}>
          <div className="decision-card__main">
            <div className="meta-row">
              <DecisionBadge status={d.status} />
              <span className="muted small">Decided {formatDate(d.date)} by {d.owner.name}</span>
            </div>
            <h3 className="decision-card__title">{d.title}</h3>
            <p className="muted">
              {d.status === 'At risk'
                ? `This decision depends on an assumption whose confidence has declined${a.history[0] - a.confidence > 0 ? ` from ${a.history[0]} to ${a.confidence}` : ''}.`
                : d.status === 'Needs review'
                  ? 'The assumption behind this decision changed. The owner has been asked to revisit it.'
                  : 'The assumptions behind this decision are holding.'}
            </p>
            <p className="small"><Link2 size={12} aria-hidden className="inline-icon" /> Affects: {d.impact}</p>
          </div>
          <button className="btn btn--secondary" onClick={() => setReviewing(d.id)}>Review decision</button>
        </article>
      ))}
      {reviewing && <DecisionReviewPanel decisionId={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}

const EVENT_ICON: Record<EventKind, typeof Radar> = {
  created: PenLine, validated: CircleCheck, linked: Link2, confidence: TrendingDown, drift: Radar,
  feedback: MessageSquare, research: FlaskConical, updated: GitBranch, decision: Bell,
};

function History({ a }: { a: Assumption }) {
  const { state } = useStore();
  const events = state.events.filter((e) => e.assumptionId === a.id).sort((x, y) => x.date.localeCompare(y.date));
  return (
    <div className="history-grid">
      <section className="card" aria-labelledby="timeline-title">
        <h2 id="timeline-title" className="card__title">Timeline</h2>
        <ol className="timeline">
          {events.map((e) => {
            const Icon = EVENT_ICON[e.kind];
            return (
              <li key={e.id} className={`timeline__item timeline__item--${e.kind}`}>
                <span className="timeline__icon" aria-hidden><Icon size={14} /></span>
                <div>
                  <div className="timeline__title">{e.title}</div>
                  {e.detail && <div className="muted small">{e.detail}</div>}
                  <time className="timeline__date" dateTime={e.date}>{formatDate(e.date)}</time>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <VersionHistory a={a} />
    </div>
  );
}

export function VersionHistory({ a }: { a: Assumption }) {
  const { state } = useStore();
  return (
    <section className="card" aria-labelledby="versions-title">
      <h2 id="versions-title" className="card__title">Versions</h2>
      <ol className="versions">
        {[...a.versions].reverse().map((v) => {
          const study = state.studies.find((s) => s.id === v.studyId);
          const current = v.version === a.versions.length;
          return (
            <li key={v.version} className={`version ${current ? 'version--current' : ''}`}>
              <div className="version__head">
                <span className="tag tag--version">v{v.version}</span>
                {current && <span className="muted small">Current</span>}
                <span className="muted small">{formatDate(v.date)} · confidence {v.confidence}</span>
              </div>
              <p className={current ? '' : 'struck'}>{v.statement}</p>
              <p className="muted small">{v.reason}</p>
              {study && <p className="small"><FlaskConical size={12} aria-hidden className="inline-icon" /> {study.name}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
