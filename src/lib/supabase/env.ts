/**
 * Environment resolution for the Supabase clients.
 *
 * The installed `@supabase/ssr` / `@supabase/supabase-js` packages do not read
 * environment variables on their own — the project URL and key are always
 * passed into `createBrowserClient` / `createServerClient`. Because the browser
 * bundle needs these values, they must use the `NEXT_PUBLIC_` prefix.
 *
 * We accept either the modern publishable key or the legacy anon key so the app
 * works regardless of which key style the project exposes.
 */
export type SupabaseEnv = {
  url: string;
  key: string;
};

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.example to .env.local and set it.",
    );
  }
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY). Copy .env.example to .env.local and set it.",
    );
  }

  return { url, key };
}
