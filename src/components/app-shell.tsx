"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  Plus,
  Settings,
  Tags,
  X,
} from "lucide-react";
import { TaskDialog } from "@/components/task-dialog";
import { Button } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
import { useData } from "@/providers/data-provider";
import {
  selectActive,
  selectCompleted,
  selectOverdue,
  selectToday,
  selectUpcoming,
} from "@/lib/selectors";
import { cn, initials } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof CalendarDays;
  count?: number;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, tasks } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const todayCount =
    selectToday(tasks).length + selectOverdue(tasks).length;

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/today", label: "Today", icon: CalendarDays, count: todayCount },
    { href: "/upcoming", label: "Upcoming", icon: CalendarClock, count: selectUpcoming(tasks).length },
    { href: "/tasks", label: "All Tasks", icon: ListTodo, count: selectActive(tasks).length },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/projects", label: "Projects & Classes", icon: FolderKanban },
    { href: "/completed", label: "Completed", icon: CheckCircle2, count: selectCompleted(tasks).length },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "You";
  const email = user?.email ?? "";

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2.5 px-2 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_8px_24px_-10px_var(--accent)]">
          <Moon className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-foreground">Nook</p>
          <p className="text-[11px] text-muted-2">Stay cozy, stay on track</p>
        </div>
      </div>

      <Button
        className="mx-1 mt-1 justify-start"
        onClick={() => setNewTaskOpen(true)}
      >
        <Plus className="h-4 w-4" />
        New task
      </Button>

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-ring",
                active
                  ? "bg-surface-2 text-foreground shadow-[inset_0_0_0_1px_var(--border-strong)]"
                  : "text-muted hover:bg-surface-2/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-accent" : "text-muted-2 group-hover:text-muted",
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {typeof item.count === "number" && item.count > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    active ? "bg-accent/20 text-accent" : "bg-surface-3 text-muted",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-border bg-surface-2/50 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {initials(displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-[11px] text-muted-2">{email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-border-strong hover:text-foreground focus-ring"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );

  const currentLabel =
    nav.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ?? "Nook";

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-surface/60 backdrop-blur-md lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-nook-fade"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[82vw] border-r border-border bg-surface shadow-2xl animate-nook-in">
            <button
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground focus-ring"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-border p-2 text-muted transition hover:text-foreground focus-ring"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="flex items-center gap-2 font-semibold">
            <Moon className="h-4 w-4 text-accent" />
            {currentLabel}
          </span>
          <Button size="sm" className="ml-auto" onClick={() => setNewTaskOpen(true)}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>

      <TaskDialog open={newTaskOpen} onClose={() => setNewTaskOpen(false)} />
    </div>
  );
}
