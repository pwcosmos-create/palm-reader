const KEY = "palm_line_bias_v1";
const LEARN = 0.045;  // increased from 0.025 for snappier adjustment
const MAX   = 0.25;   // increased from 0.18 for better coverage

export type LineBias  = { xBias: number; yBias: number; confidence: number };
export type AllBiases = Record<string, LineBias>;

const DEFAULTS: AllBiases = {
  heart: { xBias: 0, yBias: 0, confidence: 0 },
  head:  { xBias: 0, yBias: 0, confidence: 0 },
  life:  { xBias: 0, yBias: 0, confidence: 0 },
  fate:  { xBias: 0, yBias: 0, confidence: 0 },
};

export const RLLineDetector = {
  getBiases(): AllBiases {
    if (typeof window === "undefined") return { ...DEFAULTS };
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      // Merge with defaults so new keys are always present
      return saved ? { ...DEFAULTS, ...saved } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  },

  /** dx/dy: direction unit (-1, 0, +1). Applies LEARN per click. Returns updated AllBiases. */
  adjust(line: string, dx: number, dy: number): AllBiases {
    const all = this.getBiases();
    const b = { ...(all[line] ?? { xBias: 0, yBias: 0, confidence: 0 }) };
    b.xBias = Math.max(-MAX, Math.min(MAX, b.xBias + dx * LEARN));
    b.yBias = Math.max(-MAX, Math.min(MAX, b.yBias + dy * LEARN));
    b.confidence = Math.min(100, b.confidence + 3);
    all[line] = b;
    localStorage.setItem(KEY, JSON.stringify(all));
    return all;
  },

  /** User confirms the line position is correct — boosts confidence without shifting. */
  confirm(line: string): AllBiases {
    const all = this.getBiases();
    const b = { ...(all[line] ?? { xBias: 0, yBias: 0, confidence: 0 }) };
    b.confidence = Math.min(100, b.confidence + 10);
    all[line] = b;
    localStorage.setItem(KEY, JSON.stringify(all));
    return all;
  },

  /** Overall detection confidence: average across all lines (0–100). */
  overallConfidence(): number {
    const vals = Object.values(this.getBiases());
    return Math.round(vals.reduce((s, b) => s + b.confidence, 0) / vals.length);
  },
};
