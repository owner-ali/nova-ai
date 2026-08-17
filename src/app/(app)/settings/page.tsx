import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <SettingsView
      initialUser={{
        name: user.name,
        email: user.email,
        assistantName: user.assistantName,
        responseStyle: user.responseStyle,
        memoryEnabled: user.memoryEnabled,
        voiceEnabled: user.voiceEnabled,
        voiceSpeed: user.voiceSpeed,
        voiceLanguage: user.voiceLanguage,
        autoSpeak: user.autoSpeak,
      }}
    />
  );
}
