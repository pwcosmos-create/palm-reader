import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  try {
    const { image, rlContext } = await req.json();

    // Strip "data:image/...;base64," prefix
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });

    // ── RL 컨텍스트를 프롬프트에 주입 ────────────────────────────────────
    const rlSection = rlContext ? `
## 사용자 개인화 데이터 (강화학습 기반)
- 개인화 수준: ${rlContext.personalizationLevel}%
- 선호 분석 스타일: ${rlContext.preferredStyle}
- 총 분석 횟수: ${rlContext.totalSessions}회
- 선별 평균 만족도:
  - 생명선: ${rlContext.lineRatings.life}/5 (${rlContext.lineRatings.lifeCount}회 평가)
  - 두뇌선: ${rlContext.lineRatings.head}/5 (${rlContext.lineRatings.headCount}회 평가)
  - 감정선: ${rlContext.lineRatings.heart}/5 (${rlContext.lineRatings.heartCount}회 평가)
  - 운명선: ${rlContext.lineRatings.fate}/5 (${rlContext.lineRatings.fateCount}회 평가)

### 스타일 지침:
${rlContext.preferredStyle === "Mystical" ? "신비롭고 운명적인 어조로, 우주적 에너지와 직관을 강조하세요." : ""}
${rlContext.preferredStyle === "Psychological" ? "심리학적 통찰 중심으로, 성격과 내면의 동기를 분석하세요." : ""}
${rlContext.preferredStyle === "Practical" ? "실용적이고 구체적인 조언 중심으로, 일상에 적용 가능한 인사이트를 제공하세요." : ""}
${rlContext.preferredStyle === "Visionary" ? "미래 지향적이고 가능성 중심으로, 잠재력과 성장 경로를 강조하세요." : ""}
${rlContext.personalizationLevel > 50 ? `이 사용자는 ${rlContext.personalizationLevel}%의 높은 개인화 수준을 가지고 있습니다. 더 깊고 구체적인 분석을 제공하세요.` : ""}
${rlContext.lineRatings.life < 3 && rlContext.lineRatings.lifeCount > 0 ? "생명선 분석에 대한 만족도가 낮습니다. 더 풍부하고 자세한 해석을 제공하세요." : ""}
${rlContext.lineRatings.heart < 3 && rlContext.lineRatings.heartCount > 0 ? "감정선 분석에 대한 만족도가 낮습니다. 더 공감적이고 감성적인 해석을 제공하세요." : ""}
` : "";

    const prompt = `당신은 세계 최고의 AI 손금 분석가입니다. 이 손바닥 이미지를 분석하여 아래 JSON 형식으로 응답하세요. 반드시 한국어로 작성하세요.
${rlSection}
## 분석 지침
- 이미지에서 실제로 보이는 손금 선의 특징(깊이, 길이, 방향, 분기 여부)을 기반으로 분석하세요.
- 각 선에 대해 구체적이고 개인화된 해석을 제공하세요.
- score는 해당 선의 선명도, 길이, 깊이를 종합적으로 평가한 0~100 숫자입니다.

## 응답 형식 (JSON만, 다른 텍스트 없이)
{
  "summary": "전체 운세 요약 (2-3문장, 이 손금만의 특징을 언급)",
  "easySummary": "도사의 아주 쉬운 총평 (아이들도 이해하기 쉽게, 아주 친절하고 명랑한 말투로 작성, '안녕 친구야!' 같은 느낌으로 시작)",
  "life": {
    "reading": "생명선 분석 (2-3문장, 건강/생명력/체력)",
    "score": 숫자
  },
  "head": {
    "reading": "두뇌선 분석 (2-3문장, 지능/사고방식/집중력)",
    "score": 숫자
  },
  "heart": {
    "reading": "감정선 분석 (2-3문장, 감정/사랑/인간관계)",
    "score": 숫자
  },
  "fate": {
    "reading": "운명선 분석 (2-3문장, 직업/사회적 성공/목표)",
    "score": 숫자
  },
  "wealth": {
    "score": 숫자,
    "text": "재물운 설명 (1-2문장)"
  },
  "love": {
    "score": 숫자,
    "text": "연애운 설명 (1-2문장)"
  },
  "advice": "오늘의 조언 (이 손금에 맞는 구체적인 1문장)"
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
