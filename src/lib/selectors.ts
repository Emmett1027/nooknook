import type { Category, Project, Task } from "./types";
import { PRIORITY_ORDER, addDays, endOfDay, isToday, startOfDay } from "./utils";

export type EntityMap<T> = Record<string, T>;

export function indexById<T extends { id: string }>(rows: T[]): EntityMap<T> {
  return rows.reduce<EntityMap<T>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});
}

export function byDueDate(a: Task, b: Task): number {
  if (!a.due_at && !b.due_at) return 0;
  if (!a.due_at) return 1;
  if (!b.due_at) return -1;
  return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
}

export function bySortOrder(a: Task, b: Task): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

/** Overdue or due today. */
export function selectToday(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.is_completed && t.due_at && isToday(t.due_at))
    .sort((a, b) => {
      const ao = new Date(a.due_at!).getTime() < Date.now();
      const bo = new Date(b.due_at!).getTime() < Date.now();
      if (ao !== bo) return ao ? -1 : 1;
      return byDueDate(a, b);
    });
}

/** Overdue tasks (not today). */
export function selectOverdue(tasks: Task[]): Task[] {
  const todayStart = startOfDay(new Date()).getTime();
  return tasks
    .filter(
      (t) => !t.is_completed && t.due_at && new Date(t.due_at).getTime() < todayStart,
    )
    .sort(byDueDate);
}

/** Due after today and within the next 7 days. */
export function selectUpcoming(tasks: Task[], days = 7): Task[] {
  const from = endOfDay(new Date()).getTime();
  const to = endOfDay(addDays(new Date(), days)).getTime();
  return tasks
    .filter((t) => {
      if (t.is_completed || !t.due_at) return false;
      const time = new Date(t.due_at).getTime();
      return time > from && time <= to;
    })
    .sort(byDueDate);
}

export function selectActive(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.is_completed).sort((a, b) => {
    if (a.due_at && b.due_at) return byDueDate(a, b);
    if (a.due_at) return -1;
    if (b.due_at) return 1;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

export function selectCompleted(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.is_completed)
    .sort((a, b) => {
      const at = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bt - at;
    });
}

export function priorityBreakdown(tasks: Task[]) {
  const active = tasks.filter((t) => !t.is_completed);
  return {
    urgent: active.filter((t) => t.priority === "urgent").length,
    high: active.filter((t) => t.priority === "high").length,
    normal: active.filter((t) => t.priority === "normal").length,
    low: active.filter((t) => t.priority === "low").length,
  };
}

export function countByCategory(tasks: Task[]): Record<string, number> {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.is_completed || !task.category_id) return acc;
    acc[task.category_id] = (acc[task.category_id] ?? 0) + 1;
    return acc;
  }, {});
}

export function countByProject(tasks: Task[]): Record<string, number> {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.is_completed || !task.project_id) return acc;
    acc[task.project_id] = (acc[task.project_id] ?? 0) + 1;
    return acc;
  }, {});
}

export function categoryName(
  categories: Category[],
  id: string | null,
): string | null {
  if (!id) return null;
  return categories.find((c) => c.id === id)?.name ?? null;
}

export function projectName(projects: Project[], id: string | null): string | null {
  if (!id) return null;
  return projects.find((p) => p.id === id)?.name ?? null;
}
