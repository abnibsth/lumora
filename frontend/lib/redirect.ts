import { ROUTES } from "@/lib/constants";

export function getRedirectTarget(next: string | string[] | undefined): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return ROUTES.dashboard;
}
