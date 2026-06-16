"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bot,
  FileSearch,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Moon,
  Sun,
  UserRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user-profile", label: "User Profile", icon: UserRound },
  { href: "/role-analysis", label: "Role Analysis", icon: FileSearch },
  { href: "/gap-analysis", label: "Gap Analysis", icon: Gauge },
  { href: "/improvement-plan", label: "Improvement Plan", icon: Sparkles },
  { href: "/resume-studio", label: "Resume Studio", icon: FileText },
  { href: "/interview-prep", label: "Interview Prep", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings }
];

const AUTH_PATHS = ["/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Route guard: redirect unauthenticated users to /login
  useEffect(() => {
    if (!isLoading && !user && !AUTH_PATHS.includes(pathname)) {
      router.replace("/login");
    }
  }, [isLoading, user, pathname, router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // While loading auth state, render nothing (avoids flash)
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // On auth pages, render children without the sidebar shell
  if (AUTH_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // If not authenticated, don't render anything (redirect is in flight)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card md:flex md:flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold">JobAIder</div>
            <div className="text-xs text-muted-foreground">AI Job Assistant</div>
          </div>
        </div>

        {/* Dark mode toggle */}
        <div className="border-b p-3">
          <button
            className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setDark((v) => !v)}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t p-3">
          <div className="mb-1 px-3 py-1">
            <p className="text-xs font-medium text-foreground truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard" className="font-semibold">JobAIder</Link>
          <BarChart3 className="h-5 w-5" />
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
