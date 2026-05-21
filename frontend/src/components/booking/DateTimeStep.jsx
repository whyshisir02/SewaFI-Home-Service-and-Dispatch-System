import { CalendarDays } from 'lucide-react';
import { BookingField, fieldClass, textareaClass } from './BookingField';

const TIME_WINDOWS = [
  { label: '7:00 AM - 8:00 AM', start: '07:00', end: '08:00' },
  { label: '8:00 AM - 9:00 AM', start: '08:00', end: '09:00' },
  { label: '9:00 AM - 10:00 AM', start: '09:00', end: '10:00' },
  { label: '10:00 AM - 11:00 AM', start: '10:00', end: '11:00' },
  { label: '11:00 AM - 12:00 PM', start: '11:00', end: '12:00' },
  { label: '12:00 PM - 1:00 PM', start: '12:00', end: '13:00' },
  { label: '1:00 PM - 2:00 PM', start: '13:00', end: '14:00' },
  { label: '2:00 PM - 3:00 PM', start: '14:00', end: '15:00' },
  { label: '3:00 PM - 4:00 PM', start: '15:00', end: '16:00' },
  { label: '4:00 PM - 5:00 PM', start: '16:00', end: '17:00' },
  { label: '5:00 PM - 6:00 PM', start: '17:00', end: '18:00' },
];

export function DateTimeStep({ values, errors, minDate, onChange, onBlur }) {
  const selectedWindow =
    values.preferredStartTime && values.preferredEndTime
      ? `${values.preferredStartTime}-${values.preferredEndTime}`
      : '';

  const handleWindowChange = (event) => {
    const value = event.target.value;

    if (!value) {
      onChange('preferredStartTime', '');
      onChange('preferredEndTime', '');
      return;
    }

    const [start, end] = value.split('-');

    onChange('preferredStartTime', start || '');
    onChange('preferredEndTime', end || '');
  };

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </span>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">
            Step 4
          </p>
          <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">
            Choose Date & Arrival Window
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <BookingField label="Preferred Date" required error={errors.preferredDate}>
          <input
            type="date"
            value={values.preferredDate}
            min={minDate}
            onChange={(event) => onChange('preferredDate', event.target.value)}
            onBlur={() => onBlur('preferredDate')}
            className={fieldClass}
          />
        </BookingField>

        <BookingField
          label="Preferred Arrival Window"
          required
          error={errors.preferredStartTime || errors.preferredEndTime}
        >
          <select
            value={selectedWindow}
            onChange={handleWindowChange}
            onBlur={() => {
              onBlur('preferredStartTime');
              onBlur('preferredEndTime');
            }}
            className={fieldClass}
          >
            <option value="">Select arrival window</option>

            {TIME_WINDOWS.map((window) => (
              <option
                key={`${window.start}-${window.end}`}
                value={`${window.start}-${window.end}`}
              >
                {window.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
            Provider may arrive anytime within this selected window after accepting.
          </p>
        </BookingField>
      </div>

      <BookingField label="Special Instructions" className="mt-5">
        <textarea
          value={values.specialInstructions}
          onChange={(event) => onChange('specialInstructions', event.target.value)}
          className={textareaClass}
          rows={4}
          maxLength={300}
          placeholder="Any access details, preferred communication, or important notes..."
        />
        <p className="mt-2 text-right text-xs font-semibold text-[var(--sf-text-muted)]">
          {values.specialInstructions.length}/300
        </p>
      </BookingField>
    </section>
  );
}

export default DateTimeStep;