import { Card } from '../../../components/ui/Layout/Card';

const getMethodLabel = (method) =>
  String(method || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function PaymentMethodSelector({ methods = [], value, onChange, unavailable }) {
  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-base font-bold text-[var(--sf-text-main)]">Payment Method</h2>

      {unavailable ? (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">Online payment methods are not available yet. Manual confirmation is supported.</p>
      ) : methods.length ? (
        <div className="mt-3 space-y-2">
          {methods.map((method) => (
            <label
              key={method}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-2 text-sm text-[var(--sf-text-main)]"
            >
              <input
                type="radio"
                name="paymentMethod"
                className="h-4 w-4"
                checked={value === method}
                onChange={() => onChange(method)}
              />
              <span>{getMethodLabel(method)}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">
          Payment can be handled after service completion according to the agreed service amount.
        </p>
      )}
    </Card>
  );
}

export default PaymentMethodSelector;
