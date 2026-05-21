import { z } from 'zod';

const HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WORKING_DAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const providerScheduleSchema = z.object({
  availableToday: z.boolean().default(true),
  workingDays: z
    .array(z.enum(WORKING_DAYS))
    .min(1, 'Select at least one working day'),
  startTime: z
    .string()
    .regex(HHMM_PATTERN, 'Start time must be in HH:mm format'),
  endTime: z
    .string()
    .regex(HHMM_PATTERN, 'End time must be in HH:mm format'),
}).refine(
  (values) => {
    const [startHour, startMinute] = values.startTime.split(':').map(Number);
    const [endHour, endMinute] = values.endTime.split(':').map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return end > start;
  },
  {
    path: ['endTime'],
    message: 'End time must be after start time',
  }
);
