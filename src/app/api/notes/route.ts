import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAutomationsForTrigger } from "@/lib/automations";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(20000),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const notes = await prisma.note.findMany({
    where: {
      userId,
      OR: search
        ? [{ title: { contains: search, mode: "insensitive" } }, { content: { contains: search, mode: "insensitive" } }]
        : undefined,
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please add a title and content." }, { status: 400 });

  const note = await prisma.note.create({ data: { userId, ...parsed.data } });

  runAutomationsForTrigger(userId, "note.created", { noteTitle: note.title, noteContent: note.content }).catch(() => {});

  return NextResponse.json({ note }, { status: 201 });
}
