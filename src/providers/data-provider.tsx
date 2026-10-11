"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { applyTheme } from "@/lib/theme";
import { errorMessage } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import * as api from "@/lib/data";
import type {
  Category,
  Profile,
  Project,
  Subtask,
  Task,
  TaskInput,
} from "@/lib/types";

type Status = "idle" | "loading" | "ready" | "error";

interface DataContextValue {
  status: Status;
  error: string | null;
  profile: Profile | null;
  categories: Category[];
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  refresh: () => Promise<void>;

  saveProfile: (
    patch: Partial<Pick<Profile, "display_name" | "theme" | "accent_color">>,
  ) => Promise<void>;

  addCategory: (input: {
    name: string;
    color: string | null;
    icon: string | null;
  }) => Promise<Category>;
  editCategory: (
    id: string,
    patch: Partial<Pick<Category, "name" | "color" | "icon" | "sort_order">>,
  ) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  addProject: (input: {
    name: string;
    description: string | null;
    category_id: string | null;
  }) => Promise<Project>;
  editProject: (
    id: string,
    patch: Partial<Pick<Project, "name" | "description" | "category_id">>,
  ) => Promise<void>;
  removeProject: (id: string) => Promise<void>;

  addTask: (input: TaskInput) => Promise<Task>;
  editTask: (id: string, patch: Partial<TaskInput>) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;

  addSubtask: (taskId: string, title: string) => Promise<void>;
  editSubtask: (id: string, patch: Partial<Pick<Subtask, "title">>) => Promise<void>;
  toggleSubtask: (subtask: Subtask) => Promise<void>;
  removeSubtask: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function nextOrder<T extends { sort_order: number }>(rows: T[]): number {
  return rows.reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const userId = user?.id ?? null;

  // Note: no setState runs before the first `await`, so calling this from an
  // effect does not trigger the "setState synchronously in effect" lint rule.
  const refresh = useCallback(async () => {
    if (!userId) return;
    const supabase = getBrowserSupabase();
    try {
      const [nextProfile, nextCategories, nextProjects, nextTasks, nextSubtasks] =
        await Promise.all([
          api.fetchProfile(supabase, userId),
          api.fetchCategories(supabase, userId),
          api.fetchProjects(supabase, userId),
          api.fetchTasks(supabase, userId),
          api.fetchSubtasks(supabase, userId),
        ]);
      setProfile(nextProfile);
      setCategories(nextCategories);
      setProjects(nextProjects);
      setTasks(nextTasks);
      setSubtasks(nextSubtasks);
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    // The provider only mounts for authenticated users and unmounts on sign-out,
    // so no reset branch is needed here.
    // Fetching on mount is the intended use of this effect: it synchronises the
    // client cache with the Supabase backend when the user becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (userId) void refresh();
  }, [userId, refresh]);

  // Apply the saved theme + accent whenever the profile changes.
  useEffect(() => {
    applyTheme(profile?.theme, profile?.accent_color);
  }, [profile?.theme, profile?.accent_color]);

  const requireClient = useCallback((): { supabase: SupabaseClient; userId: string } => {
    if (!userId) throw new Error("Not authenticated");
    return { supabase: getBrowserSupabase(), userId };
  }, [userId]);

  /* ----------------------------- profile ------------------------------ */
  const saveProfile = useCallback<DataContextValue["saveProfile"]>(
    async (patch) => {
      const { supabase, userId: uid } = requireClient();
      const updated = await api.updateProfile(supabase, uid, patch);
      setProfile(updated);
    },
    [requireClient],
  );

  /* ---------------------------- categories ---------------------------- */
  const addCategory = useCallback<DataContextValue["addCategory"]>(
    async (input) => {
      const { supabase, userId: uid } = requireClient();
      const created = await api.createCategory(supabase, uid, {
        ...input,
        sort_order: nextOrder(categories),
      });
      setCategories((prev) => [...prev, created]);
      return created;
    },
    [requireClient, categories],
  );

  const editCategory = useCallback<DataContextValue["editCategory"]>(
    async (id, patch) => {
      const { supabase } = requireClient();
      const updated = await api.updateCategory(supabase, id, patch);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    },
    [requireClient],
  );

  const removeCategory = useCallback<DataContextValue["removeCategory"]>(
    async (id) => {
      const { supabase, userId: uid } = requireClient();
      await api.deleteCategory(supabase, uid, id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setProjects((prev) =>
        prev.map((p) => (p.category_id === id ? { ...p, category_id: null } : p)),
      );
      setTasks((prev) =>
        prev.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
      );
    },
    [requireClient],
  );

  /* ----------------------------- projects ----------------------------- */
  const addProject = useCallback<DataContextValue["addProject"]>(
    async (input) => {
      const { supabase, userId: uid } = requireClient();
      const created = await api.createProject(supabase, uid, input);
      setProjects((prev) => [...prev, created]);
      return created;
    },
    [requireClient],
  );

  const editProject = useCallback<DataContextValue["editProject"]>(
    async (id, patch) => {
      const { supabase } = requireClient();
      const updated = await api.updateProject(supabase, id, patch);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    [requireClient],
  );

  const removeProject = useCallback<DataContextValue["removeProject"]>(
    async (id) => {
      const { supabase, userId: uid } = requireClient();
      await api.deleteProject(supabase, uid, id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) =>
        prev.map((t) => (t.project_id === id ? { ...t, project_id: null } : t)),
      );
    },
    [requireClient],
  );

  /* ------------------------------ tasks ------------------------------- */
  const addTask = useCallback<DataContextValue["addTask"]>(
    async (input) => {
      const { supabase, userId: uid } = requireClient();
      const created = await api.createTask(supabase, uid, input, nextOrder(tasks));
      setTasks((prev) => [...prev, created]);
      return created;
    },
    [requireClient, tasks],
  );

  const editTask = useCallback<DataContextValue["editTask"]>(
    async (id, patch) => {
      const { supabase } = requireClient();
      const updated = await api.updateTask(supabase, id, patch);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    },
    [requireClient],
  );

  const toggleTask = useCallback<DataContextValue["toggleTask"]>(
    async (task) => {
      const { supabase } = requireClient();
      const updated = await api.setTaskCompleted(supabase, task.id, !task.is_completed);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    },
    [requireClient],
  );

  const removeTask = useCallback<DataContextValue["removeTask"]>(
    async (id) => {
      const { supabase } = requireClient();
      await api.deleteTask(supabase, id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSubtasks((prev) => prev.filter((s) => s.task_id !== id));
    },
    [requireClient],
  );

  /* ----------------------------- subtasks ----------------------------- */
  const addSubtask = useCallback<DataContextValue["addSubtask"]>(
    async (taskId, title) => {
      const { supabase, userId: uid } = requireClient();
      const order = nextOrder(subtasks.filter((s) => s.task_id === taskId));
      const created = await api.createSubtask(supabase, uid, taskId, title, order);
      setSubtasks((prev) => [...prev, created]);
    },
    [requireClient, subtasks],
  );

  const editSubtask = useCallback<DataContextValue["editSubtask"]>(
    async (id, patch) => {
      const { supabase } = requireClient();
      const updated = await api.updateSubtask(supabase, id, patch);
      setSubtasks((prev) => prev.map((s) => (s.id === id ? updated : s)));
    },
    [requireClient],
  );

  const toggleSubtask = useCallback<DataContextValue["toggleSubtask"]>(
    async (subtask) => {
      const { supabase } = requireClient();
      const updated = await api.updateSubtask(supabase, subtask.id, {
        is_completed: !subtask.is_completed,
      });
      setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? updated : s)));
    },
    [requireClient],
  );

  const removeSubtask = useCallback<DataContextValue["removeSubtask"]>(
    async (id) => {
      const { supabase } = requireClient();
      await api.deleteSubtask(supabase, id);
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
    },
    [requireClient],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      status,
      error,
      profile,
      categories,
      projects,
      tasks,
      subtasks,
      refresh,
      saveProfile,
      addCategory,
      editCategory,
      removeCategory,
      addProject,
      editProject,
      removeProject,
      addTask,
      editTask,
      toggleTask,
      removeTask,
      addSubtask,
      editSubtask,
      toggleSubtask,
      removeSubtask,
    }),
    [
      status,
      error,
      profile,
      categories,
      projects,
      tasks,
      subtasks,
      refresh,
      saveProfile,
      addCategory,
      editCategory,
      removeCategory,
      addProject,
      editProject,
      removeProject,
      addTask,
      editTask,
      toggleTask,
      removeTask,
      addSubtask,
      editSubtask,
      toggleSubtask,
      removeSubtask,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
