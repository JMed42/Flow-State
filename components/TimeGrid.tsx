import React, { useState, useRef, useEffect } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Task } from '../types';
import { Clock, Plus } from 'lucide-react';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
const SLOT_HEIGHT = 64; // px

interface TimeGridProps {
  dateStr: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onCreateAtTime?: (dateStr: string, startTime: string, duration: number) => void;
}

interface TimeSlotProps {
  dateStr: string;
  hour: number;
  onMouseDown: (hour: number, minutes: number) => void;
  children?: React.ReactNode;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ dateStr, hour, onMouseDown, children }) => {
  const slotId = `${dateStr}::${hour.toString().padStart(2, '0')}`;
  const { setNodeRef, isOver } = useDroppable({ id: slotId });

  const handleSlotMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minutes = Math.floor((offsetY / SLOT_HEIGHT) * 60);
    // Snap to 15m intervals for better UX
    const snappedMinutes = Math.floor(minutes / 15) * 15;
    onMouseDown(hour, snappedMinutes);
  };

  return (
    <div 
      ref={setNodeRef}
      onMouseDown={handleSlotMouseDown}
      className={`relative h-16 border-b border-slate-200 flex transition-colors ${
        isOver ? 'bg-indigo-100/50' : 'hover:bg-slate-50'
      } cursor-crosshair`}
    >
      <div className="w-12 flex-shrink-0 text-[11px] font-bold text-slate-500 p-1 text-right border-r border-slate-200 pr-2 pt-1 font-mono select-none bg-slate-50/30">
        {hour}:00
      </div>
      <div className="flex-1 relative">
        <div className="absolute top-1/2 left-0 w-full border-t border-slate-100 border-dashed pointer-events-none"></div>
        {children}
      </div>
    </div>
  );
};

const GridTask: React.FC<{ task: Task; onEdit: (t: Task) => void }> = ({ task, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'Task', task, fromGrid: true },
  });

  const heightPx = Math.max(32, (task.duration / 60) * SLOT_HEIGHT);
  const [_, minStr] = (task.startTime || "00:00").split(':');
  const minutes = parseInt(minStr, 10);
  const topOffset = (minutes / 60) * SLOT_HEIGHT;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  if (isDragging) return null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onEdit(task); }}
      style={{ ...style, height: `${heightPx}px`, top: `${topOffset}px` }}
      className={`absolute left-1 right-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold border-2 shadow flex flex-col justify-start overflow-hidden hover:brightness-95 transition-all z-10 cursor-grab active:cursor-grabbing ${
        task.completed 
          ? 'bg-slate-100 text-slate-600 border-slate-300' 
          : 'bg-indigo-200 text-indigo-950 border-indigo-400'
      }`}
    >
      <div className="truncate leading-tight mb-0.5">{task.title}</div>
      <div className="text-[10px] opacity-90 flex items-center gap-1 font-black"><Clock size={10} />{task.duration}m</div>
    </div>
  );
};

export const TimeGrid: React.FC<TimeGridProps> = ({ dateStr, tasks, onEditTask, onCreateAtTime }) => {
  const [selection, setSelection] = useState<{ startHour: number; startMin: number; currentHour: number; currentMin: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (hour: number, minutes: number) => {
    setSelection({ startHour: hour, startMin: minutes, currentHour: hour, currentMin: minutes + 30 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selection || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    
    // Total minutes since 6:00
    const totalMinutes = (offsetY / SLOT_HEIGHT) * 60;
    const hour = Math.floor(totalMinutes / 60) + 6;
    const min = Math.floor((totalMinutes % 60) / 15) * 15;

    setSelection(prev => prev ? { ...prev, currentHour: hour, currentMin: min } : null);
  };

  const handleMouseUp = () => {
    if (!selection || !onCreateAtTime) {
      setSelection(null);
      return;
    }

    const startTotal = selection.startHour * 60 + selection.startMin;
    const currentTotal = selection.currentHour * 60 + selection.currentMin;
    
    const startTime = `${selection.startHour.toString().padStart(2, '0')}:${selection.startMin.toString().padStart(2, '0')}`;
    const duration = Math.max(15, currentTotal - startTotal);

    onCreateAtTime(dateStr, startTime, duration);
    setSelection(null);
  };

  useEffect(() => {
    if (selection) {
      const up = () => handleMouseUp();
      window.addEventListener('mouseup', up);
      return () => window.removeEventListener('mouseup', up);
    }
  }, [selection]);

  const renderSelection = () => {
    if (!selection) return null;
    const startTotal = selection.startHour * 60 + selection.startMin;
    const currentTotal = selection.currentHour * 60 + selection.currentMin;
    
    const top = ((startTotal - 6 * 60) / 60) * SLOT_HEIGHT;
    const height = Math.max(15, (currentTotal - startTotal) / 60 * SLOT_HEIGHT);

    return (
      <div 
        style={{ top: `${top}px`, height: `${height}px` }}
        className="absolute left-14 right-1 bg-indigo-600/30 border-2 border-indigo-600 border-dashed rounded-lg z-20 pointer-events-none flex items-center justify-center"
      >
        <div className="bg-indigo-700 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1">
           <Plus size={12} strokeWidth={3} /> New Task ({Math.round(currentTotal - startTotal)}m)
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={gridRef} 
      className="pb-4 select-none relative bg-white"
      onMouseMove={handleMouseMove}
    >
      {renderSelection()}
      {HOURS.map(hour => {
        const hourPrefix = hour.toString().padStart(2, '0');
        const tasksInHour = tasks.filter(t => t.startTime?.startsWith(`${hourPrefix}:`));
        return (
          <TimeSlot key={hour} dateStr={dateStr} hour={hour} onMouseDown={handleMouseDown}>
            {tasksInHour.map(task => (
              <GridTask key={task.id} task={task} onEdit={onEditTask} />
            ))}
          </TimeSlot>
        );
      })}
    </div>
  );
};