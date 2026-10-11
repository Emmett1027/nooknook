"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Circle, CheckCircle2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { useData } from "@/providers/data-provider";
import type { Priority, Task, TaskInput } from "@/lib/types";
import { PRIORITIES } from "@/lib/types";
import {
  PRIORITY_META,
  errorMessage,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/utils";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaults?: Partial<TaskInput>;
}

const EMPTY: TaskInput = {
  title: "",
  description: null,
  due_at: null,
  priority: "normal",
  category_id: null,
  project_id: null,
};

/**
 * Rendered only while open, so the inner component mounts with fresh form state
 * derived from `task`/`defaults` — no state-resetting effect required.
 */
export function TaskDialog(props: TaskDialogProps) {
  if (!props.open) return null;
  return <TaskDialogInner {...props} />;
}

function TaskDialogInner({ onClose, task, defaults }: TaskDialogProps) {
  const {
    categories,
    projects,
    subtasks,
    addTask,
    editTask,
    removeTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
  } = useData();

  const isEditing = Boolean(task);
  const [form, setForm] = useState<TaskInput>(() =>
    task
      ? {
          title: task.title,
          description: task.description,
          due_at: task.due_at,
          priority: task.priority,
          category_id: task.category_id,
          project_id: task.project_id,
        }
      : { ...EMPTY, ...defaults },
  );
  const [draftSubtasks, setDraftSubtasks] = useState<string[]>([]);
  const [draftSubtaskText, setDraftSubtaskText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const taskSubtasks = useMemo(
    () => (task ? subtasks.filter((s) => s.task_id === task.id) : []),
    [subtasks, task],
  );

  const update = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("Give your task a title.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const payload: TaskInput = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() ? form.description.trim() : null,
      };
      if (task) {
        await editTask(task.id, payload);
      } else {
        const created = await addTask(payload);
        for (const title of draftSubtasks) {
          await addSubtask(created.id, title);
        }
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setPending(true);
    try {
      await removeTask(task.id);
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  async function commitDraftSubtask() {
    const title = draftSubtaskText.trim();
    if (!title) return;
    if (task) {
      try {
        await addSubtask(task.id, title);
      } catch (err) {
        setError(errorMessage(err));
      }
    } else {
      setDraftSubtasks((prev) => [...prev, title]);
    }
    setDraftSubtaskText("");
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={isEditing ? "Edit task" : "New task"}
        description={
          isEditing ? "Update details, subtasks and scheduling." : "Add a task to your nook."
        }
        footer={
          <>
            {isEditing ? (
              <Button
                variant="ghost"
                className="mr-auto text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? <Spinner className="border-accent-foreground/40 border-t-accent-foreground" /> : null}
              {isEditing ? "Save changes" : "Create task"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <Field label="Title">
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="What needs doing?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
          </Field>

          <Field label="Notes">
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add details, links, or context…"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date">
              <Input
                type="datetime-local"
                value={toDateTimeLocalValue(form.due_at)}
                onChange={(e) => update("due_at", fromDateTimeLocalValue(e.target.value))}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) => update("priority", e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select
                value={form.category_id ?? ""}
                onChange={(e) => update("category_id", e.target.value || null)}
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Project / Class">
              <Select
                value={form.project_id ?? ""}
                onChange={(e) => update("project_id", e.target.value || null)}
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-surface-2/40 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Subtasks
            </p>

            <div className="flex flex-col gap-1.5">
              {taskSubtasks.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-surface-2"
                >
                  <button
                    onClick={() => toggleSubtask(s)}
                    className="text-muted transition hover:text-accent focus-ring"
                    aria-label={s.is_completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {s.is_completed ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span
                    className={
                      s.is_completed
                        ? "flex-1 text-sm text-muted-2 line-through"
                        : "flex-1 text-sm text-foreground"
                    }
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={() => removeSubtask(s.id)}
                    className="rounded p-1 text-muted-2 opacity-0 transition hover:text-rose-300 group-hover:opacity-100 focus-ring"
                    aria-label="Delete subtask"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {draftSubtasks.map((title, index) => (
                <div
                  key={`${title}-${index}`}
                  className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-surface-2"
                >
                  <Circle className="h-4 w-4 text-muted" />
                  <span className="flex-1 text-sm text-foreground">{title}</span>
                  <button
                    onClick={() =>
                      setDraftSubtasks((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="rounded p-1 text-muted-2 opacity-0 transition hover:text-rose-300 group-hover:opacity-100 focus-ring"
                    aria-label="Remove subtask"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Input
                value={draftSubtaskText}
                onChange={(e) => setDraftSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void commitDraftSubtask();
                  }
                }}
                placeholder="Add a subtask…"
                className="h-9"
              />
              <Button
                variant="secondary"
                size="sm"
                className="h-9"
                onClick={() => void commitDraftSubtask()}
                disabled={!draftSubtaskText.trim()}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this task?"
        message="This permanently deletes the task and its subtasks. This cannot be undone."
        pending={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
