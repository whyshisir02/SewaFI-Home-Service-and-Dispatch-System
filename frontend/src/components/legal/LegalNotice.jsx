import { AlertCircle } from 'lucide-react';
import { Container } from '../ui/Layout/Container';

export function LegalNotice({ text }) {
  return (
    <section className="pb-2">
      <Container>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-[var(--sf-text-main)]">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span>{text}</span>
          </p>
        </div>
      </Container>
    </section>
  );
}

export default LegalNotice;

