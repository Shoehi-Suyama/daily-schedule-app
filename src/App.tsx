import { useState, useRef } from 'react';
import { formatDate, addDays, isToday, getDayData, saveDayData } from './storage';
import type { DayData } from './types';
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
  const [editingSchedule, setEditingSchedule] = useState<import('./types').ScheduleItem | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const isAnimating = useRef(false);

  function navigateTo(newDate: string) {
    if (isAnimating.current) return;
    isAnimating.current = true;
    const data = getDayData(newDate);
    setDateStr(newDate);
    setDayData(data);
    setTimeout(() => { isAnimating.current = false; }, 300);
  }

  function goToday() {
    const today = formatDate(new Date());
    navigateTo(today);
  }

  function updateDayData(partial: Partial<DayData>) {
    setDayData(prev => {
      const next = { ...prev, ...partial };
      saveDayData(next);
      return next;
    });
  }

  // Swipe handling
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) navigateTo(addDays(dateStr, 1));
    else navigateTo(addDays(dateStr, -1));
  }

  const todayFlag = isToday(dateStr);

  return (
    <div
      className="max-w-md mx-auto min-h-screen bg-gray-100 flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <DateBar
        dateStr={dateStr}
        onPrev={() => navigateTo(addDays(dateStr, -1))}
        onNext={() => navigateTo(addDays(dateStr, 1))}
        onOpenCalendar={() => setShowCalendar(true)}
        onGoToday={goToday}
      />

      <div className="flex-1 overflow-y-auto pb-24">
        <Timeline
          schedules={dayData.schedules}
          isToday={todayFlag}
          scrollRef={timelineRef}
          onEditSchedule={item => { setEditingSchedule(item); setShowScheduleModal(true); }}
          onUpdateSchedule={item => updateDayData({ schedules: dayData.schedules.map(s => s.id === item.id ? item : s) })}
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

      {/* FAB */}
      <button
        onClick={() => setShowScheduleModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-3xl rounded-full shadow-lg flex items-center justify-center z-20"
      >
        +
      </button>

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
            const schedules = editingSchedule
              ? dayData.schedules.map(s => s.id === item.id ? item : s)
              : [...dayData.schedules, item];
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
