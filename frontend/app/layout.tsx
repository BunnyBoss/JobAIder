import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "JobAIder",
  description: "AI Job Application Assistant"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

