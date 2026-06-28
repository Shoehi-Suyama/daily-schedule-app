import { useState, useRef } from 'react';
import { formatDate, addDays, isToday, getDayData, saveDayData } from './storage';
import type { DayData, ScheduleItem } from './types';
import DateBar from './components/DateBar';
import CalendarPicker from './components/CalendarPicker';
import Timeline from './components/Timeline';
import TaskList from './components/TaskList';
import Reflection from './components/Reflection';
import ScheduleModal from './components/ScheduleModal';

function App() {
  const [dateStr, setDateStr] = useState(() => formatDate(new Date()));
  const [dayData, setDayData] = useState<DayData>(() => getDayData(formatDate(new Date())));
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  function navigateTo(newDate: string) {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setDateStr(newDate);
    setDayData(getDayData(newDate));
    setTimeout(() => { isAnimating.current = false; }, 300);
  }

  function updateDayData(partial: Partial<DayData>) {
    setDayData(prev => {
      const next = { ...prev, ...partial };
      saveDayData(next);
      return next;
    });
  }

  function handleAddSchedule(item: ScheduleItem) {
    const schedules = [...dayData.schedules, item];
    updateDayData({ schedules });
    setEditingSchedule(item);
    setShowScheduleModal(true);
  }

  const todayFlag = isToday(dateStr);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100 flex flex-col select-none">
      <DateBar
        dateStr={dateStr}
        onPrev={() => navigateTo(addDays(dateStr, -1))}
        onNext={() => navigateTo(addDays(dateStr, 1))}
        onOpenCalendar={() => setShowCalendar(true)}
        onGoToday={() => navigateTo(formatDate(new Date()))}
      />

      <div className="flex-1 overflow-y-auto pb-6">
        <Timeline
          schedules={dayData.schedules}
          isToday={todayFlag}
          scrollRef={timelineRef}
          onEditSchedule={item => { setEditingSchedule(item); setShowScheduleModal(true); }}
          onUpdateSchedule={item => updateDayData({ schedules: dayData.schedules.map(s => s.id === item.id ? item : s) })}
          onAddSchedule={handleAddSchedule}
        />
        <TaskList
          tasks={dayData.tasks}
          onChange={tasks => updateDayData({ tasks })}
        />
        <Reflection
          reflection={dayData.reflection}
          rating={dayData.rating}
          onReflectionChange={reflection => updateDayData({ reflection })}
          onRatingChange={rating => updateDayData({ rating })}
        />
      </div>

      {showCalendar && (
        <CalendarPicker
          selectedDate={dateStr}
          onSelect={navigateTo}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          initial={editingSchedule ?? undefined}
          onSave={item => {
            const schedules = dayData.schedules.map(s => s.id === item.id ? item : s);
            updateDayData({ schedules });
          }}
          onDelete={id => updateDayData({ schedules: dayData.schedules.filter(s => s.id !== id) })}
          onClose={() => { setShowScheduleModal(false); setEditingSchedule(null); }}
        />
      )}
    </div>
  );
}

export default App;
