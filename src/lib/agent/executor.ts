import "server-only";
import { prisma } from "@/lib/prisma";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { DESTRUCTIVE_TOOLS } from "./tools";

/**
 * Every function here takes the authenticated userId as its first argument
 * and every Prisma query is scoped with `where: { userId }` (and re-checked
 * on update/delete) so one user can never read or mutate another user's data.
 *
 * This module is the ONLY place tool calls are executed. The frontend never
 * calls these directly — it only ever talks to /api/ai/chat and /api/ai/command,
 * which run on the server.
 */

export type ToolResult = {
  ok: boolean;
  requiresConfirmation?: boolean;
  data?: unknown;
  message: string;
};

export async function executeTool(
  userId: string,
  name: string,
  args: Record<string, any>,
  confirmed: boolean
): Promise<ToolResult> {
  // Destructive tools require an explicit confirmation flag from the client,
  // which is only set after the user clicks "Confirm" in the UI.
  if (DESTRUCTIVE_TOOLS.has(name) && !confirmed) {
    return {
      ok: false,
      requiresConfirmation: true,
      message: `This action (${name}) is irreversible and needs your confirmation before I proceed.`,
    };
  }

  switch (name) {
    case "createTask": {
      const task = await prisma.task.create({
        data: {
          userId,
          title: args.title,
          description: args.description ?? null,
          priority: (args.priority as TaskPriority) ?? "MEDIUM",
          dueDate: args.dueDate ? new Date(args.dueDate) : null,
          category: args.category ?? null,
        },
      });
      return { ok: true, data: task, message: `Created task "${task.title}".` };
    }

    case "updateTask": {
      const existing = await prisma.task.findFirst({ where: { id: args.taskId, userId } });
      if (!existing) return { ok: false, message: "I couldn't find that task." };
      const task = await prisma.task.update({
        where: { id: existing.id },
        data: {
          title: args.title ?? undefined,
          status: (args.status as TaskStatus) ?? undefined,
          priority: (args.priority as TaskPriority) ?? undefined,
          dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
        },
      });
      return { ok: true, data: task, message: `Updated task "${task.title}".` };
    }

    case "deleteTask": {
      const existing = await prisma.task.findFirst({ where: { id: args.taskId, userId } });
      if (!existing) return { ok: false, message: "I couldn't find that task." };
      await prisma.task.delete({ where: { id: existing.id } });
      return { ok: true, message: `Deleted task "${existing.title}".` };
    }

    case "listTasks": {
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          status: args.status && args.status !== "ALL" ? (args.status as TaskStatus) : undefined,
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: args.limit ?? 20,
      });
      return { ok: true, data: tasks, message: `Found ${tasks.length} task(s).` };
    }

    case "createReminder": {
      const reminder = await prisma.reminder.create({
        data: { userId, title: args.title, reminderTime: new Date(args.reminderTime) },
      });
      return { ok: true, data: reminder, message: `Reminder set: "${reminder.title}".` };
    }

    case "listReminders": {
      const now = new Date();
      const where: any = { userId };
      if (args.scope === "UPCOMING") where.reminderTime = { gte: now };
      if (args.scope === "OVERDUE") {
        where.reminderTime = { lt: now };
        where.status = "PENDING";
      }
      if (args.scope === "COMPLETED") where.status = "COMPLETED";
      const reminders = await prisma.reminder.findMany({
        where,
        orderBy: { reminderTime: "asc" },
        take: 20,
      });
      return { ok: true, data: reminders, message: `Found ${reminders.length} reminder(s).` };
    }

    case "createCalendarEvent": {
      const event = await prisma.calendarEvent.create({
        data: {
          userId,
          title: args.title,
          startTime: new Date(args.startTime),
          endTime: new Date(args.endTime),
          location: args.location ?? null,
          description: args.description ?? null,
        },
      });
      return { ok: true, data: event, message: `Scheduled "${event.title}".` };
    }

    case "listCalendarEvents": {
      const from = args.from ? new Date(args.from) : new Date(new Date().setHours(0, 0, 0, 0));
      const to = args.to ? new Date(args.to) : new Date(new Date().setHours(23, 59, 59, 999));
      const events = await prisma.calendarEvent.findMany({
        where: { userId, startTime: { gte: from, lte: to } },
        orderBy: { startTime: "asc" },
      });
      return { ok: true, data: events, message: `Found ${events.length} event(s).` };
    }

    case "createNote": {
      const note = await prisma.note.create({
        data: { userId, title: args.title, content: args.content },
      });
      return { ok: true, data: note, message: `Created note "${note.title}".` };
    }

    case "searchNotes": {
      const notes = await prisma.note.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: args.query, mode: "insensitive" } },
            { content: { contains: args.query, mode: "insensitive" } },
          ],
        },
        take: 10,
      });
      return { ok: true, data: notes, message: `Found ${notes.length} note(s).` };
    }

    case "saveMemory": {
      const memory = await prisma.memory.create({
        data: {
          userId,
          content: args.content,
          category: args.category ?? "general",
          importance: args.importance ?? 3,
        },
      });
      return { ok: true, data: memory, message: "Got it, I'll remember that." };
    }

    case "searchMemory": {
      const memories = await prisma.memory.findMany({
        where: { userId, content: { contains: args.query, mode: "insensitive" } },
        take: 10,
      });
      return { ok: true, data: memories, message: `Found ${memories.length} memory(ies).` };
    }

    case "startFocusSession": {
      const session = await prisma.focusSession.create({
        data: { userId, durationMin: args.durationMin, taskLabel: args.taskLabel ?? null },
      });
      return { ok: true, data: session, message: `Started a ${args.durationMin}-minute focus session.` };
    }

    default:
      return { ok: false, message: `Unknown tool: ${name}` };
  }
}
