/**
 * Application types mirroring the existing Supabase schema exactly.
 * Do not rename columns here without a matching database migration.
 */

export type Priority = "low" | "normal" | "high" | "urgent";

export const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

export interface Profile {
  id: string;
  display_name: string | null;
  theme: string | null;
  accent_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: Priority;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  user_id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

/** New-task / edit-task form payload (only writable columns). */
export interface TaskInput {
  title: string;
  description: string | null;
  due_at: string | null;
  priority: Priority;
  category_id: string | null;
  project_id: string | null;
}
