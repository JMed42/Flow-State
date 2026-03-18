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
import {
  format, addDays, startOfToday, parseISO, isSameDay,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, addWeeks,
} from 'date-fns';
import {
  Plus, Sparkles, Loader2, CalendarDays, LayoutDashboard,
  Grid3X3, List, ChevronLeft, ChevronRight,
  Inbox, Layers, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import {
  Task, TasksState, Category, DailyMeals, Recipe,
  ShoppingCategory, ShoppingItem, JournalEntry, RitualProposedChanges,
} from './types';

// Components
import { LeftSidebar, AppNavItem } from './components/LeftSidebar';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { MealModal } from './components/MealModal';
import { MealDashboard } from './components/MealDashboard';
import { ShoppingDashboard } from './components/ShoppingDashboard';
import { DroppableContainer } from './components/DroppableContainer';
import { FitnessDashboard } from './components/FitnessDashboard';
import { SettingsDashboard } from './components/SettingsDashboard';
import { optimizeSchedule } from './services/geminiService';

// Droppable tab IDs for the inbox
const TAB_STAGING = 'tab-staging';
const TAB_BACKLOG  = 'tab-backlog';

// ─── Droppable Inbox Tab ─────────────────────────────────────────────────────

const DroppableTab: React.FC<{
  id: string;
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ id, active, count, onClick, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 ${
        active
          ? 'bg-white text-indigo-600 shadow-sm'
          : isOver
          ? 'bg-indigo-50 text-indigo-500'
          : 'text-stone-500 hover:text-stone-700'
      }`}
    >
      {children}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
        active ? 'bg-indigo-100 text-indigo-600' : 'bg-stone-200 text-stone-500'
      }`}>{count}</span>
    </button>
  );
};

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat1', name: 'Work',     color: 'blue'   },
    { id: 'cat2', name: 'Personal', color: 'green'  },
    { id: 'cat3', name: 'Home',     color: 'orange' },
  ]);

  const [tasks, setTasks] = useState<TasksState>(() => [
    { id: '1', title: 'Review Q4 Roadmap',    description: 'Align with product team',   scheduledDate: null,                           stage: 'staging', duration: 45, priority: 'high',   completed: false, order: 0, categoryId: 'cat1' },
    { id: '2', title: 'Write Newsletter Draft', description: 'Focus on new features',    scheduledDate: null,                           stage: 'staging', duration: 60, priority: 'medium', completed: false, order: 1, categoryId: 'cat1' },
    { id: '3', title: 'Weekly Grocery Run',    description: 'Pick up essentials',        scheduledDate: null,                           stage: 'backlog', duration: 45, priority: 'low',    completed: false, order: 0, categoryId: 'cat3' },
    { id: '4', title: 'Daily Workout',         description: '30 min cardio',             scheduledDate: format(new Date(), 'yyyy-MM-dd'), startTime: '07:00', stage: 'staging', duration: 30, priority: 'medium', completed: false, order: 0, categoryId: 'cat2', recurrence: 'daily', recurrenceGroupId: 'rg1' },
    { id: '5', title: 'Team Standup',          description: 'Daily sync',                scheduledDate: format(new Date(), 'yyyy-MM-dd'), startTime: '10:00', stage: 'staging', duration: 15, priority: 'low',    completed: true,  order: 1, categoryId: 'cat1' },
    { id: '6', title: 'Client Strategy Call',  description: 'Discuss project scope',     scheduledDate: format(new Date(), 'yyyy-MM-dd'), startTime: '14:00', stage: 'staging', duration: 60, priority: 'high',   completed: false, order: 2, categoryId: 'cat1' },
    { id: '7', title: 'Deep Work Block',       description: 'No interruptions',          scheduledDate: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', stage: 'staging', duration: 90, priority: 'high',   completed: false, order: 3, categoryId: 'cat1' },
  ]);

  const [mealPlans, setMealPlans]         = useState<Record<string, DailyMeals>>({});
  const [recipes, setRecipes]             = useState<Recipe[]>([]);
  const [dailyNotes, setDailyNotes]       = useState<Record<string, string>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const [shoppingCategories, setShoppingCategories] = useState<ShoppingCategory[]>([
    { id: 'shop1', name: 'Groceries',    budget: 200, color: 'green'  },
    { id: 'shop2', name: 'Home & Garden', budget: 150, color: 'orange' },
  ]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([
    { id: 'si1', title: 'Oat milk',  estimatedCost: 5.50, completed: false, categoryId: 'shop1' },
    { id: 'si2', title: 'Greek yogurt', estimatedCost: 4.00, completed: true, categoryId: 'shop1' },
    { id: 'si3', title: 'Plant pots', estimatedCost: 28.00, completed: false, categoryId: 'shop2' },
  ]);

  // ── UI State ───────────────────────────────────────────────────────────────
  const [activeNav,    setActiveNav]    = useState<AppNavItem>('calendar');
  const [viewMode,     setViewMode]     = useState<'today' | 'week' | 'month' | 'list'>('today');
  const [inboxOpen,    setInboxOpen]    = useState(true);
  const [inboxTab,     setInboxTab]     = useState<'staging' | 'backlog'>('staging');
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [activeItem,   setActiveItem]   = useState<Task | null>(null);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingTask,  setEditingTask]  = useState<Task | null>(null);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [activeMealDate,  setActiveMealDate]  = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const today = startOfToday();

  const visibleDates = useMemo(() => {
    if (viewMode === 'month') {
      const ms = startOfMonth(today);
      const me = endOfMonth(today);
      return eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(me) });
    }
    if (viewMode === 'today') return [today];
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, [today, viewMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stagingTasks = useMemo(
    () => tasks.filter(t => t.scheduledDate === null && t.stage === 'staging').sort((a, b) => a.order - b.order),
    [tasks],
  );
  const backlogTasks = useMemo(
    () => tasks.filter(t => t.scheduledDate === null && t.stage === 'backlog').sort((a, b) => a.order - b.order),
    [tasks],
  );
  const sidebarTasks = inboxTab === 'staging' ? stagingTasks : backlogTasks;

  const getTasksForDate = (dateStr: string) =>
    tasks.filter(t => t.scheduledDate === dateStr).sort((a, b) => a.order - b.order);

  // ── Recurrence helper ──────────────────────────────────────────────────────
  const spawnNextOccurrence = (task: Task): Task | null => {
    if (!task.recurrence || task.recurrence === 'none' || !task.scheduledDate) return null;
    const base = parseISO(task.scheduledDate);
    const nextDate = task.recurrence === 'daily' ? addDays(base, 1)
      : task.recurrence === 'weekly' ? addWeeks(base, 1)
      : addMonths(base, 1);
    return { ...task, id: uuidv4(), scheduledDate: format(nextDate, 'yyyy-MM-dd'), completed: false };
  };

  // ── Task handlers ──────────────────────────────────────────────────────────
  const handleCreateTask = (taskData: Partial<Task>) => {
    if (taskData.id && tasks.find(t => t.id === taskData.id)) {
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newTask: Task = {
        id: uuidv4(),
        title: taskData.title || 'Untitled',
        description: taskData.description,
        scheduledDate: taskData.scheduledDate ?? null,
        stage: taskData.stage ?? inboxTab,
        duration: taskData.duration ?? 30,
        priority: taskData.priority ?? 'medium',
        completed: false,
        order: sidebarTasks.length,
        categoryId: taskData.categoryId,
        startTime: taskData.startTime,
        recurrence: taskData.recurrence ?? 'none',
        recurrenceGroupId: taskData.recurrenceGroupId
          ?? (taskData.recurrence && taskData.recurrence !== 'none' ? uuidv4() : undefined),
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleToggleComplete = (id: string) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      const becoming = !target.completed;
      const updated = prev.map(t => t.id === id ? { ...t, completed: becoming } : t);
      if (becoming && target.recurrence && target.recurrence !== 'none') {
        const next = spawnNextOccurrence(target);
        if (next && !updated.some(t => t.recurrenceGroupId === target.recurrenceGroupId && t.scheduledDate === next.scheduledDate)) {
          return [...updated, next];
        }
      }
      return updated;
    });
  };

  const handleMoveStage = (id: string, newStage: 'backlog' | 'staging') =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, stage: newStage } : t));

  const handleAddCategory    = (c: Category)  => setCategories(prev => [...prev, c]);
  const handleDeleteCategory = (id: string)   => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.map(t => t.categoryId === id ? { ...t, categoryId: undefined } : t));
  };

  const handleOpenMealModal  = (dateStr: string) => { setActiveMealDate(dateStr); setIsMealModalOpen(true); };
  const handleSaveMealPlan   = (dateStr: string, meals: DailyMeals) => setMealPlans(prev => ({ ...prev, [dateStr]: meals }));
  const handleAddRecipe      = (r: Recipe)    => setRecipes(prev => [...prev, r]);
  const handleDeleteRecipe   = (id: string)   => setRecipes(prev => prev.filter(r => r.id !== id));

  const handleAddShoppingCategory    = (c: ShoppingCategory) => setShoppingCategories(prev => [...prev, c]);
  const handleDeleteShoppingCategory = (id: string) => {
    setShoppingCategories(prev => prev.filter(c => c.id !== id));
    setShoppingItems(prev => prev.map(i => i.categoryId === id ? { ...i, categoryId: undefined } : i));
  };
  const handleAddShoppingItem    = (i: ShoppingItem) => setShoppingItems(prev => [...prev, i]);
  const handleUpdateShoppingItem = (i: ShoppingItem) => setShoppingItems(prev => prev.map(x => x.id === i.id ? i : x));
  const handleDeleteShoppingItem = (id: string)       => setShoppingItems(prev => prev.filter(i => i.id !== id));

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const datesStr = visibleDates.slice(0, 7).map(d => format(d, 'yyyy-MM-dd'));
    try {
      const optimized = await optimizeSchedule(tasks, datesStr);
      setTasks(optimized);
    } catch (e) { console.error(e); } finally { setIsOptimizing(false); }
  };

  const handleCreateAtTime = (dateStr: string, startTime: string, duration: number) => {
    setEditingTask({ id: '', title: '', scheduledDate: dateStr, startTime, duration, priority: 'medium', completed: false, order: 0, stage: 'staging' } as Task);
    setIsModalOpen(true);
  };

  const applyRitualChanges = (changes: RitualProposedChanges) => {
    const newTasks = changes.tasksToAdd.map(t => ({
      ...t, id: uuidv4(), duration: t.duration ?? 30, priority: t.priority ?? 'medium',
      completed: false, order: 0, stage: 'staging' as const,
      scheduledDate: t.scheduledDate ?? null, startTime: t.startTime ?? undefined,
    } as Task));

    setTasks(prev => {
      let next = prev.map(t => changes.tasksToComplete.includes(t.id) ? { ...t, completed: true } : t)
                     .filter(t => !changes.tasksToRemove.includes(t.id));
      return [...next, ...newTasks];
    });

    if (changes.mealsToUpdate) {
      setMealPlans(prev => ({ ...prev, [changes.mealsToUpdate!.date]: changes.mealsToUpdate!.meals }));
    }
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveItem(tasks.find(t => t.id === event.active.id) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // ── Drop on inbox tab ──
    if (overId === TAB_BACKLOG) {
      setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, scheduledDate: null, stage: 'backlog', startTime: undefined } : t));
      setInboxTab('backlog');
      return;
    }
    if (overId === TAB_STAGING) {
      setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, scheduledDate: null, stage: 'staging', startTime: undefined } : t));
      setInboxTab('staging');
      return;
    }

    // ── Drop on time slot (dateStr::HH) ──
    if (overId.includes('::')) {
      const [dateStr, hourStr] = overId.split('::');
      setTasks(prev => prev.map(t =>
        t.id === activeTaskId
          ? { ...t, scheduledDate: dateStr, startTime: `${hourStr}:00`, stage: 'staging' }
          : t
      ));
      return;
    }

    // ── Drop on a date column or another task ──
    let containerId: string | null = null;
    if (visibleDates.some(d => format(d, 'yyyy-MM-dd') === overId)) {
      containerId = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) containerId = overTask.scheduledDate;
    }

    // Sidebar drop (null container = inbox)
    const isInboxDrop = containerId === null &&
      (overId.startsWith('sidebar-') || tasks.find(t => t.id === overId)?.scheduledDate === null);

    const destTasks = tasks.filter(t => {
      if (containerId === null)
        return t.scheduledDate === null && t.stage === inboxTab;
      return t.scheduledDate === containerId && !t.startTime;
    }).sort((a, b) => a.order - b.order);

    const activeIndex = destTasks.findIndex(t => t.id === activeTaskId);
    const overIndex   = destTasks.findIndex(t => t.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const reordered = arrayMove(destTasks, activeIndex, overIndex);
      setTasks(prev => {
        const next = [...prev];
        reordered.forEach((t, idx) => {
          const i = next.findIndex(nt => nt.id === t.id);
          if (i !== -1) next[i] = { ...next[i], order: idx };
        });
        return next;
      });
    } else if (containerId !== undefined) {
      setTasks(prev => prev.map(t =>
        t.id === activeTaskId
          ? { ...t, scheduledDate: containerId, stage: containerId === null ? inboxTab : 'staging', startTime: undefined, order: destTasks.length }
          : t
      ));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-stone-50 text-stone-800 font-sans overflow-hidden">

      {/* ── 1. Left icon sidebar ── */}
      <LeftSidebar activeNav={activeNav} onNavChange={setActiveNav} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* ── 2. Universal Inbox (middle column) — only on calendar view ── */}
        {activeNav === 'calendar' && (
          <div
            className={`relative flex flex-col bg-white border-r border-stone-200 z-20 transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${
              inboxOpen ? 'w-[288px]' : 'w-0'
            }`}
          >
            {inboxOpen && (
              <>
                {/* Inbox header */}
                <div className="px-4 pt-4 pb-3 border-b border-stone-100 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Inbox size={14} className="text-stone-400" />
                      <h2 className="text-sm font-semibold text-stone-700">Inbox</h2>
                    </div>
                    <button
                      onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm shadow-indigo-200 transition-colors"
                      title="Add task"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-stone-100 p-1 rounded-lg gap-1">
                    <DroppableTab
                      id={TAB_STAGING}
                      active={inboxTab === 'staging'}
                      count={stagingTasks.length}
                      onClick={() => setInboxTab('staging')}
                    >
                      <Inbox size={11} />
                      Staging
                    </DroppableTab>
                    <DroppableTab
                      id={TAB_BACKLOG}
                      active={inboxTab === 'backlog'}
                      count={backlogTasks.length}
                      onClick={() => setInboxTab('backlog')}
                    >
                      <Layers size={11} />
                      Backlog
                    </DroppableTab>
                  </div>
                </div>

                {/* Task list */}
                <div className="flex-1 overflow-y-auto px-3 py-3">
                  <DroppableContainer
                    id={`sidebar-${inboxTab}`}
                    title=""
                    tasks={sidebarTasks}
                    categories={categories}
                    onEditTask={t => { setEditingTask(t); setIsModalOpen(true); }}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                    onMoveStage={handleMoveStage}
                    isBacklog
                  />
                </div>

                {/* Quick hint */}
                <div className="px-4 py-2.5 border-t border-stone-100 flex-shrink-0">
                  <p className="text-[10px] text-stone-300 text-center">
                    Drag tasks onto the calendar to timebox them
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 3. Main canvas ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Non-calendar modules */}
          {activeNav === 'meals' && (
            <MealDashboard
              recipes={recipes}
              mealPlans={mealPlans}
              onAddRecipe={handleAddRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onEditDailyMeal={handleOpenMealModal}
            />
          )}
          {activeNav === 'fitness' && <FitnessDashboard />}
          {activeNav === 'budget' && (
            <ShoppingDashboard
              categories={shoppingCategories}
              items={shoppingItems}
              onAddCategory={handleAddShoppingCategory}
              onDeleteCategory={handleDeleteShoppingCategory}
              onAddItem={handleAddShoppingItem}
              onUpdateItem={handleUpdateShoppingItem}
              onDeleteItem={handleDeleteShoppingItem}
            />
          )}
          {activeNav === 'settings' && <SettingsDashboard />}

          {/* Calendar view */}
          {activeNav === 'calendar' && (
            <>
              {/* Calendar toolbar */}
              <div className="h-[56px] bg-white border-b border-stone-200 px-5 flex items-center justify-between flex-shrink-0 z-10">
                <div className="flex items-center gap-4">
                  {/* Inbox toggle */}
                  <button
                    onClick={() => setInboxOpen(!inboxOpen)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    title={inboxOpen ? 'Hide inbox' : 'Show inbox'}
                  >
                    {inboxOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                  </button>

                  <span className="text-base font-semibold text-stone-700 tracking-tight">
                    {format(today, 'EEEE, MMMM d')}
                  </span>

                  {/* View switcher */}
                  <div className="flex bg-stone-100 p-0.5 rounded-lg">
                    {([
                      { id: 'today', label: 'Day',   icon: LayoutDashboard },
                      { id: 'week',  label: 'Week',  icon: CalendarDays },
                      { id: 'month', label: 'Month', icon: Grid3X3 },
                      { id: 'list',  label: 'List',  icon: List },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setViewMode(id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          viewMode === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        <Icon size={13} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart Schedule button */}
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Smart Schedule
                </button>
              </div>

              {/* Calendar body */}
              <div className="flex-1 overflow-hidden bg-stone-50">
                {viewMode === 'list' ? (
                  /* ─ List view ─ */
                  <div className="max-w-2xl mx-auto w-full p-8 pb-32 overflow-y-auto h-full">
                    {Object.entries(
                      tasks
                        .filter(t => t.scheduledDate !== null)
                        .reduce((groups, task) => {
                          const d = task.scheduledDate!;
                          if (!groups[d]) groups[d] = [];
                          groups[d].push(task);
                          return groups;
                        }, {} as Record<string, Task[]>)
                    )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateStr, dayTasks]) => (
                        <div key={dateStr} className="mb-8">
                          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 pb-2 border-b border-stone-200">
                            {format(parseISO(dateStr), 'EEEE, MMMM d')}
                          </h3>
                          <DroppableContainer
                            id={dateStr}
                            title=""
                            tasks={dayTasks}
                            categories={categories}
                            onEditTask={t => { setEditingTask(t); setIsModalOpen(true); }}
                            onDeleteTask={handleDeleteTask}
                            onToggleComplete={handleToggleComplete}
                            compactMode
                          />
                        </div>
                      ))}
                  </div>
                ) : viewMode === 'month' ? (
                  /* ─ Month view ─ */
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-stone-200 flex-shrink-0 bg-white">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-2 text-center text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-7 auto-rows-fr bg-stone-200 gap-px">
                      {visibleDates.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isToday = isSameDay(date, today);
                        return (
                          <div key={dateStr} className="bg-white min-h-[120px]">
                            <DroppableContainer
                              id={dateStr}
                              title={format(date, 'd')}
                              tasks={getTasksForDate(dateStr)}
                              categories={categories}
                              mealPlan={mealPlans[dateStr]}
                              onEditTask={t => { setEditingTask(t); setIsModalOpen(true); }}
                              onDeleteTask={handleDeleteTask}
                              onToggleComplete={handleToggleComplete}
                              onEditMealPlan={() => handleOpenMealModal(dateStr)}
                              isToday={isToday}
                              compactMode
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* ─ Day / Week view ─ */
                  <div className={`h-full flex overflow-hidden ${viewMode === 'week' ? 'overflow-x-auto' : ''}`}>
                    <div className={`flex h-full min-h-0 divide-x divide-stone-100 ${viewMode === 'week' ? 'min-w-[1120px] w-full' : 'w-full'}`}>
                      {visibleDates.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isToday = isSameDay(date, today);
                        return (
                          <div
                            key={dateStr}
                            className={`flex flex-col bg-white overflow-hidden ${viewMode === 'week' ? 'flex-1 min-w-[160px]' : 'flex-1'}`}
                          >
                            <DroppableContainer
                              id={dateStr}
                              title={isToday ? 'Today' : format(date, 'EEE')}
                              subtitle={format(date, 'MMM d')}
                              isToday={isToday}
                              tasks={getTasksForDate(dateStr)}
                              categories={categories}
                              mealPlan={mealPlans[dateStr]}
                              onEditTask={t => { setEditingTask(t); setIsModalOpen(true); }}
                              onDeleteTask={handleDeleteTask}
                              onToggleComplete={handleToggleComplete}
                              onEditMealPlan={() => handleOpenMealModal(dateStr)}
                              onCreateAtTime={handleCreateAtTime}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Drag overlay ── */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeItem ? (
            <div className="w-[260px] opacity-90 rotate-1 scale-105 shadow-2xl shadow-indigo-200/50">
              <TaskCard
                task={activeItem}
                categoryData={categories.find(c => c.id === activeItem.categoryId)}
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleComplete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Modals ── */}
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
      <MealModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        dateStr={activeMealDate}
        existingMeals={activeMealDate ? mealPlans[activeMealDate] : undefined}
        onSave={handleSaveMealPlan}
      />
    </div>
  );
}
