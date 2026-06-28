import { parseDate, isToday } from '../storage';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

interface Props {
  dateStr: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenCalendar: () => void;
  onGoToday: () => void;
}

export default function DateBar({ dateStr, onPrev, onNext, onOpenCalendar, onGoToday }: Props) {
  const date = parseDate(dateStr);
  const today = isToday(dateStr);
  const weekday = WEEKDAYS[date.getDay()];

  const label = today
    ? `今日（${date.getMonth() + 1}月${date.getDate()}日）`
    : `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekday}）`;

  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="flex items-center justify-between px-2 py-3">
        <button
          onClick={onPrev}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-xl"
        >
          ◀
        </button>

        <button
          onClick={onOpenCalendar}
          className="flex-1 text-center font-medium text-gray-800 text-base py-1"
        >
          {label}
        </button>

        <button
          onClick={onNext}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-xl"
        >
          ▶
        </button>
      </div>

      {!today && (
        <div className="flex justify-center pb-2">
          <button
            onClick={onGoToday}
            className="text-sm px-4 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
          >
            今日へ戻る
          </button>
        </div>
      )}
    </div>
  );
}
