import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { useStore } from '../../state/store';
import { OWNERS } from '../../data/seed';
import type { Category } from '../../data/types';

export function AssumptionForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [statement, setStatement] = useState('');
  const [category, setCategory] = useState<Category>('Customer');
  const [owner, setOwner] = useState(OWNERS[0].name);
  const [confidence, setConfidence] = useState(60);
  const [expires, setExpires] = useState('');
  const [touched, setTouched] = useState(false);
  const error = statement.trim().length < 8 ? 'Write the belief as a full sentence (at least 8 characters).' : '';

  const save = () => {
    setTouched(true);
    if (error) return;
    dispatch({ type: 'addAssumptions', items: [{ statement: statement.trim(), category, ownerName: owner, confidence, expiresOn: expires || null }] });
    toast('Assumption added. It starts as Untested until you link evidence.');
    onClose();
  };

  return (
    <Modal
      title="Write an assumption"
      description="Phrase it as something your team believes about customers, the market, your product, or pricing."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={save}>Save assumption</button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="field">
          <span className="field__label">Statement</span>
          <textarea
            data-autofocus
            rows={3}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="e.g. Owners want to see cash flow forecasts on the home screen."
            aria-invalid={touched && !!error}
            aria-describedby="statement-error"
          />
          {touched && error && <span id="statement-error" className="field__error">{error}</span>}
        </label>
        <div className="form__row">
          <label className="field">
            <span className="field__label">Category</span>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {(['Customer', 'Market', 'Product', 'Pricing'] as const).map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Owner</span>
            <select className="select" value={owner} onChange={(e) => setOwner(e.target.value)}>
              {OWNERS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </label>
        </div>
        <div className="form__row">
          <label className="field">
            <span className="field__label">Initial confidence <strong className="field__value">{confidence}</strong></span>
            <input type="range" min={0} max={100} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} />
            <span className="field__help">How sure is the team today, before evidence?</span>
          </label>
          <label className="field">
            <span className="field__label">Check again by <span className="muted">(optional)</span></span>
            <input type="date" className="input" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </label>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
