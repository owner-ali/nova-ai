import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Nova AI — Your AI assistant that gets things done.",
  description: "Nova AI is a personal AI assistant with voice, tasks, reminders, calendar, notes, and memory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-base-950 font-body text-white antialiased">
        <div className="pointer-events-none fixed inset-0 bg-nova-radial" />
        <div className="relative">
          <AuthProvider>{children}</AuthProvider>
        </div>
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
