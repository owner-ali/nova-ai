import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  durationMin: z.number().refine((v) => [25, 45, 60, 90].includes(v)),
  taskLabel: z.string().max(200).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const sessions = await prisma.focusSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid focus session duration." }, { status: 400 });

  const focusSession = await prisma.focusSession.create({
    data: { userId, durationMin: parsed.data.durationMin, taskLabel: parsed.data.taskLabel },
  });

  return NextResponse.json({ session: focusSession }, { status: 201 });
}
