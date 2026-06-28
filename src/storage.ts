import type { DayData } from './types';

const KEY_PREFIX = 'daily-schedule-';

export function getDayData(dateStr: string): DayData {
  const raw = localStorage.getItem(KEY_PREFIX + dateStr);
  if (raw) return JSON.parse(raw);
  return {
    date: dateStr,
    schedules: [],
    tasks: [],
    reflection: '',
    rating: 0,
  };
}

export function saveDayData(data: DayData): void {
  localStorage.setItem(KEY_PREFIX + data.date, JSON.stringify(data));
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, delta: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + delta);
  return formatDate(d);
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}
