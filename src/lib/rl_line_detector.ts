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

/**
 * 🏥 Anatomical Landmark Regions (Omega's Intuition)
 * These normalized [x0, y0, x1, y1] boxes define where lines MUST be.
 */
const LANDMARKS: Record<string, [number, number, number, number]> = {
  heart: [0.15, 0.22, 0.95, 0.45], // Top horizontal (Lowered y0 from 0.15 to 0.22 to avoid fingers)
  head:  [0.15, 0.35, 0.95, 0.65], // Middle horizontal
  life:  [0.05, 0.35, 0.55, 0.95], // Curve around thumb
  fate:  [0.30, 0.30, 0.75, 0.95], // Vertical center
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

  /**
   * 🤖 Agent Alpha: Pure Pixel Logic
   * Higher weight to absolute darkness (valley floor).
   */
  evaluateAlpha(brightness: number): number {
    // Inverse sigmoid: 0 (black) -> 1.0, 255 (white) -> 0.0
    return Math.pow(1 - brightness / 255, 2.5);
  },

  /**
   * 🧘 Agent Omega: Anatomical Intuition
   * Penalizes paths that wander outside the expected landmark box.
   */
  evaluateOmega(line: string, nx: number, ny: number): number {
    const box = LANDMARKS[line];
    if (!box) return 1.0;
    const [x0, y0, x1, y1] = box;
    
    // Smooth falloff if outside box
    let dist = 0;
    if (nx < x0) dist = x0 - nx;
    else if (nx > x1) dist = nx - x1;
    if (ny < y0) dist = Math.max(dist, y0 - ny);
    else if (ny > y1) dist = Math.max(dist, ny - y1);

    const exitPenalty = Math.exp(-dist * 12); // Sharp decay outside the 'Veda' zone
    
    // 🧤 Stage 14: Finger Exclusion RL (Guardrail)
    // High-altitude penalty to prevent line drift into finger segments (y < 0.20)
    if (ny < 0.20) {
      const fingerPenalty = Math.pow(ny / 0.20, 2); // Squared penalty as it gets closer to top
      return exitPenalty * fingerPenalty;
    }

    return exitPenalty;
  },

  /**
   * ⚖️ Collaborative Consensus
   * Combines Alpha's physical detection with Omega's structural guardrails.
   */
  getConsensus(line: string, nx: number, ny: number, brightness: number): number {
    const alpha = this.evaluateAlpha(brightness);
    const omega = this.evaluateOmega(line, nx, ny);
    
    // If Omega is highly skeptical (outside box), it overrides Alpha's local darkness
    return alpha * (0.4 + 0.6 * omega);
  },

  /**
   * 🌙 Silent Practice Engine (Stage 13)
   * Simulates line detection on 'ideal' anatomical paths to refine weights.
   * This runs in the background to fulfill "Continuous Background RL".
   */
  practice(iterations = 5): AllBiases {
    const all = this.getBiases();
    let updated = false;

    for (const [line, box] of Object.entries(LANDMARKS)) {
      const b = all[line];
      if (!b) continue;

      // Ideal center of the landmark box
      const idealX = (box[0] + box[2]) / 2;
      const idealY = (box[1] + box[3]) / 2;

      // Current biased "center" (assuming 0.5 is base)
      const currentX = 0.5 + b.xBias;
      const currentY = 0.5 + b.yBias;

      // Distance to ideal
      const dx = idealX - currentX;
      const dy = idealY - currentY;

      // Practice step: move 10% towards ideal anatomical center
      // This ensures the AI doesn't drift too far into "Noise" over time.
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        const pRate = 0.005; 
        b.xBias += dx * pRate;
        b.yBias += dy * pRate;
        // Confidence slowly rises during successful practice
        b.confidence = Math.min(100, b.confidence + 0.1);
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(KEY, JSON.stringify(all));
    }
    return all;
  }
};
