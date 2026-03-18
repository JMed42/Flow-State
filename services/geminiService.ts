
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const optimizeSchedule = async (
  currentTasks: Task[],
  availableDates: string[]
): Promise<Task[]> => {
  const activeTasks = currentTasks.filter(t => !t.completed);
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];
  
  const prompt = `
    You are an expert productivity assistant (Sunsama/Akiflow style). I have a list of tasks that need scheduling.
    Today's Date: ${todayStr}
    Current Time: ${currentTimeStr}
    Available Planning Window: ${availableDates.join(', ')}
    
    Rules for Scheduling:
    1. Distribute tasks across the window. Do not overfill a single day (max 400 mins/day).
    2. Suggest a START TIME (HH:mm) for every task you schedule. 
    3. If scheduling for today (${todayStr}), the startTime MUST be after ${currentTimeStr}.
    4. Prioritize 'staging' stage and 'high' priority tasks for earlier slots.
    5. Group similar tasks if possible.
    6. If a task already has a startTime, you may keep it or move it if it helps the overall flow.
    
    Return a JSON object with an 'updates' array. 
    Each update MUST have: id, scheduledDate (YYYY-MM-DD), startTime (HH:mm), and order (integer).
    
    Current Task Backlog/Active:
    ${JSON.stringify(activeTasks.map(({id, title, priority, duration, scheduledDate, startTime, stage}) => ({id, title, priority, duration, scheduledDate, startTime, stage})))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            updates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  scheduledDate: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  order: { type: Type.NUMBER }
                },
                required: ["id", "scheduledDate", "startTime", "order"]
              }
            }
          },
          required: ["updates"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return currentTasks;

    const result = JSON.parse(jsonText) as { updates: { id: string, scheduledDate: string, startTime: string, order: number }[] };
    
    const newTasks = [...currentTasks];
    result.updates.forEach(update => {
      const index = newTasks.findIndex(t => t.id === update.id);
      if (index !== -1) {
        newTasks[index] = {
          ...newTasks[index],
          scheduledDate: update.scheduledDate,
          startTime: update.startTime,
          order: update.order,
          stage: 'staging'
        };
      }
    });

    return newTasks;

  } catch (error) {
    console.error("Gemini Scheduling Error:", error);
    return currentTasks;
  }
};

export const suggestTaskTime = async (
  task: Partial<Task>,
  existingTasks: Task[],
  targetDate: string
): Promise<{ scheduledDate: string; startTime: string }> => {
  const scheduledOnDay = existingTasks.filter(t => t.scheduledDate === targetDate && t.startTime);
  const now = new Date();
  const isToday = targetDate === now.toISOString().split('T')[0];
  const minTime = isToday ? `${(now.getHours() + 1).toString().padStart(2, '0')}:00` : "08:00";
  
  const prompt = `
    Find the best available time slot for a new task on ${targetDate}.
    Task: "${task.title}" (${task.duration} mins, ${task.priority} priority).
    Constraint: If today, must be after ${minTime}.
    Existing schedule: ${JSON.stringify(scheduledOnDay.map(t => ({ title: t.title, start: t.startTime, duration: t.duration })))}
    Return startTime in HH:mm.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING }
          },
          required: ["startTime"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"startTime":"09:00"}');
    return {
      scheduledDate: targetDate,
      startTime: result.startTime
    };
  } catch (error) {
    return { scheduledDate: targetDate, startTime: "09:00" };
  }
};
