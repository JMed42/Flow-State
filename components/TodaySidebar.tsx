import React, { useMemo } from 'react';
import { ShoppingCategory, ShoppingItem, Task } from '../types';
import { ShoppingCart, DollarSign, Sparkles, StickyNote, Circle, ChevronRight, TrendingUp } from 'lucide-react';

interface TodaySidebarProps {
  tasks: Task[];
  shoppingCategories: ShoppingCategory[];
  shoppingItems: ShoppingItem[];
  notes: string;
  onSaveNotes: (notes: string) => void;
}

export const TodaySidebar: React.FC<TodaySidebarProps> = ({
  tasks,
  shoppingCategories,
  shoppingItems,
  notes,
  onSaveNotes
}) => {
  const pendingShopping = useMemo(() => shoppingItems.filter(i => !i.completed).slice(0, 5), [shoppingItems]);
  const totalBudget = useMemo(() => shoppingCategories.reduce((s, c) => s + c.budget, 0), [shoppingCategories]);
  const totalEstimated = useMemo(() => shoppingItems.reduce((s, i) => s + i.estimatedCost, 0), [shoppingItems]);

  const suggestion = useMemo(() => {
    const active = tasks.filter(t => !t.completed && t.scheduledDate).sort((a,b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
    if (active.length > 0) {
        const next = active[0];
        return { title: next.title, time: next.startTime || 'Now', priority: next.priority };
    }
    return null;
  }, [tasks]);

  const budgetProgress = Math.min(100, (totalEstimated / (totalBudget || 1)) * 100);

  return (
    <div className="w-80 border-l border-slate-300 bg-slate-50 flex flex-col p-6 overflow-y-auto scrollbar-thin z-10 shadow-xl">
      <div className="space-y-10">
        {/* Suggestion Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles size={16} strokeWidth={3} />
                <h2 className="text-[11px] font-black uppercase tracking-widest">Focus Target</h2>
            </div>
          </div>
          {suggestion ? (
            <div className="bg-white border-2 border-indigo-600 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full -mr-12 -mt-12"></div>
              <span className="text-[11px] font-black text-indigo-600 block mb-1.5 uppercase tracking-wider">{suggestion.time}</span>
              <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2">{suggestion.title}</h3>
              <div className="mt-4 flex justify-between items-center">
                 <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-black uppercase ${suggestion.priority === 'high' ? 'bg-red-600 border-red-700 text-white' : 'bg-indigo-100 border-indigo-200 text-indigo-800'}`}>
                    {suggestion.priority}
                 </span>
                 <button className="text-[11px] font-black text-indigo-700 flex items-center gap-0.5 hover:translate-x-1 transition-transform bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shadow-sm">GO <ChevronRight size={14} /></button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 font-bold bg-white rounded-2xl p-6 text-center border border-slate-300 shadow-sm italic">All caught up! Time for deep work?</div>
          )}
        </section>

        {/* Budget Overview */}
        <section className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-rose-700">
                <TrendingUp size={18} strokeWidth={3} />
                <h2 className="text-[11px] font-black uppercase tracking-widest">Budget Health</h2>
            </div>
            <span className={`text-[11px] font-black ${totalEstimated > totalBudget ? 'text-red-600' : 'text-emerald-700'}`}>
                {Math.round(budgetProgress)}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">EST. SPEND</span>
                <span className="text-lg font-black text-slate-900">${totalEstimated.toFixed(0)}</span>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">MONTHLY MAX</span>
                <span className="text-lg font-black text-slate-900">${totalBudget.toFixed(0)}</span>
             </div>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
             <div className={`h-full transition-all duration-1000 ${totalEstimated > totalBudget ? 'bg-red-600' : 'bg-emerald-600'}`} style={{ width: `${budgetProgress}%` }} />
          </div>
        </section>

        {/* Shopping Summary */}
        <section className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 mb-5">
            <ShoppingCart size={18} strokeWidth={3} />
            <h2 className="text-[11px] font-black uppercase tracking-widest">Shopping List</h2>
          </div>
          <div className="space-y-3">
            {pendingShopping.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all">
                 <Circle size={12} className="text-slate-400 fill-slate-50" strokeWidth={3} />
                 <span className="text-xs font-bold text-slate-800 truncate flex-1">{item.title}</span>
                 <span className="text-[11px] font-mono font-black text-slate-500">${item.estimatedCost.toFixed(0)}</span>
              </div>
            ))}
            {pendingShopping.length === 0 && <div className="text-xs text-slate-400 font-bold italic py-2 text-center">Nothing to buy today.</div>}
          </div>
        </section>

        {/* Notes Area */}
        <section className="flex-1 flex flex-col min-h-0 bg-amber-50/50 p-5 rounded-2xl border-2 border-amber-200 shadow-inner">
          <div className="flex items-center gap-2 text-amber-800 mb-4">
            <StickyNote size={18} strokeWidth={3} />
            <h2 className="text-[11px] font-black uppercase tracking-widest">Scratchpad</h2>
          </div>
          <textarea 
            value={notes}
            onChange={(e) => onSaveNotes(e.target.value)}
            placeholder="Jot down quick thoughts..."
            className="w-full flex-1 min-h-[160px] p-4 bg-white border border-amber-200 rounded-xl text-sm text-slate-900 placeholder:text-amber-300 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all resize-none outline-none font-bold"
          />
        </section>
      </div>
    </div>
  );
};