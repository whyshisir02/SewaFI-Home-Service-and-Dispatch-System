import { Button } from '../Button/Button';

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="surface-card flex min-h-[220px] flex-col items-center justify-center rounded-[1.75rem] p-8 text-center">
      <div className="mb-4 h-16 w-16 rounded-full bg-primary/10" />
      <h3 className="font-display text-2xl text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
