import { useState } from 'react';
import type { ScheduleItem } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
  initial?: ScheduleItem;
  onSave: (item: ScheduleItem) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function ScheduleModal({ initial, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [startTime, setStartTime] = useState(initial?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(initial?.endTime ?? '10:00');
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);

  const isEdit = !!initial;

  function submit() {
    if (!title.trim()) return;
    onSave({
      id: initial?.id ?? Date.now().toString(),
      title: title.trim(),
      startTime,
      endTime,
      color,
    });
    onClose();
  }

  function handleDelete() {
    if (initial && onDelete) {
      onDelete(initial.id);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">{isEdit ? '予定を編集' : '予定を追加'}</h2>
          {isEdit && onDelete && (
            <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-600 px-2 py-1">
              削除
            </button>
          )}
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="タイトル"
          autoFocus
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 mb-3"
        />

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 shrink-0">開始</span>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="flex-1 min-w-0 outline-none bg-transparent" />
          </div>
          <span className="text-gray-400 shrink-0">〜</span>
          <div className="flex items-center gap-2 flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 shrink-0">終了</span>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="flex-1 min-w-0 outline-none bg-transparent" />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            キャンセル
          </button>
          <button onClick={submit} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600">
            {isEdit ? '保存' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
