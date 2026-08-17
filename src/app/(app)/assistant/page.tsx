import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssistantView } from "@/components/assistant/assistant-view";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const [conversations, user] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  return (
    <AssistantView
      initialConversations={conversations.map((c: any) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))}
      autoSpeak={user?.autoSpeak ?? true}
    />
  );
}
