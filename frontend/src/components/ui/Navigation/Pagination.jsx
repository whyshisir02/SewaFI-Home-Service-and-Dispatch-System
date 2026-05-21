import { Button } from '../Button/Button';

export function Pagination({ page = 1, totalPages = 1, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={() => onChange?.(page - 1)} disabled={page <= 1}>
        Previous
      </Button>
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" onClick={() => onChange?.(page + 1)} disabled={page >= totalPages}>
        Next
      </Button>
    </div>
  );
}

export default Pagination;
