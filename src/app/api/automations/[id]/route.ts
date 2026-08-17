import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.automation.findFirst({ where: { id: id, userId } });
  if (!existing) return NextResponse.json({ error: "Automation not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const automation = await prisma.automation.update({ where: { id }, data: { enabled: parsed.data.enabled } });
  return NextResponse.json({ automation });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const existing = await prisma.automation.findFirst({ where: { id: id, userId } });
  if (!existing) return NextResponse.json({ error: "Automation not found." }, { status: 404 });

  await prisma.automation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
