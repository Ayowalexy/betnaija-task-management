function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function to12Hour(value: string): string {
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(hour12)}:${pad(m)} ${period}`;
}

export interface SelectOption {
  value: string;
  label: string;
}

const WORK_HOURS_START = 7; // 7:00 AM
const WORK_HOURS_END = 20; // 8:00 PM

/** Start-time choices in 15-minute increments within work hours (7:00 AM - 8:00 PM), e.g. "09:15" -> "09:15 AM". */
export const START_TIME_OPTIONS: SelectOption[] = Array.from(
  { length: (WORK_HOURS_END - WORK_HOURS_START) * 4 + 1 },
  (_, i) => {
    const totalQuarterHours = WORK_HOURS_START * 4 + i;
    const value = `${pad(Math.floor(totalQuarterHours / 4))}:${pad((totalQuarterHours % 4) * 15)}`;
    return { value, label: to12Hour(value) };
  },
);

/** Duration choices, in minutes, used to derive the end time from the selected start time. */
export const DURATION_OPTIONS: SelectOption[] = [
  { value: '10', label: '10 mins' },
  { value: '15', label: '15 mins' },
  { value: '30', label: '30 mins' },
  { value: '45', label: '45 mins' },
  { value: '60', label: '1 hr' },
  { value: '90', label: '1 hr 30 mins' },
  { value: '120', label: '2 hrs' },
  { value: '180', label: '3 hrs' },
  { value: '240', label: '4 hrs' },
  { value: '480', label: '8 hrs' },
];

/** Adds `durationMinutes` to a "HH:mm" start time, clamped to the same day (23:59 max). */
export function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = Math.min(h * 60 + m + durationMinutes, 23 * 60 + 59);
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

export function formatTimeLabel(value: string): string {
  return value ? to12Hour(value) : '';
}
