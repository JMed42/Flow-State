
import React, { useState } from 'react';
import { ShoppingCategory, ShoppingItem } from '../types';
import { Plus, Trash2, ShoppingCart, DollarSign, Check, X, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ShoppingDashboardProps {
  categories: ShoppingCategory[];
  items: ShoppingItem[];
  onAddCategory: (category: ShoppingCategory) => void;
  onDeleteCategory: (id: string) => void;
  onAddItem: (item: ShoppingItem) => void;
  onUpdateItem: (item: ShoppingItem) => void;
  onDeleteItem: (id: string) => void;
}

const AVAILABLE_COLORS = ['blue', 'green', 'rose', 'amber', 'purple', 'teal', 'indigo'];

const COLOR_STYLES: Record<string, { bgHeader: string; textHeader: string; border: string; progress: string; barBg: string; ring: string }> = {
  blue: { bgHeader: 'bg-blue-50', textHeader: 'text-blue-800', border: 'border-blue-100', progress: 'bg-blue-500', barBg: 'bg-blue-100', ring: 'ring-blue-500' },
  green: { bgHeader: 'bg-green-50', textHeader: 'text-green-800', border: 'border-green-100', progress: 'bg-green-500', barBg: 'bg-green-100', ring: 'ring-green-500' },
  rose: { bgHeader: 'bg-rose-50', textHeader: 'text-rose-800', border: 'border-rose-100', progress: 'bg-rose-500', barBg: 'bg-rose-100', ring: 'ring-rose-500' },
  amber: { bgHeader: 'bg-amber-50', textHeader: 'text-amber-800', border: 'border-amber-100', progress: 'bg-amber-500', barBg: 'bg-amber-100', ring: 'ring-amber-500' },
  purple: { bgHeader: 'bg-purple-50', textHeader: 'text-purple-800', border: 'border-purple-100', progress: 'bg-purple-500', barBg: 'bg-purple-100', ring: 'ring-purple-500' },
  teal: { bgHeader: 'bg-teal-50', textHeader: 'text-teal-800', border: 'border-teal-100', progress: 'bg-teal-500', barBg: 'bg-teal-100', ring: 'ring-teal-500' },
  indigo: { bgHeader: 'bg-indigo-50', textHeader: 'text-indigo-800', border: 'border-indigo-100', progress: 'bg-indigo-500', barBg: 'bg-indigo-100', ring: 'ring-indigo-500' },
};

export const ShoppingDashboard: React.FC<ShoppingDashboardProps> = ({
  categories,
  items,
  onAddCategory,
  onDeleteCategory,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('100');
  const [newCatColor, setNewCatColor] = useState('blue');

  // Temporary state for new item inputs per category key
  const [newItemInputs, setNewItemInputs] = useState<Record<string, { title: string, cost: string }>>({});

  const getCatInput = (catId: string) => newItemInputs[catId] || { title: '', cost: '' };

  const setCatInput = (catId: string, field: 'title' | 'cost', value: string) => {
    setNewItemInputs(prev => ({
      ...prev,
      [catId]: {
        ...getCatInput(catId),
        [field]: value
      }
    }));
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      id: uuidv4(),
      name: newCatName,
      budget: parseFloat(newCatBudget) || 0,
      color: newCatColor
    });
    setNewCatName('');
    setNewCatBudget('100');
    setIsCreatingCategory(false);
  };

  const handleAddItemToCategory = (e: React.FormEvent, catId?: string) => {
    e.preventDefault();
    const inputKey = catId || 'uncategorized';
    const input = getCatInput(inputKey);
    
    if (!input.title.trim()) return;

    onAddItem({
      id: uuidv4(),
      title: input.title,
      estimatedCost: parseFloat(input.cost) || 0,
      completed: false,
      categoryId: catId
    });

    // Reset input
    setCatInput(inputKey, 'title', '');
    setCatInput(inputKey, 'cost', '');
  };

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpend = items.reduce((sum, i) => sum + (i.completed ? i.estimatedCost : 0), 0);
  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedCost, 0);

  const renderCategoryCard = (category?: ShoppingCategory) => {
    const isUncategorized = !category;
    const catItems = items.filter(i => isUncategorized ? !i.categoryId : i.categoryId === category!.id);
    const catTotal = catItems.reduce((sum, i) => sum + i.estimatedCost, 0);
    const progress = !isUncategorized && category!.budget > 0 ? (catTotal / category!.budget) * 100 : 0;
    const isOverBudget = !isUncategorized && catTotal > category!.budget;

    // Determine colors
    const colorKey = category?.color || 'blue'; // default to blue logic if missing, though uncategorized uses gray
    const styles = COLOR_STYLES[colorKey] || COLOR_STYLES.blue;
    
    const bgHeader = isUncategorized ? 'bg-gray-100' : styles.bgHeader;
    const textHeader = isUncategorized ? 'text-gray-700' : styles.textHeader;
    const borderColor = isUncategorized ? 'border-gray-200' : styles.border;

    return (
      <div key={category?.id || 'uncategorized'} className={`bg-white rounded-xl border ${borderColor} shadow-sm flex flex-col transition-all hover:shadow-md`}>
        {/* Header */}
        <div className={`p-4 border-b ${borderColor} ${bgHeader} rounded-t-xl`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className={`font-bold ${textHeader} flex items-center gap-2`}>
                {isUncategorized ? 'Uncategorized' : category!.name}
                {isOverBudget && <AlertCircle size={16} className="text-red-500 animate-pulse" />}
              </h3>
              {!isUncategorized && (
                <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mt-1">
                  <span className={isOverBudget ? 'text-red-600 font-bold' : ''}>
                     ${catTotal.toFixed(2)}
                  </span>
                  <span className="opacity-50">/</span>
                  <span>${category!.budget}</span>
                </div>
              )}
            </div>
            {!isUncategorized && (
              <button 
                onClick={() => onDeleteCategory(category!.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-white/50 rounded"
                title="Delete Category"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          
          {/* Progress Bar */}
          {!isUncategorized && (
            <div className={`h-2 w-full ${styles.barBg} bg-opacity-50 rounded-full overflow-hidden`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${isOverBudget ? 'bg-red-500' : styles.progress}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Item List */}
        <div className="p-2 flex-1 space-y-1">
          {catItems.map(item => (
            <div key={item.id} className="group flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <button 
                onClick={() => onUpdateItem({ ...item, completed: !item.completed })}
                className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                {item.completed && <Check size={10} strokeWidth={4} />}
              </button>
              
              <div className="flex-1 min-w-0 flex flex-col">
                 <span className={`text-sm leading-tight truncate ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                   {item.title}
                 </span>
              </div>

              <div className="flex items-center gap-2">
                {item.estimatedCost > 0 && (
                   <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center">
                     <span className="text-[9px] opacity-60 mr-0.5">$</span>{item.estimatedCost}
                   </span>
                )}
                <button 
                  onClick={() => onDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}

          {catItems.length === 0 && (
             <div className="py-4 text-center text-xs text-gray-300 italic">No items</div>
          )}
        </div>

        {/* Footer Input */}
        <form 
          onSubmit={(e) => handleAddItemToCategory(e, category?.id)} 
          className="p-3 border-t border-gray-100 flex gap-2 bg-gray-50/30 rounded-b-xl"
        >
          <input 
            type="text"
            placeholder="Add item..."
            className="flex-1 min-w-0 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            value={getCatInput(category?.id || 'uncategorized').title}
            onChange={(e) => setCatInput(category?.id || 'uncategorized', 'title', e.target.value)}
          />
          <div className="relative w-16">
             <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <DollarSign size={10} />
             </div>
             <input 
               type="number"
               placeholder="0"
               min="0"
               step="0.01"
               className="w-full bg-white border border-gray-200 rounded pl-5 pr-1 py-1.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
               value={getCatInput(category?.id || 'uncategorized').cost}
               onChange={(e) => setCatInput(category?.id || 'uncategorized', 'cost', e.target.value)}
             />
          </div>
          <button 
             type="submit"
             className="bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 px-2 rounded transition-colors"
          >
             <Plus size={14} />
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full flex flex-col">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Shopping Lists</h1>
            <p className="text-gray-500 text-sm">Manage budgets and buy lists</p>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex flex-col items-end min-w-[120px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Est.</span>
              <span className="text-xl font-bold text-gray-800">${totalEstimated.toFixed(0)}</span>
           </div>
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex flex-col items-end min-w-[120px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Budget</span>
              <span className={`text-xl font-bold ${totalEstimated > totalBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                ${totalBudget.toFixed(0)}
              </span>
           </div>
           <button 
             onClick={() => setIsCreatingCategory(true)}
             className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium"
           >
             <Plus size={18} /> New Category
           </button>
        </div>
      </div>

      {/* Category Creation Form */}
      {isCreatingCategory && (
        <div className="mb-8 bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
           <form onSubmit={handleCreateCategory} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                 <label className="block text-xs font-bold text-indigo-800 mb-1">Category Name</label>
                 <input 
                   type="text" 
                   autoFocus
                   required
                   placeholder="e.g., Weekly Groceries"
                   className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={newCatName}
                   onChange={e => setNewCatName(e.target.value)}
                 />
              </div>
              <div className="w-full md:w-32">
                 <label className="block text-xs font-bold text-indigo-800 mb-1">Budget ($)</label>
                 <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                        <DollarSign size={14} />
                    </div>
                    <input 
                      type="number" 
                      required
                      min="0"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newCatBudget}
                      onChange={e => setNewCatBudget(e.target.value)}
                    />
                 </div>
              </div>
              <div className="w-full md:w-auto">
                 <label className="block text-xs font-bold text-indigo-800 mb-1">Color</label>
                 <div className="flex gap-2 bg-white p-2 rounded-lg border border-indigo-200">
                    {AVAILABLE_COLORS.map(c => (
                       <button
                         key={c}
                         type="button"
                         onClick={() => setNewCatColor(c)}
                         className={`w-6 h-6 rounded-full transition-all duration-200 ${
                            newCatColor === c 
                              ? `ring-2 ring-offset-2 ${COLOR_STYLES[c].ring} scale-110` 
                              : 'hover:scale-110 opacity-70 hover:opacity-100'
                         }`}
                         style={{ backgroundColor: `var(--color-${c}-400, ${c})` }} // Fallback
                       >
                         {/* Explicit dot for current selection */}
                         <span className={`block w-full h-full rounded-full bg-${c}-400`}></span>
                       </button>
                    ))}
                 </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <button 
                   type="button"
                   onClick={() => setIsCreatingCategory(false)}
                   className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex-1"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex-1"
                 >
                   Create
                 </button>
              </div>
           </form>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 overflow-y-auto scrollbar-thin">
         {categories.map(cat => renderCategoryCard(cat))}
         
         {/* Always show Uncategorized card last */}
         {renderCategoryCard(undefined)}
      </div>
    </div>
  );
};
