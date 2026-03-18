
import React, { useState, useEffect } from 'react';
import { JournalEntry, JournalType, RitualProposedChanges, Task } from '../types';
import { Plus, Sun, Book, ChevronDown, ChevronRight, Search, Trash2, Clock, Check, ChevronLeft, Sparkles, X, AlertTriangle, Copy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { BasicEntryEditor } from './BasicEntryEditor';
import { MorningRitual } from './MorningRitual';

interface JournalDashboardProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onApplyRitualChanges: (changes: RitualProposedChanges) => void;
  currentTasks: Task[];
}

export const JournalDashboard: React.FC<JournalDashboardProps> = ({ 
  entries, 
  onSaveEntry, 
  onDeleteEntry,
  onApplyRitualChanges,
  currentTasks
}) => {
  const [view, setView] = useState<'landing' | 'basic' | 'ritual' | 'ritual-entry'>('landing');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [showSavedList, setShowSavedList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const activeEntry = entries.find(e => e.id === activeEntryId);
  const entryToDelete = entries.find(e => e.id === deletingId);

  const startBasicEntry = (id?: string) => {
    if (id) {
      setActiveEntryId(id);
      setView('basic');
    } else {
      const newId = uuidv4();
      const newEntry: JournalEntry = {
        id: newId,
        title: 'Untitled Entry',
        content: '',
        date: new Date().toISOString(),
        type: 'basic'
      };
      onSaveEntry(newEntry);
      setActiveEntryId(newId);
      setView('basic');
    }
  };

  const handleCloneEntry = (entry: JournalEntry) => {
    const newId = uuidv4();
    const clonedEntry: JournalEntry = {
      ...entry,
      id: newId,
      title: `${entry.title} (Copy)`,
      date: new Date().toISOString(),
      lastSaved: undefined
    };
    onSaveEntry(clonedEntry);
    setActiveEntryId(newId);
    if (entry.type === 'basic') setView('basic');
    else setView('ritual-entry');
  };

  const viewRitualEntry = (id: string) => {
    setActiveEntryId(id);
    setView('ritual-entry');
  };

  const startRitual = () => {
    setView('ritual');
  };

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteEntry(deletingId);
      if (activeEntryId === deletingId) {
        setView('landing');
        setActiveEntryId(null);
      }
      setDeletingId(null);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a,b) => b.date.localeCompare(a.date));

  const handleEntryClick = (entry: JournalEntry) => {
    if (entry.type === 'basic') {
      startBasicEntry(entry.id);
    } else if (entry.type === 'ritual') {
      viewRitualEntry(entry.id);
    }
  };

  const DeleteModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Delete {entryToDelete?.type === 'ritual' ? 'Ritual' : 'Entry'}?</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6">
            Are you sure you want to remove <span className="text-slate-900">"{entryToDelete?.title}"</span>? This action is permanent and cannot be reversed.
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setDeletingId(null)}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-rose-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'basic' && activeEntry) {
    return (
      <BasicEntryEditor 
        entry={activeEntry} 
        onSave={(content, title) => onSaveEntry({ ...activeEntry, content, title: title || activeEntry.title })} 
        onClone={() => handleCloneEntry(activeEntry)}
        onExit={() => { setView('landing'); setActiveEntryId(null); }}
      />
    );
  }

  if (view === 'ritual-entry' && activeEntry) {
    return (
      <div className={`flex flex-col h-full bg-slate-50 transition-all duration-500 ${isFocusMode ? 'fixed inset-0 z-[100]' : 'relative'}`}>
        {deletingId && <DeleteModal />}
        <div className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => { setView('landing'); setActiveEntryId(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all">
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-slate-900">{activeEntry.title}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(activeEntry.date), 'PPPP')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
              title={isFocusMode ? 'Exit Focus' : 'Focus Mode'}
            >
              {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button 
              onClick={() => handleCloneEntry(activeEntry)}
              className="text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <Copy size={14} /> Duplicate
            </button>
            <button onClick={() => setDeletingId(activeEntry.id)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
              <Trash2 size={14} /> Delete Ritual
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-white">
           <div className="max-w-3xl mx-auto space-y-12 pb-24">
              <section>
                 <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={16} /> Session Summary
                 </h3>
                 <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 italic text-slate-800 leading-relaxed font-medium">
                    "{activeEntry.content}"
                 </div>
              </section>

              {activeEntry.transcript && (
                 <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Clock size={16} /> Conversation History
                    </h3>
                    <div className="space-y-6">
                       {activeEntry.transcript.map((m, i) => (
                          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                             <span className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-4 mr-4">{m.role}</span>
                             <div className={`p-4 rounded-2xl text-sm max-w-[90%] ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
                                {m.text}
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
              )}
           </div>
        </div>
      </div>
    );
  }

  if (view === 'ritual') {
    return (
      <MorningRitual 
        onFinish={(changes, journalData) => {
          onApplyRitualChanges(changes);
          onSaveEntry({
            id: uuidv4(),
            title: journalData.title!,
            content: journalData.content!,
            transcript: journalData.transcript,
            type: 'ritual',
            date: journalData.date!
          });
          setView('landing');
        }} 
        onCancel={() => setView('landing')}
        currentTasks={currentTasks}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {deletingId && <DeleteModal />}
      <div className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shadow-sm z-10">
        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Book className="text-amber-500" />
          Mindful Journal
        </h1>
        <div className="flex items-center gap-3">
           {activeEntryId && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 uppercase flex items-center gap-1"><Check size={10} /> Autosaved</span>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`border-r border-slate-200 bg-white transition-all duration-300 overflow-hidden flex flex-col ${showSavedList ? 'w-80' : 'w-0'}`}>
          <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search entries..." 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-amber-400 transition-colors"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
             {filteredEntries.map(entry => (
                <div 
                  key={entry.id}
                  onClick={() => handleEntryClick(entry)}
                  className={`group p-3 rounded-xl border cursor-pointer transition-all ${activeEntryId === entry.id ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-slate-800 truncate flex-1">{entry.title || 'Untitled'}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleCloneEntry(entry); }}
                        className="p-1 text-slate-300 hover:text-indigo-500 transition-all"
                        title="Duplicate"
                       >
                        <Copy size={12} />
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(entry.id); }}
                        className="p-1 text-slate-300 hover:text-red-500 transition-all"
                        title="Delete"
                       >
                        <Trash2 size={12} />
                       </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${entry.type === 'ritual' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                      {entry.type}
                    </span>
                  </div>
                </div>
             ))}
             {filteredEntries.length === 0 && (
                <div className="py-20 text-center px-4">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Book className="text-slate-300" size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">No entries found.</p>
                </div>
             )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50 relative">
          <button 
            onClick={() => setShowSavedList(!showSavedList)}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-slate-200 p-1 rounded-r-lg shadow-sm text-slate-400 hover:text-slate-600 z-10"
          >
            {showSavedList ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          <div className="max-w-4xl mx-auto">
             <div className="mb-12">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">How's your mind today?</h2>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Capture thoughts, clear the clutter, and plan with intention.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button 
                  onClick={startRitual}
                  className="group relative bg-white border-2 border-transparent hover:border-indigo-500 rounded-3xl p-8 text-left transition-all hover:shadow-2xl shadow-lg flex flex-col items-start gap-6 overflow-hidden"
                >
                   <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform"></div>
                   <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors z-10">
                      <Sun size={32} strokeWidth={3} />
                   </div>
                   <div className="z-10">
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Morning Ritual</h3>
                      <p className="text-slate-500 font-bold text-sm leading-relaxed">Reflect on yesterday and set clear, achievable goals for today with AI guidance.</p>
                   </div>
                   <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-xs group-hover:translate-x-2 transition-transform uppercase tracking-widest">
                      Start Planning <ChevronRight size={16} />
                   </div>
                </button>

                <button 
                  onClick={() => startBasicEntry()}
                  className="group relative bg-white border-2 border-transparent hover:border-amber-500 rounded-3xl p-8 text-left transition-all hover:shadow-2xl shadow-lg flex flex-col items-start gap-6 overflow-hidden"
                >
                   <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform"></div>
                   <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors z-10">
                      <Plus size={32} strokeWidth={3} />
                   </div>
                   <div className="z-10">
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Basic Entry</h3>
                      <p className="text-slate-500 font-bold text-sm leading-relaxed">A focused space for raw thoughts, drafts, and spontaneous ideas without distraction.</p>
                   </div>
                   <div className="mt-auto flex items-center gap-2 text-amber-600 font-black text-xs group-hover:translate-x-2 transition-transform uppercase tracking-widest">
                      New Entry <ChevronRight size={16} />
                   </div>
                </button>
             </div>

             <div className="mt-16 bg-slate-100/50 border border-slate-200 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Clock size={20} className="text-slate-400" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Recent Activity</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.slice(0, 3).map(entry => (
                    <div 
                      key={entry.id}
                      onClick={() => handleEntryClick(entry)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all"
                    >
                      <h5 className="font-bold text-slate-800 text-sm mb-1 truncate">{entry.title}</h5>
                      <span className="text-[10px] font-bold text-slate-400 block">{format(new Date(entry.date), 'EEEE, MMM d')}</span>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold italic uppercase tracking-widest">No recent entries.</div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
