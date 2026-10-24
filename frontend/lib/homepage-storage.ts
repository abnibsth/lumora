import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  HomepageContent,
  HomepageAdminState,
  HomepageRevision,
} from "@/types/homepage";
import { DEFAULT_HOMEPAGE_CONTENT } from "./homepage-defaults";

const STORAGE_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(STORAGE_DIR, "homepage-store.json");

function getInitialState(): HomepageAdminState {
  return {
    lockVersion: 1,
    draftUpdatedAt: new Date().toISOString(),
    draftUpdatedByName: "Sistem (Inisialisasi)",
    draftContent: DEFAULT_HOMEPAGE_CONTENT,
    revisions: [],
  };
}

export function readHomepageStore(): HomepageAdminState {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      const initial = getInitialState();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const data = fs.readFileSync(STORAGE_FILE, "utf-8");
    const parsed = JSON.parse(data) as HomepageAdminState;
    if (!parsed || !parsed.draftContent) {
      return getInitialState();
    }
    return parsed;
  } catch (err) {
    console.error("Gagal membaca homepage storage, menggunakan default:", err);
    return getInitialState();
  }
}

function writeHomepageStore(state: HomepageAdminState): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  // Write to temporary file first then rename for atomic persistence
  const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(tempFile, STORAGE_FILE);
}

// Get content for the public landing page (published revision or fallback)
export function getHomepagePublicContent(): {
  content: HomepageContent;
  isPublished: boolean;
  publishedAt?: string;
} {
  const store = readHomepageStore();
  if (store.publishedRevisionId && store.revisions.length > 0) {
    const published = store.revisions.find(
      (r) => r.id === store.publishedRevisionId
    );
    if (published) {
      return {
        content: published.content,
        isPublished: true,
        publishedAt: published.publishedAt,
      };
    }
  }
  return {
    content: DEFAULT_HOMEPAGE_CONTENT,
    isPublished: false,
  };
}

export function getHomepageAdminState(): HomepageAdminState {
  return readHomepageStore();
}

export function getHomepageRevisions(): HomepageRevision[] {
  return readHomepageStore().revisions;
}

// Save draft content (does NOT publish to public)
export function saveHomepageDraft(
  draft: HomepageContent,
  adminName: string
): HomepageAdminState {
  const store = readHomepageStore();
  store.draftContent = draft;
  store.lockVersion += 1;
  store.draftUpdatedAt = new Date().toISOString();
  store.draftUpdatedByName = adminName || "Administrator";
  writeHomepageStore(store);
  return store;
}

// Publish current draft to public live site
export function publishHomepageDraft(adminName: string): {
  state: HomepageAdminState;
  revision: HomepageRevision;
} {
  const store = readHomepageStore();
  const revisionId = crypto.randomUUID();
  const publishedAt = new Date().toISOString();

  const newRevision: HomepageRevision = {
    id: revisionId,
    publishedAt,
    publishedByName: adminName || "Administrator",
    content: JSON.parse(JSON.stringify(store.draftContent)),
  };

  store.publishedRevisionId = revisionId;
  store.lastPublishedAt = publishedAt;
  store.lastPublishedByName = adminName || "Administrator";
  store.lockVersion += 1;
  // Prepend to revisions history, keep up to 20 latest revisions
  store.revisions = [newRevision, ...store.revisions].slice(0, 20);

  writeHomepageStore(store);
  return { state: store, revision: newRevision };
}

// Restore an older revision into the draft (admin must preview & publish separately)
export function restoreHomepageRevision(
  revisionId: string,
  adminName: string
): HomepageAdminState {
  const store = readHomepageStore();
  const target = store.revisions.find((r) => r.id === revisionId);
  if (!target) {
    throw new Error("Revisi tidak ditemukan");
  }

  store.draftContent = JSON.parse(JSON.stringify(target.content));
  store.lockVersion += 1;
  store.draftUpdatedAt = new Date().toISOString();
  store.draftUpdatedByName = `${adminName || "Administrator"} (Pemulihan Revisi ${new Date(target.publishedAt).toLocaleDateString("id-ID")})`;

  writeHomepageStore(store);
  return store;
}
