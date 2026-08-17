import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  assistantName: z.string().min(1).max(40).optional(),
  responseStyle: z.enum(["concise", "detailed", "friendly"]).optional(),
  memoryEnabled: z.boolean().optional(),
  voiceEnabled: z.boolean().optional(),
  voiceSpeed: z.number().min(0.5).max(2).optional(),
  voiceLanguage: z.string().max(10).optional(),
  autoSpeak: z.boolean().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(72).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });

  const { currentPassword, newPassword, ...rest } = parsed.data;

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash || !currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  }

  const user = await prisma.user.update({ where: { id: userId }, data: rest });
  return NextResponse.json({ user });
}
