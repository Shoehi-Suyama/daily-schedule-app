import { useRef, useEffect, useState, useCallback } from 'react';
import type { ScheduleItem } from '../types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour
const SNAP_MINUTES = 15;
const LONG_PRESS_MS = 500;

interface Props {
  schedules: ScheduleItem[];
  isToday: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onEditSchedule: (item: ScheduleItem) => void;
  onUpdateSchedule: (item: ScheduleItem) => void;
  onAddSchedule: (item: ScheduleItem) => void;
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

export default function Timeline({ schedules, isToday, scrollRef, onEditSchedule, onUpdateSchedule, onAddSchedule }: Props) {
  const nowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // リサイズドラッグ
  const dragState = useRef<{ id: string; edge: DragEdge; startY: number; originalMinutes: number } | null>(null);
  const didDrag = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localSchedules, setLocalSchedules] = useState(schedules);
  const localSchedulesRef = useRef(localSchedules);

  // 長押し
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressMoved = useRef(false);
  const [longPressY, setLongPressY] = useState<number | null>(null);

  useEffect(() => { setLocalSchedules(schedules); }, [schedules]);
  useEffect(() => { localSchedulesRef.current = localSchedules; }, [localSchedules]);

  useEffect(() => {
    if (isToday && scrollRef.current) {
      const el = scrollRef.current;
      const targetTop = (nowMinutes / 60) * HOUR_HEIGHT - el.clientHeight / 2;
      el.scrollTop = Math.max(0, targetTop);
    }
  }, [isToday]);

  // ---- リサイズドラッグ ----
  const getClientY = (e: MouseEvent | TouchEvent) =>
    'touches' in e ? e.touches[0].clientY : e.clientY;

  const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    e.preventDefault();
    const dy = getClientY(e) - ds.startY;
    if (Math.abs(dy) > 12) didDrag.current = true;
    const deltaMinutes = Math.round((dy / HOUR_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;
    const newMinutes = ds.originalMinutes + deltaMinutes;
    setLocalSchedules(prev => prev.map(s => {
      if (s.id !== ds.id) return s;
      if (ds.edge === 'top') {
        const endMin = timeToMinutes(s.endTime);
        return { ...s, startTime: minutesToTime(Math.min(newMinutes, endMin - SNAP_MINUTES)) };
      } else {
        const startMin = timeToMinutes(s.startTime);
        return { ...s, endTime: minutesToTime(Math.max(newMinutes, startMin + SNAP_MINUTES)) };
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
    const originalMinutes = edge === 'top' ? timeToMinutes(item.startTime) : timeToMinutes(item.endTime);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragState.current = { id, edge, startY: clientY, originalMinutes };
    setDraggingId(id);
    window.addEventListener('mousemove', onDragMove, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);
  }

  // ---- 長押しで予定追加 ----
  function getTouchMinutes(clientY: number): number {
    const el = scrollRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top + el.scrollTop;
    return Math.round((y / HOUR_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;
  }

  function handleBgTouchStart(e: React.TouchEvent) {
    longPressMoved.current = false;
    const clientY = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      if (longPressMoved.current) return;
      const startMin = Math.max(0, Math.min(23 * 60, getTouchMinutes(clientY)));
      const endMin = Math.min(24 * 60, startMin + 60);
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        title: '',
        startTime: minutesToTime(startMin),
        endTime: minutesToTime(endMin),
        color: '#3b82f6',
      };
      setLongPressY(clientY);
      onAddSchedule(newItem);
    }, LONG_PRESS_MS);
  }

  function handleBgTouchMove() {
    longPressMoved.current = true;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleBgTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressY(null);
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="relative mx-3 my-2">
      {/* タイムライン内FABボタン */}
      <button
        onClick={() => {
          const el = scrollRef.current;
          const scrollMid = el ? el.scrollTop + el.clientHeight / 2 : 9 * 60;
          const startMin = Math.round(scrollMid / HOUR_HEIGHT * 60 / SNAP_MINUTES) * SNAP_MINUTES;
          const endMin = Math.min(24 * 60, startMin + 60);
          onAddSchedule({
            id: Date.now().toString(),
            title: '',
            startTime: minutesToTime(startMin),
            endTime: minutesToTime(endMin),
            color: '#3b82f6',
          });
        }}
        className="absolute top-2 right-2 z-20 w-8 h-8 bg-blue-500 text-white rounded-full shadow flex items-center justify-center text-xl leading-none"
      >
        +
      </button>

      <div ref={scrollRef} className="overflow-y-auto bg-white rounded-xl shadow-sm" style={{ maxHeight: '72vh' }}>
        <div
          ref={containerRef}
          className="relative"
          style={{ height: HOUR_HEIGHT * 24 }}
          onTouchStart={handleBgTouchStart}
          onTouchMove={handleBgTouchMove}
          onTouchEnd={handleBgTouchEnd}
        >
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

          {/* 長押し中のフィードバック */}
          {longPressY !== null && (
            <div
              className="absolute left-12 right-0 border-t-2 border-blue-400 border-dashed pointer-events-none"
              style={{ top: getTouchMinutes(longPressY) / 60 * HOUR_HEIGHT }}
            />
          )}

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
                style={{ top, height, backgroundColor: item.color, opacity: isDragging ? 0.85 : 1, zIndex: isDragging ? 10 : 1 }}
              >
                <div
                  onMouseDown={e => startDrag(e, item.id, 'top')}
                  onTouchStart={e => startDrag(e, item.id, 'top')}
                  className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize touch-none"
                >
                  <div className="w-8 h-1 rounded-full bg-white/60" />
                </div>
                <div className="absolute inset-x-2 flex items-center gap-1 overflow-hidden" style={{ top: 8, bottom: 8 }}>
                  <span className="font-medium truncate flex-1 leading-tight text-xs">{item.title}</span>
                  <span className="text-xs opacity-80 shrink-0 leading-tight">{item.startTime}〜{item.endTime}</span>
                </div>
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
              style={{ top: (nowMinutes / 60) * HOUR_HEIGHT, zIndex: 20 }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -translate-x-1" />
              <div className="flex-1 border-t-2 border-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
