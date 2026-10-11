import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                      */
/* -------------------------------------------------------------------------- */

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isToday(value: string | Date): boolean {
  const d = new Date(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isOverdue(value: string | Date): boolean {
  return new Date(value).getTime() < Date.now();
}

/** "3:30 PM" style time. */
export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Friendly relative due label, e.g. "Today, 3:30 PM", "Tomorrow", "Mar 4". */
export function formatDue(value: string | Date): string {
  const date = new Date(value);
  const now = new Date();
  const days = Math.round(
    (startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000,
  );

  if (days === 0) return `Today, ${formatTime(date)}`;
  if (days === 1) return `Tomorrow, ${formatTime(date)}`;
  if (days === -1) return `Yesterday, ${formatTime(date)}`;
  if (days > 1 && days < 7) {
    return `${date.toLocaleDateString(undefined, { weekday: "long" })}, ${formatTime(date)}`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function relativeDay(value: string | Date): "overdue" | "today" | "future" {
  const date = new Date(value);
  const now = new Date();
  if (isToday(date)) return "today";
  return date.getTime() < now.getTime() ? "overdue" : "future";
}

/** Format an ISO string for a `datetime-local` input value. */
export function toDateTimeLocalValue(value: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Convert a `datetime-local` input value into an ISO string (or null). */
export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/* -------------------------------------------------------------------------- */
/* Priority                                                                   */
/* -------------------------------------------------------------------------- */

export const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; badge: string }
> = {
  low: {
    label: "Low",
    dot: "bg-sky-400",
    badge: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  },
  normal: {
    label: "Normal",
    dot: "bg-slate-400",
    badge: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  },
  high: {
    label: "High",
    dot: "bg-amber-400",
    badge: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  },
  urgent: {
    label: "Urgent",
    dot: "bg-rose-500",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  },
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function errorMessage(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Something went wrong.";
}
