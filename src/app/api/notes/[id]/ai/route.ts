import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ action: z.enum(["summarize", "rewrite", "extractTasks"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const limited = rateLimit(`notes-ai:${userId}`, 15, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });

  const note = await prisma.note.findFirst({ where: { id: id, userId } });
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  const prompts: Record<string, string> = {
    summarize: `Summarize the following note in 2-4 concise sentences:\n\n${note.content}`,
    rewrite: `Rewrite the following note to be clearer and better organized, keeping the same meaning:\n\n${note.content}`,
    extractTasks: `Extract any actionable tasks from the following note as a short bullet list. If there are none, say "No action items found.":\n\n${note.content}`,
  };

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are Nova, a concise and helpful writing assistant." },
        { role: "user", content: prompts[parsed.data.action] },
      ],
    });

    const result = completion.choices[0].message.content ?? "";

    if (parsed.data.action === "extractTasks") {
      const lines = result
        .split("\n")
        .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
        .filter((l) => l && !l.toLowerCase().startsWith("no action items"));

      if (lines.length) {
        await prisma.task.createMany({
          data: lines.map((title) => ({ userId, title: title.slice(0, 200) })),
        });
      }
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Nova's AI service is temporarily unavailable." }, { status: 502 });
  }
}
