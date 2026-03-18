
import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, Category, DailyMeals } from '../types';
import { TaskCard } from './TaskCard';
import { TimeGrid } from './TimeGrid';
import { MealSummary } from './MealSummary';
import { Utensils, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface DroppableContainerProps {
  id: string;
  title: string;
  tasks: Task[];
  categories: Category[];
  mealPlan?: DailyMeals;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onMoveStage?: (id: string, newStage: 'backlog' | 'staging') => void;
  onEditMealPlan?: () => void;
  onCreateAtTime?: (dateStr: string, startTime: string, duration: number) => void;
  isBacklog?: boolean;
  isToday?: boolean;
  subtitle?: string;
  extraHeader?: React.ReactNode;
  compactMode?: boolean;
}

export const DroppableContainer: React.FC<DroppableContainerProps> = ({ 
  id, 
  title, 
  tasks, 
  categories,
  mealPlan,
  onEditTask, 
  onDeleteTask, 
  onToggleComplete,
  onMoveStage,
  onEditMealPlan,
  onCreateAtTime,
  isBacklog = false,
  isToday = false,
  subtitle,
  extraHeader,
  compactMode = false
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [allDayExpanded, setAllDayExpanded] = useState(false);

  let displayTasks: Task[] = [];
  let scheduledTasks: Task[] = [];
  let allDayTasks: Task[] = [];

  if (compactMode || isBacklog) {
    displayTasks = [...tasks].sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return a.order - b.order;
    });
  } else {
    allDayTasks = tasks.filter(t => !t.startTime).sort((a,b) => a.order - b.order);
    scheduledTasks = tasks.filter(t => !!t.startTime);
    displayTasks = allDayTasks;
  }

  const totalDuration = tasks.filter(t => !t.completed).reduce((acc, t) => acc + t.duration, 0);
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;
  const timeString = `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;

  const hasMeals = mealPlan && (mealPlan.breakfast.title || mealPlan.lunch.title || mealPlan.dinner.title);

  return (
    <div className={`flex flex-col h-full rounded-xl overflow-hidden border-2 transition-colors ${
      isBacklog 
        ? 'bg-slate-100 border-slate-300' 
        : isOver 
          ? 'bg-indigo-100/50 border-indigo-500' 
          : 'bg-slate-50 border-transparent'
    }`}>
      <div className={`p-4 flex-shrink-0 flex justify-between items-center border-b ${isToday ? 'bg-indigo-100/30 border-indigo-200' : 'bg-slate-100 border-slate-200'}`}>
         <div className="flex flex-col">
            <h3 className={`font-black text-sm uppercase tracking-widest leading-none ${isToday ? 'text-indigo-900' : 'text-slate-700'}`}>
              {title}
            </h3>
            {subtitle && <span className="text-[11px] text-slate-500 font-black mt-1 uppercase tracking-wider">{subtitle}</span>}
         </div>
         <div className="flex items-center gap-2">
            {timeString !== '0m' && (
                <span className="text-[10px] font-black font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-sm">
                {timeString}
                </span>
            )}
            {compactMode && onEditMealPlan && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onEditMealPlan(); }}
                 className={`flex items-center gap-0.5 px-2 py-0.5 rounded border-2 transition-colors font-black ${
                    hasMeals 
                     ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' 
                     : 'text-slate-400 border-slate-300 hover:text-green-700 hover:bg-green-50 hover:border-green-600'
                 }`}
               >
                 <Utensils size={10} strokeWidth={3} />
                 <span className="text-[10px]">+</span>
               </button>
            )}
         </div>
         {extraHeader}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
        {!isBacklog && !compactMode ? (
          <div className="flex-shrink-0 border-b border-slate-200 bg-white/50">
            <button 
              onClick={() => setAllDayExpanded(!allDayExpanded)}
              className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-black text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100/40"
            >
              <div className="flex items-center gap-2 uppercase tracking-widest">
                <Layers size={14} className="text-slate-400" />
                <span>All Day Tasks ({allDayTasks.length})</span>
              </div>
              {allDayTasks.length > 0 && (allDayExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
            
            <div 
              ref={setNodeRef}
              className={`p-3 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
                allDayExpanded || allDayTasks.length === 0 ? 'max-h-[1000px] opacity-100' : 'max-h-24 overflow-hidden mask-fade'
              }`}
              style={(!allDayExpanded && allDayTasks.length > 1) ? { maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' } : {}}
            >
              <SortableContext id={id} items={allDayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {allDayTasks.length === 0 ? (
                  <div className="py-2 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest">No All-Day Tasks</div>
                ) : (
                  allDayTasks.map(task => (
                    <TaskCard key={task.id} task={task} categoryData={categories.find(c => c.id === task.categoryId)} onEdit={onEditTask} onDelete={onDeleteTask} onToggleComplete={onToggleComplete} onMoveStage={onMoveStage} />
                  ))
                )}
              </SortableContext>
            </div>
          </div>
        ) : (
          <div ref={setNodeRef} className="p-3 space-y-2 min-h-[60px] flex-1">
            <SortableContext id={id} items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {displayTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-200/50 border-2 border-dashed border-slate-300 rounded-xl m-2">
                  <span className="text-xs font-bold uppercase tracking-widest">{isBacklog ? 'Empty Backlog' : 'No Tasks'}</span>
                </div>
              ) : (
                displayTasks.map(task => (
                  <TaskCard key={task.id} task={task} categoryData={categories.find(c => c.id === task.categoryId)} onEdit={onEditTask} onDelete={onDeleteTask} onToggleComplete={onToggleComplete} onMoveStage={onMoveStage} />
                ))
              )}
            </SortableContext>
          </div>
        )}

        {!isBacklog && !compactMode && (
          <div className="relative bg-white flex-1 min-h-[400px]">
            <TimeGrid dateStr={id} tasks={scheduledTasks} onEditTask={onEditTask} onCreateAtTime={onCreateAtTime} />
          </div>
        )}
      </div>
      
      {!isBacklog && !compactMode && onEditMealPlan && (
        <div className="flex-shrink-0 border-t border-slate-200 shadow-lg">
          <MealSummary meals={mealPlan} onClick={onEditMealPlan} compactMode={compactMode} />
        </div>
      )}
    </div>
  );
};
