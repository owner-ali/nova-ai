import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runAgentTurn } from "@/lib/agent/agent";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  command: z.string().min(1).max(2000),
  confirmedToolName: z.string().optional(),
});

// Used by the voice assistant: a single natural-language command in, a spoken-ready reply out.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const limited = rateLimit(`ai-command:${userId}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many commands in a row. Give me a second." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "I didn't catch that command." }, { status: 400 });
  }

  try {
    const result = await runAgentTurn({
      userId,
      userName: session.user.name ?? "there",
      history: [{ role: "user", content: parsed.data.command }],
      confirmedToolName: parsed.data.confirmedToolName,
    });

    return NextResponse.json({
      reply: result.reply,
      toolCalls: result.toolCalls,
      pendingConfirmation: result.pendingConfirmation ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Nova's AI service is temporarily unavailable." }, { status: 502 });
  }
}
