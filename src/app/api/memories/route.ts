import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  content: z.string().min(1).max(1000),
  category: z.string().max(60).optional(),
  importance: z.number().min(1).max(5).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const memories = await prisma.memory.findMany({
    where: { userId, content: search ? { contains: search, mode: "insensitive" } : undefined },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ memories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please enter something to remember." }, { status: 400 });

  const memory = await prisma.memory.create({
    data: {
      userId,
      content: parsed.data.content,
      category: parsed.data.category ?? "general",
      importance: parsed.data.importance ?? 3,
    },
  });

  return NextResponse.json({ memory }, { status: 201 });
}
