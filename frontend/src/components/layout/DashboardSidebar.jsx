import { Link, NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app.config';
import { cn } from '../../lib/cn';

export function DashboardSidebar({ items = [], mobile = false, onNavigate }) {
  const brand = (
    <div className="mb-8">
      <Link to="/" onClick={onNavigate} className="font-display text-2xl text-foreground hover:opacity-90">
        {APP_CONFIG.name}
      </Link>
      <p className="text-sm text-muted">Operations dashboard</p>
    </div>
  );

  const navItems = (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground',
                isActive && 'bg-surface text-foreground shadow-soft'
              )
            }
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  if (mobile) {
    return (
      <div className="px-1 pb-3">
        {brand}
        {navItems}
      </div>
    );
  }

  return (
    <aside className="glass-panel hidden w-72 flex-col border-r border-border/70 px-5 py-6 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:overflow-y-auto">
      {brand}
      {navItems}
    </aside>
  );
}

export default DashboardSidebar;
