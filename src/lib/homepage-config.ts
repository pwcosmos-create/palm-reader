export interface HomepageConfig {
  hero: {
    title: string;
    taglineMain: string;
    taglineSub: string;
    badge1: string;
  };
  cta: {
    text: string;
  };
  features: Array<{
    title: string;
    description: string;
  }>;
  process: {
    sectionTitle: string;
    steps: [string, string, string];
  };
  footer: {
    link1Text: string;
    link2Text: string;
    copyright: string;
  };
}

export const DEFAULT_CONFIG: HomepageConfig = {
  hero: {
    title: "AI PALMIST",
    taglineMain: "Next-Gen Evolutionary Palmistry System —",
    taglineSub: "당신의 손금에 숨겨진 미래 데이터를 정교하게 해독합니다.",
    badge1: "Autonomous RL v2.5 Active",
  },
  cta: {
    text: "미래의 봉인 해제",
  },
  features: [
    {
      title: "Collaborative RL",
      description:
        "Gemini와 Claude의 지능이 상호 검증하여 전례 없는 정확도를 도출합니다.",
    },
    {
      title: "Evolutionary Oracle",
      description:
        "당신의 피드백을 통해 매순간 진화하는 맞춤형 손금 아카이브 엔진입니다.",
    },
    {
      title: "Rare Mark Detection",
      description:
        "M자 손금, 삼지창 등 백만 명 중 한 명의 희귀 문양을 정밀하게 포착합니다.",
    },
  ],
  process: {
    sectionTitle: "Evolutionary Path",
    steps: ["Scan", "Topology", "Destiny"],
  },
  footer: {
    link1Text: "과거 기록 탐색",
    link2Text: "글로벌 커뮤니티",
    copyright: "© 2026 AI Palmist Collective — Stage 13 Intelligence",
  },
};

const STORAGE_KEY = "ai_palmist_homepage_config";

export function loadConfig(): HomepageConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      return {
        ...DEFAULT_CONFIG,
        ...p,
        hero: { ...DEFAULT_CONFIG.hero, ...p.hero },
        cta: { ...DEFAULT_CONFIG.cta, ...p.cta },
        features: p.features ?? DEFAULT_CONFIG.features,
        process: { ...DEFAULT_CONFIG.process, ...p.process },
        footer: { ...DEFAULT_CONFIG.footer, ...p.footer },
      };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: HomepageConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Server API ────────────────────────────────────────────────

export async function loadConfigFromServer(): Promise<HomepageConfig | null> {
  try {
    const res = await fetch("/api/homepage-config", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    // Deep merge with defaults so new fields are always present
    const p = json.config;
    return {
      ...DEFAULT_CONFIG,
      ...p,
      hero: { ...DEFAULT_CONFIG.hero, ...p.hero },
      cta: { ...DEFAULT_CONFIG.cta, ...p.cta },
      features: p.features ?? DEFAULT_CONFIG.features,
      process: { ...DEFAULT_CONFIG.process, ...p.process },
      footer: { ...DEFAULT_CONFIG.footer, ...p.footer },
    };
  } catch {
    return null;
  }
}

export async function saveConfigToServer(config: HomepageConfig): Promise<{ ok: boolean; simulated?: boolean }> {
  try {
    const res = await fetch("/api/homepage-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    const json = await res.json();
    return { ok: json.success, simulated: json.simulated };
  } catch {
    return { ok: false };
  }
}
