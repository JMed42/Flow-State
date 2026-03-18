
import React from 'react';
import { Task, Category } from '../types';
import { Repeat, Clock, Tag, Edit2, Trash2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RecurrenceDashboardProps {
  tasks: Task[];
  categories: Category[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const RecurrenceDashboard: React.FC<RecurrenceDashboardProps> = ({
  tasks,
  categories,
  onEditTask,
  onDeleteTask
}) => {
  // Filter for tasks that are "master" recurring tasks or have recurrence set
  // To avoid seeing multiple instances of the same recurring rule, we group by recurrenceGroupId
  // Explicitly typing the accumulator and the initial value to ensure proper inference.
  const recurringTasksMap = tasks.reduce((acc: Map<string, Task>, task: Task) => {
    if (task.recurrence && task.recurrence !== 'none' && task.recurrenceGroupId) {
      // Keep the "latest" instance (one that hasn't been completed or has furthest date)
      const existing = acc.get(task.recurrenceGroupId);
      if (!existing || (!task.completed && existing.completed) || (task.scheduledDate || '') > (existing.scheduledDate || '')) {
        acc.set(task.recurrenceGroupId, task);
      }
    }
    return acc;
  }, new Map<string, Task>());

  // Explicitly typing recurringTasks as Task[] to resolve 'Property does not exist on type unknown' errors.
  const recurringTasks: Task[] = Array.from(recurringTasksMap.values());

  const getRecurrenceLabel = (pattern: string) => {
    return pattern.charAt(0).toUpperCase() + pattern.slice(1);
  };

  const getCategory = (catId?: string) => categories.find(c => c.id === catId);

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
          <Repeat size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recurring Tasks</h1>
          <p className="text-gray-500 text-sm">Manage tasks that repeat automatically</p>
        </div>
      </div>

      <div className="space-y-4">
        {recurringTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Repeat size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">No recurring tasks planned yet.</p>
            <p className="text-sm text-gray-400">Set a recurrence pattern when creating or editing a task.</p>
          </div>
        ) : (
          recurringTasks.map(task => {
            const cat = getCategory(task.categoryId);
            return (
              <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 flex-shrink-0">
                    <Repeat size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {getRecurrenceLabel(task.recurrence!)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {task.duration}m
                      </div>
                      {task.scheduledDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={12} />
                          Next: {format(parseISO(task.scheduledDate), 'MMM d')}
                        </div>
                      )}
                      {cat && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Tag size={12} />
                          {cat.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEditTask(task)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
