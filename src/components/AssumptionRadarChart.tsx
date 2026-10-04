import { useState } from 'react';
import type { Assumption, Status } from '../data/types';
import { formatRelative, monthsSince } from '../data/format';
import { HERO_ID } from '../data/seed';
import { STATUS_META, useElementWidth } from './ui';

const H = 340;
const M = { top: 20, right: 20, bottom: 44, left: 48 };
const X_MAX = 18;
const NEVER = 19.5;

function Shape({ status, x, y, r }: { status: Status; x: number; y: number; r: number }) {
  const color = STATUS_META[status].color;
  switch (status) {
    case 'Holding':
      return <circle cx={x} cy={y} r={r} fill={color} />;
    case 'Drifting':
      return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} transform={`rotate(45 ${x} ${y})`} fill={color} rx={1.5} />;
    case 'Expired':
      return <rect x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} fill={color} rx={1.5} />;
    case 'Untested':
      return <circle cx={x} cy={y} r={r - 1} fill="var(--maze-neutral-000)" stroke={color} strokeWidth={2} strokeDasharray="2.5 2" />;
  }
}

export function ShapeIcon({ status }: { status: Status }) {
  return (
    <svg width={14} height={14} aria-hidden>
      <Shape status={status} x={7} y={7} r={5} />
    </svg>
  );
}

export function AssumptionRadarChart({ assumptions, onSelect }: { assumptions: Assumption[]; onSelect: (id: string) => void }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const w = Math.max(width, 320);
  const iw = w - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const sx = (m: number) => M.left + (Math.min(m, 20) / 20) * iw;
  const sy = (c: number) => M.top + (1 - c / 100) * ih;

  const points = assumptions.map((a) => {
    const months = a.lastValidated ? Math.min(monthsSince(a.lastValidated), X_MAX) : NEVER;
    return { a, x: sx(months), y: sy(a.confidence) };
  });
  // Draw the hovered and hero points last so they sit on top.
  const ordered = [...points].sort((p, q) => Number(p.a.id === HERO_ID) - Number(q.a.id === HERO_ID) || Number(p.a.id === hover) - Number(q.a.id === hover));
  const hovered = points.find((p) => p.a.id === hover);

  return (
    <div ref={ref} className="radar-chart">
      {width > 0 && (
        <svg width={w} height={H} role="img" aria-labelledby="radar-desc">
          <desc id="radar-desc">Scatter plot of {assumptions.length} assumptions by confidence and time since last validated. A list version follows the chart.</desc>
          {/* Freshness band beyond 12 months and the "never validated" column */}
          <rect x={sx(12)} y={M.top} width={sx(X_MAX) - sx(12)} height={ih} fill="var(--maze-neutral-100)" />
          <rect x={sx(X_MAX) + 4} y={M.top} width={sx(20) - sx(X_MAX) - 4} height={ih} fill="var(--maze-neutral-100)" rx={4} />
          {[0, 25, 50, 75, 100].map((c) => (
            <g key={c}>
              <line x1={M.left} x2={sx(X_MAX)} y1={sy(c)} y2={sy(c)} stroke="var(--maze-neutral-200)" />
              <text x={M.left - 10} y={sy(c) + 4} textAnchor="end" className="axis-label">{c}</text>
            </g>
          ))}
          <line x1={M.left} x2={sx(X_MAX)} y1={sy(60)} y2={sy(60)} stroke="var(--maze-neutral-400)" strokeDasharray="4 4" />
          <text x={sx(X_MAX) - 4} y={sy(60) - 6} textAnchor="end" className="axis-note">Drift threshold · 60</text>
          {[0, 3, 6, 9, 12, 15, 18].map((m) => (
            <text key={m} x={sx(m)} y={H - M.bottom + 18} textAnchor="middle" className="axis-label">{m === 0 ? 'Now' : `${m} mo`}</text>
          ))}
          <text x={(sx(X_MAX) + 4 + sx(20)) / 2} y={H - M.bottom + 18} textAnchor="middle" className="axis-label">Never</text>
          <text x={M.left + iw / 2} y={H - 6} textAnchor="middle" className="axis-title">Time since last validated →</text>
          <text transform={`translate(12 ${M.top + ih / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">Confidence →</text>
          <text x={M.left + 8} y={M.top + 14} className="axis-note axis-note--good">Recent and confident</text>
          <text x={sx(12) + 8} y={sy(0) - 8} className="axis-note">Older than 12 months</text>

          {ordered.map(({ a, x, y }) => {
            const isHero = a.id === HERO_ID;
            const r = isHero ? 8 : 6.5;
            return (
              <g
                key={a.id}
                className={`radar-dot ${hover === a.id ? 'is-hover' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${a.statement} Confidence ${a.confidence}, ${a.status}, owner ${a.owner.name}.`}
                onMouseEnter={() => setHover(a.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(a.id)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect(a.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(a.id))}
              >
                <circle cx={x} cy={y} r={16} fill="transparent" />
                {(isHero || hover === a.id) && <circle cx={x} cy={y} r={r + 5} fill="none" stroke={STATUS_META[a.status].color} strokeOpacity={0.35} strokeWidth={2} />}
                <Shape status={a.status} x={x} y={y} r={r} />
                {isHero && (
                  <text x={x + 14} y={y + 4} className="radar-label">{a.status === 'Drifting' ? 'Price is why customers choose us' : 'Fast, reliable payouts'}</text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {hovered && (
        <div
          className="chart-tooltip"
          style={{ left: Math.min(hovered.x + 14, w - 270), top: Math.max(hovered.y - 12, 0), transform: hovered.y > H - 120 ? 'translateY(-100%)' : undefined }}
          role="presentation"
        >
          <div className="chart-tooltip__title">{hovered.a.statement}</div>
          <div className="chart-tooltip__row">
            <span className={`status-text status-text--${STATUS_META[hovered.a.status].className}`}><ShapeIcon status={hovered.a.status} /> {hovered.a.status}</span>
            <span>Confidence <strong>{hovered.a.confidence}</strong></span>
          </div>
          <div className="chart-tooltip__row muted">
            <span>{hovered.a.owner.name}</span>
            <span>Validated {formatRelative(hovered.a.lastValidated).toLowerCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
