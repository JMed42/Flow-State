
import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '../types';
import { ChevronLeft, Maximize2, Minimize2, Check, Copy } from 'lucide-react';

interface BasicEntryEditorProps {
  entry: JournalEntry;
  onSave: (content: string, title: string) => void;
  onClone: () => void;
  onExit: () => void;
}

export const BasicEntryEditor: React.FC<BasicEntryEditorProps> = ({ entry, onSave, onClone, onExit }) => {
  const [content, setContent] = useState(entry.content);
  const [title, setTitle] = useState(entry.title);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<any | null>(null);

  // Sync state if entry changes (e.g. from switching entries)
  useEffect(() => {
    setContent(entry.content);
    setTitle(entry.title);
  }, [entry.id]);

  useEffect(() => {
    if (content !== entry.content || title !== entry.title) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      setSaving(true);
      saveTimeout.current = setTimeout(() => {
        onSave(content, title);
        setSaving(false);
      }, 1000);
    }
  }, [content, title]);

  return (
    <div className={`flex flex-col h-full bg-white transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[100]' : 'relative'}`}>
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-6 flex-1">
          <button 
            onClick={onExit}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all flex-shrink-0"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col flex-1 max-w-xl">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-black text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0"
              placeholder="Enter title..."
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Drafting • {new Date(entry.date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="mr-4">
              {saving ? (
                <div className="flex items-center gap-2 text-indigo-500 text-[10px] font-black uppercase">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></div>
                    Saving...
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase">
                    <Check size={12} />
                    Synced
                </div>
              )}
           </div>
           
           <button 
             onClick={onClone}
             title="Duplicate Entry"
             className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
           >
             <Copy size={20} />
           </button>

           <button 
             onClick={() => setIsFullScreen(!isFullScreen)}
             className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
           >
             {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-thin py-20 px-4">
        <textarea 
          autoFocus
          className="w-full max-w-3xl flex-1 bg-transparent text-xl font-medium leading-relaxed text-slate-800 placeholder:text-slate-200 border-none outline-none focus:ring-0 resize-none min-h-[500px]"
          placeholder="Start writing your thoughts here..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="w-full max-w-3xl mt-20 pt-10 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
           <span>{content.trim() ? content.trim().split(/\s+/).length : 0} Words</span>
           <span>Character Count: {content.length}</span>
        </div>
      </div>
    </div>
  );
};
