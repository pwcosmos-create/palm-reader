interface LineReward {
  lineName: string;
  rating: number; // 1 to 5
  timestamp: number;
}

export class RLEngine {
  private static STORAGE_KEY = 'palm_reader_rl_v2';

  static saveReward(lineName: string, rating: number) {
    if (typeof window === 'undefined') return;
    const history = this.getHistory();
    history.push({ lineName, rating, timestamp: Date.now() });
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
    // Assume 20 ratings (5 sessions) are needed for full calibration
    return Math.min(100, Math.floor((history.length / 20) * 100));
  }

  static getCalibratedPrompt(): string {
    const history = this.getHistory();
    if (history.length === 0) return "Provide a premium mystical and deeply insightful reading.";

    const avg = history.reduce((s, c) => s + c.rating, 0) / history.length;
    
    // Auto-detect style preference
    let style = "Mystical & Insightful";
    if (avg > 4) style = "Visionary & Highly Encouraging";
    else if (avg < 3) style = "Direct, Practical & No-nonsense";

    let behavior = history.length > 5 ? "Personalized patterns detected." : "Learning user preferences.";

    return `
      [AUTONOMOUS RL CALIBRATION]
      - Maturity: ${this.getPersonalizationLevel()}%
      - Current Style: ${style}
      - Feedback Status: ${behavior}
      - Instruction: 과거 ${history.length}회차의 피드백을 바탕으로 사용자의 성향(${style})에 맞춘 '초정밀 개인화' 분석을 수행하세요.
    `;
  }
}
