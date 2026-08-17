import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const now = new Date();
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      startTime: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lte: new Date(now.getFullYear(), now.getMonth() + 2, 0),
      },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <CalendarView
      initialEvents={events.map((e: any) => ({
        ...e,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
      }))}
    />
  );
}
