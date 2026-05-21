import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Checkbox } from '../../../components/ui/Input/Checkbox';
import { providerScheduleSchema } from '../validators/provider.schema';

const WORKING_DAY_OPTIONS = [
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
];

export function ProviderScheduleForm({ initialValues, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(providerScheduleSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Checkbox label="Available for new bookings" {...register('availableToday')} />
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--sf-text-main)]">Working days</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {WORKING_DAY_OPTIONS.map((day) => (
            <Checkbox
              key={day.value}
              label={day.label}
              value={day.value}
              {...register('workingDays')}
            />
          ))}
        </div>
        {errors.workingDays?.message ? (
          <p className="mt-1 text-sm text-[var(--sf-danger)]">{errors.workingDays.message}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Start time" type="time" error={errors.startTime?.message} {...register('startTime')} />
        <Input label="End time" type="time" error={errors.endTime?.message} {...register('endTime')} />
      </div>
      <Button type="submit" loading={loading} disabled={loading}>
        Save schedule
      </Button>
    </form>
  );
}

export default ProviderScheduleForm;
