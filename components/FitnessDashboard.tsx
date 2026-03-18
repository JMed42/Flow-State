import React, { useState } from 'react';
import { Dumbbell, Flame, Clock, Target, TrendingUp, Plus, Check, Activity, Zap } from 'lucide-react';

const STUB_WORKOUTS = [
  { id: '1', name: 'Morning Run', duration: 30, calories: 280, type: 'Cardio', completed: true },
  { id: '2', name: 'Upper Body Strength', duration: 45, calories: 320, type: 'Strength', completed: false },
  { id: '3', name: 'Evening Yoga', duration: 20, calories: 90, type: 'Flexibility', completed: false },
];

const TYPE_STYLES: Record<string, string> = {
  Cardio: 'bg-orange-100 text-orange-700',
  Strength: 'bg-indigo-100 text-indigo-700',
  Flexibility: 'bg-emerald-100 text-emerald-700',
  HIIT: 'bg-rose-100 text-rose-700',
};

const WEEKLY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACTIVITY_DATA = [true, true, false, true, false, false, false]; // stub

export const FitnessDashboard: React.FC = () => {
  const [workouts, setWorkouts] = useState(STUB_WORKOUTS);

  const toggleWorkout = (id: string) =>
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, completed: !w.completed } : w));

  const completedCount = workouts.filter(w => w.completed).length;
  const totalCalories = workouts.filter(w => w.completed).reduce((s, w) => s + w.calories, 0);
  const totalMinutes = workouts.filter(w => w.completed).reduce((s, w) => s + w.duration, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-stone-800 tracking-tight">Fitness</h1>
          <p className="text-sm text-stone-400 mt-0.5">Stay active, stay focused</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-orange-200">
          <Plus size={15} strokeWidth={2.5} />
          Log Workout
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Workouts Done', value: completedCount, unit: 'today', icon: Dumbbell, bg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
            { label: 'Calories Burned', value: totalCalories, unit: 'kcal', icon: Flame, bg: 'bg-orange-50', iconColor: 'text-orange-500' },
            { label: 'Active Time', value: totalMinutes, unit: 'min', icon: Clock, bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
          ].map(({ label, value, unit, icon: Icon, bg, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={17} className={iconColor} />
              </div>
              <div className="text-2xl font-bold text-stone-800 leading-none">{value}</div>
              <div className="text-xs text-stone-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Weekly Activity Ring */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-stone-400" />
              <h2 className="text-sm font-semibold text-stone-700">Weekly Goal</h2>
            </div>
            <span className="text-xs text-stone-500">{completedCount} / 5 workouts</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 mb-3">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (completedCount / 5) * 100)}%` }}
            />
          </div>
          <div className="flex gap-2 mt-4">
            {WEEKLY_DAYS.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                  ACTIVITY_DATA[i]
                    ? 'bg-orange-400 shadow-sm shadow-orange-200'
                    : i < new Date().getDay() ? 'bg-stone-100' : 'bg-stone-50 border border-stone-200'
                }`}>
                  {ACTIVITY_DATA[i] && <Zap size={12} className="text-white" strokeWidth={2.5} />}
                </div>
                <span className="text-[10px] text-stone-400 font-medium">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Workouts */}
        <div>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Today's Plan</h2>
          <div className="space-y-2">
            {workouts.map(workout => (
              <div
                key={workout.id}
                className={`bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-center gap-4 transition-all ${workout.completed ? 'opacity-60' : 'hover:shadow-md'}`}
              >
                <button
                  onClick={() => toggleWorkout(workout.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    workout.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400 hover:bg-orange-50 hover:text-orange-500'
                  }`}
                >
                  {workout.completed ? <Check size={16} strokeWidth={2.5} /> : <Dumbbell size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${workout.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                    {workout.name}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
                    <span>{workout.duration} min</span>
                    <span>·</span>
                    <span>{workout.calories} kcal</span>
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${TYPE_STYLES[workout.type] || 'bg-stone-100 text-stone-600'}`}>
                  {workout.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="rounded-2xl border-2 border-dashed border-stone-200 p-10 flex flex-col items-center text-center text-stone-400">
          <Activity size={30} className="mb-3 opacity-40" />
          <p className="text-sm font-medium text-stone-500">Progress charts & insights</p>
          <p className="text-xs mt-1">Connect your health data to unlock trends, streaks, and AI coaching</p>
        </div>
      </div>
    </div>
  );
};
