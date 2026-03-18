import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Task, Category } from '../types';
import { Clock, Plus } from 'lucide-react';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 10 PM
const SLOT_HEIGHT = 64; // px per hour

// Category color map — complete class strings for CDN Tailwind
const GRID_TASK_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue:   { bg: 'bg-blue-50',    border: 'border-l-blue-400 border-blue-200',    text: 'text-blue-900',   dot: 'bg-blue-400' },
  green:  { bg: 'bg-emerald-50', border: 'border-l-emerald-400 border-emerald-200', text: 'text-emerald-900', dot: 'bg-emerald-400' },
  orange: { bg: 'bg-orange-50',  border: 'border-l-orange-400 border-orange-200',  text: 'text-orange-900', dot: 'bg-orange-400' },
  purple: { bg: 'bg-violet-50',  border: 'border-l-violet-400 border-violet-200',  text: 'text-violet-900', dot: 'bg-violet-400' },
  red:    { bg: 'bg-rose-50',    border: 'border-l-rose-400 border-rose-200',      text: 'text-rose-900',   dot: 'bg-rose-400' },
  yellow: { bg: 'bg-yellow-50',  border: 'border-l-yellow-400 border-yellow-200',  text: 'text-yellow-900', dot: 'bg-yellow-400' },
  pink:   { bg: 'bg-pink-50',    border: 'border-l-pink-400 border-pink-200',      text: 'text-pink-900',   dot: 'bg-pink-400' },
  gray:   { bg: 'bg-stone-100',  border: 'border-l-stone-400 border-stone-200',    text: 'text-stone-800',  dot: 'bg-stone-400' },
};
const DEFAULT_TASK_STYLE = { bg: 'bg-indigo-50', border: 'border-l-indigo-400 border-indigo-200', text: 'text-indigo-900', dot: 'bg-indigo-400' };

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ─── Current Time Line ───────────────────────────────────────────────────────

const CurrentTimeLine: React.FC = () => {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h < 5 || h > 22) { setTop(null); return; }
      setTop(((h - 5) + m / 60) * SLOT_HEIGHT);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, []);

  if (top === null) return null;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm flex-shrink-0 ml-9" />
      <div className="flex-1 h-px bg-red-400 opacity-70" />
    </div>
  );
};

// ─── Droppable Hour Slot ──────────────────────────────────────────────────────

interface TimeSlotProps {
  dateStr: string;
  hour: number;
  onMouseDown: (hour: number, minutes: number) => void;
  children?: React.ReactNode;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ dateStr, hour, onMouseDown, children }) => {
  const slotId = `${dateStr}::${hour.toString().padStart(2, '0')}`;
  const { setNodeRef, isOver } = useDroppable({ id: slotId });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking on a task block
    if ((e.target as HTMLElement).closest('[data-task-block]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const snappedMinutes = Math.floor((offsetY / SLOT_HEIGHT) * 4) * 15;
    onMouseDown(hour, Math.min(45, snappedMinutes));
  };

  return (
    <div
      ref={setNodeRef}
      onMouseDown={handleMouseDown}
      className={`relative border-b border-stone-100 flex transition-colors ${
        isOver ? 'bg-indigo-50/70' : 'hover:bg-stone-50/60'
      } cursor-crosshair`}
      style={{ height: SLOT_HEIGHT }}
    >
      {/* Hour label */}
      <div className="w-12 flex-shrink-0 text-[10px] font-medium text-stone-400 pt-1.5 pr-3 text-right select-none border-r border-stone-100">
        {formatHour(hour)}
      </div>

      {/* Slot content */}
      <div className="flex-1 relative">
        {/* Half-hour dashed line */}
        <div className="absolute top-1/2 left-0 right-0 border-t border-stone-100 border-dashed pointer-events-none" />
        {/* Drop highlight */}
        {isOver && (
          <div className="absolute inset-0 border-2 border-indigo-300 border-dashed rounded-r-md pointer-events-none opacity-60" />
        )}
        {children}
      </div>
    </div>
  );
};

// ─── Grid Task Block ──────────────────────────────────────────────────────────

interface GridTaskProps {
  task: Task;
  category?: Category;
  onEdit: (t: Task) => void;
}

const GridTask: React.FC<GridTaskProps> = ({ task, category, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'Task', task, fromGrid: true },
  });

  const heightPx = Math.max(28, (task.duration / 60) * SLOT_HEIGHT);
  const [, minStr] = (task.startTime || '00:00').split(':');
  const topOffset = (parseInt(minStr, 10) / 60) * SLOT_HEIGHT;

  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  const styles = category ? (GRID_TASK_STYLES[category.color] ?? DEFAULT_TASK_STYLE) : DEFAULT_TASK_STYLE;

  if (isDragging) return null;

  const showDetails = heightPx >= 40;

  return (
    <div
      data-task-block
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={e => { e.stopPropagation(); onEdit(task); }}
      style={{ ...dragStyle, height: `${heightPx}px`, top: `${topOffset}px` }}
      className={`absolute left-1 right-1 rounded-md border border-l-4 px-2 py-1 text-[11px] overflow-hidden cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow z-10 ${styles.bg} ${styles.border}`}
    >
      <div className={`font-semibold truncate leading-snug ${styles.text} ${task.completed ? 'line-through opacity-60' : ''}`}>
        {task.title}
      </div>
      {showDetails && (
        <div className={`flex items-center gap-1 mt-0.5 opacity-70 ${styles.text}`}>
          <Clock size={9} />
          <span className="text-[10px]">{formatDuration(task.duration)}</span>
          {task.startTime && <span className="text-[10px] ml-1">{task.startTime}</span>}
        </div>
      )}
    </div>
  );
};

// ─── Selection Overlay ────────────────────────────────────────────────────────

interface SelectionState {
  startHour: number;
  startMin: number;
  currentHour: number;
  currentMin: number;
}

const SelectionOverlay: React.FC<{ sel: SelectionState }> = ({ sel }) => {
  const startTotal = sel.startHour * 60 + sel.startMin;
  const currentTotal = sel.currentHour * 60 + sel.currentMin;
  const top = ((startTotal - 5 * 60) / 60) * SLOT_HEIGHT;
  const height = Math.max(SLOT_HEIGHT / 4, ((currentTotal - startTotal) / 60) * SLOT_HEIGHT);
  const duration = Math.max(15, currentTotal - startTotal);

  return (
    <div
      style={{ top: `${top}px`, height: `${height}px` }}
      className="absolute left-14 right-1 bg-indigo-500/10 border-2 border-indigo-500 border-dashed rounded-lg z-20 pointer-events-none flex items-center justify-center"
    >
      {height >= 24 && (
        <div className="bg-indigo-600 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow flex items-center gap-1">
          <Plus size={11} strokeWidth={2.5} />
          New task · {formatDuration(duration)}
        </div>
      )}
    </div>
  );
};

// ─── Main TimeGrid ────────────────────────────────────────────────────────────

interface TimeGridProps {
  dateStr: string;
  tasks: Task[];
  categories: Category[];
  onEditTask: (task: Task) => void;
  onCreateAtTime?: (dateStr: string, startTime: string, duration: number) => void;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
  dateStr, tasks, categories, onEditTask, onCreateAtTime
}) => {
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c])),
    [categories]
  );

  const handleMouseDown = (hour: number, minutes: number) => {
    setSelection({ startHour: hour, startMin: minutes, currentHour: hour, currentMin: minutes + 30 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selection || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const totalMinutes = (offsetY / SLOT_HEIGHT) * 60 + 5 * 60;
    const hour = Math.floor(totalMinutes / 60);
    const min = Math.floor((totalMinutes % 60) / 15) * 15;
    setSelection(prev => prev ? { ...prev, currentHour: Math.min(22, hour), currentMin: min } : null);
  };

  const handleMouseUp = () => {
    if (!selection || !onCreateAtTime) { setSelection(null); return; }
    const startTotal = selection.startHour * 60 + selection.startMin;
    const currentTotal = selection.currentHour * 60 + selection.currentMin;
    const startTime = `${String(selection.startHour).padStart(2, '0')}:${String(selection.startMin).padStart(2, '0')}`;
    const duration = Math.max(15, currentTotal - startTotal);
    onCreateAtTime(dateStr, startTime, duration);
    setSelection(null);
  };

  useEffect(() => {
    if (!selection) return;
    const up = () => handleMouseUp();
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [selection]);

  return (
    <div
      ref={gridRef}
      className="relative select-none bg-white pb-8"
      onMouseMove={handleMouseMove}
    >
      <CurrentTimeLine />
      {selection && <SelectionOverlay sel={selection} />}

      {HOURS.map(hour => {
        const prefix = String(hour).padStart(2, '0');
        const hourTasks = tasks.filter(t => t.startTime?.startsWith(`${prefix}:`));
        return (
          <TimeSlot key={hour} dateStr={dateStr} hour={hour} onMouseDown={handleMouseDown}>
            {hourTasks.map(task => (
              <GridTask
                key={task.id}
                task={task}
                category={task.categoryId ? categoryMap[task.categoryId] : undefined}
                onEdit={onEditTask}
              />
            ))}
          </TimeSlot>
        );
      })}
    </div>
  );
};
