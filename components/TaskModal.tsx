import React, { useState, useEffect } from 'react';
import { Task, Priority, Category, RecurrencePattern } from '../types';
import { X, Plus, Trash2, Calendar, Inbox, Layers, Repeat, Clock, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { suggestTaskTime } from '../services/geminiService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  editingTask?: Task | null;
  categories: Category[];
  tasks: Task[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const AVAILABLE_COLORS = ['blue', 'green', 'red', 'orange', 'purple', 'yellow', 'pink', 'gray'];

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingTask, 
  categories,
  tasks,
  onAddCategory,
  onDeleteCategory
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [duration, setDuration] = useState(30);
  const [stage, setStage] = useState<'backlog' | 'staging' | 'scheduled'>('staging');
  const [scheduledDate, setScheduledDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrencePattern>('none');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setDuration(editingTask.duration);
      setRecurrence(editingTask.recurrence || 'none');
      setStartTime(editingTask.startTime || '');
      
      if (editingTask.scheduledDate) {
        setStage('scheduled');
        setScheduledDate(editingTask.scheduledDate);
      } else {
        setStage(editingTask.stage);
      }
      setSelectedCategoryId(editingTask.categoryId || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDuration(30);
      setStage('staging');
      setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
      setStartTime('');
      setSelectedCategoryId('');
      setRecurrence('none');
    }
    setIsCreatingCategory(false);
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const handleSuggestTime = async () => {
    if (!title) {
      alert("Please enter a task title first so AI can contextualize the slot.");
      return;
    }
    setIsSuggesting(true);
    try {
      const suggestion = await suggestTaskTime({ title, priority, duration }, tasks, scheduledDate);
      setStartTime(suggestion.startTime);
      setStage('scheduled');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData: Partial<Task> = {
      id: editingTask?.id || undefined,
      title,
      description,
      priority,
      duration: Number(duration),
      categoryId: selectedCategoryId || undefined,
      recurrence: recurrence,
      recurrenceGroupId: editingTask?.recurrenceGroupId || (recurrence !== 'none' ? uuidv4() : undefined),
      startTime: startTime || undefined
    };

    if (stage === 'scheduled') {
      taskData.scheduledDate = scheduledDate;
      taskData.stage = 'staging'; 
    } else {
      taskData.scheduledDate = null;
      taskData.stage = stage;
      taskData.startTime = undefined;
    }

    onSave(taskData);
    onClose();
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory: Category = { id: uuidv4(), name: newCategoryName, color: newCategoryColor };
    onAddCategory(newCategory);
    setSelectedCategoryId(newCategory.id);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {editingTask?.id ? 'Edit Task' : 'Schedule New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto scrollbar-thin">
          <div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title"
              className="w-full text-2xl font-bold placeholder:text-gray-300 border-none focus:ring-0 p-0 text-gray-800"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Workflow State</label>
            <div className="grid grid-cols-3 gap-3">
               <button type="button" onClick={() => setStage('backlog')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${stage === 'backlog' ? 'bg-gray-100 border-gray-300 text-gray-800 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Layers size={16} /> Backlog</button>
               <button type="button" onClick={() => setStage('staging')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${stage === 'staging' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Inbox size={16} /> Staging</button>
               <button type="button" onClick={() => setStage('scheduled')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${stage === 'scheduled' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><Calendar size={16} /> Scheduled</button>
            </div>
          </div>

          {stage === 'scheduled' || isSuggesting ? (
             <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 animate-in zoom-in-95 duration-200 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-emerald-700 uppercase">Scheduling Details</label>
                  <button 
                    type="button" 
                    onClick={handleSuggestTime}
                    disabled={isSuggesting}
                    className="flex items-center gap-1 text-[10px] font-black bg-white border border-emerald-300 px-2 py-1 rounded-full text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSuggesting ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    {isSuggesting ? "Analyzing..." : "Suggest Time"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Date</label>
                      <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Time (Optional)</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                    </div>
                </div>
                <div>
                   <label className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase mb-1"><Repeat size={12} /> Repeat Cycle</label>
                   <div className="flex gap-2">
                      {['none', 'daily', 'weekly', 'monthly'].map(p => (
                        <button key={p} type="button" onClick={() => setRecurrence(p as RecurrencePattern)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${recurrence === p ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}>
                           {p === 'none' ? 'Once' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          ) : (
             <div className="flex justify-center">
                <button 
                  type="button" 
                  onClick={handleSuggestTime}
                  disabled={isSuggesting}
                  className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <Sparkles size={16} /> AI Scheduling Suggestion
                </button>
             </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Description & Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, sub-tasks, or relevant links..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase">Duration: <span className="text-indigo-600 font-black">{duration}m</span></label>
              <input type="range" min="5" max="120" step="5" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Tag Category</label>
               {!isCreatingCategory && (
                 <button type="button" onClick={() => setIsCreatingCategory(true)} className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"><Plus size={10} /> NEW</button>
               )}
            </div>
            {isCreatingCategory ? (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-bottom-2 duration-150">
                 <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Name..." className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500" />
                 <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {AVAILABLE_COLORS.map(color => (
                        <button key={color} type="button" onClick={() => setNewCategoryColor(color)} className={`w-6 h-6 rounded-full border-2 transition-transform ${newCategoryColor === color ? 'border-gray-800 scale-125 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setIsCreatingCategory(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500">Cancel</button>
                       <button type="button" onClick={handleCreateCategory} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg">Create</button>
                    </div>
                 </div>
              </div>
            ) : (
              <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold">
                <option value="">No Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Discard</button>
            <button type="submit" className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg hover:shadow-indigo-200 transition-all">
              {editingTask?.id ? 'Update Task' : 'Confirm Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
