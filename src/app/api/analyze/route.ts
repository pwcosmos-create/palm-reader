import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  try {
    const { image } = await req.json();

    // Strip "data:image/...;base64," prefix
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    // Using the high-performance Flash model for fast analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `당신은 세계 최고의 하이테크 AI 손금 분석 마스터입니다. 이 이미지를 기반으로 약 5,000~8,000자에 가까운 초정밀 심층 분석 리포트를 생성하세요.

## 분석 지침 (필수!)
- **분량**: 각 항목("summary", "life", "head", "heart", "fate")은 반드시 **한국어 공백 포함 1,000자 이상**으로 상세히 작성하세요. (전체 리포트가 하나의 논문 수준이어야 합니다.)
- **구조**: 모든 분석 항목("life", "head", "heart", "fate")은 다음 4단계 구조를 엄격히 따르세요:
    1. **[물리적 흔적]**: 실제 이미지에서 관찰되는 선의 굵기, 길이, 색상, 분기, 끊김 등을 과학적/해부학적으로 구체적 묘사.
    2. **[업보의 공명]**: 해당 손금이 가진 영적, 심리학적, 기질적 의미의 심층 해석.
    3. **[미래의 궤적]**: 초년, 중년, 말년에 걸친 구체적인 인생 경로와 중요한 변곡점 예견.
    4. **[우주의 지침]**: 해당 운명을 극복하거나 유지하기 위한 실천적이고 철학적인 삶의 조언.
- **언어**: 우아하고 신비로우면서도 신뢰감을 주는 전문적인 고어와 현대 심리학 용어를 조화롭게 사용하세요.
- **데이터 기반**: "이미지를 보면 ~ 부분에서 나타나는 특징이..."와 같이 실제로 데이터를 분석하고 있음을 끊임없이 강조하세요.

## 응답 형식 (JSON만, 다른 텍스트 없이)
{
  "summary": "1,000자 이상의 초정밀 종합 요약 및 운명적 다이어그램 총평",
  "easySummary": "도사의 아주 쉬운 총평 (아이들도 이해하기 쉽게 명랑한 말투, 약 300자)",
  "life": {
    "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (각 파트별 상세 기술, 총 1,000자 이상)",
    "score": 숫자
  },
  "head": {
    "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (총 1,000자 이상)",
    "score": 숫자
  },
  "heart": {
    "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (총 1,000자 이상)",
    "score": 숫자
  },
  "fate": {
    "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (총 1,000자 이상)",
    "score": 숫자
  },
  "wealth": {
    "score": 숫자,
    "text": "재물운 심층 분석 및 금전적 기회 상세 설명 (500자 이상)"
  },
  "love": {
    "score": 숫자,
    "text": "연애운 및 배우자운, 인연의 실타래 분석 (500자 이상)"
  },
  "specialSigns": [
    {
      "name": "발견된 희귀 문양 이름",
      "reading": "문양의 기원과 신비로운 의미, 소유자에게 미치는 영향력 (500자 이상)",
      "emoji": "문양 이모지"
    }
  ],
  "advice": "오늘의 자아실현을 위한 궁극의 철학적 조언"
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Extract JSON — handle ```json blocks, thinking tags, or raw JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini raw response:", text.slice(0, 300));
      return NextResponse.json({ error: "Invalid response from Gemini" }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("JSON parse failed:", jsonMatch[0].slice(0, 300));
      return NextResponse.json({ error: "JSON parse failed" }, { status: 500 });
    }

    // Normalize score fields (0-100 보장)
    const clamp = (v: any) => Math.min(100, Math.max(0, Number(v) || 50));
    if (parsed.life) parsed.life.score = clamp(parsed.life.score);
    if (parsed.head) parsed.head.score = clamp(parsed.head.score);
    if (parsed.heart) parsed.heart.score = clamp(parsed.heart.score);
    if (parsed.fate) parsed.fate.score = clamp(parsed.fate.score);
    if (parsed.wealth) parsed.wealth.score = clamp(parsed.wealth.score);
    if (parsed.love) parsed.love.score = clamp(parsed.love.score);

    return NextResponse.json({ ok: true, data: parsed });
  } catch (e) {
    console.error("Gemini API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
