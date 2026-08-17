import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex">
      <Sidebar userName={session.user.name ?? "Owner"} />
      <div className="min-h-screen flex-1 pb-20 lg:pb-0">{children}</div>
      <MobileNav />
    </div>
  );
}
