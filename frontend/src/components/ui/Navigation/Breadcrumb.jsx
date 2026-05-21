import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {item.path ? <Link to={item.path}>{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 ? <ChevronRight className="h-4 w-4" /> : null}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;
