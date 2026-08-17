import "server-only";
import { openai, AI_MODEL, NOVA_SYSTEM_PROMPT } from "@/lib/openai";
import { AGENT_TOOLS, DESTRUCTIVE_TOOLS } from "./tools";
import { executeTool, type ToolResult } from "./executor";
import { prisma } from "@/lib/prisma";
import type OpenAI from "openai";

export type AgentChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AgentTurnResult = {
  reply: string;
  toolCalls: { name: string; args: Record<string, any>; result: ToolResult }[];
  pendingConfirmation?: { name: string; args: Record<string, any> };
};

/**
 * Runs one full agent turn:
 * user command -> LLM picks a tool (or not) -> validate + permission check ->
 * execute on the server -> feed result back to the LLM -> return final natural-language reply.
 */
export async function runAgentTurn(params: {
  userId: string;
  userName: string;
  history: AgentChatMessage[];
  confirmedToolName?: string; // set when the user clicked "Confirm" on a pending destructive action
}): Promise<AgentTurnResult> {
  const { userId, userName, history, confirmedToolName } = params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const memories = user?.memoryEnabled
    ? await prisma.memory.findMany({
        where: { userId },
        orderBy: { importance: "desc" },
        take: 12,
      })
    : [];

  const systemPrompt = NOVA_SYSTEM_PROMPT({
    userName,
    assistantName: user?.assistantName ?? "Nova",
    style: user?.responseStyle ?? "concise",
    memories: memories.map((m: any) => m.content),
  });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m: AgentChatMessage) => ({ role: m.role, content: m.content })),
  ];

  const first = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    tools: AGENT_TOOLS,
    tool_choice: "auto",
  });

  const choice = first.choices[0];
  const toolCalls = choice.message.tool_calls ?? [];
  const executed: AgentTurnResult["toolCalls"] = [];

  if (toolCalls.length === 0) {
    return { reply: choice.message.content ?? "", toolCalls: [] };
  }

  // Execute each requested tool call server-side.
  const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  let pendingConfirmation: AgentTurnResult["pendingConfirmation"];

  for (const call of toolCalls) {
    const name = call.function.name;
    let args: Record<string, any> = {};
    try {
      args = JSON.parse(call.function.arguments || "{}");
    } catch {
      args = {};
    }

    const isConfirmed = confirmedToolName === name;
    const result = await executeTool(userId, name, args, isConfirmed);
    executed.push({ name, args, result });

    if (result.requiresConfirmation && DESTRUCTIVE_TOOLS.has(name)) {
      pendingConfirmation = { name, args };
    }

    toolMessages.push({
      role: "tool",
      tool_call_id: call.id,
      content: JSON.stringify(result),
    });
  }

  if (pendingConfirmation) {
    return {
      reply: `${userName}, ${executed[0].result.message} Do you want me to continue?`,
      toolCalls: executed,
      pendingConfirmation,
    };
  }

  // Feed tool results back so the model can produce a natural-language reply.
  const second = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [...messages, choice.message, ...toolMessages],
  });

  return {
    reply: second.choices[0].message.content ?? "Done.",
    toolCalls: executed,
  };
}
