
export type Priority = 'high' | 'medium' | 'low';
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Category {
  id: string;
  name: string;
  color: string; // e.g., 'blue', 'green', 'rose', etc.
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string | null; // YYYY-MM-DD or null (backlog/staging)
  startTime?: string; // HH:mm (24h) or undefined
  duration: number; // in minutes
  priority: Priority;
  completed: boolean;
  order: number;
  stage: 'backlog' | 'staging'; // Workflow status for unscheduled tasks. Scheduled tasks imply 'active'.
  categoryId?: string; // Link to user-defined category
  recurrence?: RecurrencePattern;
  recurrenceGroupId?: string; // To link instances of the same recurring rule
}

export type TasksState = Task[];

export interface AIScheduleResponse {
  scheduledTasks: {
    id: string;
    scheduledDate: string;
    order: number;
    reasoning?: string;
  }[];
}

export interface Meal {
  title: string;
  ingredients: string;
}

export interface DailyMeals {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
}

export interface ShoppingCategory {
  id: string;
  name: string;
  budget: number;
  color: string;
}

export interface ShoppingItem {
  id: string;
  title: string;
  estimatedCost: number;
  completed: boolean;
  categoryId?: string;
}

export type JournalType = 'basic' | 'ritual';

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string; // For basic: text content. For ritual: AI summary.
  date: string;
  type: JournalType;
  lastSaved?: string;
  transcript?: Message[]; // Only for ritual type
}

export interface RitualProposedChanges {
  tasksToAdd: Partial<Task>[];
  tasksToComplete: string[]; // ids
  tasksToRemove: string[]; // ids
  mealsToUpdate?: { date: string, meals: DailyMeals };
}
