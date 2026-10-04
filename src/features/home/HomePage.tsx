import { useState } from 'react';
import { trackEvent } from '../../analytics';
import { ArrowRight, Bot, ClipboardList, LayoutGrid, MousePointerClick, Radar } from 'lucide-react';
import { useStore, countByStatus } from '../../state/store';
import { formatDate } from '../../data/format';
import { Avatar } from '../../components/ui';
import { Modal } from '../../components/Modal';
import { useToast, COMING_SOON } from '../../components/Toast';
import type { Study } from '../../data/types';
import { HERO_ID, RETEST_STUDY_ID } from '../../data/seed';

const STUDY_STATUS_CLASS = { Completed: 'neutral', Live: 'live', Draft: 'neutral' } as const;

export function StudyStatus({ study }: { study: Study }) {
  return (
    <span className={`badge badge--${STUDY_STATUS_CLASS[study.status]} badge--sm`}>
      {study.status === 'Live' && <span className="live-dot" aria-hidden />}
      {study.status}
    </span>
  );
}

export function HomePage() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [preview, setPreview] = useState<Study | null>(null);
  const counts = countByStatus(state.assumptions);
  const attention = counts.Drifting;
  const openPreview = (s: Study) => {
    trackEvent('Study Preview Opened', { study: s.id });
    setPreview(s);
  };
  const studies = [...state.studies].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page">
      <header className="home-hero">
        <h1 className="home-hero__title">Good afternoon, Dana</h1>
        <p className="page-header__desc">Here’s what’s happening across your research.</p>
      </header>

      <section className="alert-card" data-tour="home-alert" aria-labelledby="alert-title">
        <div className="alert-card__icon" aria-hidden>
          <Radar size={20} />
        </div>
        <div className="alert-card__text">
          <div className="kicker kicker--blue">Assumptions <span className="tag tag--new">New</span></div>
          <h2 id="alert-title" className="alert-card__title">
            {attention > 0 ? `${attention} assumption${attention === 1 ? '' : 's'} need${attention === 1 ? 's' : ''} your attention` : 'Your assumptions are up to date'}
          </h2>
          <p>
            {attention > 0
              ? 'Recent research suggests some of the beliefs behind your roadmap may be changing.'
              : 'No drifting assumptions right now. Maze will let you know when the evidence changes.'}
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => { trackEvent('Home Alert Clicked', { attention }); dispatch({ type: 'navigate', screen: 'assumptions' }); }}>
          Review in Assumptions <ArrowRight size={16} aria-hidden />
        </button>
      </section>

      <section aria-labelledby="create-title" className="section">
        <h2 id="create-title" className="section-title">Start something new</h2>
        <div className="quick-grid">
          {[
            { icon: ClipboardList, title: 'New study', text: 'Build a survey, prototype test or card sort' },
            { icon: Bot, title: 'AI-moderated interviews', text: 'Run interviews at scale with Maze AI' },
            { icon: MousePointerClick, title: 'Test a prototype', text: 'Import from Figma and add missions' },
            { icon: LayoutGrid, title: 'Browse templates', text: '60+ ready-made research templates' },
          ].map(({ icon: Icon, title, text }) => (
            <button key={title} className="quick-card" onClick={() => toast(`${title}: ${COMING_SOON}`, 'info')}>
              <span className="quick-card__icon" aria-hidden><Icon size={18} /></span>
              <span className="quick-card__title">{title}</span>
              <span className="quick-card__text">{text}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="studies-title" className="section">
        <div className="section-head">
          <h2 id="studies-title" className="section-title">Recent studies</h2>
          <button className="link-btn" onClick={() => toast(`All studies: ${COMING_SOON}`, 'info')}>View all</button>
        </div>
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
                <th scope="col">Type</th>
                <th scope="col" className="num">Participants</th>
                <th scope="col">Created by</th>
              </tr>
            </thead>
            <tbody>
              {studies.map((s) => (
                <tr key={s.id} className="table__row" tabIndex={0} onClick={() => openPreview(s)} onKeyDown={(e) => e.key === 'Enter' && openPreview(s)}>
                  <td>
                    <div className="cell-title">{s.name}</div>
                    <div className="cell-sub">{formatDate(s.date)}{s.simulated && ' · Simulated'}</div>
                  </td>
                  <td><StudyStatus study={s} /></td>
                  <td className="muted">{s.type}</td>
                  <td className="num">{s.status === 'Live' ? `${s.participants}/${s.targetParticipants}` : s.participants}</td>
                  <td><span className="owner"><Avatar person={s.createdBy} size={22} /> {s.createdBy.name}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {preview && (
        <Modal
          title={preview.name}
          kicker={`${preview.type} · ${formatDate(preview.date)}`}
          onClose={() => setPreview(null)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setPreview(null)}>Close</button>
              {(preview.id === RETEST_STUDY_ID || ['s1', 's3', 's4', 's5'].includes(preview.id)) && (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    setPreview(null);
                    if (preview.id === RETEST_STUDY_ID && state.research.phase === 'done') dispatch({ type: 'navigate', screen: 'results' });
                    else dispatch({ type: 'openAssumption', id: HERO_ID, tab: 'evidence' });
                  }}
                >
                  {preview.id === RETEST_STUDY_ID && state.research.phase === 'done' ? 'Open results' : 'See linked assumption'}
                </button>
              )}
            </>
          }
        >
          <dl className="dl">
            <div><dt>Status</dt><dd><StudyStatus study={preview} /></dd></div>
            <div><dt>Participants</dt><dd>{preview.participants}{preview.status === 'Live' && ` of ${preview.targetParticipants}`}</dd></div>
            <div><dt>Created by</dt><dd>{preview.createdBy.name}</dd></div>
            <div className="dl__full"><dt>Objective</dt><dd>{preview.objective}</dd></div>
          </dl>
          <p className="fine-print">Full study reports are outside this concept. Fictional study data.</p>
        </Modal>
      )}
    </div>
  );
}
