"use client";

import { useEffect, useState } from "react";
import { Check, LogOut, Palette, Save, User } from "lucide-react";
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Spinner,
} from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/providers/auth-provider";
import { useData } from "@/providers/data-provider";
import {
  ACCENT_PRESETS,
  THEMES,
  applyTheme,
  resolveAccent,
  resolveTheme,
  type ThemeId,
} from "@/lib/theme";
import { cn, errorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function SettingsForm() {
  const { profile, status } = useData();

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted">
        <Spinner /> Loading settings…
      </div>
    );
  }

  // Mount the form only once the profile is available so it can seed its local
  // state from the loaded values without a syncing effect.
  return <SettingsFormInner key={profile?.id ?? "profile"} />;
}

function SettingsFormInner() {
  const { user, signOut } = useAuth();
  const { profile, saveProfile } = useData();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [theme, setTheme] = useState<ThemeId>(resolveTheme(profile?.theme));
  const [accent, setAccent] = useState(resolveAccent(profile?.accent_color));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Live preview while choosing.
  useEffect(() => {
    applyTheme(theme, accent);
  }, [theme, accent]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await saveProfile({
        display_name: displayName.trim() || null,
        theme,
        accent_color: accent,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Personalise your nook and manage your account."
      />

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {error ? <ErrorNote>{error}</ErrorNote> : null}

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email" hint="Managed by Supabase authentication">
              <Input value={user?.email ?? ""} disabled />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Theme
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {THEMES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setTheme(preset.id);
                  setAccent(preset.defaultAccent);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition focus-ring",
                  theme === preset.id
                    ? "border-accent bg-surface-2"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border"
                  style={{ backgroundColor: preset.swatch }}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preset.defaultAccent }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {preset.label}
                    </span>
                    {theme === preset.id ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : null}
                  </span>
                  <span className="block text-xs text-muted">{preset.description}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted">
            Accent colour
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setAccent(color)}
                aria-label={`Use accent ${color}`}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition focus-ring",
                  accent.toLowerCase() === color.toLowerCase()
                    ? "border-foreground"
                    : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              aria-label="Custom accent colour"
              className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface"
            />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Spinner className="border-accent-foreground/40 border-t-accent-foreground" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </Button>
          {saved ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-300">
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : null}
        </div>
      </form>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-foreground">Session</h2>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user?.email}. Signing out keeps all your data safely synced.
        </p>
        <Button variant="secondary" className="mt-4" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </Card>

      <p className="mt-6 text-xs text-muted-2">
        Profile record created{" "}
        {profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "—"}
        .
      </p>
    </div>
  );
}
