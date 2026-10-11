"use client";

import { useMemo, useState } from "react";
import { ListTodo, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Button, Card, EmptyState, Input, Select, Spinner } from "@/components/ui";
import { TaskList } from "@/components/task-list";
import { PageHeader } from "@/components/page-header";
import { TaskDialog } from "@/components/task-dialog";
import { useData } from "@/providers/data-provider";
import type { Priority, Task } from "@/lib/types";
import { PRIORITIES } from "@/lib/types";
import { PRIORITY_META, endOfDay, isToday, startOfDay } from "@/lib/utils";

type Bucket = "overdue" | "today" | "tomorrow" | "week" | "later" | "none";

const BUCKET_LABELS: Record<Bucket, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  later: "Later",
  none: "No due date",
};

const BUCKET_ORDER: Bucket[] = ["overdue", "today", "tomorrow", "week", "later", "none"];

function bucketOf(task: Task): Bucket {
  if (!task.due_at) return "none";
  const date = new Date(task.due_at);
  if (isToday(date)) return "today";
  const todayStart = startOfDay(new Date()).getTime();
  if (date.getTime() < todayStart) return "overdue";
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (startOfDay(date).getTime() === tomorrow.getTime()) return "tomorrow";
  if (date.getTime() <= endOfDay(new Date()).getTime() + 6 * 86400000) return "week";
  return "later";
}

export default function TasksPage() {
  const { tasks, categories, projects, status, error } = useData();
  const [newOpen, setNewOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<"" | Priority>("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtersActive =
    Boolean(search) || Boolean(categoryId) || Boolean(projectId) || Boolean(priority);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (task.is_completed && !showCompleted) return false;
      if (q && !`${task.title} ${task.description ?? ""}`.toLowerCase().includes(q))
        return false;
      if (categoryId === "__none__" && task.category_id) return false;
      if (categoryId && categoryId !== "__none__" && task.category_id !== categoryId)
        return false;
      if (projectId === "__none__" && task.project_id) return false;
      if (projectId && projectId !== "__none__" && task.project_id !== projectId)
        return false;
      if (priority && task.priority !== priority) return false;
      return true;
    });
  }, [tasks, search, categoryId, projectId, priority, showCompleted]);

  const activeFiltered = filtered.filter((t) => !t.is_completed);
  const completedFiltered = filtered.filter((t) => t.is_completed);

  const grouped = useMemo(() => {
    const map = new Map<Bucket, Task[]>();
    for (const task of activeFiltered) {
      const bucket = bucketOf(task);
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket)!.push(task);
    }
    return BUCKET_ORDER.filter((b) => (map.get(b)?.length ?? 0) > 0).map((b) => ({
      bucket: b,
      tasks: map.get(b)!,
    }));
  }, [activeFiltered]);

  function resetFilters() {
    setSearch("");
    setCategoryId("");
    setProjectId("");
    setPriority("");
  }

  const newTaskButton = (
    <Button onClick={() => setNewOpen(true)}>
      <Plus className="h-4 w-4" />
      New task
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="All Tasks"
        description={`${activeFiltered.length} open task${activeFiltered.length === 1 ? "" : "s"}${
          filtersActive ? " matching your filters" : ""
        }.`}
        action={newTaskButton}
      />

      <Card className="mb-6 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="pl-9"
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10"
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {filtersActive ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={resetFilters}
              aria-label="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {showFilters ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All categories</option>
              <option value="__none__">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              <option value="__none__">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "" | Priority)}
            >
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface accent-[var(--accent)]"
          />
          Show completed tasks
        </label>
      </Card>

      {status === "loading" || status === "idle" ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
          <Spinner /> Loading tasks…
        </div>
      ) : status === "error" ? (
        <EmptyState title="Couldn't load your tasks" description={error ?? undefined} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-5 w-5" />}
          title={filtersActive ? "No tasks match your filters" : "No tasks yet"}
          description={
            filtersActive
              ? "Try clearing a filter or adjusting your search."
              : "Create your first task to start building momentum."
          }
          action={
            filtersActive ? (
              <Button variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              newTaskButton
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <section key={group.bucket}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2
                  className={
                    group.bucket === "overdue"
                      ? "text-sm font-semibold text-rose-300"
                      : "text-sm font-semibold text-muted"
                  }
                >
                  {BUCKET_LABELS[group.bucket]}
                </h2>
                <span className="text-xs text-muted-2">{group.tasks.length}</span>
              </div>
              <Card className="p-2">
                <TaskList tasks={group.tasks} />
              </Card>
            </section>
          ))}

          {showCompleted && completedFiltered.length > 0 ? (
            <section>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-muted">Completed</h2>
                <span className="text-xs text-muted-2">{completedFiltered.length}</span>
              </div>
              <Card className="p-2">
                <TaskList tasks={completedFiltered} />
              </Card>
            </section>
          ) : null}
        </div>
      )}

      <TaskDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
