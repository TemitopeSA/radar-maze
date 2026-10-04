import { useState } from 'react';
import { Play, Video } from 'lucide-react';
import type { Quote, Study, Theme } from '../data/types';
import { formatDate } from '../data/format';
import { Modal } from './Modal';

const THEME_CLASS: Record<Theme, string> = { Price: 'price', 'Payout speed': 'speed', Trust: 'trust', Workflow: 'neutral', Device: 'neutral' };

export function ThemeTag({ theme }: { theme: Theme }) {
  return <span className={`theme theme--${THEME_CLASS[theme]}`}>{theme}</span>;
}

export function QuoteCard({ quote, study }: { quote: Quote; study?: Study }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`quote quote--${quote.era}`}>
      <div className="quote__top">
        <ThemeTag theme={quote.theme} />
        <time className="muted" dateTime={quote.date}>{formatDate(quote.date)}{quote.clipTime && ` · ${quote.clipTime}`}</time>
      </div>
      <blockquote className="quote__text">“{quote.text}”</blockquote>
      <footer className="quote__foot">
        <div>
          <div className="quote__who">{quote.participant}</div>
          <div className="muted">{quote.role}</div>
          {study && <div className="quote__study">{study.name}</div>}
        </div>
        {quote.transcript && (
          <button className="btn btn--secondary btn--sm" onClick={() => setOpen(true)} aria-label={`View clip from ${quote.participant}`}>
            <Play size={14} aria-hidden /> View clip
          </button>
        )}
      </footer>
      {open && quote.transcript && (
        <Modal title={quote.participant} kicker={study ? `${study.type} · ${study.name}` : 'Session clip'} onClose={() => setOpen(false)} size="lg">
          <div className="clip">
            <div className="clip__player" aria-label="Mock clip placeholder">
              <Video size={28} aria-hidden />
              <p><strong>Mock clip</strong></p>
              <p className="muted">No recording exists in this concept. The transcript below is fictional.</p>
              <div className="clip__bar" aria-hidden>
                <span style={{ width: '38%' }} />
              </div>
              <div className="clip__time muted">{quote.clipTime} · {formatDate(quote.date)}</div>
            </div>
            <div className="clip__side">
              <dl className="dl dl--stack">
                <div><dt>Participant</dt><dd>{quote.participant}</dd></div>
                <div><dt>Business</dt><dd>{quote.role}</dd></div>
                <div><dt>Theme</dt><dd><ThemeTag theme={quote.theme} /></dd></div>
              </dl>
              <h3 className="side-title">Transcript</h3>
              <ol className="transcript">
                {quote.transcript.map((line, i) => (
                  <li key={i} className={line.text.includes(quote.text.replace(/[.”"]$/, '')) ? 'is-highlight' : ''}>
                    <span className="transcript__speaker">{line.speaker}</span>
                    <span>{line.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Modal>
      )}
    </article>
  );
}
