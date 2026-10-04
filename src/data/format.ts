import { TODAY } from './seed';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** Days between two ISO dates, computed in UTC so results never depend on the viewer's timezone. */
export function daysBetween(from: string, to: string = TODAY) {
  const a = parts(from);
  const b = parts(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export function monthsSince(iso: string) {
  return daysBetween(iso) / 30.44;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Never';
  const { y, m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatShort(iso: string) {
  const { m, d } = parts(iso);
  return `${MONTHS[m - 1]} ${d}`;
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return 'Never';
  const days = daysBetween(iso);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  const months = Math.round(days / 30.44);
  return `${months} months ago`;
}

export function isPast(iso: string | null) {
  return !!iso && daysBetween(iso) > 0;
}
