import { Flag, Link2 } from 'lucide-react';
import { trackEvent } from '../../analytics';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { DecisionBadge, Owner, StatusBadge } from '../../components/ui';
import { useStore } from '../../state/store';
import { formatDate } from '../../data/format';
import { HERO_ID } from '../../data/seed';
import type { Decision } from '../../data/types';

export function DecisionReviewPanel({ decisionId, onClose }: { decisionId: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const decision = state.decisions.find((d) => d.id === decisionId) as Decision;
  const linked = state.assumptions.filter((a) => decision.assumptionIds.includes(a.id));
  const hero = linked.find((a) => a.id === HERO_ID);
  const studies = state.studies.filter((s) => linked.some((a) => a.studyIds.includes(s.id)));

  const risk =
    decision.status === 'Needs review'
      ? hero && state.journey.accepted
        ? 'The assumption behind this decision was updated. Customers now choose Lumen mainly for fast, reliable payouts, so a “lowest fees” headline may no longer lead with what matters most.'
        : 'Flagged for the owner to revisit at the next planning review.'
      : decision.status === 'At risk'
        ? 'This decision depends on an assumption whose confidence has declined or whose evidence is out of date.'
        : 'The assumptions behind this decision are holding.';

  return (
    <Modal
      variant="drawer"
      size="md"
      kicker="Decision"
      title={decision.title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
          <button
            className="btn btn--primary"
            disabled={decision.status === 'Needs review'}
            onClick={() => {
              dispatch({ type: 'decision/markReview', id: decision.id });
              trackEvent('Decision Marked For Review', { decision: decision.id });
              toast(`${decision.owner.name} will see this in their review queue.`);
            }}
          >
            <Flag size={16} aria-hidden /> {decision.status === 'Needs review' ? 'Marked for review' : 'Mark for review'}
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="meta-row">
          <DecisionBadge status={decision.status} />
          <span className="muted">Decided {formatDate(decision.date)}</span>
          <Owner person={decision.owner} />
        </div>
        <div className={`risk-box risk-box--${decision.status === 'On track' ? 'ok' : decision.status === 'At risk' ? 'risk' : 'review'}`}>
          <strong>Current risk</strong>
          <p>{risk}</p>
        </div>
        <section>
          <h3 className="side-title">Rationale</h3>
          <p>{decision.rationale}</p>
          <p className="muted">Affects: {decision.impact}</p>
        </section>
        <section>
          <h3 className="side-title">Linked assumption{linked.length > 1 ? 's' : ''}</h3>
          <ul className="plain-list">
            {linked.map((a) => (
              <li key={a.id} className="linked-assumption">
                <Link2 size={14} aria-hidden />
                <div>
                  <div>{a.statement}</div>
                  <div className="meta-row meta-row--sm">
                    <StatusBadge status={a.status} size="sm" />
                    <span className="muted">Confidence {a.confidence}</span>
                    {a.versions.length > 1 && <span className="muted">Was: “{a.versions[0].statement}”</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
        {studies.length > 0 && (
          <section>
            <h3 className="side-title">Supporting evidence</h3>
            <ul className="plain-list">
              {studies.map((s) => (
                <li key={s.id} className="study-line">
                  <span>{s.name}</span>
                  <span className="muted">{s.type} · {s.participants} participants · {formatDate(s.date)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}
