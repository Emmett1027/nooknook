"use client";

import { CheckCircle2, Flame, Plus } from "lucide-react";
import { Card, EmptyState, Spinner, Button } from "@/components/ui";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";
import { TaskDialog } from "@/components/task-dialog";
import { useState } from "react";
import { useData } from "@/providers/data-provider";
import { selectOverdue, selectToday } from "@/lib/selectors";

export default function TodayPage() {
  const { tasks, status, error } = useData();
  const [newOpen, setNewOpen] = useState(false);

  const overdue = selectOverdue(tasks);
  const today = selectToday(tasks);
  const total = overdue.length + today.length;

  const newTaskButton = (
    <Button onClick={() => setNewOpen(true)}>
      <Plus className="h-4 w-4" />
      New task
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Today"
        description={
          total === 0
            ? "Nothing due today."
            : `${total} task${total === 1 ? "" : "s"} need your attention.`
        }
        action={newTaskButton}
      />

      {status === "loading" || status === "idle" ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
          <Spinner /> Loading today…
        </div>
      ) : status === "error" ? (
        <EmptyState title="Couldn't load your tasks" description={error ?? undefined} />
      ) : total === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="All clear for today"
          description="No tasks are due today and nothing is overdue. Take a breath."
          action={newTaskButton}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {overdue.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-300">
                  Overdue
                </h2>
                <span className="text-xs text-muted">({overdue.length})</span>
              </div>
              <Card className="p-2">
                <TaskList tasks={overdue} />
              </Card>
            </section>
          ) : null}

          {today.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Due today
                </h2>
                <span className="text-xs text-muted">({today.length})</span>
              </div>
              <Card className="p-2">
                <TaskList tasks={today} />
              </Card>
            </section>
          ) : null}
        </div>
      )}

      <TaskDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
