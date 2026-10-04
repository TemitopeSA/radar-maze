import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleCheck, CircleDashed, Hourglass, TrendingDown } from 'lucide-react';
import type { DecisionStatus, Person, Status } from '../data/types';

export const STATUS_META: Record<Status, { icon: typeof CircleCheck; className: string; color: string; description: string }> = {
  Holding: { icon: CircleCheck, className: 'holding', color: 'var(--status-holding)', description: 'Recent evidence supports it' },
  Drifting: { icon: TrendingDown, className: 'drifting', color: 'var(--status-drifting-dot)', description: 'Evidence is moving away from it' },
  Expired: { icon: Hourglass, className: 'expired', color: 'var(--status-expired)', description: 'Past its check-again date' },
  Untested: { icon: CircleDashed, className: 'untested', color: 'var(--status-untested)', description: 'No evidence linked yet' },
};

export function StatusBadge({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`badge badge--${meta.className} badge--${size}`}>
      <Icon size={size === 'sm' ? 12 : 14} aria-hidden strokeWidth={2.25} />
      {status}
    </span>
  );
}

const DECISION_CLASS: Record<DecisionStatus, string> = { 'On track': 'holding', 'At risk': 'expired', 'Needs review': 'drifting' };

export function DecisionBadge({ status }: { status: DecisionStatus }) {
  return <span className={`badge badge--${DECISION_CLASS[status]} badge--md`}>{status}</span>;
}

export function Avatar({ person, size = 24 }: { person: Pick<Person, 'name' | 'initials'>; size?: number }) {
  // Deterministic tint per person so avatars stay stable across renders.
  const tints = ['blue', 'lavender', 'forest', 'amber'];
  const tint = tints[(person.initials.charCodeAt(0) + person.initials.charCodeAt(1)) % tints.length];
  return (
    <span className={`avatar avatar--${tint}`} style={{ width: size, height: size, fontSize: size * 0.4 }} title={person.name} aria-hidden>
      {person.initials}
    </span>
  );
}

export function Owner({ person }: { person: Pick<Person, 'name' | 'initials'> }) {
  return (
    <span className="owner">
      <Avatar person={person} size={22} />
      <span>{person.name}</span>
    </span>
  );
}

export function Sparkline({ values, status, width = 64, height = 20 }: { values: number[]; status: Status; width?: number; height?: number }) {
  const min = Math.min(...values, 30);
  const max = Math.max(...values, 90);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 2 - ((v - min) / (max - min || 1)) * (height - 4)]);
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="sparkline" aria-hidden>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={STATUS_META[status].color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.25} fill={STATUS_META[status].color} />
    </svg>
  );
}

export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Small anchored dropdown menu with keyboard and outside-click support. */
export function Menu({ trigger, children, align = 'right', label }: {
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        ref.current?.querySelector<HTMLElement>('button')?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener('mousedown', onDown);
    const node = ref.current;
    node?.addEventListener('keydown', onKey);
    requestAnimationFrame(() => node?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => {
      document.removeEventListener('mousedown', onDown);
      node?.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div className="menu-anchor" ref={ref}>
      {trigger({ onClick: () => setOpen((o) => !o), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <div className={`menu menu--${align}`} role="menu" aria-label={label}>
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, children, onSelect, hint }: { icon?: ReactNode; children: ReactNode; onSelect: () => void; hint?: string }) {
  return (
    <button role="menuitem" className="menu__item" onClick={onSelect}>
      {icon}
      <span className="menu__label">
        {children}
        {hint && <span className="menu__hint">{hint}</span>}
      </span>
    </button>
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button id={id} role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'switch--on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="switch__thumb" />
    </button>
  );
}
