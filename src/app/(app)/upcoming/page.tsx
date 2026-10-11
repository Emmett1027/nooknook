"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { Button, Card, EmptyState, Spinner } from "@/components/ui";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";
import { TaskDialog } from "@/components/task-dialog";
import { useData } from "@/providers/data-provider";
import type { Task } from "@/lib/types";
import { endOfDay, startOfDay } from "@/lib/utils";

function dayLabel(date: Date): string {
  const now = new Date();
  const diff = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000,
  );
  if (diff === 1) return "Tomorrow";
  if (diff === 2) return `In 2 days · ${date.toLocaleDateString(undefined, { weekday: "long" })}`;
  if (diff < 7)
    return `${date.toLocaleDateString(undefined, { weekday: "long" })} · ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function UpcomingPage() {
  const { tasks, status, error } = useData();
  const [newOpen, setNewOpen] = useState(false);

  const groups = useMemo(() => {
    const from = endOfDay(new Date()).getTime();
    const future = tasks
      .filter(
        (t) => !t.is_completed && t.due_at && new Date(t.due_at).getTime() > from,
      )
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

    const map = new Map<string, { date: Date; tasks: Task[] }>();
    for (const task of future) {
      const date = new Date(task.due_at!);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map.has(key)) map.set(key, { date: startOfDay(date), tasks: [] });
      map.get(key)!.tasks.push(task);
    }
    return Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, [tasks]);

  const newTaskButton = (
    <Button onClick={() => setNewOpen(true)}>
      <Plus className="h-4 w-4" />
      New task
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Upcoming"
        description="Everything scheduled after today."
        action={newTaskButton}
      />

      {status === "loading" || status === "idle" ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
          <Spinner /> Loading upcoming…
        </div>
      ) : status === "error" ? (
        <EmptyState title="Couldn't load your tasks" description={error ?? undefined} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-5 w-5" />}
          title="Nothing scheduled"
          description="Tasks with a future due date will show up here, grouped by day."
          action={newTaskButton}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group, index) => (
            <section key={group.date.toISOString()}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {dayLabel(group.date)}
                </h2>
                <span className="text-xs text-muted-2">
                  {group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}
                </span>
                {index === 0 ? (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                    Next up
                  </span>
                ) : null}
              </div>
              <Card className="p-2">
                <TaskList tasks={group.tasks} />
              </Card>
            </section>
          ))}
        </div>
      )}

      <TaskDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
