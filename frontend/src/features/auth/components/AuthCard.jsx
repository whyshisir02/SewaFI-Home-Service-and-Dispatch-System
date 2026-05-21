import { Card } from '../../../components/ui/Layout/Card';

export function AuthCard({ title, description, children }) {
  return (
    <Card className="rounded-[2rem] p-8">
      <h1 className="font-display text-3xl text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </Card>
  );
}

export default AuthCard;
