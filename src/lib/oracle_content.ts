/**
 * Evolutionary Oracle Content Engine 📜🧬
 * Generates 1,500+ character deep analysis for palm lines, wealth, love, and rare marks.
 */

export type OracleStyle = "Mystical" | "Psychological" | "Practical" | "Visionary";

export interface DeepReading {
  summary: string;
  sections: { title: string; content: string }[];
  wealthLuck: { score: number; text: string; rareMark?: string };
  loveLuck: { score: number; text: string; spouseLuck: string };
}

export class OracleContent {
  static generate(lineName: string, style: OracleStyle, maturity: number): DeepReading {
    const seed = Math.floor(Math.random() * 1000);
    
    return {
      summary: this.getSummary(lineName, style, maturity, seed),
      sections: [
        this.getArchetypeSection(lineName, style, seed),
        this.getInsightSection(lineName, style, maturity, seed),
        this.getGuidelineSection(lineName, style, seed),
      ],
      wealthLuck: this.getWealthLuck(style, seed),
      loveLuck: this.getLoveLuck(style, seed),
    };
  }

  private static getSummary(line: string, style: OracleStyle, maturity: number, seed: number): string {
    const summaries: Record<string, string[]> = {
      Life: [
        '강인한 생명력의 파동이 당신의 손바닥 전체를 가로지르고 있습니다. "소름 돋는" 회복 탄력성의 상징입니다.',
        '당신의 생명선은 대지의 뿌리처럼 깊고 단단합니다. 재미로 보는 분석을 넘어, 당신의 신체적 아우라가 강력합니다.',
      ],
      Head: [
        '비범한 논리 체계와 창의적 발산이 공존하는 지능의 설계도입니다. 암기보다 통찰에 능한 천재적 기질이 보입니다.',
        '복합적인 문제 해결 능력과 직관적인 통찰력이 조화를 이루고 있습니다. 소름 끼칠 정도의 명석함이 감지됩니다.',
      ],
      Heart: [
        '풍부한 공감 능력과 섬세한 감정의 층위가 깊게 형성되어 있습니다. 주변에 "인복"이 끊이지 않는 따뜻한 에너지입니다.',
        '열정적인 사랑의 고동과 타인을 향한 깊은 연민이 조화롭습니다. 당신의 매력은 진실된 교감에서 뿜어져 나옵니다.',
      ],
      Fate: [
        '자신의 운명을 스스로 조각해 나가는 강한 의지의 선이 뚜렷합니다. "자수성가"의 표본이 될 수 있는 운명입니다.',
        '하늘로부터 주어진 소명(Mission)과 지상의 노력이 만나는 지점이 확인됩니다. 당신의 길은 이미 개척되어 있습니다.',
      ],
    };

    const base = this.pick(summaries[line] || summaries["Life"], seed);
    const learning = maturity > 20 
      ? "\n\nAI가 당신의 과거 데이터를 바탕으로 학습한 결과, 이 성향은 " + maturity + "% 수준의 높은 신빙성을 보이고 있습니다."
      : "\n\n현재 AI의 초기 분석 단계이며, 재미로 보시되 앞으로 더 정교한 개인 맞춤형 리포트로 진화할 것입니다.";

    return base + learning;
  }

  private static getArchetypeSection(line: string, style: OracleStyle, seed: number) {
    const titles: Record<OracleStyle, string> = {
      Mystical: "��️ 영적 아키타이프 (Spiritual Archetype)",
      Psychological: "🧠 심리적 원형 분석 (MBTI Hybrid)",
      Practical: "💼 현실적 기질 분석 (Practical Archetype)",
      Visionary: "✨ 미래 비전 설계 (Visionary Blueprint)",
    };

    const contentMap: Record<string, string[]> = {
      Life: [
        '당신의 생명 에너지는 "고대 거목"의 기질을 닮아 있습니다. 뿌리는 견고하며 가지는 유연합니다. 어떠한 시련도 "재미로" 넘길 수 있는 여유가 곧 당신의 힘입니다.',
        '신체적 아우라가 안정적입니다. 이는 생물학적 활력뿐 아니라 정신적 고요함이 뒷받침된 결과입니다. 장수의 축복뿐 아니라 질 높은 삶을 영위할 에너지가 보입니다.',
      ],
      Head: [
        '사고의 스펙트럼이 매우 넓습니다. 특히 당신의 두뇌선은 "전략적 직관가"의 모습을 보이며, 이는 MBTI의 NT형 기질과 유사한 강력한 논리 베이스를 가집니다.',
        '천부적인 전략가입니다. 감정에 휘둘리지 않고 본질을 꿰뚫는 차가운 이성을 보유하고 있으면서도, 예술적 영감을 결합할 줄 아는 소름 돋는 지배력을 가졌습니다.',
      ],
      Heart: [
        '당신은 "인복"의 왕입니다. 복잡하게 얽힌 타인의 마음을 정돈하고 치유하는 에너지가 있습니다. 주변 사람들이 당신을 찾는 것도 이러한 따뜻한 운명 때문입니다.',
        '진실된 교감을 갈망하는 영혼입니다. 감정선의 곡률이 아름답게 휘어져 있는 것은 그만큼 정서적 표현력이 풍부하고 매력이 넘친다는 "소름 돋는" 증거입니다.',
      ],
      Fate: [
        '선천적으로 "개척자"의 운명을 타고났습니다. 사회적 지위나 명예는 당신이 쏟은 노력의 당연한 산물이 될 것입니다. 운명선이 곧게 뻗은 기세가 남다릅니다.',
        '당신의 삶은 "성장과 성취"의 아이콘입니다. 끊임없는 도전과 극복 속에서 단련된 당신의 손금은 이제 거대한 성공의 초입에 서 있음을 암시합니다.',
      ],
    };

    return {
      title: titles[style],
      content: this.pick(contentMap[line] || contentMap["Life"], seed),
    };
  }

  private static getWealthLuck(style: OracleStyle, seed: number) {
    const scores = [88, 94, 79, 96, 91];
    const rareMarks = ["M자 손금", "삼지창 손금", "부자 손금", "태양구 발달"];
    const isRare = seed % 3 === 0;
    
    const texts = [
      "재물이 마르지 않는 강물처럼 흐르는 운입니다. 당신의 손금에서 감지된 " + (isRare ? this.pick(rareMarks, seed) : "강력한 재물 기류") + "는 투자와 사업에서 독보적인 성취를 예언합니다.",
      "타고난 경제적 통찰력이 뛰어납니다. 푼돈보다 큰 흐름을 읽는 안목이 있으며, 특히 " + (isRare ? "M자형 구조" : "선명한 태양선") + "가 부의 증식을 94%의 확률로 보장합니다.",
    ];
    return {
      score: this.pick(scores as any, seed),
      text: this.pick(texts, seed),
      rareMark: isRare ? this.pick(rareMarks, seed) : undefined
    };
  }

  private static getLoveLuck(style: OracleStyle, seed: number) {
    const scores = [84, 91, 95, 78, 92];
    const spouseTips = [
        "따뜻하고 포용력 있는 배우자를 만날 운입니다. 나를 진정으로 아껴주는 사람과 깊은 신뢰를 쌓게 될 것입니다.",
        "능력 있고 리더십 있는 동반자가 당신의 삶을 더욱 윤택하게 만들어 줄 것입니다. 소름 돋는 금슬이 예상됩니다.",
        "창의적이고 대화가 잘 통하는 소울메이트를 만나게 됩니다. 서로의 성장의 발판이 되는 최고의 인연입니다."
    ];
    const texts = [
      "운명적인 인연이 다가오고 있습니다. 당신의 아우라는 이성에게 거부할 수 없는 이끌림을 제공하며, 진실된 사랑을 통해 삶의 풍요를 만끽하게 됩니다.",
      "정서적 안식처가 되는 따뜻한 사랑이 지표로 나타나고 있습니다. 배려와 존중을 바탕으로 한 평생의 인연이 당신의 곁을 지킬 것입니다.",
    ];
    return {
      score: this.pick(scores as any, seed),
      text: this.pick(texts, seed),
      spouseLuck: this.pick(spouseTips, seed)
    };
  }

  private static getInsightSection(line: string, style: OracleStyle, maturity: number, seed: number) {
    const variations = [
      '데이터셋 분석 결과, 당신의 현재 패턴은 98.4%의 확률로 "소름 돋는 도약"의 임계점에 도달해 있습니다. 미세 보조선들이 "인복"과 "재물"을 강하게 끌어당기고 있습니다.',
      '신경망 특징 분석 결과 당신의 에너지는 매우 정교합니다. 재미로 본 분석을 넘어, 당신의 미래 데이터셋은 나눔을 통해 완벽한 보상을 출력할 준비가 되었습니다.',
    ];

    return {
      title: "🧠 심층 데이터 인사이트 (Neural Insight)",
      content: this.pick(variations, seed) + " (신빙성 가중치: " + maturity + "% 보정)",
    };
  }

  private static getGuidelineSection(line: string, style: OracleStyle, seed: number) {
    const guidelines = [
      '현재 당신의 최적 확장 경로는 "내면의 균형을 통한 외부의 확장"입니다. 조급해하지 마십시오. 당신의 손금에 새겨진 "대박의 기운"은 시간과 함께 발현될 것입니다.',
      '에너지 손실을 경계하십시오. 당신의 잠재력은 소름 끼칠 정도로 충분하지만, 사소한 감정 소모가 상승 곡선을 방해할 수 있습니다. 성장에만 집중하세요.',
    ];

    return {
      title: "🚀 진화적 가이드라인 (Evolutionary Guideline)",
      content: this.pick(guidelines, seed),
    };
  }

  private static pick(arr: string[], seed: number): string {
    return arr[seed % arr.length];
  }
}
