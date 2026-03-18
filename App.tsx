
import React, { useState, useMemo, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { format, addDays, startOfToday, parseISO, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, addWeeks } from 'date-fns';
import { Plus, Sparkles, Calendar as CalendarIcon, Loader2, CalendarDays, Grid3X3, List, ChevronLeft, ChevronRight, Inbox, Layers, Utensils, ShoppingCart, Repeat, LayoutDashboard, Calendar, PenTool } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Task, TasksState, Category, DailyMeals, Recipe, ShoppingCategory, ShoppingItem, JournalEntry, RitualProposedChanges } from './types';
import { TaskModal } from './components/TaskModal';
import { MealModal } from './components/MealModal';
import { MealDashboard } from './components/MealDashboard';
import { ShoppingDashboard } from './components/ShoppingDashboard';
import { RecurrenceDashboard } from './components/RecurrenceDashboard';
import { DroppableContainer } from './components/DroppableContainer';
import { TodaySidebar } from './components/TodaySidebar';
import { TaskCard } from './components/TaskCard';
import { JournalDashboard } from './components/JournalDashboard';
import { optimizeSchedule } from './services/geminiService';

const TAB_BACKLOG = 'tab-backlog';
const TAB_STAGING = 'tab-staging';

const DroppableTab = ({ id, active, onClick, children, icon: Icon }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${
        active 
          ? 'border-indigo-600 text-indigo-700' 
          : isOver
            ? 'border-indigo-400 text-indigo-500 bg-indigo-50/50'
            : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={16} />
      {children}
    </button>
  );
};

export default function App() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat1', name: 'Work', color: 'blue' },
    { id: 'cat2', name: 'Personal', color: 'green' },
    { id: 'cat3', name: 'House', color: 'orange' },
  ]);

  const [tasks, setTasks] = useState<TasksState>(() => {
    return [
      { id: '1', title: 'Review Q4 Roadmap', description: 'Check with product team', scheduledDate: null, stage: 'staging', duration: 45, priority: 'high', completed: false, order: 0, categoryId: 'cat1' },
      { id: '2', title: 'Email Marketing Draft', description: 'Focus on new features', scheduledDate: format(new Date(), 'yyyy-MM-dd'), stage: 'staging', duration: 60, priority: 'medium', completed: false, order: 0, categoryId: 'cat1' },
      { id: '3', title: 'Daily Workout', description: '30 mins cardio', scheduledDate: format(new Date(), 'yyyy-MM-dd'), startTime: '08:00', stage: 'staging', duration: 30, priority: 'medium', completed: false, order: 1, categoryId: 'cat2', recurrence: 'daily', recurrenceGroupId: 'rg1' },
      { id: '4', title: 'Team Sync', description: 'Daily standup', scheduledDate: format(new Date(), 'yyyy-MM-dd'), startTime: '10:00', stage: 'staging', duration: 15, priority: 'low', completed: true, order: 1, categoryId: 'cat1' },
      { id: '5', title: 'Client Call', description: 'Discuss project scope', scheduledDate: format(new Date(), 'yyyy-MM-dd'), startTime: '14:00', stage: 'staging', duration: 30, priority: 'high', completed: false, order: 2, categoryId: 'cat1' },
    ];
  });

  const [mealPlans, setMealPlans] = useState<Record<string, DailyMeals>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const [shoppingCategories, setShoppingCategories] = useState<ShoppingCategory[]>([
    { id: 'shop_cat_1', name: 'Groceries', budget: 150, color: 'green' },
    { id: 'shop_cat_2', name: 'Home Improv', budget: 200, color: 'orange' }
  ]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([
    { id: 'item_1', title: 'Milk', estimatedCost: 4.50, completed: false, categoryId: 'shop_cat_1' },
    { id: 'item_2', title: 'Eggs', estimatedCost: 6.00, completed: false, categoryId: 'shop_cat_1' },
    { id: 'item_3', title: 'Paint', estimatedCost: 45.00, completed: false, categoryId: 'shop_cat_2' },
  ]);

  const [activeNav, setActiveNav] = useState<'calendar' | 'meals' | 'shopping' | 'recurrence' | 'journal'>('calendar');

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMealDate, setActiveMealDate] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month' | 'list'>('today');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'backlog' | 'staging'>('staging');

  const today = startOfToday();
  const visibleDates = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
    if (viewMode === 'today') return [today];
    const daysToShow = 7;
    return Array.from({ length: daysToShow }).map((_, i) => addDays(today, i));
  }, [today, viewMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sidebarTasks = useMemo(() => 
    tasks
      .filter(t => t.scheduledDate === null && (t.stage || 'backlog') === sidebarTab)
      .sort((a, b) => a.order - b.order),
  [tasks, sidebarTab]);

  const getTasksForDate = (dateStr: string) => 
    tasks.filter(t => t.scheduledDate === dateStr).sort((a, b) => a.order - b.order);

  const spawnNextOccurrence = (task: Task): Task | null => {
    if (!task.recurrence || task.recurrence === 'none' || !task.scheduledDate) return null;
    let nextDate: Date;
    const currentDate = parseISO(task.scheduledDate);
    switch (task.recurrence) {
      case 'daily': nextDate = addDays(currentDate, 1); break;
      case 'weekly': nextDate = addWeeks(currentDate, 1); break;
      case 'monthly': nextDate = addMonths(currentDate, 1); break;
      default: return null;
    }
    return { ...task, id: uuidv4(), scheduledDate: format(nextDate, 'yyyy-MM-dd'), completed: false };
  };

  const handleCreateTask = (taskData: Partial<Task>) => {
    if (taskData.id) {
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newTask: Task = {
        id: uuidv4(),
        title: taskData.title || 'Untitled',
        description: taskData.description,
        scheduledDate: taskData.scheduledDate || null, 
        stage: taskData.stage || sidebarTab,
        duration: taskData.duration || 30,
        priority: taskData.priority || 'medium',
        completed: false,
        order: sidebarTasks.length,
        categoryId: taskData.categoryId,
        startTime: taskData.startTime,
        recurrence: taskData.recurrence || 'none',
        recurrenceGroupId: taskData.recurrenceGroupId || (taskData.recurrence && taskData.recurrence !== 'none' ? uuidv4() : undefined)
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleToggleComplete = (id: string) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      const isBecomingComplete = !target.completed;
      const updatedTasks = prev.map(t => t.id === id ? { ...t, completed: isBecomingComplete } : t);
      if (isBecomingComplete && target.recurrence && target.recurrence !== 'none') {
        const nextTask = spawnNextOccurrence(target);
        if (nextTask) {
          const alreadyExists = updatedTasks.some(t => t.recurrenceGroupId === target.recurrenceGroupId && t.scheduledDate === nextTask.scheduledDate);
          if (!alreadyExists) return [...updatedTasks, nextTask];
        }
      }
      return updatedTasks;
    });
  };
  
  const handleMoveStage = (id: string, newStage: 'backlog' | 'staging') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, stage: newStage } : t));
  };

  const handleAddCategory = (newCat: Category) => setCategories(prev => [...prev, newCat]);
  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.map(t => t.categoryId === id ? { ...t, categoryId: undefined } : t));
  };

  const handleOpenMealModal = (dateStr: string) => {
    setActiveMealDate(dateStr);
    setIsMealModalOpen(true);
  };

  const handleSaveMealPlan = (dateStr: string, meals: DailyMeals) => setMealPlans(prev => ({ ...prev, [dateStr]: meals }));
  const handleAddRecipe = (recipe: Recipe) => setRecipes(prev => [...prev, recipe]);
  const handleDeleteRecipe = (id: string) => setRecipes(prev => prev.filter(r => r.id !== id));

  const handleAddShoppingCategory = (cat: ShoppingCategory) => setShoppingCategories(prev => [...prev, cat]);
  const handleDeleteShoppingCategory = (id: string) => {
    setShoppingCategories(prev => prev.filter(c => c.id !== id));
    setShoppingItems(prev => prev.map(i => i.categoryId === id ? { ...i, categoryId: undefined } : i));
  };
  const handleAddShoppingItem = (item: ShoppingItem) => setShoppingItems(prev => [...prev, item]);
  const handleUpdateShoppingItem = (item: ShoppingItem) => setShoppingItems(prev => prev.map(i => i.id === item.id ? item : i));
  const handleDeleteShoppingItem = (id: string) => setShoppingItems(prev => prev.filter(i => i.id !== id));

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const datesStr = visibleDates.slice(0, 7).map(d => format(d, 'yyyy-MM-dd'));
    try {
      const optimizedTasks = await optimizeSchedule(tasks, datesStr);
      setTasks(optimizedTasks);
    } catch (e) { console.error(e); } finally { setIsOptimizing(false); }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const task = tasks.find(t => t.id === active.id);
    setActiveItem(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    if (overId === TAB_BACKLOG) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, scheduledDate: null, stage: 'backlog', startTime: undefined } : t));
      setSidebarTab('backlog');
      return;
    }
    if (overId === TAB_STAGING) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, scheduledDate: null, stage: 'staging', startTime: undefined } : t));
      setSidebarTab('staging');
      return;
    }

    if (overId.includes('::')) {
      const [dateStr, hourStr] = overId.split('::');
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, scheduledDate: dateStr, startTime: `${hourStr}:00`, stage: 'staging' } : t));
      return;
    }

    let containerId: string | null = null;
    if (visibleDates.some(d => format(d, 'yyyy-MM-dd') === overId)) containerId = overId;
    else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) containerId = overTask.scheduledDate;
    }

    const destinationTasks = tasks.filter(t => {
      if (containerId === null) return t.scheduledDate === null && (t.stage || 'backlog') === sidebarTab;
      return t.scheduledDate === containerId && (viewMode === 'month' ? true : !t.startTime);
    }).sort((a,b) => a.order - b.order);
    
    const activeIndex = destinationTasks.findIndex(t => t.id === activeId);
    const overIndex = destinationTasks.findIndex(t => t.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const newOrder = arrayMove(destinationTasks, activeIndex, overIndex);
      setTasks(prev => {
        const next = [...prev];
        newOrder.forEach((t, index) => {
          const originalIndex = next.findIndex(ot => ot.id === t.id);
          if (originalIndex !== -1) next[originalIndex].order = index;
        });
        return next;
      });
    } else {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, scheduledDate: containerId, stage: containerId === null ? sidebarTab : 'staging', startTime: undefined, order: destinationTasks.length } : t));
    }
  };

  const handleCreateAtTime = (dateStr: string, startTime: string, duration: number) => {
    setEditingTask({
        id: '', 
        title: '', 
        scheduledDate: dateStr, 
        startTime, 
        duration, 
        priority: 'medium', 
        completed: false, 
        order: 0, 
        stage: 'staging'
    } as Task);
    setIsModalOpen(true);
  };

  const applyRitualChanges = (changes: RitualProposedChanges) => {
    const newTasks = changes.tasksToAdd.map(t => ({
      ...t,
      id: uuidv4(),
      duration: t.duration || 30,
      priority: t.priority || 'medium',
      completed: false,
      order: 0,
      stage: 'staging',
      scheduledDate: t.scheduledDate || null,
      startTime: t.startTime || undefined
    } as Task));

    setTasks(prev => {
      let next = [...prev];
      next = next.map(t => changes.tasksToComplete.includes(t.id) ? { ...t, completed: true } : t);
      next = next.filter(t => !changes.tasksToRemove.includes(t.id));
      return [...next, ...newTasks];
    });

    if (changes.mealsToUpdate) {
      setMealPlans(prev => ({
        ...prev,
        [changes.mealsToUpdate!.date]: changes.mealsToUpdate!.meals
      }));
    }
  };

  const handleSaveJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prev => {
      const exists = prev.find(e => e.id === entry.id);
      if (exists) {
        return prev.map(e => e.id === entry.id ? { ...entry, lastSaved: new Date().toISOString() } : e);
      }
      return [...prev, { ...entry, lastSaved: new Date().toISOString() }];
    });
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-slate-200 text-slate-800 font-sans overflow-hidden">
      <div className="w-16 bg-white border-r border-slate-300 flex flex-col items-center py-6 gap-6 z-30 flex-shrink-0 shadow-md">
        <button onClick={() => setActiveNav('calendar')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeNav === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} title="Calendar"><CalendarIcon size={20} /></button>
        <button onClick={() => setActiveNav('journal')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeNav === 'journal' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title="Journal"><PenTool size={20} /></button>
        <button onClick={() => setActiveNav('recurrence')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeNav === 'recurrence' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} title="Recurring Tasks"><Repeat size={20} /></button>
        <button onClick={() => setActiveNav('meals')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeNav === 'meals' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title="Meal Plans"><Utensils size={20} /></button>
        <button onClick={() => setActiveNav('shopping')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeNav === 'shopping' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} title="Shopping & Budget"><ShoppingCart size={20} /></button>
        <div className="mt-auto flex flex-col gap-4 w-full items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg transition-colors ${sidebarOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden relative">
          {activeNav === 'calendar' && (
            <div className={`bg-slate-50 border-r border-slate-300 flex flex-col z-20 shadow-lg transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-none'}`}>
              <div className="p-5 pb-0 flex-shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-slate-800 text-lg">Tasks</h2>
                    <button 
                      onClick={() => { setEditingTask(null); setIsModalOpen(true); }} 
                      className="group flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full transition-all shadow-sm"
                    >
                      <Plus size={16} /> 
                      <span className="text-xs font-bold uppercase tracking-wide">Quick Add</span>
                    </button>
                  </div>
                  <div className="flex gap-4 border-b border-slate-200">
                    <DroppableTab id={TAB_STAGING} active={sidebarTab === 'staging'} onClick={() => setSidebarTab('staging')} icon={Inbox}>Staging</DroppableTab>
                    <DroppableTab id={TAB_BACKLOG} active={sidebarTab === 'backlog'} onClick={() => setSidebarTab('backlog')} icon={Layers}>Backlog</DroppableTab>
                  </div>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-100 mt-2">
                  <DroppableContainer id={`sidebar-${sidebarTab}`} title={sidebarTab === 'staging' ? "Ready to Schedule" : "Unsorted Ideas"} tasks={sidebarTasks} categories={categories} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDeleteTask={handleDeleteTask} onToggleComplete={handleToggleComplete} onMoveStage={handleMoveStage} isBacklog />
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0 bg-white h-full shadow-inner">
            {activeNav === 'journal' ? (
              <JournalDashboard 
                entries={journalEntries} 
                onSaveEntry={handleSaveJournalEntry} 
                onDeleteEntry={handleDeleteJournalEntry}
                onApplyRitualChanges={applyRitualChanges}
                currentTasks={tasks}
              />
            ) : activeNav === 'recurrence' ? (
              <RecurrenceDashboard tasks={tasks} categories={categories} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDeleteTask={handleDeleteTask} />
            ) : activeNav === 'meals' ? (
               <MealDashboard recipes={recipes} mealPlans={mealPlans} onAddRecipe={handleAddRecipe} onDeleteRecipe={handleDeleteRecipe} onEditDailyMeal={handleOpenMealModal} />
            ) : activeNav === 'shopping' ? (
                <ShoppingDashboard categories={shoppingCategories} items={shoppingItems} onAddCategory={handleAddShoppingCategory} onDeleteCategory={handleDeleteShoppingCategory} onAddItem={handleAddShoppingItem} onUpdateItem={handleUpdateShoppingItem} onDeleteItem={handleDeleteShoppingItem} />
            ) : (
              <>
                <div className="h-16 border-b border-slate-300 bg-white px-6 flex justify-between items-center flex-shrink-0 z-20">
                  <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-slate-800">{format(today, 'MMMM yyyy')}</h1>
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
                      <button onClick={() => setViewMode('today')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'today' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={14} /> Today</button>
                      <button onClick={() => setViewMode('week')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'week' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarDays size={14} /> Week</button>
                      <button onClick={() => setViewMode('month')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Grid3X3 size={14} /> Month</button>
                      <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List size={14} /> Task View</button>
                    </div>
                  </div>
                  <button onClick={handleOptimize} disabled={isOptimizing} className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                    {isOptimizing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Smart Schedule
                  </button>
                </div>

                <div className="flex-1 overflow-hidden flex bg-slate-50">
                  <div className="flex-1 overflow-y-auto scrollbar-thin relative h-full">
                    {viewMode === 'list' ? (
                        <div className="max-w-3xl mx-auto w-full p-8 pb-32">
                            {Object.entries(tasks.filter(t => t.scheduledDate !== null).reduce((groups, task) => {
                                const date = task.scheduledDate!;
                                if (!groups[date]) groups[date] = [];
                                groups[date].push(task);
                                return groups;
                            }, {} as Record<string, Task[]>)).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([dateStr, dayTasks]) => (
                                <div key={dateStr} className="mb-8">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-300 pb-2">{format(parseISO(dateStr), 'EEEE, MMMM d')}</h3>
                                    <DroppableContainer id={dateStr} title="" tasks={dayTasks} categories={categories} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} onDeleteTask={handleDeleteTask} onToggleComplete={handleToggleComplete} compactMode />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`flex h-full min-h-0 ${viewMode === 'month' ? 'grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px border-b border-slate-300' : `divide-x divide-slate-300 ${viewMode === 'week' ? 'min-w-[1960px]' : 'w-full'}`}`}>
                            {viewMode === 'month' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">{d}</div>
                            ))}
                            {visibleDates.map(date => {
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const isToday = isSameDay(date, today);
                                return (
                                    <div key={dateStr} className={viewMode === 'month' ? 'min-h-[140px] bg-white flex flex-col' : 'flex-1 min-w-[300px] h-full bg-white shadow-sm'}>
                                        <DroppableContainer 
                                            id={dateStr} 
                                            title={viewMode === 'month' ? format(date, 'd') : (isToday ? 'Today' : format(date, 'EEEE'))} 
                                            subtitle={viewMode === 'month' ? undefined : format(date, 'MMM d')} 
                                            isToday={isToday} 
                                            tasks={getTasksForDate(dateStr)} 
                                            categories={categories} 
                                            mealPlan={mealPlans[dateStr]} 
                                            onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} 
                                            onDeleteTask={handleDeleteTask} 
                                            onToggleComplete={handleToggleComplete} 
                                            onEditMealPlan={() => handleOpenMealModal(dateStr)} 
                                            compactMode={viewMode === 'month'}
                                            onCreateAtTime={handleCreateAtTime}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                  </div>
                  {viewMode === 'today' && (
                    <TodaySidebar 
                        tasks={tasks}
                        shoppingCategories={shoppingCategories}
                        shoppingItems={shoppingItems}
                        notes={dailyNotes[format(today, 'yyyy-MM-dd')] || ''}
                        onSaveNotes={(n) => setDailyNotes(prev => ({ ...prev, [format(today, 'yyyy-MM-dd')]: n }))}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <DragOverlay>{activeItem ? (<div className="w-[280px] opacity-90 cursor-grabbing"><div className="transform rotate-2 shadow-2xl"><TaskCard task={activeItem} categoryData={categories.find(c => c.id === activeItem.categoryId)} onEdit={() => {}} onDelete={() => {}} onToggleComplete={() => {}} /></div></div>) : null}</DragOverlay>
      </DndContext>
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCreateTask} 
        editingTask={editingTask} 
        categories={categories} 
        tasks={tasks}
        onAddCategory={handleAddCategory} 
        onDeleteCategory={handleDeleteCategory} 
      />
      <MealModal isOpen={isMealModalOpen} onClose={() => setIsMealModalOpen(false)} dateStr={activeMealDate} existingMeals={activeMealDate ? mealPlans[activeMealDate] : undefined} onSave={handleSaveMealPlan} />
    </div>
  );
}
