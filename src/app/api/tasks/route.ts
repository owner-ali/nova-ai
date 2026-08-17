import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAutomationsForTrigger } from "@/lib/automations";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional(),
  category: z.string().max(60).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: status && status !== "ALL" ? (status as any) : undefined,
      title: search ? { contains: search, mode: "insensitive" } : undefined,
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the task details." }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority ?? "MEDIUM",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      category: parsed.data.category,
    },
  });

  runAutomationsForTrigger(userId, "task.created", { taskTitle: task.title, taskDescription: task.description ?? undefined }).catch(() => {});

  return NextResponse.json({ task }, { status: 201 });
}
