import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  category: z.string().max(60).optional(),
  importance: z.number().min(1).max(5).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.memory.findFirst({ where: { id: id, userId } });
  if (!existing) return NextResponse.json({ error: "Memory not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const memory = await prisma.memory.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ memory });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.memory.findFirst({ where: { id: id, userId } });
  if (!existing) return NextResponse.json({ error: "Memory not found." }, { status: 404 });

  await prisma.memory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
