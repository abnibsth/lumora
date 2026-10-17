import { describe, expect, it } from "vitest";
import { BMC_LABELS } from "@/lib/dashboard";
import { BMC_BLOCK_DEFINITIONS } from "./bmc-guide-data";

describe("BMC Block Definitions and Layout", () => {
  it("contains exactly 9 standard blocks matching BMC_LABELS", () => {
    expect(BMC_BLOCK_DEFINITIONS).toHaveLength(9);
    const defLabels = BMC_BLOCK_DEFINITIONS.map((def) => def.label);
    BMC_LABELS.forEach((label) => {
      expect(defLabels).toContain(label);
    });
  });

  it("each definition contains required guiding questions, tips, examples, and grid area", () => {
    BMC_BLOCK_DEFINITIONS.forEach((def) => {
      expect(def.id).toBeTruthy();
      expect(def.shortName).toBeTruthy();
      expect(def.order).toBeGreaterThanOrEqual(1);
      expect(def.order).toBeLessThanOrEqual(9);
      expect(["feasibility", "desirability", "viability"]).toContain(def.category);
      expect(def.description.length).toBeGreaterThan(10);
      expect(def.guidingQuestions.length).toBeGreaterThanOrEqual(2);
      expect(def.examples.length).toBeGreaterThanOrEqual(2);
      expect(def.tips.length).toBeGreaterThan(5);
      expect(def.placeholder.length).toBeGreaterThan(5);
      expect(def.gridArea).toBeTruthy();
    });
  });

  it("maps correctly to canonical Osterwalder BMC categories", () => {
    const feasibility = BMC_BLOCK_DEFINITIONS.filter((d) => d.category === "feasibility").map((d) => d.label);
    expect(feasibility).toEqual(expect.arrayContaining(["Mitra Utama", "Aktivitas Utama", "Sumber Daya Utama"]));

    const desirability = BMC_BLOCK_DEFINITIONS.filter((d) => d.category === "desirability").map((d) => d.label);
    expect(desirability).toEqual(expect.arrayContaining(["Proposisi Nilai", "Hubungan Pelanggan", "Saluran", "Segmen Pelanggan"]));

    const viability = BMC_BLOCK_DEFINITIONS.filter((d) => d.category === "viability").map((d) => d.label);
    expect(viability).toEqual(expect.arrayContaining(["Struktur Biaya", "Sumber Pendapatan"]));
  });
});
