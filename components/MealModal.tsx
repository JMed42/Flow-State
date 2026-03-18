import React, { useState, useEffect } from 'react';
import { DailyMeals, Meal } from '../types';
import { X, Save, Utensils, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  existingMeals?: DailyMeals;
  onSave: (dateStr: string, meals: DailyMeals) => void;
}

const emptyMeal: Meal = { title: '', ingredients: '' };

export const MealModal: React.FC<MealModalProps> = ({ 
  isOpen, 
  onClose, 
  dateStr, 
  existingMeals, 
  onSave 
}) => {
  const [meals, setMeals] = useState<DailyMeals>({
    breakfast: { ...emptyMeal },
    lunch: { ...emptyMeal },
    dinner: { ...emptyMeal },
    snacks: { ...emptyMeal },
  });

  useEffect(() => {
    if (isOpen && existingMeals) {
      setMeals(existingMeals);
    } else if (isOpen) {
      // Reset if no existing meals
      setMeals({
        breakfast: { ...emptyMeal },
        lunch: { ...emptyMeal },
        dinner: { ...emptyMeal },
        snacks: { ...emptyMeal },
      });
    }
  }, [isOpen, existingMeals]);

  if (!isOpen || !dateStr) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(dateStr, meals);
    onClose();
  };

  const updateMeal = (type: keyof DailyMeals, field: keyof Meal, value: string) => {
    setMeals(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const formattedDate = dateStr ? format(parseISO(dateStr), 'EEEE, MMMM d, yyyy') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-green-100 bg-green-50 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-lg text-green-700">
               <Utensils size={20} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-800">Meal Planning</h2>
               <p className="text-sm text-gray-500 font-medium">{formattedDate}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white/50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto scrollbar-thin">
          
          {/* Breakfast */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm uppercase tracking-wider">
               <Coffee size={16} /> Breakfast
            </div>
            <input 
              type="text" 
              placeholder="What's for breakfast? (e.g., Avocado toast)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              value={meals.breakfast.title}
              onChange={e => updateMeal('breakfast', 'title', e.target.value)}
            />
            <textarea
              placeholder="Ingredients or recipe notes..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
              value={meals.breakfast.ingredients}
              onChange={e => updateMeal('breakfast', 'ingredients', e.target.value)}
            />
          </div>

          {/* Lunch */}
          <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm uppercase tracking-wider">
               <Sun size={16} /> Lunch
            </div>
            <input 
              type="text" 
              placeholder="What's for lunch? (e.g., Chicken salad wrap)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              value={meals.lunch.title}
              onChange={e => updateMeal('lunch', 'title', e.target.value)}
            />
            <textarea
              placeholder="Ingredients or recipe notes..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
              value={meals.lunch.ingredients}
              onChange={e => updateMeal('lunch', 'ingredients', e.target.value)}
            />
          </div>

          {/* Dinner */}
          <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm uppercase tracking-wider">
               <Moon size={16} /> Dinner
            </div>
            <input 
              type="text" 
              placeholder="What's for dinner? (e.g., Grilled salmon)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              value={meals.dinner.title}
              onChange={e => updateMeal('dinner', 'title', e.target.value)}
            />
            <textarea
              placeholder="Ingredients or recipe notes..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
              value={meals.dinner.ingredients}
              onChange={e => updateMeal('dinner', 'ingredients', e.target.value)}
            />
          </div>

           {/* Snacks */}
           <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-2 text-pink-600 font-semibold text-sm uppercase tracking-wider">
               <Cookie size={16} /> Snacks
            </div>
            <textarea
              placeholder="Planned snacks? (e.g., Apple with peanut butter)"
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
              value={meals.snacks.title}
              onChange={e => updateMeal('snacks', 'title', e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow flex items-center gap-2"
            >
              <Save size={16} />
              Save Meal Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
