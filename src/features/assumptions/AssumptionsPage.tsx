import { useMemo, useState } from 'react';
import { trackEvent } from '../../analytics';
import { ArrowDown, ArrowUp, FileUp, PenLine, Plus, Search, X } from 'lucide-react';
import { countByStatus, useStore, type SortKey } from '../../state/store';
import { formatDate, formatRelative } from '../../data/format';
import { HERO_ID } from '../../data/seed';
import type { Category, Status } from '../../data/types';
import { PageHeader } from '../../components/PageHeader';
import { AssumptionRadarChart, ShapeIcon } from '../../components/AssumptionRadarChart';
import { Menu, MenuItem, Owner, Sparkline, StatusBadge, STATUS_META } from '../../components/ui';
import { useTour } from '../tour/TourProvider';
import { AssumptionForm } from './AssumptionForm';
import { ImportAssumptionsDialog } from './ImportAssumptionsDialog';

const STATUSES: Status[] = ['Holding', 'Drifting', 'Expired', 'Untested'];
const CATEGORIES: Category[] = ['Customer', 'Market', 'Product', 'Pricing'];
const ATTENTION: Record<Status, number> = { Drifting: 0, Expired: 1, Untested: 2, Holding: 3 };

export function AssumptionsPage() {
  const { state, dispatch } = useStore();
  const tour = useTour();
  const [dialog, setDialog] = useState<null | 'write' | 'import'>(null);
  const { filters } = state;
  const counts = countByStatus(state.assumptions);

  const open = (id: string, source: 'table' | 'radar' | 'list') => {
    trackEvent('Assumption Opened', { source, hero: id === HERO_ID }, `${source}-${id === HERO_ID ? 'hero' : 'other'}`);
    dispatch({ type: 'openAssumption', id });
    if (id === HERO_ID) tour.signal('open-hero');
  };

  const rows = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = state.assumptions.filter(
      (a) =>
        (!q || a.statement.toLowerCase().includes(q) || a.owner.name.toLowerCase().includes(q)) &&
        (filters.status === 'all' || a.status === filters.status) &&
        (filters.category === 'all' || a.category === filters.category),
    );
    const validated = (d: string | null) => d ?? '0000';
    const sorters: Record<SortKey, ((a: (typeof list)[0], b: (typeof list)[0]) => number) | null> = {
      default: (a, b) => ATTENTION[a.status] - ATTENTION[b.status] || Number(b.id === HERO_ID) - Number(a.id === HERO_ID) || a.confidence - b.confidence,
      'confidence-asc': (a, b) => a.confidence - b.confidence,
      'confidence-desc': (a, b) => b.confidence - a.confidence,
      'validated-recent': (a, b) => validated(b.lastValidated).localeCompare(validated(a.lastValidated)),
      'validated-oldest': (a, b) => validated(a.lastValidated).localeCompare(validated(b.lastValidated)),
    };
    return [...list].sort(sorters[filters.sort] ?? undefined);
  }, [state.assumptions, filters]);

  const filtered = filters.query || filters.status !== 'all' || filters.category !== 'all' || filters.sort !== 'default';

  const toggleSort = (key: 'confidence' | 'validated') => {
    const [a, b]: SortKey[] = key === 'confidence' ? ['confidence-asc', 'confidence-desc'] : ['validated-oldest', 'validated-recent'];
    dispatch({ type: 'setFilters', filters: { sort: filters.sort === a ? b : a } });
  };
  const sortIcon = (key: 'confidence' | 'validated') => {
    if (key === 'confidence' && filters.sort === 'confidence-asc') return <ArrowUp size={12} aria-hidden />;
    if (key === 'confidence' && filters.sort === 'confidence-desc') return <ArrowDown size={12} aria-hidden />;
    if (key === 'validated' && filters.sort === 'validated-oldest') return <ArrowUp size={12} aria-hidden />;
    if (key === 'validated' && filters.sort === 'validated-recent') return <ArrowDown size={12} aria-hidden />;
    return null;
  };
  const ariaSort = (key: 'confidence' | 'validated') => {
    if (!filters.sort.startsWith(key)) return undefined;
    return filters.sort.endsWith('asc') || filters.sort.endsWith('oldest') ? 'ascending' : 'descending';
  };

  return (
    <div className="page">
      <PageHeader
        kicker="Product discovery"
        title="Assumptions"
        description="Track what you believe, see what the evidence says, and know when to look again."
        actions={
          <Menu
            label="Add assumption"
            trigger={(props) => (
              <button className="btn btn--primary" {...props}>
                <Plus size={16} aria-hidden /> Add assumption
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem icon={<PenLine size={16} aria-hidden />} hint="Capture a belief and its owner" onSelect={() => { close(); setDialog('write'); }}>Write one</MenuItem>
                <MenuItem icon={<FileUp size={16} aria-hidden />} hint="Pull assumptions out of a PRD or brief" onSelect={() => { close(); setDialog('import'); }}>Import from a doc</MenuItem>
              </>
            )}
          </Menu>
        }
      />

      <section className="tiles" data-tour="summary-tiles" aria-label="Assumption summary">
        <button className={`tile ${filters.status === 'all' ? 'is-selected' : ''}`} onClick={() => dispatch({ type: 'setFilters', filters: { status: 'all' } })} aria-pressed={filters.status === 'all'}>
          <span className="tile__label">Tracked</span>
          <span className="tile__value">{state.assumptions.length}</span>
          <span className="tile__sub">{new Set(state.assumptions.map((a) => a.owner.name)).size} owners</span>
        </button>
        {STATUSES.map((s) => {
          const Icon = STATUS_META[s].icon;
          return (
            <button
              key={s}
              className={`tile tile--${STATUS_META[s].className} ${filters.status === s ? 'is-selected' : ''}`}
              onClick={() => { trackEvent('Assumptions Filtered', { by: 'tile' }, 'tile'); dispatch({ type: 'setFilters', filters: { status: filters.status === s ? 'all' : s } }); }}
              aria-pressed={filters.status === s}
            >
              <span className="tile__label"><Icon size={14} aria-hidden /> {s}</span>
              <span className="tile__value">{counts[s]}</span>
              <span className="tile__sub">{STATUS_META[s].description}</span>
            </button>
          );
        })}
      </section>

      <section className="card radar-card" aria-labelledby="radar-title">
        <div className="radar-card__chart" data-tour="radar">
          <div className="card__head">
            <div>
              <h2 id="radar-title" className="card__title">Assumption radar</h2>
              <p className="card__sub">Healthy assumptions tend to be recently validated and high-confidence. Low-confidence or long-unvalidated assumptions deserve a closer look.</p>
            </div>
          </div>
          <AssumptionRadarChart assumptions={state.assumptions} onSelect={(id) => open(id, 'radar')} />
        </div>
        <aside className="radar-card__side">
          <h3 className="side-title">Legend</h3>
          <ul className="legend">
            {STATUSES.map((s) => (
              <li key={s}>
                <ShapeIcon status={s} />
                <span><strong>{s}</strong> <span className="muted">· {counts[s]}</span></span>
              </li>
            ))}
          </ul>
          <h3 className="side-title">Worth a look</h3>
          <ul className="attention-list">
            {state.assumptions
              .filter((a) => a.status !== 'Holding')
              .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.confidence - b.confidence)
              .slice(0, 4)
              .map((a) => (
                <li key={a.id}>
                  <button className="attention-item" onClick={() => open(a.id, 'list')}>
                    <ShapeIcon status={a.status} />
                    <span>
                      <span className="attention-item__text">{a.statement}</span>
                      <span className="attention-item__meta">{a.status} · {a.confidence}</span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          <p className="fine-print">A position on the radar is a prompt to look closer, not proof that a belief is wrong.</p>
        </aside>
      </section>

      <section className="card" aria-labelledby="table-title">
        <div className="toolbar">
          <h2 id="table-title" className="card__title">All assumptions</h2>
          <div className="toolbar__controls">
            <label className="search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder="Search statements or owners"
                aria-label="Search assumptions"
                value={filters.query}
                onChange={(e) => dispatch({ type: 'setFilters', filters: { query: e.target.value } })}
                onBlur={(e) => e.target.value && trackEvent('Assumptions Searched', { length: e.target.value.length })}
              />
            </label>
            <select className="select" aria-label="Filter by status" value={filters.status} onChange={(e) => { trackEvent('Assumptions Filtered', { by: 'status' }, 'status'); dispatch({ type: 'setFilters', filters: { status: e.target.value as Status | 'all' } }); }}>
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select" aria-label="Filter by category" value={filters.category} onChange={(e) => { trackEvent('Assumptions Filtered', { by: 'category' }, 'category'); dispatch({ type: 'setFilters', filters: { category: e.target.value as Category | 'all' } }); }}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="select" aria-label="Sort assumptions" value={filters.sort} onChange={(e) => { trackEvent('Assumptions Sorted', { sort: e.target.value }, e.target.value); dispatch({ type: 'setFilters', filters: { sort: e.target.value as SortKey } }); }}>
              <option value="default">Sort: Needs attention</option>
              <option value="confidence-asc">Confidence: low to high</option>
              <option value="confidence-desc">Confidence: high to low</option>
              <option value="validated-oldest">Last validated: oldest</option>
              <option value="validated-recent">Last validated: newest</option>
            </select>
            {filtered && (
              <button className="btn btn--ghost btn--sm" onClick={() => dispatch({ type: 'clearFilters' })}>
                <X size={14} aria-hidden /> Clear
              </button>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table className="table table--assumptions">
            <thead>
              <tr>
                <th scope="col">Assumption</th>
                <th scope="col">Category</th>
                <th scope="col">Owner</th>
                <th scope="col" aria-sort={ariaSort('confidence')}>
                  <button className="th-sort" onClick={() => toggleSort('confidence')}>Confidence {sortIcon('confidence')}</button>
                </th>
                <th scope="col">Status</th>
                <th scope="col" aria-sort={ariaSort('validated')}>
                  <button className="th-sort" onClick={() => toggleSort('validated')}>Last validated {sortIcon('validated')}</button>
                </th>
                <th scope="col" className="num">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const hero = a.id === HERO_ID;
                return (
                  <tr
                    key={a.id}
                    className={`table__row ${hero && a.status === 'Drifting' ? 'table__row--hero' : ''}`}
                    data-tour={hero ? 'hero-row' : undefined}
                    tabIndex={0}
                    aria-label={`Open assumption: ${a.statement}`}
                    onClick={() => open(a.id, 'table')}
                    onKeyDown={(e) => e.key === 'Enter' && open(a.id, 'table')}
                  >
                    <td className="cell-statement">
                      <div className="cell-title">{a.statement}</div>
                      {a.versions.length > 1 && <div className="cell-sub">v{a.versions.length} · updated {formatRelative(a.versions[a.versions.length - 1].date).toLowerCase()}</div>}
                    </td>
                    <td><span className="tag">{a.category}</span></td>
                    <td><Owner person={a.owner} /></td>
                    <td>
                      <span className="confidence-cell">
                        <strong>{a.confidence}</strong>
                        <Sparkline values={a.retestPoint ? [...a.history, a.retestPoint.value] : a.history} status={a.status} />
                      </span>
                    </td>
                    <td><StatusBadge status={a.status} size="sm" /></td>
                    <td className="muted nowrap" title={formatDate(a.lastValidated)}>{formatRelative(a.lastValidated)}</td>
                    <td className="num">{a.evidenceCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="empty">
              <p><strong>No assumptions match these filters.</strong></p>
              <button className="btn btn--secondary btn--sm" onClick={() => dispatch({ type: 'clearFilters' })}>Clear filters</button>
            </div>
          )}
        </div>
        <div className="table-foot muted">Showing {rows.length} of {state.assumptions.length} assumptions</div>
      </section>

      {dialog === 'write' && <AssumptionForm onClose={() => setDialog(null)} />}
      {dialog === 'import' && <ImportAssumptionsDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
