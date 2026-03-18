
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { RitualProposedChanges, Task, Message, JournalEntry } from '../types';
import { 
  ChevronLeft, 
  Send, 
  Sparkles, 
  Loader2, 
  Calendar, 
  Check, 
  X, 
  AlertTriangle, 
  Utensils, 
  Plus, 
  Maximize2, 
  Minimize2, 
  ChevronRight,
  Inbox,
  Clock,
  Layout,
  Target
} from 'lucide-react';
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface MorningRitualProps {
  onFinish: (changes: RitualProposedChanges, journalEntry: Partial<JournalEntry>) => void;
  onCancel: () => void;
  currentTasks: Task[];
}

export const MorningRitual: React.FC<MorningRitualProps> = ({ onFinish, onCancel, currentTasks }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const [proposedChanges, setProposedChanges] = useState<RitualProposedChanges | null>(null);
  const [view, setView] = useState<'chat' | 'confirmation'>('chat');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const initChat = async () => {
      const model = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are a mindful productivity coach. 
          Conduct a "Morning Ritual" conversation. Today's date is ${todayStr}.
          
          Framing for the session:
          1. Warm Greeting: Acknowledge the day and time.
          2. Reflection: Ask about yesterday's "Wins" (achievements) and "Misses" (what didn't happen or felt heavy).
          3. Intentional Planning: Help the user decide what to focus on today. 
          4. Scheduling: If a task should happen today, assign it a scheduledDate of ${todayStr}.
          5. Time Blocking: Suggest specific start times (HH:mm) for tasks discussed so they appear in the day's timeline.
          
          Current Calendar Context: ${JSON.stringify(currentTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed, date: t.scheduledDate, time: t.startTime })))}
          
          Tone: Encouraging, calm, and focused. Use natural language.
          
          After the user indicates they are done planning, output a JSON block wrapped in triple backticks with the tag "PROPOSAL" that follows this schema:
          {
            "tasksToAdd": [{"title": string, "duration": number, "priority": "high"|"medium"|"low", "scheduledDate": "YYYY-MM-DD" | null, "startTime": "HH:mm" | null}],
            "tasksToComplete": [id strings],
            "tasksToRemove": [id strings],
            "mealsToUpdate": { "date": "YYYY-MM-DD", "meals": { "breakfast": {"title": string, "ingredients": string}, "lunch": {"title": string, "ingredients": string}, "dinner": {"title": string, "ingredients": string}, "snacks": {"title": string, "ingredients": string} } }
          }
          Only output the proposal when the user is ready to finalize.`
        }
      });
      setChat(model);
      
      const response = await model.sendMessage({ message: "Hello! It's a pleasure to sit down with you. How did yesterday go? What were your wins and what felt a bit heavy?" });
      setMessages([{ role: 'model', text: response.text }]);
    };
    initChat();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !chat) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chat.sendMessage({ message: input });
      const text = response.text;
      
      if (text.includes('PROPOSAL')) {
        const match = text.match(/```json\s*PROPOSAL\s*([\s\S]*?)```/i) || text.match(/```PROPOSAL\s*([\s\S]*?)```/i);
        if (match) {
          try {
            const proposal = JSON.parse(match[1]);
            setProposedChanges(proposal);
            setView('confirmation');
          } catch (e) {
            console.error("JSON parse error for proposal", e);
          }
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: text.split('```')[0].trim() }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!proposedChanges) return;
    setIsFinalizing(true);
    
    try {
      const summaryResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize the following planning session transcript in 2-3 concise, insightful sentences for a journal entry:\n\n${messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}`,
      });

      const journalEntry: Partial<JournalEntry> = {
        title: `Morning Ritual - ${format(new Date(), 'PPPP')}`,
        content: summaryResponse.text || "Daily planning session completed with AI guidance.",
        transcript: messages,
        type: 'ritual',
        date: new Date().toISOString()
      };

      onFinish(proposedChanges, journalEntry);
    } catch (error) {
      console.error("Error generating ritual summary:", error);
      onFinish(proposedChanges, {
        title: `Morning Ritual - ${format(new Date(), 'PPPP')}`,
        content: "Completed ritual session.",
        transcript: messages,
        type: 'ritual',
        date: new Date().toISOString()
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const backlogTasks = useMemo(() => currentTasks.filter(t => !t.scheduledDate && t.stage === 'backlog'), [currentTasks]);
  const stagingTasks = useMemo(() => currentTasks.filter(t => !t.scheduledDate && t.stage === 'staging'), [currentTasks]);
  
  const calendarTasks = useMemo(() => {
    const dateStr = format(calendarDate, 'yyyy-MM-dd');
    return currentTasks.filter(t => t.scheduledDate === dateStr).sort((a, b) => (a.startTime || '23:59').localeCompare(b.startTime || '23:59'));
  }, [currentTasks, calendarDate]);

  if (view === 'confirmation' && proposedChanges) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shadow-sm">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
             <Check className="text-emerald-500" />
             Review Ritual Adjustments
           </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-8">
              <section>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Plus size={16} className="text-indigo-500" /> Tasks to Add
                 </h3>
                 <div className="space-y-3">
                    {proposedChanges.tasksToAdd.map((t, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{t.title}</span>
                            {t.startTime && <span className="text-[10px] font-black text-indigo-600 uppercase">Starts at {t.startTime}</span>}
                          </div>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{t.duration}m</span>
                       </div>
                    ))}
                    {proposedChanges.tasksToAdd.length === 0 && <p className="text-xs text-slate-400 italic">No tasks added.</p>}
                 </div>
              </section>

              <section>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Check size={16} className="text-emerald-500" /> Mark as Complete
                 </h3>
                 <div className="space-y-3">
                    {proposedChanges.tasksToComplete.map(id => {
                      const task = currentTasks.find(ct => ct.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                           <span className="font-bold text-emerald-900">{task?.title || 'Unknown Task'}</span>
                        </div>
                      );
                    })}
                    {proposedChanges.tasksToComplete.length === 0 && <p className="text-xs text-slate-400 italic">No tasks completed.</p>}
                 </div>
              </section>

              <section>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <X size={16} className="text-rose-500" /> Remove from Schedule
                 </h3>
                 <div className="space-y-3">
                    {proposedChanges.tasksToRemove.map(id => {
                       const task = currentTasks.find(ct => ct.id === id);
                       return (
                        <div key={id} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                           <span className="font-bold text-rose-900">{task?.title || 'Unknown Task'}</span>
                        </div>
                      );
                    })}
                    {proposedChanges.tasksToRemove.length === 0 && <p className="text-xs text-slate-400 italic">No tasks removed.</p>}
                 </div>
              </section>

              {proposedChanges.mealsToUpdate && (
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Utensils size={16} className="text-green-500" /> Nutrition Update
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     {Object.entries(proposedChanges.mealsToUpdate.meals).map(([type, meal]: [any, any]) => (
                        <div key={type} className="p-4 bg-green-50/30 rounded-2xl border border-green-100">
                           <span className="text-[10px] font-black text-green-600 uppercase block mb-1">{type}</span>
                           <span className="font-bold text-slate-800 text-sm">{meal?.title || 'No change'}</span>
                        </div>
                     ))}
                  </div>
                </section>
              )}
           </div>
        </div>
        <div className="h-20 border-t border-slate-200 bg-white px-8 flex items-center justify-end gap-4 shadow-inner">
           <button 
             disabled={isFinalizing}
             onClick={() => setView('chat')}
             className="px-6 py-2.5 text-sm font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
           >
             Go Back to Chat
           </button>
           <button 
             disabled={isFinalizing}
             onClick={handleFinalize}
             className="px-10 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
           >
             {isFinalizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
             {isFinalizing ? "Saving Ritual..." : "Finalize Ritual"}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white z-20">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all">
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              isFocusMode 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title={isFocusMode ? 'Exit Focus' : 'Focus Mode'}
          >
            {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
               Morning Ritual
               <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[9px] border border-indigo-100 uppercase font-black">AI Guided</span>
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setCalendarDate(subDays(calendarDate, 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition-all">
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {isSameDay(calendarDate, new Date()) ? 'Today' : isSameDay(calendarDate, addDays(new Date(), 1)) ? 'Tomorrow' : isSameDay(calendarDate, subDays(new Date(), 1)) ? 'Yesterday' : format(calendarDate, 'EEEE')}
                </span>
                <span className="text-xs font-bold text-slate-900 leading-none">{format(calendarDate, 'MMM d')}</span>
              </div>
              <button onClick={() => setCalendarDate(addDays(calendarDate, 1))} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition-all">
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Potential Tasks/Projects */}
        {!isFocusMode && (
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Inbox size={14} /> Potential Tasks
              </h3>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 px-2 py-1 bg-slate-50 rounded-lg mb-2">Staging</div>
                {stagingTasks.length === 0 && <p className="text-[10px] text-slate-400 italic px-2">No staging tasks.</p>}
                {stagingTasks.slice(0, 8).map(t => (
                  <div key={t.id} className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg cursor-default truncate">
                    • {t.title}
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-1">
                <div className="text-xs font-bold text-slate-900 px-2 py-1 bg-slate-50 rounded-lg mb-2">Backlog</div>
                {backlogTasks.length === 0 && <p className="text-[10px] text-slate-400 italic px-2">No backlog tasks.</p>}
                {backlogTasks.slice(0, 8).map(t => (
                  <div key={t.id} className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg cursor-default truncate">
                    • {t.title}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Target size={14} /> Today's Focus
              </h3>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                 <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                    Use the chat to pull these tasks into your schedule or create new ones.
                 </p>
              </div>
            </div>
          </div>
        )}

        {/* Middle Pane: AI Chat */}
        <div className="flex-1 flex flex-col bg-white relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-8 flex flex-col gap-6">
             <div className="flex flex-col gap-6 py-12 max-w-2xl mx-auto w-full">
                {messages.map((m, i) => (
                   <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] p-6 rounded-3xl font-medium leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-100' 
                          : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                         {m.text}
                      </div>
                   </div>
                ))}
                {loading && (
                   <div className="flex justify-start">
                      <div className="bg-slate-50 p-6 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-3 text-slate-400 italic text-sm">
                         <Loader2 className="animate-spin" size={16} />
                         Reflecting...
                      </div>
                   </div>
                )}
             </div>
          </div>

          <div className="p-8 border-t border-slate-100 bg-white">
             <div className="max-w-2xl mx-auto flex gap-4">
                <input 
                  type="text" 
                  placeholder="Tell your coach about yesterday or today..." 
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={loading}
                  className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                   <Send size={24} />
                </button>
             </div>
             <p className="text-center mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Type "I'm finished" when you're done planning.</p>
          </div>
        </div>

        {/* Right Pane: Calendar View */}
        {!isFocusMode && (
          <div className="w-80 border-l border-slate-200 bg-white flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> Schedule
                </h3>
              </div>
              
              <div className="space-y-3">
                {calendarTasks.length === 0 && (
                  <div className="py-12 text-center">
                    <Clock className="mx-auto text-slate-200 mb-2" size={24} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">No tasks scheduled</p>
                  </div>
                )}
                {calendarTasks.map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">{t.title}</span>
                      {t.completed && <Check size={12} className="text-emerald-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                        {t.startTime || 'No time'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">{t.duration}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Layout size={14} /> Day Overview
              </h3>
              <div className="relative h-[400px] border-l border-slate-100 ml-2">
                 {[8, 10, 12, 14, 16, 18, 20].map(hour => (
                   <div key={hour} className="absolute w-full flex items-center" style={{ top: `${(hour - 8) * 50}px` }}>
                      <div className="w-2 h-px bg-slate-200 -ml-2"></div>
                      <span className="text-[9px] font-black text-slate-300 uppercase ml-2">{hour}:00</span>
                   </div>
                 ))}
                 {calendarTasks.filter(t => t.startTime).map(t => {
                   const [h, m] = (t.startTime || '08:00').split(':').map(Number);
                   const top = (h - 8) * 50 + (m / 60) * 50;
                   const height = (t.duration / 60) * 50;
                   return (
                     <div 
                       key={t.id} 
                       className="absolute left-12 right-0 bg-indigo-600/10 border-l-2 border-indigo-600 p-2 overflow-hidden"
                       style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                     >
                        <span className="text-[9px] font-bold text-indigo-900 truncate block">{t.title}</span>
                     </div>
                   );
                 })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

