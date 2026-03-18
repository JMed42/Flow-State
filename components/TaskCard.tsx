import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Category } from '../types';
import { Check, Clock, Edit2, Trash2, GripVertical, Archive, ArrowUpRight } from 'lucide-react';

// Full Tailwind class strings (not interpolated) for CDN compatibility
const CATEGORY_ACCENT: Record<string, string> = {
  blue:   'border-l-blue-400',
  green:  'border-l-emerald-400',
  orange: 'border-l-orange-400',
  purple: 'border-l-violet-400',
  red:    'border-l-rose-400',
  yellow: 'border-l-yellow-400',
  pink:   'border-l-pink-400',
  gray:   'border-l-stone-400',
};

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-stone-300',
};

interface TaskCardProps {
  task: Task;
  categoryData?: Category;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onMoveStage?: (id: string, newStage: 'backlog' | 'staging') => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task, categoryData, onEdit, onDelete, onToggleComplete, onMoveStage
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const accentClass = categoryData ? (CATEGORY_ACCENT[categoryData.color] ?? 'border-l-indigo-400') : 'border-l-indigo-400';

  // Ghost placeholder while dragging
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[52px] rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/40 mb-1.5"
      />
    );
  }

  const isUnscheduled = !task.scheduledDate;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-lg border border-stone-200 border-l-4 ${accentClass} shadow-sm hover:shadow-md transition-all duration-150 mb-1.5 ${task.completed ? 'opacity-55' : ''}`}
    >
      {/* Main draggable area */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Drag handle */}
        <GripVertical
          size={13}
          className="text-stone-300 group-hover:text-stone-400 flex-shrink-0 transition-colors"
        />

        {/* Complete checkbox */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onToggleComplete(task.id)}
          className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-stone-300 hover:border-indigo-400 bg-white'
          }`}
        >
          {task.completed && <Check size={9} strokeWidth={3} className="text-white" />}
        </button>

        {/* Title */}
        <span
          className={`flex-1 text-sm min-w-0 truncate leading-snug ${
            task.completed ? 'line-through text-stone-400' : 'text-stone-800'
          }`}
        >
          {task.title}
        </span>

        {/* Duration pill */}
        <span className="flex-shrink-0 flex items-center gap-1 text-[11px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md font-medium">
          <Clock size={9} />
          {formatDuration(task.duration)}
        </span>

        {/* Priority dot */}
        <span
          className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`}
          title={`${task.priority} priority`}
        />
      </div>

      {/* Hover action bar */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white shadow-md border border-stone-200 rounded-lg p-0.5 z-20">
        {isUnscheduled && onMoveStage && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onMoveStage(task.id, task.stage === 'staging' ? 'backlog' : 'staging')}
            className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title={task.stage === 'staging' ? 'Archive to backlog' : 'Promote to staging'}
          >
            {task.stage === 'staging' ? <Archive size={12} /> : <ArrowUpRight size={12} />}
          </button>
        )}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onEdit(task)}
          className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="Edit"
        >
          <Edit2 size={12} />
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
