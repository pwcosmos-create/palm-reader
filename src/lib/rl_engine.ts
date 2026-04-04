import { OracleContent, OracleStyle, DeepReading } from "./oracle_content";

export type AgentRole = "Alpha" | "Omega";

export interface AgentSynergy {
  agentId: string;
  role: AgentRole;
  contribution: number; // 0 to 1
  specialty: string;
}

interface LineReward {
  lineName: string;
  rating: number; // 1 to 5
  timestamp: number;
  synergyId?: string; // Link to a collaborative training session
}

export class RLEngine {
  private static STORAGE_KEY = 'palm_reader_rl_v3';

  static saveReward(lineName: string, rating: number, synergyId?: string) {
    if (typeof window === 'undefined') return;
    const history = this.getHistory();
    history.push({ lineName, rating, timestamp: Date.now(), synergyId });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history.slice(-100)));
  }

  static getHistory(): LineReward[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  static getPersonalizationLevel(): number {
    const history = this.getHistory();
    if (history.length === 0) return 0;
    return Math.min(100, Math.floor((history.length / 20) * 100));
  }

  /**
   * 🤝 Collaborative Evolution Logic
   * Simulates a 2-agent synergy (Alpha: Visual, Omega: Narrative)
   */
  static async collaborativeEvolve(imageUrl: string, nodeType: 'ARCHIVE' | 'MODERN' = 'MODERN'): Promise<{
    synergyId: string;
    maturityGain: number;
    agents: AgentSynergy[]
  }> {
    const synergyId = `SYN-${nodeType}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // Agent Alpha: Visual Detection Scan
    const agentAlpha: AgentSynergy = {
      agentId: "ALPHA-01",
      role: "Alpha",
      contribution: 0.6,
      specialty: "High-Precision Line Topology"
    };

    // Agent Omega: Narrative Contextualization
    const agentOmega: AgentSynergy = {
      agentId: "OMEGA-01",
      role: "Omega",
      contribution: 0.4,
      specialty: "Psychological-Tech Narrative Synthesis"
    };

    console.log(`[COLLAB RL] Training on external node: ${imageUrl}`);
    console.log(`[ALPHA] Detecting line artifacts...`);
    await new Promise(r => setTimeout(r, 800));
    console.log(`[OMEGA] Refining archetypal patterns...`);
    await new Promise(r => setTimeout(r, 600));

    const maturityGain = 0.85; // Collaborative learning provides higher gain

    return {
      synergyId,
      maturityGain,
      agents: [agentAlpha, agentOmega]
    };
  }

  static async syncWithGlobal(lineName: string, rating: number) {
    console.log(`[GLOBAL RL SYNC] Syncing ${lineName} feedback to intelligence pool...`);
    // Conceptually, this now contributes to the multi-agent consensus
    await new Promise(r => setTimeout(r, 1000)); 
    return true;
  }

  static getGlobalIntelligenceScore(): number {
    const baseScore = 128400; // Increased base for multi-agent era
    const history = this.getHistory();
    // Collab synergy is far more valuable (+500 per ID)
    const collabBonus = history.filter(h => h.synergyId).length * 500;
    // Historical nodes (those with specific keywords) get an extra 2000
    const historicalBonus = history.filter(h => h.synergyId?.match(/HIST|PHYS|ARCHIVE/)).length * 2000;
    
    return baseScore + (history.length * 25) + collabBonus + historicalBonus;
  }

  static getEvolutionaryContent(lineName: string): DeepReading {
    const history = this.getHistory();
    const avg = history.length > 0 
      ? history.reduce((s, c) => s + c.rating, 0) / history.length 
      : 3.5;

    let style: OracleStyle = "Mystical";
    if (avg > 4.2) style = "Visionary";
    else if (avg > 3.5) style = "Psychological";
    else style = "Practical";

    const maturity = this.getPersonalizationLevel();
    return OracleContent.generate(lineName, style, maturity);
  }

  static getCalibratedPrompt(): string {
    const history = this.getHistory();
    const globalScore = this.getGlobalIntelligenceScore();
    const isCollabMode = history.some(h => h.synergyId);
    
    if (history.length === 0) return "Provide a premium mystical and deeply insightful reading.";

    const avg = history.reduce((s, c) => s + c.rating, 0) / history.length;
    let style = avg > 4 ? "Visionary" : avg < 3 ? "Practical" : "Psychological";

    return `
      [COLLABORATIVE AI CALIBRATION]
      - State: ${isCollabMode ? 'Multi-Agent Synergetic' : 'Single-Node Learning'}
      - Maturity: ${this.getPersonalizationLevel()}%
      - Global Context: ${globalScore.toLocaleString()} knowledge nodes
      - Preferred Vector: ${style}
      - Protocol: Agent Alpha(Visual)와 Agent Omega(Narrative)의 협업 데이터를 기반으로, 사용자의 고유 파동에 최적화된 리포트를 생성합니다.
    `;
  }
}
