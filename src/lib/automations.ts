import "server-only";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";

type TriggerPayload = {
  taskTitle?: string;
  taskDescription?: string;
  noteTitle?: string;
  noteContent?: string;
  reminderTitle?: string;
};

/**
 * Runs every enabled automation matching `trigger` for a user, and logs an
 * AutomationRun (success/failed) for each. Called fire-and-forget from the
 * relevant create endpoints — a failure here never blocks the user's request.
 */
export async function runAutomationsForTrigger(userId: string, trigger: string, payload: TriggerPayload) {
  const automations = await prisma.automation.findMany({ where: { userId, trigger, enabled: true } });

  for (const automation of automations) {
    try {
      let detail = "";

      switch (automation.action) {
        case "ai.summarize": {
          const text = payload.taskDescription || payload.noteContent || payload.taskTitle || "";
          if (!text) {
            detail = "Nothing to summarize.";
            break;
          }
          const completion = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
              { role: "system", content: "Summarize in one short sentence." },
              { role: "user", content: text },
            ],
          });
          detail = completion.choices[0].message.content ?? "";
          break;
        }
        case "notify.user": {
          detail = `Notification queued: ${payload.reminderTitle ?? payload.taskTitle ?? "reminder due"}.`;
          break;
        }
        case "ai.extractTasks": {
          if (!payload.noteContent) {
            detail = "No note content to extract from.";
            break;
          }
          const completion = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
              { role: "system", content: "Extract actionable tasks as a short bullet list, or say 'None'." },
              { role: "user", content: payload.noteContent },
            ],
          });
          const text = completion.choices[0].message.content ?? "";
          const lines = text
            .split("\n")
            .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
            .filter((l) => l && l.toLowerCase() !== "none");
          if (lines.length) {
            await prisma.task.createMany({ data: lines.map((title) => ({ userId, title: title.slice(0, 200) })) });
          }
          detail = `Extracted ${lines.length} task(s).`;
          break;
        }
      }

      await prisma.automationRun.create({ data: { automationId: automation.id, status: "success", detail } });
    } catch (err) {
      await prisma.automationRun.create({
        data: { automationId: automation.id, status: "failed", detail: err instanceof Error ? err.message : "Unknown error" },
      });
    }
  }
}
