import { useState } from 'react';
import type { Assumption } from '../data/types';
import { formatShort } from '../data/format';
import { DRIFT_WEEK_INDEX, HERO_ID, WEEKS } from '../data/seed';
import { STATUS_META, useElementWidth } from './ui';

const H = 260;
const M = { top: 24, right: 28, bottom: 40, left: 44 };

export function ConfidenceChart({ assumption }: { assumption: Assumption }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const w = Math.max(width, 320);
  const iw = w - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const isHero = assumption.id === HERO_ID;
  const retest = assumption.retestPoint;

  const labels = [...WEEKS.map(formatShort), ...(retest ? ['Re-test'] : [])];
  const values = [...assumption.history, ...(retest ? [retest.value] : [])];
  const n = values.length;
  const sx = (i: number) => M.left + (i / (n - 1)) * iw;
  const sy = (v: number) => M.top + (1 - v / 100) * ih;
  const pts = values.map((v, i) => ({ x: sx(i), y: sy(v), v, label: labels[i] }));
  const weekly = pts.slice(0, assumption.history.length);
  const lineColor = isHero ? 'var(--status-drifting-dot)' : STATUS_META[assumption.status].color;
  const driftIndex = isHero ? DRIFT_WEEK_INDEX : -1;
  const area = `M${weekly[0].x},${sy(0)} ${weekly.map((p) => `L${p.x},${p.y}`).join(' ')} L${weekly[weekly.length - 1].x},${sy(0)} Z`;

  return (
    <div ref={ref} className="line-chart">
      {width > 0 && (
        <svg width={w} height={H} role="img" aria-label={`Weekly confidence: ${values.map((v, i) => `${labels[i]} ${v}`).join(', ')}.`} onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="conf-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={lineColor} stopOpacity="0.14" />
              <stop offset="1" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={M.left} x2={w - M.right} y1={sy(v)} y2={sy(v)} stroke="var(--maze-neutral-200)" />
              <text x={M.left - 10} y={sy(v) + 4} textAnchor="end" className="axis-label">{v}</text>
            </g>
          ))}
          <line x1={M.left} x2={w - M.right} y1={sy(60)} y2={sy(60)} stroke="var(--maze-neutral-400)" strokeDasharray="4 4" />
          <text x={w - M.right} y={sy(60) - 6} textAnchor="end" className="axis-note">Drift threshold · 60</text>
          {pts.map((p, i) => (
            <text key={i} x={p.x} y={H - M.bottom + 18} textAnchor="middle" className={`axis-label ${i === n - 1 && retest ? 'axis-label--strong' : ''}`}>{p.label}</text>
          ))}
          <text x={M.left + iw / 2} y={H - 4} textAnchor="middle" className="axis-title">Week of</text>
          <text transform={`translate(12 ${M.top + ih / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">Confidence</text>

          <path d={area} fill="url(#conf-fill)" />
          <polyline points={weekly.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {retest && (
            <line x1={weekly[weekly.length - 1].x} y1={weekly[weekly.length - 1].y} x2={pts[n - 1].x} y2={pts[n - 1].y} stroke="var(--status-holding)" strokeWidth={2.5} strokeDasharray="5 4" />
          )}

          {driftIndex >= 0 && (
            <g aria-hidden>
              <line x1={pts[driftIndex].x} x2={pts[driftIndex].x} y1={M.top} y2={sy(0)} stroke="var(--maze-amber-400)" strokeDasharray="2 3" />
              <rect x={pts[driftIndex].x - 52} y={M.top - 20} width={104} height={18} rx={4} fill="var(--maze-amber-100)" stroke="var(--maze-amber-200)" />
              <text x={pts[driftIndex].x} y={M.top - 7} textAnchor="middle" className="chart-flag">Drift detected</text>
            </g>
          )}

          {pts.map((p, i) => {
            const isRetest = !!retest && i === n - 1;
            const isDrift = i === driftIndex;
            const color = isRetest ? 'var(--status-holding)' : isDrift ? 'var(--maze-amber-500)' : lineColor;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={isDrift || isRetest ? 6 : hover === i ? 5 : 3.5} fill={isDrift || isRetest ? 'var(--maze-neutral-000)' : color} stroke={color} strokeWidth={isDrift || isRetest ? 2.5 : 0} />
                {(i === 0 || i === assumption.history.length - 1 || isRetest) && (
                  <text x={p.x} y={p.y - 12} textAnchor="middle" className="point-label" fill={color}>{p.v}</text>
                )}
                <rect
                  x={p.x - iw / (n - 1) / 2}
                  y={M.top}
                  width={iw / (n - 1)}
                  height={ih}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${p.label}: confidence ${p.v}`}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
          {hover !== null && <line x1={pts[hover].x} x2={pts[hover].x} y1={M.top} y2={sy(0)} stroke="var(--maze-neutral-300)" pointerEvents="none" />}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div className="chart-tooltip chart-tooltip--sm" style={{ left: Math.min(Math.max(pts[hover].x - 80, 0), w - 180), top: Math.max(pts[hover].y - 76, 0) }} role="status">
          <div className="muted">{retest && hover === n - 1 ? `Re-test · ${formatShort(retest.date)}` : `Week of ${pts[hover].label}`}</div>
          <div><strong className="chart-tooltip__big">{pts[hover].v}</strong> confidence</div>
          {hover > 0 && (
            <div className={pts[hover].v < pts[hover - 1].v ? 'delta delta--down' : 'delta'}>
              {pts[hover].v === pts[hover - 1].v ? 'No change' : `${pts[hover].v > pts[hover - 1].v ? '+' : ''}${pts[hover].v - pts[hover - 1].v} vs. previous`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
