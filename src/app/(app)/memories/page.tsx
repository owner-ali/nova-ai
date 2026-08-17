import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemoriesView } from "@/components/memories/memories-view";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
  });

  return <MemoriesView initialMemories={memories} />;
}
