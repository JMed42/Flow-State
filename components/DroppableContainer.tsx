import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, Category, DailyMeals } from '../types';
import { TaskCard } from './TaskCard';
import { TimeGrid } from './TimeGrid';
import { MealSummary } from './MealSummary';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

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
  compactMode = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [allDayExpanded, setAllDayExpanded] = useState(true);

  // Determine which tasks to show and how
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
    allDayTasks = tasks.filter(t => !t.startTime).sort((a, b) => a.order - b.order);
    scheduledTasks = tasks.filter(t => !!t.startTime);
    displayTasks = allDayTasks;
  }

  const pendingMinutes = tasks.filter(t => !t.completed).reduce((s, t) => s + t.duration, 0);
  const timeLabel = pendingMinutes > 0
    ? pendingMinutes >= 60
      ? `${Math.floor(pendingMinutes / 60)}h ${pendingMinutes % 60 ? `${pendingMinutes % 60}m` : ''}`
      : `${pendingMinutes}m`
    : null;

  const hasMeals = mealPlan && (mealPlan.breakfast.title || mealPlan.lunch.title || mealPlan.dinner.title);

  // ── Backlog / Inbox mode ────────────────────────────────────────────────────
  if (isBacklog) {
    return (
      <div
        ref={setNodeRef}
        className={`min-h-[80px] flex flex-col transition-colors rounded-xl ${
          isOver ? 'bg-indigo-50/60' : ''
        }`}
      >
        <SortableContext id={id} items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {displayTasks.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed transition-colors ${
              isOver ? 'border-indigo-300 bg-indigo-50' : 'border-stone-200'
            }`}>
              <span className="text-xs text-stone-400 font-medium">Drop tasks here</span>
            </div>
          ) : (
            displayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                categoryData={categories.find(c => c.id === task.categoryId)}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleComplete={onToggleComplete}
                onMoveStage={onMoveStage}
              />
            ))
          )}
        </SortableContext>
      </div>
    );
  }

  // ── Compact / Month mode ────────────────────────────────────────────────────
  if (compactMode) {
    return (
      <div className="flex flex-col h-full">
        {/* Date header */}
        <div className={`px-2 py-1.5 flex items-center justify-between border-b border-stone-100 flex-shrink-0 ${isToday ? 'bg-indigo-50/50' : ''}`}>
          <span className={`text-xs font-semibold ${isToday ? 'text-indigo-600' : 'text-stone-600'}`}>
            {title}
          </span>
          {timeLabel && (
            <span className="text-[10px] text-stone-400 font-medium">{timeLabel}</span>
          )}
        </div>

        <div
          ref={setNodeRef}
          className={`flex-1 p-1.5 space-y-0.5 overflow-hidden transition-colors ${isOver ? 'bg-indigo-50/40' : ''}`}
        >
          <SortableContext id={id} items={displayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {displayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                categoryData={categories.find(c => c.id === task.categoryId)}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleComplete={onToggleComplete}
                onMoveStage={onMoveStage}
              />
            ))}
          </SortableContext>
        </div>

        {compactMode && onEditMealPlan && (
          <div className="flex-shrink-0 border-t border-stone-100">
            <MealSummary meals={mealPlan} onClick={onEditMealPlan} compactMode />
          </div>
        )}
      </div>
    );
  }

  // ── Full Day Column (Today / Week) ──────────────────────────────────────────
  return (
    <div className={`flex flex-col h-full transition-colors ${isOver ? 'bg-indigo-50/20' : ''}`}>
      {/* Column header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${
        isToday ? 'bg-indigo-50/40 border-indigo-100' : 'bg-white border-stone-100'
      }`}>
        <div>
          <div className={`text-sm font-semibold ${isToday ? 'text-indigo-700' : 'text-stone-700'}`}>
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-stone-400 mt-0.5">{subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {timeLabel && (
            <span className="text-[11px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full font-medium">
              {timeLabel}
            </span>
          )}
          {extraHeader}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* All-day tasks section */}
        <div className="border-b border-stone-100 bg-stone-50/50">
          <button
            onClick={() => setAllDayExpanded(!allDayExpanded)}
            className="w-full px-4 py-2 flex items-center gap-2 text-[11px] font-medium text-stone-400 hover:text-stone-600 transition-colors"
          >
            <Layers size={12} />
            <span>Unscheduled ({allDayTasks.length})</span>
            {allDayTasks.length > 0 && (
              allDayExpanded ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />
            )}
          </button>

          {(allDayExpanded || allDayTasks.length === 0) && (
            <div
              ref={setNodeRef}
              className={`px-3 pb-3 space-y-1 min-h-[44px] transition-colors ${isOver ? 'bg-indigo-50/60' : ''}`}
            >
              <SortableContext id={id} items={allDayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {allDayTasks.length === 0 ? (
                  <div className={`h-10 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
                    isOver ? 'border-indigo-300' : 'border-stone-200'
                  }`}>
                    <span className="text-[10px] text-stone-300">Drag tasks here or click grid to create</span>
                  </div>
                ) : (
                  allDayTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      categoryData={categories.find(c => c.id === task.categoryId)}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onToggleComplete={onToggleComplete}
                      onMoveStage={onMoveStage}
                    />
                  ))
                )}
              </SortableContext>
            </div>
          )}
        </div>

        {/* Time grid */}
        <div className="relative bg-white">
          <TimeGrid
            dateStr={id}
            tasks={scheduledTasks}
            categories={categories}
            onEditTask={onEditTask}
            onCreateAtTime={onCreateAtTime}
          />
        </div>
      </div>

      {/* Meal summary footer */}
      {onEditMealPlan && (
        <div className="flex-shrink-0 border-t border-stone-100 shadow-sm">
          <MealSummary meals={mealPlan} onClick={onEditMealPlan} compactMode={false} />
        </div>
      )}
    </div>
  );
};
