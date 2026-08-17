import type OpenAI from "openai";

// JSON-schema tool definitions handed to the OpenAI API.
// Execution of every tool happens server-side only — see executor.ts.
export const AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "createTask",
      description: "Create a new task for the user.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          dueDate: { type: "string", description: "ISO 8601 date/time, if mentioned" },
          category: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateTask",
      description: "Update an existing task's fields (e.g. mark complete, change priority).",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          title: { type: "string" },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "COMPLETED"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          dueDate: { type: "string" },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteTask",
      description: "Delete a task. This is irreversible — only call after the user has confirmed.",
      parameters: {
        type: "object",
        properties: { taskId: { type: "string" } },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listTasks",
      description: "List the user's tasks, optionally filtered by status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "COMPLETED", "ALL"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createReminder",
      description: "Create a reminder for a specific time.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          reminderTime: { type: "string", description: "ISO 8601 date/time" },
        },
        required: ["title", "reminderTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listReminders",
      description: "List the user's upcoming or overdue reminders.",
      parameters: {
        type: "object",
        properties: {
          scope: { type: "string", enum: ["UPCOMING", "OVERDUE", "COMPLETED", "ALL"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createCalendarEvent",
      description: "Create a calendar event.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          startTime: { type: "string", description: "ISO 8601 date/time" },
          endTime: { type: "string", description: "ISO 8601 date/time" },
          location: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "startTime", "endTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listCalendarEvents",
      description: "List the user's calendar events in a date range (defaults to today).",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createNote",
      description: "Create a note.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchNotes",
      description: "Search the user's notes by keyword.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "saveMemory",
      description: "Remember a durable fact or preference about the user for future conversations.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          category: { type: "string" },
          importance: { type: "number", minimum: 1, maximum: 5 },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchMemory",
      description: "Search the user's saved memories by keyword.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "startFocusSession",
      description: "Start a focus/pomodoro session for a given duration.",
      parameters: {
        type: "object",
        properties: {
          durationMin: { type: "number", enum: [25, 45, 60, 90] },
          taskLabel: { type: "string" },
        },
        required: ["durationMin"],
      },
    },
  },
];

export const DESTRUCTIVE_TOOLS = new Set(["deleteTask"]);
