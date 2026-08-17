import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE", "DISMISSED"]).optional(),
  title: z.string().min(1).max(200).optional(),
  reminderTime: z.string().datetime().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.reminder.findFirst({ where: { id: id, userId } });
  if (!existing) return NextResponse.json({ error: "Reminder not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const reminder = await prisma.reminder.update({
    where: { id },
    data: {
      ...parsed.data,
      reminderTime: parsed.data.reminderTime ? new Date(parsed.data.reminderTime) : undefined,
    },
  });

  return NextResponse.json({ reminder });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.reminder.findFirst({ where: { id: id, userId } });
  if (!existing) return NextResponse.json({ error: "Reminder not found." }, { status: 404 });

  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
