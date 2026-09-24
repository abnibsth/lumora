/**
 * Saved-business storage, exposed as an external store.
 *
 * There is no account system and no backend, so a bookmark cannot be persisted
 * server-side. Rather than ship a button that does nothing (R-26), the save is
 * kept in localStorage and the discovery section states that it is stored on
 * this device. That is the honest scope of the feature right now.
 *
 * Why a store instead of reading localStorage in an effect: the value lives
 * outside React, so `useSyncExternalStore` is the API built for it. It also gets
 * the server and client renders right for free. The server snapshot is always
 * empty, so the HTML is rendered without any saved state, and React swaps in the
 * stored value immediately after hydration instead of the component guessing and
 * then correcting itself.
 *
 * localStorage is treated as a persistence layer, not as the source of truth.
 * The in-memory list is authoritative once loaded, so the toggle keeps working
 * for the session when storage is unavailable (private modes, a full quota),
 * where a read-through cache would silently revert the user's click.
 *
 * Known limit: a save in one tab does not appear in another until reload. The
 * `storage` event is deliberately not wired up, because no page currently reads
 * the saved list.
 */

const STORAGE_KEY = "lumora:saved-businesses";

/** A single stable reference, so the snapshot never changes identity by accident. */
const EMPTY: readonly string[] = [];

const listeners = new Set<() => void>();

let loaded = false;
let cachedSlugs: readonly string[] = EMPTY;

function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const slugs = parsed.filter(
      (value): value is string => typeof value === "string",
    );
    return slugs.length > 0 ? slugs : EMPTY;
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getSavedSlugsSnapshot(): readonly string[] {
  if (!loaded) {
    loaded = true;
    cachedSlugs = parse(readRaw());
  }
  return cachedSlugs;
}

export function getSavedSlugsServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function subscribeSavedSlugs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function writeSavedSlugs(slugs: readonly string[]): void {
  cachedSlugs = slugs;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Best effort. The change still holds for this session.
  }

  for (const listener of listeners) listener();
}
