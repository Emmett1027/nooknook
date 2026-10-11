import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Priority,
  Profile,
  Project,
  Subtask,
  Task,
  TaskInput,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/*                                                                             */
/* Every query filters by the authenticated user's id as an explicit ownership  */
/* hint. Postgres RLS is the enforcement layer; this is defence in depth.      */
/* -------------------------------------------------------------------------- */

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function fetchCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Category[]) ?? [];
}

export async function fetchProjects(
  supabase: SupabaseClient,
  userId: string,
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Project[]) ?? [];
}

export async function fetchTasks(
  supabase: SupabaseClient,
  userId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Task[]) ?? [];
}

export async function fetchSubtasks(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subtask[]> {
  const { data, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Subtask[]) ?? [];
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<Pick<Profile, "display_name" | "theme" | "accent_color">>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export async function createCategory(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; color: string | null; icon: string | null; sort_order: number },
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Category, "name" | "color" | "icon" | "sort_order">>,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

/**
 * Delete a category without deleting its tasks (or projects). References are
 * cleared first so tasks fall back to "Uncategorized".
 */
export async function deleteCategory(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const tasks = await supabase
    .from("tasks")
    .update({ category_id: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("category_id", id);
  if (tasks.error) throw tasks.error;

  const projects = await supabase
    .from("projects")
    .update({ category_id: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("category_id", id);
  if (projects.error) throw projects.error;

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; description: string | null; category_id: string | null },
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Project, "name" | "description" | "category_id">>,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Project;
}

/** Delete a project without deleting its tasks — they become project-less. */
export async function deleteProject(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const tasks = await supabase
    .from("tasks")
    .update({ project_id: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("project_id", id);
  if (tasks.error) throw tasks.error;

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------------------------------------------------------- */
/* Tasks                                                                      */
/* -------------------------------------------------------------------------- */

export async function createTask(
  supabase: SupabaseClient,
  userId: string,
  input: TaskInput,
  sortOrder: number,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...input,
      priority: input.priority as Priority,
      is_completed: false,
      sort_order: sortOrder,
      user_id: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<TaskInput> & { is_completed?: boolean; completed_at?: string | null },
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function setTaskCompleted(
  supabase: SupabaseClient,
  id: string,
  isCompleted: boolean,
): Promise<Task> {
  return updateTask(supabase, id, {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  });
}

/** Delete a task and its subtasks. */
export async function deleteTask(supabase: SupabaseClient, id: string): Promise<void> {
  const subtasks = await supabase.from("subtasks").delete().eq("task_id", id);
  if (subtasks.error) throw subtasks.error;

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------------------------------------------------------- */
/* Subtasks                                                                   */
/* -------------------------------------------------------------------------- */

export async function createSubtask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  title: string,
  sortOrder: number,
): Promise<Subtask> {
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ task_id: taskId, user_id: userId, title, sort_order: sortOrder })
    .select("*")
    .single();
  if (error) throw error;
  return data as Subtask;
}

export async function updateSubtask(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<Subtask, "title" | "is_completed" | "sort_order">>,
): Promise<Subtask> {
  const { data, error } = await supabase
    .from("subtasks")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Subtask;
}

export async function deleteSubtask(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("subtasks").delete().eq("id", id);
  if (error) throw error;
}
