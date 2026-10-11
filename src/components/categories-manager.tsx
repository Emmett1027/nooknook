"use client";

import { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  Spinner,
} from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { useData } from "@/providers/data-provider";
import type { Category } from "@/lib/types";
import { ACCENT_PRESETS } from "@/lib/theme";
import { cn, errorMessage } from "@/lib/utils";
import { countByCategory } from "@/lib/selectors";

export function CategoriesManager() {
  const { categories, tasks, status, error, removeCategory } = useData();

  const [dialog, setDialog] = useState<{ open: boolean; editing: Category | null }>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const counts = countByCategory(tasks);

  function openCreate() {
    setDialog({ open: true, editing: null });
  }

  function openEdit(category: Category) {
    setDialog({ open: true, editing: category });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await removeCategory(deleting.id);
      setDeleting(null);
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group your tasks into the areas of life they belong to."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New category
          </Button>
        }
      />

      {status === "loading" || status === "idle" ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
          <Spinner /> Loading categories…
        </div>
      ) : status === "error" ? (
        <EmptyState title="Couldn't load your categories" description={error ?? undefined} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-5 w-5" />}
          title="No categories yet"
          description="Create categories like Work, Personal or Study to organise tasks."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.id} className="group flex items-center gap-3 p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{
                  backgroundColor: `${category.color ?? "#e0a35e"}22`,
                  color: category.color ?? "#e0a35e",
                }}
              >
                {category.icon || (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color ?? "var(--accent)" }}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {category.name}
                </p>
                <p className="text-xs text-muted">
                  {counts[category.id] ?? 0} open task
                  {(counts[category.id] ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button
                  onClick={() => openEdit(category)}
                  aria-label="Edit category"
                  className="rounded-lg p-2 text-muted transition hover:bg-surface-3 hover:text-foreground focus-ring"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleting(category)}
                  aria-label="Delete category"
                  className="rounded-lg p-2 text-muted transition hover:bg-rose-500/10 hover:text-rose-300 focus-ring"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {dialog.open ? (
        <CategoryDialog
          editing={dialog.editing}
          onClose={() => setDialog({ open: false, editing: null })}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this category?"
        message={
          deleting
            ? `"${deleting.name}" will be removed. Its ${
                counts[deleting.id] ?? 0
              } task(s) will be kept and marked as Uncategorized.`
            : ""
        }
        pending={deletePending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function CategoryDialog({
  editing,
  onClose,
}: {
  editing: Category | null;
  onClose: () => void;
}) {
  const { addCategory, editCategory } = useData();
  const [name, setName] = useState(editing?.name ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [color, setColor] = useState(editing?.color ?? ACCENT_PRESETS[0]);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setFormError("Give your category a name.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const payload = {
        name: name.trim(),
        color,
        icon: icon.trim() || null,
      };
      if (editing) {
        await editCategory(editing.id, payload);
      } else {
        await addCategory(payload);
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
      title={editing ? "Edit category" : "New category"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? (
              <Spinner className="border-accent-foreground/40 border-t-accent-foreground" />
            ) : null}
            {editing ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {formError ? <ErrorNote>{formError}</ErrorNote> : null}

        <div className="flex gap-3">
          <Field label="Icon" className="w-20">
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🌿"
              maxLength={2}
              className="text-center text-lg"
            />
          </Field>
          <Field label="Name" className="flex-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. University"
            />
          </Field>
        </div>

        <Field label="Colour">
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={`Use colour ${preset}`}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition focus-ring",
                  color === preset
                    ? "border-foreground"
                    : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: preset }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Custom colour"
              className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-surface"
            />
          </div>
        </Field>
      </div>
    </Modal>
  );
}
