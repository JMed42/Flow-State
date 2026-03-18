import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Category } from '../types';
import { Check, Clock, Edit2, Trash2, AlignLeft, ArrowRight, Archive, Tag } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  categoryData?: Category; // User defined category (Housework, etc)
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onMoveStage?: (id: string, newStage: 'backlog' | 'staging') => void;
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    high: 'bg-red-200 text-red-900 border-red-300',
    medium: 'bg-amber-200 text-amber-900 border-amber-300',
    low: 'bg-slate-200 text-slate-800 border-slate-300',
  };
  return (
    <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded border ${colors[priority as keyof typeof colors]}`}>
      {priority}
    </span>
  );
};

const CategoryBadge = ({ category }: { category: Category }) => {
  // Map simple color names to tailwind classes
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-200 text-blue-900 border-blue-300',
    green: 'bg-emerald-200 text-emerald-900 border-emerald-300',
    red: 'bg-rose-200 text-rose-900 border-rose-300',
    orange: 'bg-orange-200 text-orange-900 border-orange-300',
    purple: 'bg-purple-200 text-purple-900 border-purple-300',
    gray: 'bg-slate-200 text-slate-900 border-slate-300',
    yellow: 'bg-yellow-200 text-yellow-900 border-yellow-300',
    pink: 'bg-pink-200 text-pink-900 border-pink-300',
  };
  
  const style = colorMap[category.color] || colorMap.gray;
  
  return (
     <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${style}`}>
        <Tag size={8} />
        {category.name}
     </span>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, categoryData, onEdit, onDelete, onToggleComplete, onMoveStage }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-40 bg-indigo-100 border-2 border-indigo-500 border-dashed rounded-lg h-24 w-full"
      />
    );
  }

  const isUnscheduled = !task.scheduledDate;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border border-slate-300 rounded-lg shadow hover:shadow-md transition-all p-3 mb-3 ${task.completed ? 'opacity-70 bg-slate-50 border-slate-200' : 'border-slate-300 shadow-sm'}`}
    >
      {/* Drag Handle Area */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => onToggleComplete(task.id)}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.completed ? 'bg-green-600 border-green-700 text-white' : 'border-slate-400 hover:border-indigo-600 bg-white'
              }`}
            >
              {task.completed && <Check size={12} strokeWidth={4} />}
            </button>
            <h4 className={`font-bold text-sm text-slate-900 truncate ${task.completed ? 'line-through text-slate-500 font-medium' : ''}`}>
              {task.title}
            </h4>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
             <PriorityBadge priority={task.priority} />
             {categoryData && <CategoryBadge category={categoryData} />}
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 mt-2">
          {task.startTime && (
            <div className="flex items-center gap-1 text-indigo-800 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded shadow-sm">
              {task.startTime}
            </div>
          )}
          <div className="flex items-center gap-1" title="Duration">
            <Clock size={12} className="text-slate-500" />
            <span>{task.duration}m</span>
          </div>
          {task.description && (
             <div className="flex items-center gap-1 text-slate-500" title="Has notes">
              <AlignLeft size={12} />
            </div>
          )}
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 rounded-md backdrop-blur-sm shadow-md border border-slate-300 z-10 p-0.5">
        {isUnscheduled && onMoveStage && (
           <button 
             onClick={() => onMoveStage(task.id, task.stage === 'staging' ? 'backlog' : 'staging')}
             className="p-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-100 rounded transition-colors"
             title={task.stage === 'staging' ? "Move to Backlog" : "Move to Staging"}
           >
             {task.stage === 'staging' ? <Archive size={14} /> : <ArrowRight size={14} />}
           </button>
        )}
        <button 
          onClick={() => onEdit(task)} 
          className="p-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-100 rounded transition-colors"
        >
          <Edit2 size={14} />
        </button>
        <button 
          onClick={() => onDelete(task.id)} 
          className="p-1 text-slate-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};