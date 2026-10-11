"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Browser Supabase client.
 *
 * Created lazily and memoized so it is only instantiated in the browser (inside
 * effects / event handlers), never during a server render or prerender. The
 * session lives in cookies so the proxy and server can read it too.
 */
let browserClient: SupabaseClient | undefined;

export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    const { url, key } = getSupabaseEnv();
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
