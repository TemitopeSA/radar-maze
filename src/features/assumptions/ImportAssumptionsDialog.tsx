import { useEffect, useState } from 'react';
import { trackEvent } from '../../analytics';
import { FileText, LoaderCircle, Sparkles } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { useStore } from '../../state/store';
import { EXTRACTED_FROM_PRD, SAMPLE_PRD } from '../../data/seed';
import type { Category } from '../../data/types';

interface Draft { statement: string; category: Category; confidence: number; selected: boolean }

export function ImportAssumptionsDialog({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'input' | 'extracting' | 'review'>('input');
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    if (phase !== 'extracting') return;
    const t = window.setTimeout(() => {
      setDrafts(EXTRACTED_FROM_PRD.map((d) => ({ ...d, selected: true })));
      setPhase('review');
    }, 1400);
    return () => window.clearTimeout(t);
  }, [phase]);

  const selected = drafts.filter((d) => d.selected && d.statement.trim());
  const update = (i: number, patch: Partial<Draft>) => setDrafts((list) => list.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  const confirm = () => {
    dispatch({ type: 'addAssumptions', items: selected.map((d) => ({ statement: d.statement.trim(), category: d.category, ownerName: 'Leo Martins', confidence: d.confidence, expiresOn: null })) });
    trackEvent('Assumptions Imported', { count: selected.length }, String(selected.length));
    toast(`${selected.length} assumption${selected.length === 1 ? '' : 's'} imported from your doc.`);
    onClose();
  };

  return (
    <Modal
      title="Import assumptions from a doc"
      kicker="Maze AI"
      description="Paste a PRD, brief or strategy doc. Maze finds the beliefs hiding inside it so you can track them."
      size="lg"
      onClose={onClose}
      footer={
        phase === 'review' ? (
          <>
            <button className="btn btn--ghost" onClick={() => setPhase('input')}>Back</button>
            <button className="btn btn--primary" onClick={confirm} disabled={selected.length === 0}>
              Import {selected.length} assumption{selected.length === 1 ? '' : 's'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" onClick={() => setPhase('extracting')} disabled={!text.trim() || phase === 'extracting'}>
              {phase === 'extracting' ? <LoaderCircle size={16} className="spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
              {phase === 'extracting' ? 'Extracting…' : 'Extract assumptions'}
            </button>
          </>
        )
      }
    >
      {phase !== 'review' ? (
        <div className="form">
          <div className="field">
            <div className="field__label-row">
              <label htmlFor="doc-text" className="field__label">Document text</label>
              <button className="link-btn" onClick={() => { trackEvent('Sample PRD Loaded'); setText(SAMPLE_PRD); }}>
                <FileText size={14} aria-hidden /> Load sample PRD
              </button>
            </div>
            <textarea id="doc-text" data-autofocus rows={12} className="mono" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your document here…" disabled={phase === 'extracting'} />
          </div>
          <p className="fine-print">In this concept, extraction is simulated with prepared results. Nothing is sent to an AI service.</p>
        </div>
      ) : (
        <div className="form">
          <p className="ai-inline"><Sparkles size={14} aria-hidden /> Maze found 3 assumptions. Edit them and choose which to track.</p>
          {drafts.map((d, i) => (
            <div key={i} className={`extract ${d.selected ? '' : 'extract--off'}`}>
              <input type="checkbox" checked={d.selected} onChange={(e) => update(i, { selected: e.target.checked })} aria-label={`Import assumption ${i + 1}`} />
              <div className="extract__body">
                <textarea rows={2} value={d.statement} onChange={(e) => update(i, { statement: e.target.value })} aria-label={`Statement ${i + 1}`} />
                <div className="extract__controls">
                  <select className="select select--sm" value={d.category} onChange={(e) => update(i, { category: e.target.value as Category })} aria-label={`Category ${i + 1}`}>
                    {(['Customer', 'Market', 'Product', 'Pricing'] as const).map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <label className="extract__conf">
                    Confidence
                    <input type="range" min={0} max={100} value={d.confidence} onChange={(e) => update(i, { confidence: Number(e.target.value) })} />
                    <strong>{d.confidence}</strong>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
