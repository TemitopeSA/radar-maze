import { ChevronDown, CircleHelp, FolderOpen, House, Radar, Search } from 'lucide-react';
import { useStore, type Screen } from '../state/store';
import { useToast, COMING_SOON } from './Toast';
import { Avatar } from './ui';
import { PEOPLE } from '../data/seed';

const ASSUMPTION_SCREENS: Screen[] = ['assumptions', 'detail', 'builder', 'progress', 'results', 'wrapup'];

export function Sidebar() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const active = state.screen === 'home' ? 'home' : ASSUMPTION_SCREENS.includes(state.screen) ? 'assumptions' : '';

  return (
    <nav className="sidebar" aria-label="Main">
      <button className="sidebar__team" onClick={() => toast('Switching teams is outside this concept.', 'info')}>
        <span className="sidebar__logo" aria-hidden>L</span>
        <span className="sidebar__text sidebar__team-name">Lumen · Product</span>
        <ChevronDown size={14} className="sidebar__text" aria-hidden />
      </button>
      <ul className="sidebar__list">
        <li>
          <button className={`sidebar__item ${active === 'home' ? 'is-active' : ''}`} aria-current={active === 'home' ? 'page' : undefined} onClick={() => dispatch({ type: 'navigate', screen: 'home' })}>
            <House size={18} aria-hidden />
            <span className="sidebar__text">Home</span>
          </button>
        </li>
        <li>
          <button className="sidebar__item" onClick={() => toast(`Projects: ${COMING_SOON}`, 'info')}>
            <FolderOpen size={18} aria-hidden />
            <span className="sidebar__text">Projects</span>
          </button>
        </li>
        <li>
          <button
            data-tour="nav-assumptions"
            className={`sidebar__item ${active === 'assumptions' ? 'is-active' : ''}`}
            aria-current={active === 'assumptions' ? 'page' : undefined}
            onClick={() => dispatch({ type: 'navigate', screen: 'assumptions' })}
          >
            <Radar size={18} aria-hidden />
            <span className="sidebar__text">Assumptions</span>
            <span className="tag tag--new sidebar__new">New</span>
          </button>
        </li>
        <li>
          <button className="sidebar__item" onClick={() => toast(`Search: ${COMING_SOON}`, 'info')}>
            <Search size={18} aria-hidden />
            <span className="sidebar__text">Search</span>
          </button>
        </li>
      </ul>
      <div className="sidebar__bottom">
        <button className="sidebar__item" onClick={() => toast(`Help center: ${COMING_SOON}`, 'info')}>
          <CircleHelp size={18} aria-hidden />
          <span className="sidebar__text">Help</span>
        </button>
        <button className="sidebar__item sidebar__user" onClick={() => toast('Signed in as Dana Mercer (fictional).', 'info')}>
          <Avatar person={PEOPLE.dana} size={26} />
          <span className="sidebar__text">
            <span className="sidebar__user-name">Dana Mercer</span>
            <span className="sidebar__user-role">Head of Product</span>
          </span>
        </button>
      </div>
    </nav>
  );
}
