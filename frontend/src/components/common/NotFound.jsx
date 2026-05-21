import { Link } from 'react-router-dom';
import { Button } from '../ui/Button/Button';

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card max-w-xl rounded-[2rem] p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">404</p>
        <h1 className="mt-4 font-display text-4xl text-foreground">This route does not exist</h1>
        <p className="mt-3 text-sm text-muted">The page may have moved during the modular refactor. Use the main navigation to continue.</p>
        <Button as={Link} to="/" className="mt-6">
          Back to home
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
