import React from 'react';
import { Calendar, Utensils, Dumbbell, Wallet, Settings, Sun } from 'lucide-react';

export type AppNavItem = 'calendar' | 'meals' | 'fitness' | 'budget' | 'settings';

const NAV_ITEMS: { id: AppNavItem; icon: React.FC<{ size?: number; strokeWidth?: number }>; label: string }[] = [
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'meals', icon: Utensils, label: 'Meal Planning' },
  { id: 'fitness', icon: Dumbbell, label: 'Fitness' },
  { id: 'budget', icon: Wallet, label: 'Budget' },
];

interface NavButtonProps {
  icon: React.FC<{ size?: number; strokeWidth?: number }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
      isActive
        ? 'bg-indigo-50 text-indigo-600'
        : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
    }`}
  >
    {isActive && (
      <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full" />
    )}
    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} />
  </button>
);

interface LeftSidebarProps {
  activeNav: AppNavItem;
  onNavChange: (nav: AppNavItem) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeNav, onNavChange }) => {
  return (
    <div className="w-[60px] bg-white border-r border-stone-200 flex flex-col items-center pt-5 pb-5 gap-1 z-30 flex-shrink-0 shadow-sm">
      {/* Logo */}
      <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mb-5 shadow-md shadow-indigo-200">
        <Sun size={17} className="text-white" strokeWidth={2.5} />
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <NavButton
            key={id}
            icon={icon}
            label={label}
            isActive={activeNav === id}
            onClick={() => onNavChange(id)}
          />
        ))}
      </nav>

      {/* Settings at bottom */}
      <NavButton
        icon={Settings}
        label="Settings"
        isActive={activeNav === 'settings'}
        onClick={() => onNavChange('settings')}
      />
    </div>
  );
};
