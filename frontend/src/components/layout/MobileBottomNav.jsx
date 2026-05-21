import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';

export function MobileBottomNav({ items = [] }) {
  return (
    <nav className="glass-panel fixed bottom-4 left-4 right-4 z-30 grid grid-cols-4 rounded-[2rem] border border-border/70 p-2 lg:hidden">
      {items.slice(0, 4).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-muted', isActive && 'bg-surface text-foreground')
            }
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
