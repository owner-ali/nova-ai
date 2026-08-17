import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const document = await prisma.document.findFirst({ where: { id: id, userId } });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ document });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const document = await prisma.document.findFirst({ where: { id: id, userId } });
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  await prisma.document.delete({ where: { id } });
  try {
    await unlink(path.join(process.cwd(), "public", document.storageUrl));
  } catch {
    // best-effort cleanup; missing file shouldn't fail the request
  }

  return NextResponse.json({ ok: true });
}
