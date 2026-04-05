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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `당신은 세계 최고의 하이테크 AI 손금 분석가입니다. 이 손바닥 이미지를 정밀 분석하여 아래 JSON 형식으로 응답하세요. 반드시 한국어로 작성하세요. 모든 텍스트는 신비로우면서도 심리학적인 통찰이 담긴 전문적인 어조를 유지하세요.

## 분석 지침
- 이미지에서 실제로 보이는 손금 선의 특징(깊이, 길이, 방향, 분기 여부, 특이한 문양)을 기반으로 아주 구체적으로 분석하세요.
- 각 분석은 최소 3문장 이상의 깊이 있는 내용을 담으세요.
- score는 해당 선의 선명도와 강도를 0~100 사이로 평가하세요.

## 응답 형식 (JSON만, 다른 텍스트 없이)
{
  "summary": "전체 운세 심층 요약 (150자 내외, 사용자의 운명적 흐름을 대시보드 형식으로 총평)",
  "easySummary": "도사의 아주 쉬운 총평 (아이들도 이해하기 쉽게, 아주 친절하고 명랑한 말투로 작성, '안녕 친구야!' 같은 느낌으로 시작)",
  "life": {
    "reading": "생명선 심층 분석 (건강, 생명력, 환경 적응력 및 회복 탄력성 지표)",
    "score": 숫자
  },
  "head": {
    "reading": "두뇌선 심층 분석 (지능, 사고방식, 정보 처리 알고리즘 및 인지적 구조)",
    "score": 숫자
  },
  "heart": {
    "reading": "감정선 심층 분석 (감정, 사랑, 인간관계, 정서적 공명 주파수 및 애착 지형도)",
    "score": 숫자
  },
  "fate": {
    "reading": "운명선 심층 분석 (직업, 사회적 성공, 목표 의식 및 자아실현 경로)",
    "score": 숫자
  },
  "wealth": {
    "score": 숫자,
    "text": "재물운 심층 설명 (금전적 흐름과 잠재적 부의 기회)"
  },
  "love": {
    "score": 숫자,
    "text": "연애운 및 배우자운 설명 (관계의 안정성과 운명적 만남의 가능성)"
  },
  "advice": "오늘의 자아실현 조언 (구체적이고 실천 가능한 한 문장)"
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
