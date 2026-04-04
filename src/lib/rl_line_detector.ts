const KEY = "palm_line_bias_v2";

const BASE_LEARN = 0.045;
const MAX_BIAS   = 0.25;

export type LineBias = {
  xBias: number;
  yBias: number;
  confidence: number;
  // Momentum tracking
  lastDx: number;
  lastDy: number;
  streakX: number; // consecutive same-direction x moves
  streakY: number;
};
export type AllBiases = Record<string, LineBias>;

const DEFAULT_BIAS: LineBias = {
  xBias: 0, yBias: 0, confidence: 0,
  lastDx: 0, lastDy: 0, streakX: 0, streakY: 0,
};

const DEFAULTS: AllBiases = {
  heart: { ...DEFAULT_BIAS },
  head:  { ...DEFAULT_BIAS },
  life:  { ...DEFAULT_BIAS },
  fate:  { ...DEFAULT_BIAS },
};

export const RLLineDetector = {
  getBiases(): AllBiases {
    if (typeof window === "undefined") return structuredClone(DEFAULTS);
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved) return structuredClone(DEFAULTS);
      // Merge so new keys (streakX etc.) always exist
      const merged: AllBiases = {};
      for (const k of Object.keys(DEFAULTS)) {
        merged[k] = { ...DEFAULT_BIAS, ...(saved[k] ?? {}) };
      }
      return merged;
    } catch {
      return structuredClone(DEFAULTS);
    }
  },

  /**
   * Adjust line position with:
   *  - Adaptive learning rate  : slower as confidence rises (converges)
   *  - Momentum                : same direction 2× in a row → 1.6× speed
   *  - Reversal penalty        : direction flip → confidence −8, streak reset
   */
  adjust(line: string, dx: number, dy: number): AllBiases {
    const all = this.getBiases();
    const b = { ...all[line] };

    // Adaptive rate: full speed when naive, slows to 30% at high confidence
    const adaptRate = BASE_LEARN * Math.max(0.3, 1 - b.confidence / 150);

    // X axis
    const xReversal = b.lastDx !== 0 && dx !== 0 && dx !== b.lastDx;
    const xStreak   = dx !== 0 && dx === b.lastDx ? b.streakX + 1 : 0;
    const xMomentum = xStreak >= 1 ? 1.6 : 1.0;
    b.xBias   = Math.max(-MAX_BIAS, Math.min(MAX_BIAS, b.xBias + dx * adaptRate * xMomentum));
    b.streakX = xStreak;
    b.lastDx  = dx !== 0 ? dx : b.lastDx;

    // Y axis
    const yReversal = b.lastDy !== 0 && dy !== 0 && dy !== b.lastDy;
    const yStreak   = dy !== 0 && dy === b.lastDy ? b.streakY + 1 : 0;
    const yMomentum = yStreak >= 1 ? 1.6 : 1.0;
    b.yBias   = Math.max(-MAX_BIAS, Math.min(MAX_BIAS, b.yBias + dy * adaptRate * yMomentum));
    b.streakY = yStreak;
    b.lastDy  = dy !== 0 ? dy : b.lastDy;

    // Confidence update
    if (xReversal || yReversal) {
      b.confidence = Math.max(0, b.confidence - 8); // wrong direction penalty
    } else {
      b.confidence = Math.min(100, b.confidence + 2);
    }

    all[line] = b;
    localStorage.setItem(KEY, JSON.stringify(all));
    return all;
  },

  /**
   * User confirms the position is correct.
   * Larger confidence boost when no recent reversals (streak intact).
   */
  confirm(line: string): AllBiases {
    const all = this.getBiases();
    const b = { ...all[line] };
    // Bigger reward if streak is going (user converged quickly)
    const bonus = (b.streakX + b.streakY) > 0 ? 15 : 10;
    b.confidence = Math.min(100, b.confidence + bonus);
    // Reset momentum — position is settled
    b.lastDx = 0; b.lastDy = 0;
    b.streakX = 0; b.streakY = 0;
    all[line] = b;
    localStorage.setItem(KEY, JSON.stringify(all));
    return all;
  },

  overallConfidence(): number {
    const vals = Object.values(this.getBiases());
    return Math.round(vals.reduce((s, b) => s + b.confidence, 0) / vals.length);
  },
};
