import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  reminderTime: z.string().datetime(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // UPCOMING | OVERDUE | COMPLETED | ALL
  const now = new Date();

  const where: any = { userId };
  if (scope === "UPCOMING") where.reminderTime = { gte: now };
  if (scope === "OVERDUE") {
    where.reminderTime = { lt: now };
    where.status = "PENDING";
  }
  if (scope === "COMPLETED") where.status = "COMPLETED";

  const reminders = await prisma.reminder.findMany({ where, orderBy: { reminderTime: "asc" } });
  return NextResponse.json({ reminders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Unable to create reminder." }, { status: 400 });

  const reminder = await prisma.reminder.create({
    data: { userId, title: parsed.data.title, reminderTime: new Date(parsed.data.reminderTime) },
  });

  return NextResponse.json({ reminder }, { status: 201 });
}
