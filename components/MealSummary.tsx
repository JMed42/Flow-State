import React from 'react';
import { DailyMeals } from '../types';
import { Utensils } from 'lucide-react';

interface MealSummaryProps {
  meals?: DailyMeals;
  onClick: () => void;
  compactMode?: boolean;
}

export const MealSummary: React.FC<MealSummaryProps> = ({ meals, onClick, compactMode }) => {
  const hasMeals = meals && (
    meals.breakfast.title || 
    meals.lunch.title || 
    meals.dinner.title || 
    meals.snacks.title
  );

  if (compactMode) {
    return (
      <button 
        onClick={onClick}
        className={`mt-1 w-full text-left p-1 rounded flex items-center justify-center gap-1 text-[10px] font-medium border transition-colors ${
            hasMeals 
             ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
             : 'bg-transparent text-gray-300 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-400'
        }`}
        title={hasMeals ? "View Meal Plan" : "Plan Meals"}
      >
        <Utensils size={10} />
        {hasMeals ? 'Meals' : '+'}
      </button>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`mt-auto border-t p-3 cursor-pointer transition-colors group ${
        hasMeals 
          ? 'bg-green-50/50 border-green-100 hover:bg-green-50' 
          : 'bg-white border-gray-100 hover:bg-gray-50'
      }`}
    >
      {!hasMeals ? (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 group-hover:text-green-600 py-1">
          <Utensils size={12} />
          <span>No meals planned</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">
            <Utensils size={10} /> Meal Plan
          </div>
          
          {meals?.breakfast.title && (
            <div className="flex gap-2 text-xs">
              <span className="text-gray-400 text-[10px] uppercase font-semibold w-12 flex-shrink-0">Brkfst</span>
              <span className="text-gray-700 truncate font-medium">{meals.breakfast.title}</span>
            </div>
          )}
          {meals?.lunch.title && (
            <div className="flex gap-2 text-xs">
               <span className="text-gray-400 text-[10px] uppercase font-semibold w-12 flex-shrink-0">Lunch</span>
               <span className="text-gray-700 truncate font-medium">{meals.lunch.title}</span>
            </div>
          )}
          {meals?.dinner.title && (
            <div className="flex gap-2 text-xs">
               <span className="text-gray-400 text-[10px] uppercase font-semibold w-12 flex-shrink-0">Dinner</span>
               <span className="text-gray-700 truncate font-medium">{meals.dinner.title}</span>
            </div>
          )}
          {meals?.snacks.title && (
            <div className="flex gap-2 text-xs">
               <span className="text-gray-400 text-[10px] uppercase font-semibold w-12 flex-shrink-0">Snack</span>
               <span className="text-gray-700 truncate font-medium">{meals.snacks.title}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
