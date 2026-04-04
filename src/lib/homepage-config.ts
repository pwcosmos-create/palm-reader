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
    title: "AI 손금 도사",
    taglineMain: "내 손바닥에 숨겨진 보물지도를 찾아볼까요? —",
    taglineSub: "인공지능이 들려주는 나만의 특별한 미래 이야기.",
    badge1: "최신 AI 도사 v2.5 가동 중",
  },
  cta: {
    text: "비밀의 문 열기",
  },
  features: [
    {
      title: "함께하는 똑똑이 AI",
      description:
        "세계에서 제일 똑똑한 인공지능 친구들이 만나 나의 손금을 꼼꼼하게 살펴봐요.",
    },
    {
      title: "나만의 보물지도",
      description:
        "내가 할 때마다 조금씩 변하는 신기한 손금 지도예요! 나만의 예언서를 만들어보세요.",
    },
    {
      title: "희귀한 모양 찾기",
      description:
        "M자 모양이나 삼지창 모양처럼, 백만 명 중 한 명만 가진 아주 특별한 그림도 찾아낼 수 있어요.",
    },
  ],
  process: {
    sectionTitle: "어떻게 하나요?",
    steps: ["사진 찍기", "선 그리기", "결과 확인"],
  },
  footer: {
    link1Text: "과거 기록 보기",
    link2Text: "다 함께 즐기기",
    copyright: "© 2026 AI 손금 도사 — 미래를 설계하는 친구들",
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
