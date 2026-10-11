"use client";

import { useCallback, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { TaskRow } from "@/components/task-row";
import { TaskDialog } from "@/components/task-dialog";
import { ConfirmDialog, EmptyState, Spinner } from "@/components/ui";
import { useData } from "@/providers/data-provider";
import type { Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyIcon?: ReactNode;
  showCategory?: boolean;
  showProject?: boolean;
}

export function TaskList({
  tasks,
  loading = false,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Create a task to get started.",
  emptyAction,
  emptyIcon,
  showCategory = true,
  showProject = true,
}: TaskListProps) {
  const { removeTask } = useData();
  const [editing, setEditing] = useState<Task | null>(null);
  const [editingOpen, setEditingOpen] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const onEdit = useCallback((task: Task) => {
    setEditing(task);
    setEditingOpen(true);
  }, []);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await removeTask(deleting.id);
      setDeleting(null);
    } finally {
      setDeletePending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
        <Spinner /> Loading tasks…
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon ?? <CheckCircle2 className="h-5 w-5" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-0.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onEdit={onEdit}
            onRequestDelete={setDeleting}
            showCategory={showCategory}
            showProject={showProject}
          />
        ))}
      </ul>

      <TaskDialog
        open={editingOpen}
        task={editing}
        onClose={() => {
          setEditingOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this task?"
        message={
          deleting
            ? `"${deleting.title}" and its subtasks will be permanently deleted.`
            : ""
        }
        pending={deletePending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
