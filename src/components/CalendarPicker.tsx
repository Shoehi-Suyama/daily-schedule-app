import { useState } from 'react';
import { parseDate, formatDate } from '../storage';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

interface Props {
  selectedDate: string;
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

export default function CalendarPicker({ selectedDate, onSelect, onClose }: Props) {
  const sel = parseDate(selectedDate);
  const [viewYear, setViewYear] = useState(sel.getFullYear());
  const [viewMonth, setViewMonth] = useState(sel.getMonth());

  const today = formatDate(new Date());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 w-80" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">◀</button>
          <span className="font-medium text-gray-800">{viewYear}年{viewMonth + 1}月</span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">▶</button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-center text-xs py-1 font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = formatDate(new Date(viewYear, viewMonth, day));
            const isSelected = dateStr === selectedDate;
            const isTodayCell = dateStr === today;
            const col = idx % 7;
            return (
              <button
                key={idx}
                onClick={() => { onSelect(dateStr); onClose(); }}
                className={`
                  w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm
                  ${isSelected ? 'bg-blue-500 text-white' : isTodayCell ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}
                  ${col === 0 && !isSelected ? 'text-red-500' : ''}
                  ${col === 6 && !isSelected ? 'text-blue-500' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
          キャンセル
        </button>
      </div>
    </div>
  );
}
