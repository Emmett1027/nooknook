import type { ReactNode } from "react";
import { AppLayout } from "@/components/app-layout";

// Every page in this subtree loads its data client-side once the user is
// authenticated, so navigations are allowed to block until that data arrives.
// This server layout is the lowest shared segment we can opt out from — the
// `instant` export is not allowed in the client-component layouts/pages below.
export const instant = false;

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
