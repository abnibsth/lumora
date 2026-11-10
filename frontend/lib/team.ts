import fs from "fs";
import path from "path";
import {
  DEFAULT_TEAM_ROLES,
  TEAM_ROLE_BY_NAME,
  teamMembers as fallbackTeamMembers,
  type TeamMember,
} from "@/data/team";

const IMAGE_FILE_REGEX = /\.(webp|png|jpe?g|avif|gif|svg)$/i;

/**
 * Mengubah nama file foto (misal "abni.jpg" atau "01_muhammad-alfian.png")
 * menjadi nama lengkap yang rapi ("Abni" / "Muhammad Alfian").
 */
export function formatMemberNameFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, "").trim();
  const withoutIndexPrefix = withoutExt.replace(/^\d+[\s._-]+/, "").trim();
  const rawName = (withoutIndexPrefix || withoutExt)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!rawName) {
    return "Anggota Tim LUMORA";
  }

  return rawName
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word.length <= 3 && word.includes(".")) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function resolveImgTeamDir(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "imgteam"),
    path.join(process.cwd(), "frontend", "public", "imgteam"),
  ];

  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        return dir;
      }
    } catch {
      // Lanjutkan ke kandidat berikutnya
    }
  }

  return null;
}

/**
 * Membaca daftar foto tim secara otomatis dari `frontend/public/imgteam`.
 * Nama file langsung digunakan sebagai nama anggota tim dan dicocokkan dengan peran masing-masing.
 */
export function getPublicTeamMembers(): TeamMember[] {
  const dir = resolveImgTeamDir();
  if (!dir) {
    return fallbackTeamMembers;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const imageFiles = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          !entry.name.startsWith(".") &&
          IMAGE_FILE_REGEX.test(entry.name)
      )
      .map((entry) => entry.name)
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      );

    if (imageFiles.length === 0) {
      return fallbackTeamMembers;
    }

    return imageFiles.map((filename, index) => {
      const name = formatMemberNameFromFilename(filename);
      const firstKey = name.toLowerCase().split(" ")[0] ?? "";
      const roleProfile =
        TEAM_ROLE_BY_NAME[name.toLowerCase()] ??
        TEAM_ROLE_BY_NAME[firstKey] ??
        DEFAULT_TEAM_ROLES[index % DEFAULT_TEAM_ROLES.length];
      const encodedFile = encodeURIComponent(filename);

      return {
        id: `team-${index + 1}-${filename.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
        role: roleProfile.role,
        bio: roleProfile.bio,
        photo: `/imgteam/${encodedFile}`,
        alt: `Potret ${name} — ${roleProfile.role} di LUMORA`,
        objectPosition: "center top",
      };
    });
  } catch {
    return fallbackTeamMembers;
  }
}
