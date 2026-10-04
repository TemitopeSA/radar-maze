import type { ReactNode } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface Crumb { label: string; onClick?: () => void }

export function PageHeader({ title, kicker, description, crumbs, onBack, actions }: {
  title: ReactNode;
  kicker?: string;
  description?: ReactNode;
  crumbs?: Crumb[];
  onBack?: () => void;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      {(onBack || crumbs) && (
        <div className="page-header__nav">
          {onBack && (
            <button className="icon-btn icon-btn--bordered" onClick={onBack} aria-label="Go back">
              <ArrowLeft size={16} />
            </button>
          )}
          {crumbs && (
            <nav aria-label="Breadcrumb">
              <ol className="crumbs">
                {crumbs.map((c, i) => (
                  <li key={c.label}>
                    {c.onClick ? <button className="crumbs__link" onClick={c.onClick}>{c.label}</button> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
                    {i < crumbs.length - 1 && <ChevronRight size={14} aria-hidden />}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      )}
      <div className="page-header__row">
        <div className="page-header__text">
          {kicker && <div className="kicker">{kicker}</div>}
          <h1 className="page-header__title">{title}</h1>
          {description && <p className="page-header__desc">{description}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}
