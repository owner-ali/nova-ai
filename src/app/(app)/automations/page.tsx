import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutomationsView } from "@/components/automations/automations-view";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const automations = await prisma.automation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { runs: { orderBy: { runAt: "desc" }, take: 5 } },
  });

  return (
    <AutomationsView
      initialAutomations={automations.map((a: any) => ({
        ...a,
        runs: a.runs.map((r: any) => ({ ...r, runAt: r.runAt.toISOString() })),
      }))}
    />
  );
}
