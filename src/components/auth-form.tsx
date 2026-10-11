"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon } from "lucide-react";
import { Button, ErrorNote, Field, Input, Spinner } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/utils";

type Mode = "signin" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (isSignup && password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }

    setPending(true);
    try {
      const supabase = getBrowserSupabase();

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: displayName.trim() ? { display_name: displayName.trim() } : undefined,
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback`
                : undefined,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          setNotice(
            "Account created. Check your email to confirm your address, then sign in.",
          );
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm animate-nook-in">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-[0_12px_32px_-12px_var(--accent)]">
          <Moon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          {isSignup ? "Create your nook" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isSignup
            ? "A cozy home for your tasks, categories and projects."
            : "Sign in to pick up where you left off."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-surface/80 p-6 shadow-2xl backdrop-blur-sm"
      >
        {error ? <ErrorNote>{error}</ErrorNote> : null}
        {notice ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {notice}
          </div>
        ) : null}

        {isSignup ? (
          <Field label="Display name">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex"
              autoComplete="name"
            />
          </Field>
        ) : null}

        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </Field>

        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? (
            <Spinner className="border-accent-foreground/40 border-t-accent-foreground" />
          ) : null}
          {isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to Nook? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-accent hover:underline focus-ring"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
