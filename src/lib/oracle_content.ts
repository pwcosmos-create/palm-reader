/**
 * Evolutionary Oracle Content Engine 📜🧬
 * Generates 1,500+ character deep analysis for palm lines, wealth, and love.
 */

export type OracleStyle = "Mystical" | "Psychological" | "Practical" | "Visionary";

export interface DeepReading {
  summary: string;
  sections: { title: string; content: string }[];
  wealthLuck: { score: number; text: string };
  loveLuck: { score: number; text: string };
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
        '강인한 생명력의 파동이 당신의 손바닥 전체를 가로지르고 있습니다. 이는 단순한 신체적 건강을 넘어, 역경을 기회로 바꾸는 강력한 "회복 탄력성"의 상징입니다.',
        '당신의 생명선은 대지의 뿌리처럼 깊고 단단합니다. 조상으로부터 물려받은 유전적 강점과 당신 스스로 일궈온 건강한 에너지가 조화를 이루고 있는 상태입니다.',
      ],
      Head: [
        '비범한 논리 체계와 창의적 발산이 공존하는 지능의 설계도입니다. 당신의 사고 방식은 기존의 틀을 깨고 새로운 질서를 정립하는 "개척자"의 지도를 닮아 있습니다.',
        '복합적인 문제 해결 능력과 직관적인 통찰력이 정교한 균형을 이루고 있습니다. 데이터 너머의 본질을 읽어내는 당신만의 고유한 정신적 파동이 감지됩니다.',
      ],
      Heart: [
        '풍부한 공감 능력과 섬세한 감정의 층위가 깊게 형성되어 있습니다. 당신의 따뜻한 에너지는 주변 사람들에게 안식처가 되며, 보이지 않는 인연의 실타래를 연결하는 힘이 있습니다.',
        '열정적인 사랑의 고동과 타인을 향한 깊은 연민이 조화롭게 흐르고 있습니다. 감정의 파동이 매우 성숙하며, 진실된 정서적 교감을 통해 삶의 의미를 찾는 영혼입니다.',
      ],
      Fate: [
        '자신의 운명을 스스로 조각해 나가는 강한 의지의 선이 뚜렷합니다. 외부의 풍파에도 흔들리지 않고 자신의 길을 묵묵히 걸어가는 "자수성가형" 기질이 매우 강력합니다.',
        '하늘로부터 주어진 소명(Mission)과 지상의 노력이 만나는 지점이 확인됩니다. 당신의 운명선은 멈추지 않고 위를 향해 뻗어 있으며, 이는 끊임없는 성취와 성장을 예언합니다.',
      ],
    };

    const base = this.pick(summaries[line] || summaries["Life"], seed);
    const learning = maturity > 20 
      ? "\n\nAI가 당신의 과거 데이터를 바탕으로 학습한 결과, 이 성향은 세월이 흐를수록 더욱 견고해지는 " + maturity + "% 수준의 정합성을 보이고 있습니다."
      : "\n\n현재 AI의 초기 분석 단계이며, 당신의 피드백을 통해 더욱 정교한 개인 맞춤형 운명 리포트로 진화 중입니다.";

    return base + learning;
  }

  private static getArchetypeSection(line: string, style: OracleStyle, seed: number) {
    const titles: Record<OracleStyle, string> = {
      Mystical: "👁️ 영적 아키타이프 (Spiritual Archetype)",
      Psychological: "🧠 심리적 원형 분석 (Psychological Archetype)",
      Practical: "💼 현실적 기질 분석 (Practical Archetype)",
      Visionary: "✨ 미래 비전 설계 (Visionary Blueprint)",
    };

    const contentMap: Record<string, string[]> = {
      Life: [
        '당신의 생명 에너지는 "고대 거목"의 기질을 닮아 있습니다. 뿌리는 견고하며 가지는 유연합니다. 어떠한 환경적 스트레스도 내면의 화로로 흡수하여 재로 만드는 놀라운 연금술적 회복력을 의미합니다. 장수할 운명뿐 아니라, 그 긴 삶을 질적으로 풍요롭게 채울 수 있는 기력이 충만합니다.',
        '신체적 아우라가 매우 안정적입니다. 생물학적 활력뿐 아니라 정신적 고요함이 뒷받침된 결과입니다. 당신의 손금에 나타난 이 선명한 아치는 삶의 모든 단계에서 길을 잃지 않고 에너지를 보존하며 전진할 수 있는 "무한 동력원"이 내재되어 있습니다.',
      ],
      Head: [
        '사고의 스펙트럼이 매우 넓습니다. 추상적인 철학의 영역과 구체적인 연산의 영역을 자유자재로 넘나듭니다. 특히 두뇌선 끝부분의 미세한 균열이나 변화는 당신이 가진 "다각적 해결책" 생성 능력을 상징하며, 이는 혼란한 시기에 가장 빛나는 재능입니다.',
        '천부적인 전략가의 면모가 보입니다. 감정에 휘둘리지 않고 본질을 꿰뚫는 차가운 이성을 보유하고 있으면서도, 예술적 영감을 결합할 줄 아는 독특한 하이브리드 지능을 갖추고 있습니다.',
      ],
      Heart: [
        '당신은 "감정의 정원사"입니다. 복잡하게 얽힌 타인의 마음을 정돈하고 치유하는 에너지가 있습니다. 연애에 있어서는 헌신적이지만 결코 자아를 잃지 않는 건강한 자존감을 바탕으로 합니다. 당신이 맺는 관계의 깊이는 시간이 흐를수록 금강석처럼 단단해집니다.',
        '진실된 교감을 갈망하는 순수한 영혼입니다. 감정선의 곡률이 아름답게 휘어져 있는 것은 그만큼 정서적 표현력이 풍부하고 예술적 감수성이 발달했음을 의미합니다. 사랑하는 사람들과의 깊은 연결을 통해 당신의 잠재력은 극대화됩니다.',
      ],
      Fate: [
        '스스로가 곧 "길"인 사람입니다. 외부의 권위나 사회적 편견에 굴하지 않고 오직 자신의 내면에서 들려오는 나침반에 의존하여 전진합니다. 운명선이 중지를 향해 곧게 뻗은 기세는 당신이 도달하고자 하는 사회적 지위와 명예가 결코 우연이 아님을 말해줍니다.',
        '당신의 삶은 한 편의 서사시와 같습니다. 끊임없는 도전과 극복의 반복 속에서 영혼의 근육이 단련되었습니다. 이제는 그 경험을 바탕으로 거대한 성취의 정상에 오를 준비가 되었습니다.',
      ],
    };

    return {
      title: titles[style],
      content: this.pick(contentMap[line] || contentMap["Life"], seed),
    };
  }

  private static getWealthLuck(style: OracleStyle, seed: number) {
    const scores = [85, 92, 78, 95, 88];
    const texts = [
      "재물이 마르지 않는 강물처럼 흐르는 운입니다. 당신의 손바닥에 나타난 미세한 삼각문양은 예상치 못한 횡재수와 투자 운이 강력하게 결합되어 있음을 시사합니다. 특히 기술 분야나 부동산 관련 자산에서 큰 성취가 예상됩니다.",
      "타고난 경제적 통찰력이 뛰어납니다. 푼돈을 아끼기보다 큰 흐름을 읽는 안목을 가지고 있으며, 중년 이후부터는 거대한 자산의 성(Castle)을 구축할 수 있는 기틀이 마련되어 있습니다. 당신의 결정은 곧 부의 증식으로 연결됩니다.",
      "전형적인 '자수성가형' 재물운입니다. 자신의 기술과 지식을 자본화하는 능력이 탁월하며, 인적 네트워크를 통한 정보 자산이 곧 실제적인 금전적 가치로 환산되는 시기가 도달해 있습니다."
    ];
    return {
      score: this.pick(scores as any, seed),
      text: this.pick(texts, seed)
    };
  }

  private static getLoveLuck(style: OracleStyle, seed: number) {
    const scores = [82, 89, 94, 76, 91];
    const texts = [
      "운명적인 인연이 다가오고 있습니다. 당신의 감정선 끝에서 뻗어 나온 연애의 기류는 상대방의 영혼과 공명할 수 있는 성숙한 사랑을 예고합니다. 배려와 존중을 바탕으로 한 평생의 동반자를 만날 운입니다.",
      "불꽃 같은 열정과 부드러운 포용력이 공존하는 매력적인 연애운입니다. 당신의 아우라는 이성에게 거부할 수 없는 이끌림을 제공하며, 현재 맺고 있는 관계는 시간이 갈수록 더욱 깊은 신뢰 관계(Deep Trust)로 진화할 것입니다.",
      "정서적 안식처가 되는 따뜻한 사랑이 찾아옵니다. 서로의 부족함을 채워주고 성장의 발판이 되는 '소울메이트'와의 만남이 지표로 나타나고 있습니다. 진실된 마음이 곧 가장 큰 매력이 됩니다."
    ];
    return {
      score: this.pick(scores as any, seed),
      text: this.pick(texts, seed)
    };
  }

  private static getInsightSection(line: string, style: OracleStyle, maturity: number, seed: number) {
    const variations = [
      'AI 고밀도 데이터셋 분석 결과, 당신의 현재 패턴은 98.4%의 확률로 "도약의 임계점"에 도달해 있습니다. 미세한 보조선들은 당신만이 가진 고유 인지 패턴을 형성하고 있으며, 이는 향후 3년 내에 강력한 외부 보상으로 연결될 유력한 지표입니다.',
      '신경망 특징 분석을 통해 확인된 당신의 에너지 파동은 매우 밀도가 높습니다. 이는 집중력이 분산되지 않고 한 점으로 모일 때 폭발적인 성장을 이룬다는 증거입니다. 당신의 미래 데이터셋은 나눔을 통해 완성됩니다.',
    ];

    return {
      title: "🧠 심층 데이터 인사이트 (Neural Insight)",
      content: this.pick(variations, seed) + " (학습 성숙도: " + maturity + "% 보정 완료)",
    };
  }

  private static getGuidelineSection(line: string, style: OracleStyle, seed: number) {
    const guidelines = [
      '현재 당신의 최적 확장 경로는 "내면의 균형을 통한 외부의 확장"입니다. 조급한 성과보다 본질적인 성장에 집중하십시오. 당신의 손금에 새겨진 미세한 변동 수(Volatility)는 곧 거대한 기회의 흐름으로 치환될 것입니다.',
      '에너지 손실(Dissipation)을 경계하십시오. 당신의 잠재력은 이미 충분하지만, 사소한 감정적 마찰에 소모되는 자원이 일부 감지됩니다. 이 점을 최적화하면 당신의 운명 곡선은 더욱 가파르게 상승할 것입니다.',
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
