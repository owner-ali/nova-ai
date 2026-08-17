import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ question: z.string().min(1).max(1000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const limited = rateLimit(`doc-ask:${userId}`, 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Please wait a moment before asking again." }, { status: 429 });

  const document = await prisma.document.findFirst({ where: { id: id, userId } });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!document.extractedText) return NextResponse.json({ error: "This document has no readable text." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please ask a question." }, { status: 400 });

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "Answer the user's question using only the document content provided. If the answer isn't in the document, say so.",
        },
        { role: "user", content: `Document "${document.fileName}":\n\n${document.extractedText.slice(0, 12000)}\n\nQuestion: ${parsed.data.question}` },
      ],
    });

    return NextResponse.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Nova's AI service is temporarily unavailable." }, { status: 502 });
  }
}
