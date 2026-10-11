"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, EmptyState, Spinner } from "@/components/ui";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";
import { useData } from "@/providers/data-provider";
import { selectCompleted } from "@/lib/selectors";

export default function CompletedPage() {
  const { tasks, status, error } = useData();
  const completed = selectCompleted(tasks);

  return (
    <div>
      <PageHeader
        title="Completed"
        description={
          completed.length === 0
            ? "Finished tasks will collect here."
            : `${completed.length} task${completed.length === 1 ? "" : "s"} done. Nicely played.`
        }
      />

      {status === "loading" || status === "idle" ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
          <Spinner /> Loading completed…
        </div>
      ) : status === "error" ? (
        <EmptyState title="Couldn't load your tasks" description={error ?? undefined} />
      ) : completed.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Nothing completed yet"
          description="Check off a task and it will appear here. You can always un-check it to bring it back."
        />
      ) : (
        <Card className="p-2">
          <TaskList tasks={completed} />
        </Card>
      )}
    </div>
  );
}
