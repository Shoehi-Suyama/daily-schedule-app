import { useRef, useEffect, useState, useCallback } from 'react';
import type { ScheduleItem } from '../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour
const SNAP_MINUTES = 15;

interface Props {
  schedules: ScheduleItem[];
  isToday: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onEditSchedule: (item: ScheduleItem) => void;
  onUpdateSchedule: (item: ScheduleItem) => void;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const snapped = Math.round(clamped / SNAP_MINUTES) * SNAP_MINUTES;
  const h = Math.floor(snapped / 60) % 24;
  const m = snapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type DragEdge = 'top' | 'bottom';

export default function Timeline({ schedules, isToday, scrollRef, onEditSchedule, onUpdateSchedule }: Props) {
  const nowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    id: string;
    edge: DragEdge;
    startY: number;
    originalMinutes: number;
  } | null>(null);
  const didDrag = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localSchedules, setLocalSchedules] = useState(schedules);
  const localSchedulesRef = useRef(localSchedules);

  useEffect(() => { setLocalSchedules(schedules); }, [schedules]);
  useEffect(() => { localSchedulesRef.current = localSchedules; }, [localSchedules]);

  useEffect(() => {
    if (isToday && nowRef.current) {
      nowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isToday]);

  const getClientY = (e: MouseEvent | TouchEvent) =>
    'touches' in e ? e.touches[0].clientY : e.clientY;

  const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    e.preventDefault();

    const dy = getClientY(e) - ds.startY;
    if (Math.abs(dy) > 5) didDrag.current = true;
    const deltaMinutes = Math.round((dy / HOUR_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;
    const newMinutes = ds.originalMinutes + deltaMinutes;

    setLocalSchedules(prev => prev.map(s => {
      if (s.id !== ds.id) return s;
      if (ds.edge === 'top') {
        const endMin = timeToMinutes(s.endTime);
        const startMin = Math.min(newMinutes, endMin - SNAP_MINUTES);
        return { ...s, startTime: minutesToTime(startMin) };
      } else {
        const startMin = timeToMinutes(s.startTime);
        const endMin = Math.max(newMinutes, startMin + SNAP_MINUTES);
        return { ...s, endTime: minutesToTime(endMin) };
      }
    }));
  }, []);

  const onDragEnd = useCallback(() => {
    const ds = dragState.current;
    if (!ds) return;
    dragState.current = null;
    setDraggingId(null);

    const updated = localSchedulesRef.current.find(s => s.id === ds.id);
    if (updated) onUpdateSchedule(updated);

    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('touchmove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchend', onDragEnd);
  }, [onUpdateSchedule, onDragMove]);

  function startDrag(e: React.MouseEvent | React.TouchEvent, id: string, edge: DragEdge) {
    e.stopPropagation();
    e.preventDefault();
    didDrag.current = false;
    const item = localSchedules.find(s => s.id === id)!;
    const originalMinutes = edge === 'top'
      ? timeToMinutes(item.startTime)
      : timeToMinutes(item.endTime);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragState.current = { id, edge, startY: clientY, originalMinutes };
    setDraggingId(id);

    window.addEventListener('mousemove', onDragMove, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div ref={scrollRef} className="overflow-y-auto bg-white rounded-xl mx-3 my-2 shadow-sm" style={{ maxHeight: '55vh' }}>
      <div ref={containerRef} className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
        {HOURS.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-gray-100 flex"
            style={{ top: h * HOUR_HEIGHT }}
          >
            <span className="text-xs text-gray-400 w-12 text-right pr-2 -translate-y-2 select-none">
              {String(h).padStart(2, '0')}:00
            </span>
            <div className="flex-1 border-l border-gray-100" />
          </div>
        ))}

        {localSchedules.map(item => {
          const startMin = timeToMinutes(item.startTime);
          const endMin = timeToMinutes(item.endTime);
          const top = (startMin / 60) * HOUR_HEIGHT;
          const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20);
          const isDragging = draggingId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => { if (!didDrag.current) onEditSchedule(item); }}
              className="absolute left-14 right-2 rounded-lg text-white text-sm overflow-visible"
              style={{
                top,
                height,
                backgroundColor: item.color,
                opacity: isDragging ? 0.85 : 1,
                zIndex: isDragging ? 10 : 1,
              }}
            >
              {/* 上ハンドル */}
              <div
                onMouseDown={e => startDrag(e, item.id, 'top')}
                onTouchStart={e => startDrag(e, item.id, 'top')}
                className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize touch-none"
              >
                <div className="w-8 h-1 rounded-full bg-white/60" />
              </div>

              <div className="px-2 pt-4 pb-4">
                <div className="font-medium truncate">{item.title}</div>
                <div className="text-xs opacity-80">{item.startTime}〜{item.endTime}</div>
              </div>

              {/* 下ハンドル */}
              <div
                onMouseDown={e => startDrag(e, item.id, 'bottom')}
                onTouchStart={e => startDrag(e, item.id, 'bottom')}
                className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize touch-none"
              >
                <div className="w-8 h-1 rounded-full bg-white/60" />
              </div>
            </div>
          );
        })}

        {isToday && (
          <div
            ref={nowRef}
            className="absolute left-12 right-0 flex items-center"
            style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 -translate-x-1" />
            <div className="flex-1 border-t-2 border-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}
