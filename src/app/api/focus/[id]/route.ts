import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ completed: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.focusSession.findFirst({ where: { id: id, userId } });
  if (!existing) return NextResponse.json({ error: "Focus session not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const focusSession = await prisma.focusSession.update({
    where: { id },
    data: { completed: parsed.data.completed, endedAt: new Date() },
  });

  return NextResponse.json({ session: focusSession });
}
