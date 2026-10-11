"use client";

import { Check, Pencil, Trash2, CalendarClock, ListTree } from "lucide-react";
import { useData } from "@/providers/data-provider";
import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui";
import {
  PRIORITY_META,
  cn,
  formatDue,
  isOverdue,
  relativeDay,
} from "@/lib/utils";

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
  showCategory?: boolean;
  showProject?: boolean;
}

export function TaskRow({
  task,
  onEdit,
  onRequestDelete,
  showCategory = true,
  showProject = true,
}: TaskRowProps) {
  const { categories, projects, subtasks, toggleTask } = useData();

  const category = categories.find((c) => c.id === task.category_id);
  const project = projects.find((p) => p.id === task.project_id);
  const taskSubtasks = subtasks.filter((s) => s.task_id === task.id);
  const doneCount = taskSubtasks.filter((s) => s.is_completed).length;

  const priority = PRIORITY_META[task.priority];
  const dueTone =
    task.due_at && !task.is_completed
      ? relativeDay(task.due_at) === "overdue"
        ? "text-rose-300"
        : relativeDay(task.due_at) === "today"
          ? "text-amber-300"
          : "text-muted"
      : "text-muted";

  return (
    <li
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-border hover:bg-surface-2/50",
        task.is_completed && "opacity-70",
      )}
    >
      <button
        onClick={() => toggleTask(task)}
        aria-label={task.is_completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition focus-ring",
          task.is_completed
            ? "border-accent bg-accent text-accent-foreground"
            : "border-border-strong text-transparent hover:border-accent hover:text-accent",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => onEdit(task)}
            className="min-w-0 text-left text-sm font-medium text-foreground transition hover:text-accent focus-ring"
          >
            <span className={cn("break-words", task.is_completed && "line-through")}>
              {task.title}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => onEdit(task)}
              aria-label="Edit task"
              className="rounded-lg p-1.5 text-muted transition hover:bg-surface-3 hover:text-foreground focus-ring"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onRequestDelete(task)}
              aria-label="Delete task"
              className="rounded-lg p-1.5 text-muted transition hover:bg-rose-500/10 hover:text-rose-300 focus-ring"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-2">{task.description}</p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {task.due_at ? (
            <span className={cn("inline-flex items-center gap-1 text-xs", dueTone)}>
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDue(task.due_at)}
              {!task.is_completed && isOverdue(task.due_at) ? " · overdue" : ""}
            </span>
          ) : null}

          {showCategory && category ? (
            <Badge className="border-border bg-surface-2 text-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color ?? "var(--accent)" }}
              />
              {category.name}
            </Badge>
          ) : showCategory && !category ? (
            <Badge className="border-border bg-surface-2 text-muted-2">Uncategorized</Badge>
          ) : null}

          {showProject && project ? (
            <Badge className="border-border bg-surface-2 text-muted">{project.name}</Badge>
          ) : null}

          {task.priority !== "normal" ? (
            <Badge className={priority.badge}>{priority.label}</Badge>
          ) : null}

          {taskSubtasks.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-2">
              <ListTree className="h-3.5 w-3.5" />
              {doneCount}/{taskSubtasks.length}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
