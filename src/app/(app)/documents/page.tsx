import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentsView } from "@/components/documents/documents-view";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DocumentsView
      initialDocuments={documents.map((d: any) => ({ ...d, createdAt: d.createdAt.toISOString() }))}
    />
  );
}
