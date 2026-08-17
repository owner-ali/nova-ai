import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAgentTurn } from "@/lib/agent/agent";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  conversationId: z.string().nullish(),
  message: z.string().min(1).max(4000),
  confirmedToolName: z.string().nullish(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in to talk to Nova." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const limited = rateLimit(`ai-chat:${userId}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "You're sending messages a bit fast. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message could not be understood." }, { status: 400 });
  }
  const { message, confirmedToolName } = parsed.data;
  let { conversationId } = parsed.data;

  try {
    if (!conversationId) {
      const conversation = await prisma.conversation.create({
        data: { userId, title: message.slice(0, 60) },
      });
      conversationId = conversation.id;
    } else {
      const owned = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
      if (!owned) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
    }

    await prisma.message.create({
      data: { conversationId, role: "user", content: message },
    });

    const priorMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    const result = await runAgentTurn({
      userId,
      userName: session.user.name ?? "there",
      history: priorMessages.map((m: any) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      confirmedToolName,
    });

    await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: result.reply,
        toolName: result.toolCalls[0]?.name,
        toolArgs: result.toolCalls[0]?.args,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId,
      reply: result.reply,
      toolCalls: result.toolCalls,
      pendingConfirmation: result.pendingConfirmation ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Nova's AI service is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}