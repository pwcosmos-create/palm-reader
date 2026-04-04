import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  try {
    const { image } = await req.json(); // base64 data URL

    // Strip "data:image/...;base64," prefix
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `당신은 전문 손금 분석가입니다. 이 손바닥 이미지를 분석하여 아래 JSON 형식으로 응답하세요. 한국어로 작성하세요.

{
  "summary": "전체 운세 요약 (2-3문장)",
  "life": {
    "reading": "생명선 분석 (2-3문장, 건강/생명력/체력에 대해)",
    "score": 0~100 숫자
  },
  "head": {
    "reading": "두뇌선 분석 (2-3문장, 지능/사고방식/집중력에 대해)",
    "score": 0~100 숫자
  },
  "heart": {
    "reading": "감정선 분석 (2-3문장, 감정/사랑/인간관계에 대해)",
    "score": 0~100 숫자
  },
  "fate": {
    "reading": "운명선 분석 (2-3문장, 직업/사회적 성공/목표에 대해)",
    "score": 0~100 숫자
  },
  "wealth": {
    "score": 0~100 숫자,
    "text": "재물운 설명 (1-2문장)"
  },
  "love": {
    "score": 0~100 숫자,
    "text": "연애운 설명 (1-2문장)"
  },
  "advice": "오늘의 조언 (1문장)"
}

JSON만 응답하고 다른 텍스트는 포함하지 마세요.`;

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

    // Extract JSON from response (sometimes wrapped in ```json blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid response from Gemini" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ok: true, data: parsed });
  } catch (e) {
    console.error("Gemini API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
