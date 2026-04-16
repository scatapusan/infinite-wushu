import { cookies } from "next/headers";

/**
 * Server-side coach mode check. Reads the cookie set by the client toggle.
 * Safe to call in any server component or server action.
 */
export function isCoachModeServer(): boolean {
  try {
    return cookies().get("wuxue_coach")?.value === "1";
  } catch {
    // cookies() throws outside of request context (e.g., during static generation)
    return false;
  }
}
