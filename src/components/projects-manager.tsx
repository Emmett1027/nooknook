"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { useData } from "@/providers/data-provider";
import type { Project } from "@/lib/types";
import { errorMessage } from "@/lib/utils";
import { countByProject } from "@/lib/selectors";

export function ProjectsManager() {
  const { projects, categories, tasks, status, error, removeProject } = useData();

  const [dialog, setDialog] = useState<{ open: boolean; editing: Project | null }>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const counts = countByProject(tasks);

  const groups = useMemo(() => {
    const byCategory = new Map<string, Project[]>();
    for (const project of projects) {
      const key = project.category_id ?? "__none__";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(project);
    }
    return Array.from(byCategory.entries()).map(([key, items]) => {
      const category = categories.find((c) => c.id === key) ?? null;
      return { key, category, projects: items };
    });
  }, [projects, categories]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await removeProject(deleting.id);
      setDeleting(null);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects & Classes"
        description="Track longer-running work: courses, clients, side quests."
        action={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      {status === "loading" || status === "idle" ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
          <Spinner /> Loading projects…
        </div>
      ) : status === "error" ? (
        <EmptyState title="Couldn't load your projects" description={error ?? undefined} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="No projects yet"
          description="Create a project or class to group related tasks together."
          action={
            <Button onClick={() => setDialog({ open: true, editing: null })}>
              <Plus className="h-4 w-4" />
              New project
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: group.category?.color ?? "var(--muted-2)",
                  }}
                />
                <h2 className="text-sm font-semibold text-foreground">
                  {group.category?.name ?? "Uncategorized projects"}
                </h2>
                <span className="text-xs text-muted-2">{group.projects.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.projects.map((project) => (
                  <Card key={project.id} className="group flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          onClick={() => setDialog({ open: true, editing: project })}
                          aria-label="Edit project"
                          className="rounded-lg p-2 text-muted transition hover:bg-surface-3 hover:text-foreground focus-ring"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleting(project)}
                          aria-label="Delete project"
                          className="rounded-lg p-2 text-muted transition hover:bg-rose-500/10 hover:text-rose-300 focus-ring"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {project.description ? (
                      <p className="line-clamp-2 text-xs text-muted">
                        {project.description}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className="border-border bg-surface-2 text-muted">
                        {counts[project.id] ?? 0} open task
                        {(counts[project.id] ?? 0) === 1 ? "" : "s"}
                      </Badge>
                      {group.category ? (
                        <Badge className="border-border bg-surface-2 text-muted">
                          {group.category.name}
                        </Badge>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {dialog.open ? (
        <ProjectDialog
          editing={dialog.editing}
          onClose={() => setDialog({ open: false, editing: null })}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this project?"
        message={
          deleting
            ? `"${deleting.name}" will be removed. Its tasks will be kept and unlinked from the project.`
            : ""
        }
        pending={deletePending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ProjectDialog({
  editing,
  onClose,
}: {
  editing: Project | null;
  onClose: () => void;
}) {
  const { categories, addProject, editProject } = useData();
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? "");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setFormError("Give your project a name.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
      };
      if (editing) {
        await editProject(editing.id, payload);
      } else {
        await addProject(payload);
      }
      onClose();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit project" : "New project"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? (
              <Spinner className="border-accent-foreground/40 border-t-accent-foreground" />
            ) : null}
            {editing ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {formError ? <ErrorNote>{formError}</ErrorNote> : null}
        <Field label="Name">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CS101 — Algorithms"
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
          />
        </Field>
        <Field label="Category">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
