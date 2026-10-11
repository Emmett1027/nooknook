"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Flame,
  Plus,
  Tags,
} from "lucide-react";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/providers/auth-provider";
import { useData } from "@/providers/data-provider";
import {
  countByCategory,
  selectActive,
  selectCompleted,
  selectOverdue,
  selectToday,
  selectUpcoming,
} from "@/lib/selectors";
import { PRIORITY_META } from "@/lib/utils";
import { PRIORITIES } from "@/lib/types";

function StatCard({
  label,
  value,
  icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface/80 p-4 transition hover:border-border-strong hover:bg-surface-2/60 focus-ring"
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1f`, color: accent }}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { profile } = useData();
  const { user } = useAuth();
  const { tasks, categories, status, error } = useData();
  const router = useRouter();

  const todayTasks = selectToday(tasks);
  const overdue = selectOverdue(tasks);
  const upcoming = selectUpcoming(tasks);
  const active = selectActive(tasks);
  const completed = selectCompleted(tasks);
  const categoryCounts = countByCategory(tasks);
  const uncategorized = active.filter((t) => !t.category_id).length;

  const name = profile?.display_name || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Spinner /> Loading dashboard…
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Couldn't load your data"
        description={error ?? "Please refresh the page and try again."}
      />
    );
  }

  const focus = [...overdue, ...todayTasks];
  const maxCategory = Math.max(1, ...Object.values(categoryCounts), uncategorized);

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${name}`}
        description="Here's your nook at a glance."
        action={
          <Button className="hidden sm:inline-flex" onClick={() => router.push("/today")}>
            View today
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Due today"
          value={todayTasks.length}
          icon={<CalendarDays className="h-5 w-5" />}
          accent="#e0a35e"
          href="/today"
        />
        <StatCard
          label="Overdue"
          value={overdue.length}
          icon={<Flame className="h-5 w-5" />}
          accent="#fb7185"
          href="/today"
        />
        <StatCard
          label="Upcoming"
          value={upcoming.length}
          icon={<CalendarClock className="h-5 w-5" />}
          accent="#7aa2f7"
          href="/upcoming"
        />
        <StatCard
          label="Completed"
          value={completed.length}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="#7fce9b"
          href="/completed"
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Focus for today
          </h2>
          <Link
            href="/today"
            className="text-xs font-medium text-accent hover:underline focus-ring"
          >
            See all
          </Link>
        </div>
        <Card className="p-2">
          <TaskList
            tasks={focus.slice(0, 6)}
            emptyTitle="Today is clear"
            emptyDescription="No tasks due today or overdue. Enjoy the calm."
            emptyIcon={<CheckCircle2 className="h-5 w-5" />}
          />
          {focus.length > 6 ? (
            <p className="px-3 py-2 text-xs text-muted-2">
              +{focus.length - 6} more due today
            </p>
          ) : null}
        </Card>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Active by category
          </h2>
          <Card className="p-4">
            {categories.length === 0 && uncategorized === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No categories yet.{" "}
                <Link href="/categories" className="text-accent hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {categories.map((category) => {
                  const count = categoryCounts[category.id] ?? 0;
                  return (
                    <div key={category.id} className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color ?? "var(--accent)" }}
                      />
                      <span className="w-28 shrink-0 truncate text-sm text-foreground">
                        {category.name}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(count / maxCategory) * 100}%`,
                            backgroundColor: category.color ?? "var(--accent)",
                          }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs tabular-nums text-muted">
                        {count}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted-2" />
                  <span className="w-28 shrink-0 truncate text-sm text-muted">
                    Uncategorized
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-muted-2"
                      style={{ width: `${(uncategorized / maxCategory) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs tabular-nums text-muted">
                    {uncategorized}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Open by priority
          </h2>
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {PRIORITIES.map((priority) => {
                const count = active.filter((t) => t.priority === priority).length;
                const meta = PRIORITY_META[priority];
                return (
                  <div
                    key={priority}
                    className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <span className="flex-1 text-xs text-muted">{meta.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Tags className="h-4 w-4" />
                Total open tasks
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {active.length}
              </span>
            </div>
          </Card>
        </section>
      </div>

      <div className="mt-8">
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => router.push("/tasks")}
        >
          <Plus className="h-4 w-4" />
          Browse all tasks
        </Button>
      </div>
    </div>
  );
}
