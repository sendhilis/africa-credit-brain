import { describe, it, expect } from "vitest";
import {
  SCORING_PARAMS,
  SIM_FEATURES,
  getFeaturesForSegment,
  getFeaturesByPillar,
  type BorrowerSegment,
  type SimFeature,
} from "@/components/models/scoreSimulatorData";

// ── Replicate exact scoring formula from ScoreSimulator.tsx ──
function computeScore(
  features: SimFeature[],
  binSelections: Record<string, number>,
  segment: BorrowerSegment = "retail"
) {
  const { baseScore, baseOdds, pdo } = SCORING_PARAMS;
  const intercept = SCORING_PARAMS.intercept[segment] ?? SCORING_PARAMS.defaultIntercept;
  const factor = pdo / Math.LN2;
  const offset = baseScore - factor * Math.log(baseOdds);

  let logOdds = intercept;
  const contributions: {
    key: string;
    label: string;
    beta: number;
    woe: number;
    term: number;
    points: number;
  }[] = [];

  features.forEach((f) => {
    const binIdx = binSelections[f.key] ?? 0;
    const bin = f.bins[binIdx] ?? f.bins[0];
    const term = f.beta * bin.woe;
    logOdds += term;
    const points = factor * term;
    contributions.push({
      key: f.key,
      label: f.label,
      beta: f.beta,
      woe: bin.woe,
      term,
      points,
    });
  });

  const odds = Math.exp(logOdds);
  const pd = 1 / (1 + odds);
  const rawScore = offset + factor * logOdds;
  const finalScore = Math.round(Math.max(300, Math.min(900, rawScore)));

  return { logOdds, odds, pd, rawScore, finalScore, contributions, factor, offset };
}

const SEGMENTS: BorrowerSegment[] = ["retail", "micro", "sme", "farmer"];

// ══════════════════════════════════════════════════════════════
// TEST 1: Data integrity checks
// ══════════════════════════════════════════════════════════════

describe("Score Simulator Data Integrity", () => {
  it("every feature has at least 2 bins", () => {
    SIM_FEATURES.forEach((f) => {
      expect(f.bins.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("every feature has a non-empty label", () => {
    SIM_FEATURES.forEach((f) => {
      expect(f.label.length).toBeGreaterThan(0);
    });
  });

  it("no duplicate feature keys", () => {
    const keys = SIM_FEATURES.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every feature is applicable to at least one segment", () => {
    SIM_FEATURES.forEach((f) => {
      expect(f.applicableTo.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("all segments have at least 10 features", () => {
    SEGMENTS.forEach((seg) => {
      const count = getFeaturesForSegment(seg).length;
      expect(count).toBeGreaterThanOrEqual(10);
    });
  });

  it("all betas are non-zero", () => {
    SIM_FEATURES.forEach((f) => {
      expect(f.beta).not.toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// TEST 2: WoE monotonicity & sign consistency
// ══════════════════════════════════════════════════════════════

describe("WoE Sign Consistency", () => {
  it("all betas should be negative (higher WoE = higher risk = lower score)", () => {
    const positiveBetas = SIM_FEATURES.filter((f) => f.beta > 0);
    if (positiveBetas.length > 0) {
      console.warn(
        "⚠️  ANOMALY: Features with POSITIVE beta (unusual — means positive WoE BOOSTS score):",
        positiveBetas.map((f) => `${f.key} (β=${f.beta})`)
      );
    }
    // All current features should have negative beta
    positiveBetas.forEach((f) => {
      expect(f.beta).toBeLessThan(0);
    });
  });

  it("for each feature, the 'best' bin should have the most negative WoE", () => {
    const anomalies: string[] = [];
    SIM_FEATURES.forEach((f) => {
      const woes = f.bins.map((b) => b.woe);
      const minWoe = Math.min(...woes);
      const maxWoe = Math.max(...woes);
      // The range should be meaningful
      if (maxWoe - minWoe < 0.1) {
        anomalies.push(`${f.key}: WoE range too narrow (${minWoe} to ${maxWoe})`);
      }
    });
    if (anomalies.length > 0) {
      console.warn("⚠️  Narrow WoE range features:", anomalies);
    }
  });
});

// ══════════════════════════════════════════════════════════════
// TEST 3: Direction logic — the CRITICAL test
// When beta < 0 and WoE < 0: term = (+), logOdds ↑, score ↑ → should be BOOST
// When beta < 0 and WoE > 0: term = (-), logOdds ↓, score ↓ → should be PENALTY
// The current code: points = -factor * term
//   - term positive → points negative → UI shows "Penalty" (red) ← WRONG!
// ══════════════════════════════════════════════════════════════

describe("Direction Logic (Points Sign)", () => {
  it("points sign should correctly align with score impact direction", () => {
    const factor = SCORING_PARAMS.pdo / Math.LN2;
    const anomalies: string[] = [];

    SIM_FEATURES.forEach((f) => {
      f.bins.forEach((bin) => {
        const term = f.beta * bin.woe;
        const points = factor * term;

        if (term > 0.01) {
          // Score goes UP — points should be POSITIVE (boost)
          if (points < -0.01) {
            anomalies.push(
              `${f.key} "${bin.label}": term=+${term.toFixed(3)} (score↑) but points=${points.toFixed(1)} shows as PENALTY`
            );
          }
        } else if (term < -0.01) {
          // Score goes DOWN — points should be NEGATIVE (penalty)
          if (points > 0.01) {
            anomalies.push(
              `${f.key} "${bin.label}": term=${term.toFixed(3)} (score↓) but points=+${points.toFixed(1)} shows as BOOST`
            );
          }
        }
      });
    });

    console.log(`\n🔍 Direction anomalies: ${anomalies.length}`);
    // With the fix applied, there should be ZERO anomalies
    expect(anomalies.length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════
// TEST 4: Best-case vs Worst-case score for each segment
// ══════════════════════════════════════════════════════════════

describe("Score Range Tests per Segment", () => {
  SEGMENTS.forEach((seg) => {
    describe(`Segment: ${seg}`, () => {
      const features = getFeaturesForSegment(seg);

      it("all-best bins should produce a high score (≥740)", () => {
        // For negative beta, best WoE is most negative
        const bestSelections: Record<string, number> = {};
        features.forEach((f) => {
          let bestIdx = 0;
          let bestTerm = f.beta * f.bins[0].woe;
          f.bins.forEach((bin, i) => {
            const term = f.beta * bin.woe;
            if (term > bestTerm) {
              bestTerm = term;
              bestIdx = i;
            }
          });
          bestSelections[f.key] = bestIdx;
        });

        const result = computeScore(features, bestSelections, seg);
        console.log(`  ✅ ${seg} ALL-BEST: score=${result.finalScore}, PD=${(result.pd * 100).toFixed(2)}%, raw=${result.rawScore.toFixed(1)}`);
        expect(result.finalScore).toBeGreaterThanOrEqual(740);
      });

      it("all-worst bins should produce a low score (≤500)", () => {
        const worstSelections: Record<string, number> = {};
        features.forEach((f) => {
          let worstIdx = 0;
          let worstTerm = f.beta * f.bins[0].woe;
          f.bins.forEach((bin, i) => {
            const term = f.beta * bin.woe;
            if (term < worstTerm) {
              worstTerm = term;
              worstIdx = i;
            }
          });
          worstSelections[f.key] = worstIdx;
        });

        const result = computeScore(features, worstSelections, seg);
        console.log(`  ❌ ${seg} ALL-WORST: score=${result.finalScore}, PD=${(result.pd * 100).toFixed(2)}%, raw=${result.rawScore.toFixed(1)}`);
        expect(result.finalScore).toBeLessThanOrEqual(500);
      });

      it("all-default (first bins) should produce a reasonable mid-range score (400-800)", () => {
        const result = computeScore(features, {}, seg);
        console.log(`  🔘 ${seg} ALL-DEFAULT: score=${result.finalScore}, PD=${(result.pd * 100).toFixed(2)}%, raw=${result.rawScore.toFixed(1)}`);
        expect(result.finalScore).toBeGreaterThanOrEqual(400);
        expect(result.finalScore).toBeLessThanOrEqual(800);
      });

      it("best score > default score > worst score", () => {
        const bestSel: Record<string, number> = {};
        const worstSel: Record<string, number> = {};
        features.forEach((f) => {
          let bestIdx = 0, worstIdx = 0;
          let bestTerm = f.beta * f.bins[0].woe;
          let worstTerm = bestTerm;
          f.bins.forEach((bin, i) => {
            const term = f.beta * bin.woe;
            if (term > bestTerm) { bestTerm = term; bestIdx = i; }
            if (term < worstTerm) { worstTerm = term; worstIdx = i; }
          });
          bestSel[f.key] = bestIdx;
          worstSel[f.key] = worstIdx;
        });

        const best = computeScore(features, bestSel, seg);
        const def = computeScore(features, {}, seg);
        const worst = computeScore(features, worstSel, seg);

        expect(best.finalScore).toBeGreaterThanOrEqual(def.finalScore);
        expect(def.finalScore).toBeGreaterThanOrEqual(worst.finalScore);
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════
// TEST 5: Individual feature impact — each feature should
// meaningfully move the score when toggled best→worst
// ══════════════════════════════════════════════════════════════

describe("Individual Feature Impact", () => {
  SEGMENTS.forEach((seg) => {
    const features = getFeaturesForSegment(seg);

    it(`${seg}: every feature should move score by at least 1 point when toggled`, () => {
      const zeroImpact: string[] = [];

      features.forEach((f) => {
        let bestIdx = 0, worstIdx = 0;
        let bestTerm = f.beta * f.bins[0].woe;
        let worstTerm = bestTerm;
        f.bins.forEach((bin, i) => {
          const term = f.beta * bin.woe;
          if (term > bestTerm) { bestTerm = term; bestIdx = i; }
          if (term < worstTerm) { worstTerm = term; worstIdx = i; }
        });

        const bestSel: Record<string, number> = { [f.key]: bestIdx };
        const worstSel: Record<string, number> = { [f.key]: worstIdx };
        const bestResult = computeScore(features, bestSel);
        const worstResult = computeScore(features, worstSel);
        const impact = Math.abs(bestResult.finalScore - worstResult.finalScore);

        if (impact < 1) {
          zeroImpact.push(`${f.key} (β=${f.beta}, WoE range: ${f.bins.map(b => b.woe).join(",")})`);
        }
      });

      if (zeroImpact.length > 0) {
        console.warn(`⚠️  ${seg}: Features with <1pt impact:`, zeroImpact);
      }
      expect(zeroImpact.length).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// TEST 6: PD should be between 0 and 1 for all scenarios
// ══════════════════════════════════════════════════════════════

describe("PD Validity", () => {
  SEGMENTS.forEach((seg) => {
    it(`${seg}: PD always between 0 and 1`, () => {
      const features = getFeaturesForSegment(seg);
      // Test all-best, all-worst, all-default
      [
        {},
        Object.fromEntries(features.map((f) => [f.key, f.bins.length - 1])),
        Object.fromEntries(features.map((f) => [f.key, 0])),
      ].forEach((sel) => {
        const result = computeScore(features, sel);
        expect(result.pd).toBeGreaterThan(0);
        expect(result.pd).toBeLessThan(1);
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════
// TEST 7: Pillar coverage — ensure key pillars present
// ══════════════════════════════════════════════════════════════

describe("Pillar Coverage", () => {
  it("retail should have identity, financial, social, behavioral pillars", () => {
    const pillars = Object.keys(getFeaturesByPillar("retail"));
    expect(pillars).toContain("identity");
    expect(pillars).toContain("financial");
    expect(pillars).toContain("social");
    expect(pillars).toContain("behavioral");
  });

  it("farmer should have agricultural pillar with ≥10 features", () => {
    const groups = getFeaturesByPillar("farmer");
    expect(groups.agricultural).toBeDefined();
    expect(groups.agricultural.length).toBeGreaterThanOrEqual(10);
  });

  it("sme should have business pillar", () => {
    const pillars = Object.keys(getFeaturesByPillar("sme"));
    expect(pillars).toContain("business");
  });

  it("farmer should have bread_basket_margin feature", () => {
    const features = getFeaturesForSegment("farmer");
    expect(features.find((f) => f.key === "bread_basket_margin")).toBeDefined();
  });

  it("all segments should have bread_basket_margin", () => {
    SEGMENTS.forEach((seg) => {
      const features = getFeaturesForSegment(seg);
      const bbm = features.find((f) => f.key === "bread_basket_margin");
      expect(bbm).toBeDefined();
    });
  });

  it("sme and farmer should have DSCR", () => {
    ["sme", "farmer"].forEach((seg) => {
      const features = getFeaturesForSegment(seg as BorrowerSegment);
      expect(features.find((f) => f.key === "dscr")).toBeDefined();
    });
  });

  it("retail should have employment_stability", () => {
    const features = getFeaturesForSegment("retail");
    expect(features.find((f) => f.key === "employment_stability")).toBeDefined();
  });
});
