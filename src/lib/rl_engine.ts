interface LineReward {
  lineName: string;
  rating: number; // 1 to 5
  timestamp: number;
}

interface UserPreference {
  style: 'traditional' | 'modern' | 'mystical';
  accuracyWeight: Record<string, number>;
}

export class RLEngine {
  private static STORAGE_KEY = 'palm_reader_rl_data';

  static saveReward(lineName: string, rating: number) {
    const data = this.getHistory();
    data.push({ lineName, rating, timestamp: Date.now() });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static getHistory(): LineReward[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  static getCalibratedPrompt(): string {
    const history = this.getHistory();
    if (history.length === 0) return "Provide a balanced mystical and scientific reading.";

    // Calculate which lines need more 'positive' reinforcement
    const averages = history.reduce((acc, curr) => {
      if (!acc[curr.lineName]) acc[curr.lineName] = { sum: 0, count: 0 };
      acc[curr.lineName].sum += curr.rating;
      acc[curr.lineName].count += 1;
      return acc;
    }, {} as Record<string, { sum: number, count: number }>);

    let promptExtension = "Based on previous user feedback, emphasize: ";
    for (const [line, stats] of Object.entries(averages)) {
      const avg = stats.sum / stats.count;
      if (avg >= 4) {
        promptExtension += `Maintain the depth for ${line}. `;
      } else if (avg <= 2) {
        promptExtension += `Refine the interpretation for ${line} to be more specific and less generic. `;
      }
    }

    return promptExtension;
  }
}
