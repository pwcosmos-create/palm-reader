import { OracleContent, OracleStyle, DeepReading } from "./oracle_content";

export type AgentRole = "Alpha" | "Omega";

export interface AgentSynergy {
  agentId: string;
  role: AgentRole;
  contribution: number;
  specialty: string;
}

interface LineReward {
  lineName: string;
  rating: number;
  timestamp: number;
  synergyId?: string;
}

// ── ε-greedy Bandit state per (line × style) ─────────────────────────────────
interface ArmStats {
  count: number;       // times this style was selected
  totalRating: number; // cumulative reward
}
type StyleBandits = Record<string, Record<string, ArmStats>>;

const STYLES: OracleStyle[] = ["Mystical", "Psychological", "Practical", "Visionary"];
const STYLE_KEY = "palm_reader_style_bandit_v1";

export class RLEngine {
  private static STORAGE_KEY = "palm_reader_rl_v3";

  // ── Basic reward history ────────────────────────────────────────────────
  static saveReward(lineName: string, rating: number, synergyId?: string) {
    if (typeof window === "undefined") return;
    const history = this.getHistory();
    history.push({ lineName, rating, timestamp: Date.now(), synergyId });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history.slice(-100)));
  }

  static getHistory(): LineReward[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  static getPersonalizationLevel(): number {
    const history = this.getHistory();
    return Math.min(100, Math.floor((history.length / 20) * 100));
  }

  // ── ε-greedy Bandit: content style selection ────────────────────────────
  private static getBandits(): StyleBandits {
    try {
      return JSON.parse(localStorage.getItem(STYLE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  private static saveBandits(b: StyleBandits) {
    localStorage.setItem(STYLE_KEY, JSON.stringify(b));
  }

  /**
   * Select oracle style for a line using ε-greedy:
   *   ε = max(0.1, 1 / (1 + totalTrials × 0.15))  → explores early, exploits later
   * Returns both the chosen style and exploration flag for display.
   */
  static selectStyle(lineName: string): { style: OracleStyle; exploring: boolean } {
    if (typeof window === "undefined") return { style: "Mystical", exploring: true };
    const bandits = this.getBandits();
    const arms = bandits[lineName] || {};

    const totalTrials = STYLES.reduce((s, st) => s + (arms[st]?.count ?? 0), 0);
    const epsilon = Math.max(0.1, 1 / (1 + totalTrials * 0.15));

    // Explore
    if (Math.random() < epsilon) {
      const style = STYLES[Math.floor(Math.random() * STYLES.length)];
      return { style, exploring: true };
    }

    // Exploit: highest average rating (only among tried styles; fallback to untried)
    let bestStyle: OracleStyle = "Mystical";
    let bestAvg = -1;
    for (const st of STYLES) {
      const arm = arms[st];
      if (!arm || arm.count === 0) continue;
      const avg = arm.totalRating / arm.count;
      if (avg > bestAvg) { bestAvg = avg; bestStyle = st as OracleStyle; }
    }
    return { style: bestStyle, exploring: false };
  }

  /**
   * Update bandit reward after user rates a line.
   * rating 1-5 → normalized 0-1 reward.
   */
  static updateStyleReward(lineName: string, style: OracleStyle, rating: number) {
    if (typeof window === "undefined") return;
    const bandits = this.getBandits();
    if (!bandits[lineName]) bandits[lineName] = {};
    if (!bandits[lineName][style]) bandits[lineName][style] = { count: 0, totalRating: 0 };
    bandits[lineName][style].count++;
    bandits[lineName][style].totalRating += (rating - 1) / 4; // normalize to 0-1
    this.saveBandits(bandits);
  }

  /** Returns per-style average ratings for a line (for debug/display). */
  static getStyleStats(lineName: string): Record<string, { avg: number; count: number }> {
    const arms = this.getBandits()[lineName] || {};
    const result: Record<string, { avg: number; count: number }> = {};
    for (const st of STYLES) {
      const arm = arms[st];
      result[st] = arm && arm.count > 0
        ? { avg: Math.round((arm.totalRating / arm.count) * 100), count: arm.count }
        : { avg: 0, count: 0 };
    }
    return result;
  }

  // ── Oracle content generation ──────────────────────────────────────────
  static getEvolutionaryContent(lineName: string, style?: OracleStyle): DeepReading {
    const maturity = this.getPersonalizationLevel();
    const resolvedStyle = style ?? this.selectStyle(lineName).style;
    return OracleContent.generate(lineName, resolvedStyle, maturity);
  }

  // ── Global score ───────────────────────────────────────────────────────
  static getGlobalIntelligenceScore(): number {
    const history = this.getHistory();
    const collabBonus = history.filter((h) => h.synergyId).length * 500;
    return 128400 + history.length * 25 + collabBonus;
  }

  static async syncWithGlobal(_lineName: string, _rating: number) {
    await new Promise((r) => setTimeout(r, 300));
    return true;
  }

  static getCalibratedPrompt(): string {
    const history = this.getHistory();
    if (history.length === 0) return "Provide a premium mystical and deeply insightful reading.";
    const avg = history.reduce((s, c) => s + c.rating, 0) / history.length;
    const style = avg > 4 ? "Visionary" : avg < 3 ? "Practical" : "Psychological";
    return `[RL CALIBRATION] Maturity: ${this.getPersonalizationLevel()}% | Preferred Vector: ${style}`;
  }
}
