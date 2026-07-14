import { createFileRoute, redirect } from "@tanstack/react-router";
import { completeGoogleLogin } from "@/backend/functions/auth";

export const Route = createFileRoute("/auth/google/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (search.error) {
      throw redirect({ to: "/login", search: { error: "google_denied" } });
    }
    if (!search.code || !search.state) {
      throw redirect({ to: "/login", search: { error: "google_invalid" } });
    }

    try {
      await completeGoogleLogin({ data: { code: search.code, state: search.state } });
    } catch {
      throw redirect({ to: "/login", search: { error: "google_failed" } });
    }

    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
