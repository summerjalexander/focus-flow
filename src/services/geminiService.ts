import { GoogleGenAI, Type } from "@google/genai";
import { Subtask } from "../types";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. Please set it in your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getEncouragement = async (taskText: string, subtasks: Subtask[]): Promise<string> => {
  if (!API_KEY) {
    return "Great job! Keep up the fantastic work!";
  }

  const subtaskListString = subtasks.length > 0
    ? `The user broke this down into these steps:\n${subtasks.map(s => `- ${s.text}`).join('\n')}`
    : "This task had no sub-steps.";

  const prompt = `You are an encouraging AI assistant for a user with ADHD. Your goal is to provide a specific, creative, and validating message when they complete a task.

The user just completed the following task: "${taskText}"
${subtaskListString}

Generate a short, uplifting, and encouraging message (under 30 words).
- Be creative and connect the message to the *content* of the task itself. For example, if the task is "schedule a dentist appointment", you could say "Great job scheduling that appointment! Your future smile thanks you."
- If there were sub-tasks, you can acknowledge the great planning. If not, just celebrate the single accomplishment.
- Acknowledge the effort, be positive, and avoid generic platitudes like "Good job!". Make it sound personal and genuine.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching encouragement from Gemini API:", error);
    return "You did it! That's awesome progress. What's next?";
  }
};

export const generateSubtasks = async (taskText: string): Promise<string[]> => {
  if (!API_KEY) {
    return [];
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Break down the following task for someone with ADHD into 3-5 simple, actionable sub-tasks. Return ONLY a JSON array of strings. Task: "${taskText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const subtasks = JSON.parse(jsonText);
    return Array.isArray(subtasks) ? subtasks : [];
  } catch (error) {
    console.error("Error generating subtasks from Gemini API:", error);
    return [];
  }
};
