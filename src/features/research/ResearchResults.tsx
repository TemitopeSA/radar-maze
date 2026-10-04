import { useState } from 'react';
import { ArrowRight, Check, CircleCheck, Copy, Flag, Mail, MessageSquare, PenLine, Share2, Sparkles } from 'lucide-react';
import { useStore } from '../../state/store';
import { HERO_ID, HERO_STATEMENT, PRICING_DECISION_ID, RETEST_QUOTES } from '../../data/seed';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { DecisionBadge, StatusBadge } from '../../components/ui';
import { ThemeTag } from '../../components/QuoteCard';
import { useTour } from '../tour/TourProvider';
import { VersionHistory } from '../assumptions/AssumptionDetailPage';
import { DecisionReviewPanel } from '../decisions/DecisionReviewPanel';

const DRIVERS = [
  { label: 'Instant payouts', value: 46 },
  { label: 'Trust/security', value: 27 },
  { label: 'Price', value: 18 },
  { label: 'Other', value: 9 },
];

const SHARE_TEXT =
  'We retested a key assumption behind our pricing strategy. New research suggests that instant payouts and trust matter more than price alone. The assumption has been updated, and the Q2 pricing-page decision is flagged for review.';

export function ResearchResults() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const tour = useTour();
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const hero = state.assumptions.find((a) => a.id === HERO_ID)!;
  const decision = state.decisions.find((d) => d.id === PRICING_DECISION_ID)!;
  const accepted = state.journey.accepted;
  const n = state.builder.sampleSize;

  if (state.research.phase !== 'done') {
    return (
      <div className="page page--narrow">
        <div className="card empty">
          <p><strong>No results yet.</strong></p>
          <p className="muted">Launch the re-test study to see what drives SMB owners to choose Lumen.</p>
          <button className="btn btn--primary" onClick={() => dispatch({ type: 'navigate', screen: 'builder' })}>Open study builder</button>
        </div>
      </div>
    );
  }

  const accept = () => {
    dispatch({ type: 'update/accept' });
    toast('Assumption updated to v2. The Q2 pricing page decision is flagged for review.');
    tour.signal('accept');
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: 'Assumptions', onClick: () => dispatch({ type: 'navigate', screen: 'assumptions' }) },
          { label: 'Pricing', onClick: () => dispatch({ type: 'openAssumption', id: HERO_ID }) },
          { label: 'Re-test results' },
        ]}
        onBack={() => dispatch({ type: 'openAssumption', id: HERO_ID })}
        kicker={`Study results · ${n} SMB owners · simulated`}
        title="What drives SMB owners to choose Lumen?"
        description="Customers increasingly prioritize getting paid quickly and knowing their money is safe. Price still matters, but it is no longer the leading reason to choose Lumen."
        actions={
          <button className="btn btn--secondary" onClick={() => setSharing(true)}>
            <Share2 size={16} aria-hidden /> Share update
          </button>
        }
      />

      <div className="results-grid">
        <div className="stack-lg">
          <section className="card" aria-labelledby="drivers-title">
            <div className="card__head">
              <div>
                <h2 id="drivers-title" className="card__title">Main reason for choosing Lumen</h2>
                <p className="card__sub">Share of participants who named each driver as their main reason (n = {n}).</p>
              </div>
            </div>
            <table className="sr-only">
              <caption>Main reason for choosing Lumen</caption>
              <tbody>{DRIVERS.map((d) => <tr key={d.label}><th scope="row">{d.label}</th><td>{d.value}%</td></tr>)}</tbody>
            </table>
            <div className="bars" aria-hidden>
              {DRIVERS.map((d, i) => (
                <div key={d.label} className="bars__row">
                  <span className="bars__label">{d.label}</span>
                  <span className="bars__track">
                    <span className={`bars__fill ${i === 0 ? 'bars__fill--top' : d.label === 'Price' ? 'bars__fill--price' : ''}`} style={{ width: `${(d.value / 50) * 100}%` }} />
                  </span>
                  <span className="bars__value">{d.value}%</span>
                </div>
              ))}
            </div>
            <p className="muted small">In November 2025, 64% named price as their main reason. Today it’s 18%.</p>
          </section>

          <section className="card ai-card ai-card--flat" aria-labelledby="synth-title">
            <div className="kicker kicker--ai"><Sparkles size={12} aria-hidden /> Maze AI synthesis · simulated</div>
            <h2 id="synth-title" className="card__title">What changed</h2>
            <ul className="synth">
              <li><strong>Speed is the switching trigger.</strong> 31 of {n} owners described a moment when waiting for a payout created a cash crunch.</li>
              <li><strong>Trust is about predictability.</strong> Owners care less about security features than about money arriving exactly when promised.</li>
              <li><strong>Price is a tiebreaker.</strong> Most owners said fees matter only when providers are otherwise similar.</li>
            </ul>
            <p className="fine-print">Generated for this concept from fictional data. In a real study, every claim would link to responses.</p>
          </section>

          <section aria-labelledby="quotes-title">
            <h2 id="quotes-title" className="section-title">Representative quotes</h2>
            <p className="muted small">Mock quotes from this concept’s simulated study.</p>
            <div className="quote-row">
              {RETEST_QUOTES.map((q) => (
                <figure key={q.id} className="mini-quote">
                  <ThemeTag theme={q.theme} />
                  <blockquote>“{q.text}”</blockquote>
                  <figcaption className="muted small">{q.participant} · {q.role}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>

        <div className="stack-lg">
          <section className={`card update-card ${accepted ? 'update-card--done' : ''}`} data-tour="update-card" aria-labelledby="update-title">
            <div className="kicker kicker--ai"><Sparkles size={12} aria-hidden /> Suggested update</div>
            <h2 id="update-title" className="card__title">{accepted ? 'Assumption updated' : 'Update your assumption'}</h2>
            <div className="before-after">
              <div className="before-after__old">
                <span className="before-after__label">Before · v1 · confidence 41</span>
                <p className="struck">{HERO_STATEMENT}</p>
              </div>
              <ArrowRight size={16} className="before-after__arrow" aria-hidden />
              <div className="before-after__new">
                <span className="before-after__label">{accepted ? 'Now · v2' : 'Proposed · v2'}</span>
                <p>{accepted ? hero.statement : state.proposal.statement}</p>
                <div className="meta-row meta-row--sm">
                  <span>Confidence <strong>{accepted ? hero.confidence : state.proposal.confidence}</strong></span>
                  <StatusBadge status={accepted ? hero.status : state.proposal.confidence >= 60 ? 'Holding' : 'Drifting'} size="sm" />
                </div>
              </div>
            </div>
            <p className="muted small">
              Based on this simulated study: payout speed and trust were named by 73% of participants, price by 18%.{state.proposal.edited && !accepted && ' You edited this suggestion.'}
            </p>
            {accepted ? (
              <div className="accepted-box" role="status">
                <CircleCheck size={16} aria-hidden />
                <div>
                  <strong>Saved as v2.</strong> The re-test study is linked as evidence, and confidence is now {hero.confidence}.
                </div>
              </div>
            ) : (
              <div className="row-actions row-actions--start">
                <button className="btn btn--primary" onClick={accept}>
                  <Check size={16} aria-hidden /> Accept update
                </button>
                <button className="btn btn--secondary" onClick={() => setEditing(true)}>
                  <PenLine size={16} aria-hidden /> Edit
                </button>
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="impact-title">
            <h2 id="impact-title" className="card__title">Affected decision</h2>
            <div className="impact">
              <div>
                <p className="impact__title">{decision.title}</p>
                <DecisionBadge status={decision.status} />
              </div>
              <p className="muted small">
                {decision.status === 'Needs review'
                  ? `${decision.owner.name} has been asked to review this decision.`
                  : 'Depends on the pricing assumption. Accepting the update flags it for review.'}
              </p>
              <button className="btn btn--secondary btn--sm" onClick={() => setReviewing(true)}>
                <Flag size={14} aria-hidden /> Review decision
              </button>
            </div>
          </section>

          {accepted && <VersionHistory a={hero} />}

          {accepted && (
            <div className="next-card">
              <button className="btn btn--secondary" onClick={() => setSharing(true)}><Share2 size={16} aria-hidden /> Share update</button>
              <button className="btn btn--primary" onClick={() => dispatch({ type: 'navigate', screen: 'wrapup' })}>
                See the full loop <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>

      {editing && <EditProposal onClose={() => setEditing(false)} />}
      {sharing && <ShareModal onClose={() => setSharing(false)} />}
      {reviewing && <DecisionReviewPanel decisionId={PRICING_DECISION_ID} onClose={() => setReviewing(false)} />}
    </div>
  );
}

function EditProposal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [statement, setStatement] = useState(state.proposal.statement);
  const [confidence, setConfidence] = useState(state.proposal.confidence);
  return (
    <Modal
      title="Edit suggested update"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            disabled={statement.trim().length < 8}
            onClick={() => {
              dispatch({ type: 'proposal/set', statement: statement.trim(), confidence });
              toast('Suggestion updated. Accept it when you’re ready.');
              onClose();
            }}
          >
            Save changes
          </button>
        </>
      }
    >
      <div className="form">
        <label className="field">
          <span className="field__label">New assumption</span>
          <textarea data-autofocus rows={3} value={statement} onChange={(e) => setStatement(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Confidence <strong className="field__value">{confidence}</strong></span>
          <input type="range" min={0} max={100} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} />
          <span className="field__help">Below 60, the assumption stays Drifting.</span>
        </label>
      </div>
    </Modal>
  );
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<'slack' | 'email'>('slack');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      toast('Summary copied to clipboard.');
    } catch {
      toast('Couldn’t access the clipboard. Select the text to copy it.', 'info');
    }
  };
  return (
    <Modal
      title="Share update with your team"
      description="Preview only. Nothing is sent from this concept."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--secondary" onClick={copy}><Copy size={16} aria-hidden /> Copy summary</button>
          <button className="btn btn--primary" onClick={onClose}>Done</button>
        </>
      }
    >
      <div className="tabs tabs--compact" role="tablist" aria-label="Share channel">
        <button role="tab" aria-selected={tab === 'slack'} className={`tabs__tab ${tab === 'slack' ? 'is-active' : ''}`} onClick={() => setTab('slack')}>
          <MessageSquare size={14} aria-hidden /> Slack
        </button>
        <button role="tab" aria-selected={tab === 'email'} className={`tabs__tab ${tab === 'email' ? 'is-active' : ''}`} onClick={() => setTab('email')}>
          <Mail size={14} aria-hidden /> Email
        </button>
      </div>
      {tab === 'slack' ? (
        <div className="share-preview share-preview--slack">
          <div className="share-preview__channel"># product-leadership</div>
          <div className="slack-msg">
            <span className="slack-msg__avatar" aria-hidden>M</span>
            <div>
              <div><strong>Maze</strong> <span className="tag tag--sm">APP</span> <span className="muted small">2:41 PM</span></div>
              <p>{SHARE_TEXT}</p>
              <div className="slack-msg__attach">
                <strong>Assumption updated · v2</strong>
                <span className="struck small">SMB owners choose Lumen mainly because it's the cheapest option.</span>
                <span className="small">SMB owners choose Lumen mainly for fast, reliable payouts; price is secondary.</span>
                <span className="muted small">Instant payouts 46% · Trust 27% · Price 18% · Other 9%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="share-preview share-preview--email">
          <dl className="email-head">
            <div><dt>To</dt><dd>product-leadership@lumen.example</dd></div>
            <div><dt>Subject</dt><dd>Pricing assumption updated: payouts matter more than price</dd></div>
          </dl>
          <div className="email-body">
            <p>Hi team,</p>
            <p>{SHARE_TEXT}</p>
            <p><strong>Main reason for choosing Lumen</strong><br />Instant payouts 46% · Trust/security 27% · Price 18% · Other 9%</p>
            <p>Dana</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
