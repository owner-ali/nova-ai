import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotesView } from "@/components/notes/notes-view";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return <NotesView initialNotes={notes.map((n: any) => ({ ...n, updatedAt: n.updatedAt.toISOString() }))} />;
}
