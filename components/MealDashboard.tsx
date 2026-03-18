import React, { useState } from 'react';
import { Plus, Trash2, Utensils, ChefHat, Calendar } from 'lucide-react';
import { Recipe, DailyMeals } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays, startOfToday } from 'date-fns';

interface MealDashboardProps {
  recipes: Recipe[];
  mealPlans: Record<string, DailyMeals>;
  onAddRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  onEditDailyMeal: (dateStr: string) => void;
}

export const MealDashboard: React.FC<MealDashboardProps> = ({
  recipes,
  mealPlans,
  onAddRecipe,
  onDeleteRecipe,
  onEditDailyMeal
}) => {
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [newRecipeTitle, setNewRecipeTitle] = useState('');
  const [newRecipeIngredients, setNewRecipeIngredients] = useState('');

  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

  const handleAddRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeTitle.trim()) return;
    
    onAddRecipe({
      id: uuidv4(),
      title: newRecipeTitle,
      ingredients: newRecipeIngredients
    });
    setNewRecipeTitle('');
    setNewRecipeIngredients('');
    setIsAddingRecipe(false);
  };

  const renderDailyPreview = (date: Date, dateStr: string) => {
    const meals = mealPlans[dateStr];
    const hasMeals = meals && (meals.breakfast.title || meals.lunch.title || meals.dinner.title || meals.snacks.title);

    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
          <div>
            <h3 className="font-bold text-gray-800">{format(date, 'EEEE')}</h3>
            <span className="text-xs text-gray-400">{format(date, 'MMM do')}</span>
          </div>
          <button 
            onClick={() => onEditDailyMeal(dateStr)}
            className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-200 hover:bg-green-100 transition-colors"
          >
            Edit Plan
          </button>
        </div>

        {hasMeals ? (
           <div className="space-y-3 flex-1">
             {meals.breakfast.title && (
               <div>
                 <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Breakfast</span>
                 <div className="text-sm font-medium text-gray-700">{meals.breakfast.title}</div>
               </div>
             )}
             {meals.lunch.title && (
               <div>
                 <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Lunch</span>
                 <div className="text-sm font-medium text-gray-700">{meals.lunch.title}</div>
               </div>
             )}
             {meals.dinner.title && (
               <div>
                 <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Dinner</span>
                 <div className="text-sm font-medium text-gray-700">{meals.dinner.title}</div>
               </div>
             )}
             {meals.snacks.title && (
               <div>
                 <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Snacks</span>
                 <div className="text-sm font-medium text-gray-700">{meals.snacks.title}</div>
               </div>
             )}
           </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-6">
            <Utensils size={32} className="opacity-20 mb-2" />
            <span className="text-sm">No meals planned</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
          <ChefHat size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meal Dashboard</h1>
          <p className="text-gray-500">Manage recipes and weekly nutrition</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Daily Previews */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Calendar size={18} /> Upcoming Meals
          </h2>
          <div className="h-64">
            {renderDailyPreview(today, todayStr)}
          </div>
          <div className="h-64">
             {renderDailyPreview(tomorrow, tomorrowStr)}
          </div>
        </div>

        {/* Right Column: Recipe Manager */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <Utensils size={18} /> Saved Recipes
            </h2>
            <button 
              onClick={() => setIsAddingRecipe(true)}
              className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={16} /> Add Recipe
            </button>
          </div>

          {isAddingRecipe && (
             <form onSubmit={handleAddRecipe} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Recipe Title" 
                  className="w-full text-lg font-semibold border-b border-gray-200 pb-2 mb-3 focus:outline-none focus:border-indigo-500"
                  value={newRecipeTitle}
                  onChange={e => setNewRecipeTitle(e.target.value)}
                  autoFocus
                />
                <textarea 
                   placeholder="Ingredients and instructions..." 
                   className="w-full text-sm text-gray-600 bg-gray-50 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-3"
                   rows={3}
                   value={newRecipeIngredients}
                   onChange={e => setNewRecipeIngredients(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                   <button 
                     type="button" 
                     onClick={() => setIsAddingRecipe(false)}
                     className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                   >
                     Save Recipe
                   </button>
                </div>
             </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {recipes.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <div className="text-gray-400 mb-2">No recipes saved yet</div>
                   <button onClick={() => setIsAddingRecipe(true)} className="text-indigo-600 font-medium hover:underline">Create your first recipe</button>
                </div>
             ) : (
                recipes.map(recipe => (
                  <div key={recipe.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow group relative">
                     <button 
                       onClick={() => onDeleteRecipe(recipe.id)}
                       className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       title="Delete Recipe"
                     >
                       <Trash2 size={14} />
                     </button>
                     <h3 className="font-bold text-gray-800 mb-2 pr-6">{recipe.title}</h3>
                     <p className="text-sm text-gray-500 line-clamp-3 whitespace-pre-line">{recipe.ingredients}</p>
                  </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
