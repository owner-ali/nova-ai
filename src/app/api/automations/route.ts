import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TRIGGERS = ["task.created", "reminder.due", "note.created"] as const;
const ACTIONS = ["ai.summarize", "notify.user", "ai.extractTasks"] as const;

const createSchema = z.object({
  name: z.string().min(1).max(120),
  trigger: z.enum(TRIGGERS),
  action: z.enum(ACTIONS),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const automations = await prisma.automation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { runs: { orderBy: { runAt: "desc" }, take: 5 } },
  });

  return NextResponse.json({ automations });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please choose a name, trigger, and action." }, { status: 400 });

  const automation = await prisma.automation.create({ data: { userId, ...parsed.data } });
  return NextResponse.json({ automation }, { status: 201 });
}
