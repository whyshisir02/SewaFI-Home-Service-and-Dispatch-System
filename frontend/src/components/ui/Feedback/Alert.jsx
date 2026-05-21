import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { Badge } from '../DataDisplay/Badge';

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

export function Alert({ title, description, tone = 'info', action }) {
  const Icon = icons[tone] || Info;
  return (
    <div className="surface-card flex items-start gap-3 rounded-[1.5rem] p-4">
      <div className="rounded-2xl bg-surface-muted p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{title}</p>
          <Badge tone={tone === 'error' ? 'danger' : tone}>{tone}</Badge>
        </div>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
        {action}
      </div>
    </div>
  );
}

export default Alert;
