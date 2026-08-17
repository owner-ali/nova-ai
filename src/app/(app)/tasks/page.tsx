import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TasksView } from "@/components/tasks/tasks-view";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
  });

  return (
    <TasksView
      initialTasks={tasks.map((t: any) => ({
        ...t,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      }))}
    />
  );
}
