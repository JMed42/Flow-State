import React, { useState } from 'react';
import { User, Palette, Bell, Link2, Database, ChevronRight, Sun, Moon, Monitor, Check } from 'lucide-react';

type ThemeOption = 'light' | 'dark' | 'system';

const SECTIONS = [
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    items: [
      { label: 'Task reminders', description: 'Get notified before scheduled tasks', type: 'toggle', defaultOn: true },
      { label: 'Daily summary', description: 'Morning digest of your day', type: 'toggle', defaultOn: true },
      { label: 'Weekly review', description: 'Sunday reflection prompt', type: 'toggle', defaultOn: false },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Link2,
    items: [
      { label: 'Google Calendar', description: 'Sync events two-way', type: 'link', connected: false },
      { label: 'Notion', description: 'Import tasks from databases', type: 'link', connected: false },
      { label: 'Todoist', description: 'Migrate your task list', type: 'link', connected: false },
    ],
  },
  {
    id: 'data',
    title: 'Data & Privacy',
    icon: Database,
    items: [
      { label: 'Export all data', description: 'Download as JSON', type: 'action' },
      { label: 'Import data', description: 'Restore from backup', type: 'action' },
      { label: 'Clear all data', description: 'Permanently delete everything', type: 'danger' },
    ],
  },
];

export const SettingsDashboard: React.FC = () => {
  const [theme, setTheme] = useState<ThemeOption>('light');
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Task reminders': true,
    'Daily summary': true,
    'Weekly review': false,
  });

  const flipToggle = (label: string) =>
    setToggles(prev => ({ ...prev, [label]: !prev[label] }));

  const THEME_OPTIONS: { id: ThemeOption; label: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-8 py-5">
        <h1 className="text-xl font-semibold text-stone-800 tracking-tight">Settings</h1>
        <p className="text-sm text-stone-400 mt-0.5">Customize your Flow State experience</p>
      </div>

      <div className="max-w-xl mx-auto p-8 space-y-6">

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2.5">
            <User size={14} className="text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-700">Profile</h2>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              F
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-stone-800">Flow State User</div>
              <div className="text-xs text-stone-400 mt-0.5">user@flowstate.app</div>
            </div>
            <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-colors">
              Edit
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2.5">
            <Palette size={14} className="text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-700">Appearance</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="text-xs text-stone-500 font-medium mb-2.5">Theme</div>
              <div className="flex gap-2">
                {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      theme === id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-xs font-medium">{label}</span>
                    {theme === id && <Check size={12} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-sm text-stone-700">Compact Mode</div>
                <div className="text-xs text-stone-400">Denser task cards</div>
              </div>
              <div className="w-10 h-5 bg-stone-200 rounded-full relative cursor-pointer hover:bg-stone-300 transition-colors">
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic sections */}
        {SECTIONS.map(section => (
          <div key={section.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2.5">
              <section.icon size={14} className="text-stone-400" />
              <h2 className="text-sm font-semibold text-stone-700">{section.title}</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {section.items.map((item: any) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    item.type === 'action' || item.type === 'link' ? 'hover:bg-stone-50 cursor-pointer transition-colors' : ''
                  }`}
                >
                  <div>
                    <div className={`text-sm font-medium ${item.type === 'danger' ? 'text-red-600' : 'text-stone-700'}`}>
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-xs text-stone-400 mt-0.5">{item.description}</div>
                    )}
                  </div>
                  {item.type === 'toggle' && (
                    <button
                      onClick={() => flipToggle(item.label)}
                      className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                        toggles[item.label] ? 'bg-indigo-500' : 'bg-stone-200'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                        toggles[item.label] ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  )}
                  {(item.type === 'link' || item.type === 'action') && (
                    <div className="flex items-center gap-2">
                      {item.connected === false && (
                        <span className="text-[11px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Not connected</span>
                      )}
                      <ChevronRight size={14} className="text-stone-300" />
                    </div>
                  )}
                  {item.type === 'danger' && (
                    <ChevronRight size={14} className="text-stone-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-stone-300 py-4">Flow State · v1.0.0 · Built with calm in mind</p>
      </div>
    </div>
  );
};
