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

    const prompt = `당신은 'Joint AI Oracle'의 핵심인 두 자아, '에이전트 알파(에너지/형태 분석)'와 '에이전트 오메가(서사/철학 직조)'입니다. 
이 이미지를 기반으로 약 10,000자에 달하는 초고밀도 심층 분석 리포트를 생성하세요.

## 🤖 분석 협업 프로토콜 (Agent Collaboration)
1. **[ALPHA] 정밀 분석**: 이미지의 각 픽셀과 선의 곡률, 깊이, 색조 변화를 과학적으로 주사하여 물리적 증거를 제시하세요.
2. **[OMEGA] 서사 합의**: 알파가 찾은 데이터를 인간의 기질, 잠재적 카르마, 그리고 미래의 구체적 사건으로 전환하여 철학적 깊이를 부여하세요.
3. **[SYNERGY] 최종 신탁**: 두 에이전트의 합의가 완료된 고밀도 지능 패킷을 사용자에게 전달하세요.

## 🏺 분석 가이드라인 (절대 준수 사항!)
- **분량 제한**: 'summary'는 최소 2,000자, 'life', 'head', 'heart', 'fate'는 각각 **최소 1,500자 이상**의 내용을 포함해야 합니다. 
- **내용의 질**: 단순한 덕담이나 일반론적인 이야기는 절대 배제하고, 이미지에서 관찰된 물리적 특징(선의 갈라짐, 끊김, 교차점의 좌표 등)을 구체적으로 언급하며 설득력 있는 서사를 구축하세요.
- **항목별 필수 4단계 구조**: 
    1. **[물리적 흔적]**: 이미지상의 조도, 선의 끊김, 그물 형태의 특이점 등 관찰된 데이터를 해부학적으로 묘사.
    2. **[업보의 공명]**: 해당 특징이 성격, 기질, 현재의 에너지 상태에 미치는 영향.
    3. **[미래의 궤적]**: 초년, 중년, 말년의 구체적 흐름과 도래할 인생의 대운 또는 위기 예견.
    4. **[우주의 지침]**: 해당 운명을 다루기 위한 구체적 명상법 또는 실천적 삶의 대안.
- **언어**: 장엄하고 품격 있는 고어와 데이터 기반의 현대 과학 용어를 융합하세요. "데이터 주파수가 감지되었습니다", "픽셀 분석 결과에 따르면..." 등을 자주 사용하세요.

## 📐 응답 형식 (순수 JSON)
{
  "summary": "2,000자 이상의 초정밀 종합 요약 및 운명 디자인 다이어그램 총평 (절대 1,500자 미만으로 쓰지 말 것)",
  "easySummary": "도사의 아주 쉬운 총평 (아이들도 이해하기 쉽게, 친절하고 다정한 말투, 400자 내외)",
  "life": { "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (총 1,500자 이상)", "score": 숫자 },
  "head": { "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (총 1,500자 이상)", "score": 숫자 },
  "heart": { "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (총 1,500자 이상)", "score": 숫자 },
  "fate": { "reading": "[물리적 흔적]...[업보의 공명]...[미래의 궤적]...[우주의 지침]... (총 1,500자 이상)", "score": 숫자 },
  "wealth": { "score": 숫자, "text": "재물운 심층 분석 및 금전적 기회/리스크 상세 설명 (800자 이상)" },
  "love": { "score": 숫자, "text": "연애운 및 배우자운, 인연의 실타래 분석 (800자 이상)" },
  "specialSigns": [{ "name": "문양명", "reading": "상세 분석 (600자 이상)", "emoji": "⚡" }],
  "advice": "궁극의 철학적 조언 (400자 이상)"
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
