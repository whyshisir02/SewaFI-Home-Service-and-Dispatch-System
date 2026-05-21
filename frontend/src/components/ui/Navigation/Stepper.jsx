import { Check } from 'lucide-react';
import { cn } from '../../../lib/cn';

export function Stepper({ steps = [], currentStep = 0 }) {
  return (
    <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      {steps.map((step, index) => {
        const complete = index < currentStep;
        const active = index === currentStep;
        return (
          <div key={step.title} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold',
                complete && 'border-secondary bg-secondary text-slate-950',
                active && 'border-primary bg-primary text-white',
                !complete && !active && 'border-border bg-surface text-muted'
              )}
            >
              {complete ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              <p className="text-xs text-muted">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;
