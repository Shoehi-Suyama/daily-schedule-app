export interface ScheduleItem {
  id: string;
  startTime: string; // "HH:MM"
  endTime: string;
  title: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
}

export interface DayData {
  date: string; // "YYYY-MM-DD"
  schedules: ScheduleItem[];
  tasks: Task[];
  reflection: string;
  rating: number; // 1-5
}
