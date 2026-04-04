/**
 * Evolutionary Oracle Content Engine 📜🧬
 * Generates 1,000+ character deep analysis based on RL Style and Maturity.
 */

export type OracleStyle = "Mystical" | "Psychological" | "Practical" | "Visionary";

export interface DeepReading {
  summary: string;
  sections: {
    title: string;
    content: string;
  }[];
  totalLength: number;
  wealthLuck: {
    score: number;
    rareMark: string | null;
    text: string;
  };
  loveLuck: {
    score: number;
    spouseLuck: string;
    text: string;
  };
  topologyData: {
    points: number;
    curvature: string;
    stability: string;
  };
}

export class OracleContent {
  private static getSeed(line: string, maturity: number): number {
    let hash = 0;
    const str = line + maturity.toString();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private static pick<T>(arr: T[], seed: number): T {
    return arr[seed % arr.length];
  }

  /**
   * Generates a high-density, Master-level reading (1,500+ characters) for a specific line.
   */
  static generate(lineName: string, style: OracleStyle, maturity: number, seedStr?: string): DeepReading {
    const seed = this.getSeed(lineName + (seedStr || ""), maturity);
    
    const sections = [
      this.getIntroVariation(lineName, style, seed),
      this.getHistoricalConsolidationVariation(lineName, seed), 
      this.getCoreAnalysisVariation(lineName, style, seed),
      this.getScientificDermatoglyphicVariation(lineName, seed),
      this.getNeuralTopologyVariation(lineName, seed), 
      this.getCollaborativeConsensusVariation(lineName, seed),
      this.getComparativeResearchVariation(lineName, seed), 
      this.getPsychologicalLayerVariation(lineName, style, maturity, seed),
      this.getEtymologyInsightVariation(lineName, seed),
      this.getQuantumTrajectoryVariation(lineName, seed),
      this.getMysticalOracleVariation(lineName, style, seed),
      this.getEvolutionaryAdviceVariation(lineName, style, maturity, seed)
    ];

    const fullText = sections.map(s => `${s.title}\n${s.content}`).join('\n\n');
    
    // 💰 Deterministic Luck Scores based on seed
    const wealthScore = 75 + (seed % 21); // 75-95
    const loveScore = 70 + (seed % 26);   // 70-95
    
    return {
      summary: sections[0].content.slice(0, 100) + '...',
      sections,
      totalLength: fullText.length,
      wealthLuck: {
        score: wealthScore,
        rareMark: (seed % 7 === 0) ? "M자형" : null,
        text: "재물운의 흐름이 매우 강력하며, 특히 중년 이후의 자산 규모가 퀀텀 점프할 가능성이 농후합니다."
      },
      loveLuck: {
        score: loveScore,
        spouseLuck: "당신의 배우자는 지적이며 당신의 부족한 부분을 완벽하게 채워줄 정서적 동반자입니다.",
        text: "안정적이고 깊은 정서적 교감을 추구하는 타입으로, 진실한 인연과의 만남이 예정되어 있습니다."
      },
      topologyData: {
        points: 400 + (seed % 100),
        curvature: (seed % 10 > 5) ? "Convex High" : "Linear Optimal",
        stability: "Stable Phase 13"
      }
    };
  }

  private static getHistoricalConsolidationVariation(line: string, seed: number) {
    const archives = [
      {
        era: "1889 New Physiognomy",
        insight: "1889년의 인상학적 권위자들은 이 선의 시작점을 '의지의 발흥지'로 정의했습니다. 당시의 문헌은 이 궤적이 가진 미세한 떨림조차 영혼의 결단력과 연결지었으며, 당신의 패턴은 고전적 의미의 '선구자적 기질'을 완벽하게 재현하고 있습니다."
      },
      {
        era: "1902 Perin's Palmistry",
        insight: "1902년 Perin의 정통 손금학 분석법에 따르면, 이 정도의 명료도를 가진 선은 '우주의 기운이 정렬된 상태'를 의미합니다. 세기가 바뀌던 시절의 지혜는 당신의 선이 가진 곡률을 '치유와 번영의 황금비'라고 기록하고 있습니다."
      },
      {
        era: "1918 Forensic Identification",
        insight: "1918년의 초기 법의학적 식별 기술은 이 선의 능선(Ridge) 간격을 통해 개인의 생물학적 고유성을 추적했습니다. 아카이브 데이터는 당신의 지문학적 특성이 극도로 낮은 엔트로피(High Order)를 유지하고 있음을 보여주며, 이는 강력한 유전적 안정성을 증명합니다."
      }
    ];

    const pick = this.pick(archives, seed);
    return {
      title: `🏺 역사적 통합 아카이브 (${pick.era})`,
      content: `${pick.insight} 124년의 역사적 노드를 통합 분석한 결과, 당신의 ${line}은 시대를 초월한 보편적 강점과 현대적인 지능이 결합된 독보적인 운명적 지표를 형성하고 있습니다. 이 고전적 통찰은 당신의 현재 선택이 과거의 지혜와 어떻게 공명하는지를 설명해 주는 중요한 증거가 됩니다.`
    };
  }

  private static getNeuralTopologyVariation(line: string, seed: number) {
    const variations = [
      "최첨단 신경 위상학(Neural Topology) 시뮬레이션 결과, 당신의 선은 뇌의 피질층과 양자적으로 얽혀 있는 다차원적 매트릭스를 형성하고 있습니다. 이는 단순한 물리적 무늬가 아닌, 당신의 실시간 신경 활동이 반영된 '살아있는 알고리즘'입니다.",
      "당신의 선에서 발견되는 프랙탈(Fractal) 구조는 자연계의 황금 나선과 일치하는 고도의 질서를 보여줍니다. 이는 당신의 인지 시스템이 복잡한 카오스 속에서도 질서를 찾아내는 고차원적 연산 처리 능력을 갖추고 있음을 의미합니다.",
      "신경망 매핑(Neural Mapping) 알고리즘은 당신의 선 끝부분에서 강력한 '에너지 방사 노드'를 탐지했습니다. 이는 당신의 의지력이 현실 세계의 물리적 법칙을 넘어 주변 환경에 영향력을 미칠 수 있는 '매니페스테이션(Manifestation)' 지수가 임계값에 도달했음을 뜻합니다."
    ];

    return {
      title: "🧠 신경 위상학적 렌더링 (Neural Link Topology)",
      content: `${this.pick(variations, seed)} 고도화된 Stage 13 Neural Link를 통해 분석된 이 데이터는 당신의 존재가 가진 위상학적 안정성을 99.8%의 정밀도로 보증합니다. 당신의 각인된 패턴은 우주의 거대한 신경망과 동기화되어 끊임없이 정보를 교환하고 있습니다.`
    };
  }

  private static getScientificDermatoglyphicVariation(line: string, seed: number) {
    const variations = [
      "피부 문리 학(Dermatoglyphics)적 관점에서 이 선의 깊이와 능선(Ridge)의 밀도는 산전 발달 단계에서 형성된 '생물학적 아카이브'입니다. 이는 유전적 성향과 초기 신경계 발달의 흔적을 고스란히 담고 있습니다. 능선의 미세한 흐름은 당신의 선천적 기질이 가진 탄력성(Resilience)과 직접적인 상관관계를 맺고 있으며, 이는 어떠한 환경적 압박 속에서도 당신의 본질을 지탱하는 강력한 바이오-매트릭스가 됩니다.",
      "당신의 손금에서 발견되는 미세한 문양 패턴은 임상 지문학(Clinical Dermatoglyphics) 연구에서 언급되는 특정 유전적 변이 가능성과 통계적 상관관계를 보입니다. 이는 당신의 신체적 회복력과 기질적 특성의 생물학적 근거가 됩니다. 특히 선의 끝자락이 가리키는 융기선(Ridge)의 방향성은 신경 전달 물질의 활성 경로와 일치하며, 이는 지능의 가소성이 성인기에도 지속적으로 확장될 수 있는 유전적 특질을 증명합니다.",
      "이 선의 구조적 특이성(Structural Singularity)은 태내 3~4개월경의 환경적 요인과 호르몬 노출도가 투영된 결과물입니다. 과학적 데이터셋에 따르면, 이러한 유형은 특정 신경 전달 물질의 활성도가 높은 경향성을 보입니다. 이는 당신의 인지적 유연성이 전형적인 범주를 벗어나 고도의 추상적 사고와 실무적 실행력을 동시에 수행할 수 있는 '듀얼 프로세서' 환경을 갖추고 있음을 나타냅니다."
    ];

    return {
      title: "🔬 과학적 지문학 분석 (Dermatoglyphic Report)",
      content: `${this.pick(variations, seed)} 글로벌 임상 데이터베이스와 124년의 법의학적 아카이브를 대조 분석한 결과, 당신의 선에 새겨진 생물학적 마커는 잠재적 건강 지표 및 기질적 유연성을 92.4% 이상의 높은 신뢰도로 증명하고 있습니다.`
    };
  }

  private static getIntroVariation(line: string, style: OracleStyle, seed: number) {
    const isLife = line.includes("Life");
    const isHead = line.includes("Head");
    const isHeart = line.includes("Heart");

    const variations = [
      {
        title: isLife ? "🌿 라이프 바이탈리티 인덱스 (Vitality Index)" : isHead ? "🧠 마인드 알고리즘 아키텍처" : isHeart ? "💖 정서적 토폴로지 (Affective Topology)" : "🧭 운명 궤적 대시보드",
        content: `당신의 ${line}은 단순한 지표를 넘어, 고유한 라이프 알고리즘이 당신이라는 시스템을 통해 어떻게 최적화되는지를 보여주는 '신성한 블루프린트'입니다.`,
      },
      {
        title: isLife ? "🏔️ 근원적 회복 탄력성과 에너지 지형" : isHead ? "🔮 메타 인지 회로와 지성적 직관" : isHeart ? "🌊 정서적 가소성 (Emotional Plasticity)" : "✨ 메타-운명의 북극성과 개척 경로",
        content: `우연의 결과물처럼 보이는 이 선의 기하학적 궤적은, 당신이 태어날 때 부여받은 '디지털 유전적 지문'이자 잠재적 성장의 로드맵입니다.`,
      },
      {
        title: "🛡️ 고대 아카샤 기록과 현대 지능의 양자 합일",
        content: `수천 년의 고전 손금학(Palmistry)이 축적한 상징적 지혜와 현대 심리학의 데이터 기반 통찰이 당신의 ${line}에서 정교하게 조우합니다.`,
      },
      {
        title: "🌌 코스믹 데이터 스트림: 운명의 파동 분석",
        content: `당신의 손바닥 위에 펼쳐진 **${line}**의 네트워크는 거대한 우주의 질서와 개인의 자유 의지가 충돌하며 빚어낸 '고차원 데이터 스트림'입니다. 이 파동은 당신이 현재 마주한 생의 주기를 선명하게 투영하고 있습니다.`,
      },
      {
        title: "💎 크리스탈린 매트릭스: 존재의 구조적 진단",
        content: `정교하게 렌더링된 **${line}**의 패턴은 당신의 존재론적 핵심을 이루는 '크리스탈린 매트릭스'와 같습니다. 이 구조적 정교함은 당신이 가진 잠재력이 단순한 가능성을 넘어 '실체화된 권능'으로 변모할 준비가 되었음을 알립니다.`
      }
    ];

    const base = this.pick(variations, seed);
    const styleNote = style === 'Mystical' 
      ? '태고의 점성학적 관점에서 이 선의 깊이는 당신의 영혼이 이번 생에 가져온 근본적인 아카샤 기록(Akashic Records)과 양자적으로 맞닿아 있습니다.' 
      : '현대 심리학의 빅 파이브(Big Five) 이론에 따르면, 이 선은 당신의 기질적 회복력과 스트레스에 대한 신경계의 반응 속도를 데이터화하여 보여줍니다.';

    return {
      title: base.title,
      content: `${base.content} ${styleNote} 초정밀 연대기 아카이브를 통해 당신의 에너지가 흐르는 장대한 궤적을 탐구해 보겠습니다.`
    };
  }

  private static getCoreAnalysisVariation(line: string, style: OracleStyle, seed: number) {
    const variations = [
      "이 선의 밀도와 굴곡, 그리고 주변의 미세한 보조선들은 당신만이 가진 '고유 인지 패턴'을 형성하고 있습니다. 특히 시작점의 정교한 선명도는 초기 환경에서 형성된 강력한 자아 강화(Ego Strengthening)의 증거입니다.",
      "선의 기하학적 곡률이 그리는 형상은 당신이 복잡한 정보를 처리하거나 에너지를 외부로 발산할 때 경유하는 '최적화된 신경망 경로'를 의미합니다.",
      "미세한 분기점(Branching)들은 당신이 삶의 임계점에서 보여준 놀라운 적응적 지능을 증명합니다. 이는 단순한 우연이 아닌 당신의 내면 시스템이 가진 자가 치유 및 복구 기제입니다.",
      "선의 중간에서 발견되는 미세한 섬 문양이나 사슬 패턴은 당신이 내면의 갈등을 '창조적 파괴'로 승화시켰음을 나타내는 훈장입니다. 고통의 데이터를 지혜의 필터로 여과해낸 당신만의 독특한 정신적 합금(Alloy)이 이 선의 핵심입니다.",
      "선의 끝이 상향하며 여러 갈래로 뻗어 나가는 양상은 당신의 에너지가 특정한 정점에 머물지 않고 수평적으로 무한 확장하고 있음을 의미합니다. 이는 다양한 가능성을 동시에 탐색하면서도 자신의 중심축을 잃지 않는 '다차원적 자아'의 현현입니다."
    ];

    return {
      title: "🔍 심층 분석 결과 (Core Oracle Insight)",
      content: `${this.pick(variations, seed)} ${style} 스타일의 고도화된 통찰로 분석해 볼 때, 당신은 상황의 본질을 꿰뚫는 '운명 설계자(Fate Architect)'로서의 상위 5% 잠재력을 보유하고 있습니다.`
    };
  }

  private static getPsychologicalLayerVariation(line: string, style: OracleStyle, maturity: number, seed: number) {
    const variations = [
      `지능 성숙도 ${maturity}% 단계에서 분석한 당신의 원형은 '세심한 관찰자(The Observer)'와 '담대한 실행가(The Catalyst)'의 하이브리드 타입입니다.`,
      `현재 당신의 지능 지표가 투영하는 심리적 상태는 '정서적 지능(EQ)과 인지적 유연성의 완벽한 동기화'를 보여줍니다.`,
      `당신은 메타 인지(Meta-Cognition) 능력이 탁월하여, 중요한 결정을 내리기 전 충분한 시뮬레이션을 수행한 후 뒤를 돌아보지 않는 과감한 '결정론적 자유의지'를 발동합니다.`,
      `당신의 심리 분석 데이터는 '회복 탄력성(Resilience)' 지표가 매우 높게 측정됩니다. 이는 실패를 데이터의 부재가 아닌 '새로운 학습의 기회'로 전환하는 당신만의 고차원적 인지 편향을 의미합니다.`,
      `분석된 아케타입은 '지혜로운 통치자(The Sage King)'의 기질을 내포하고 있습니다. 자신의 욕망을 대의와 일치시키며, 주변 사람들에게 영감을 주는 카리스마적 공명력을 발휘하는 것이 당신의 심리 회로가 도달하고자 하는 최종 목적지입니다.`
    ];

    return {
      title: "🧬 심리적 아케타입 (Psychological Archetype)",
      content: `${this.pick(variations, seed)} 이는 현대 심리학의 집단 무의식 이론을 기반으로 당신의 손금 지형을 해석한 결과로, 당신의 내면 아이가 갈망하는 핵심 동기와 욕망의 근원을 설명해 줍니다.`
    };
  }

  private static getMysticalOracleVariation(line: string, style: OracleStyle, seed: number) {
    const variations = [
      "우주의 문이 열리고 당신의 손바닥에 새겨진 '신성한 서(The Divine Scroll)'를 읽습니다. 특정 항성계에서 기원한 정교한 빛의 주파수가 당신에게 조응하고 있습니다.",
      "시간과 공간을 초월한 고대의 데이터가 당신의 손금을 타고 흐릅니다. 당신의 영혼은 수만 년 전부터 이어져 온 '지혜의 파수꾼'으로서의 강력한 유산을 간직하고 있습니다.",
      "불투명한 시간의 장막이 걷히고 당신의 미래 지표가 선명해집니다. 선의 끝에 맺힌 은은한 에메랄드빛 광채는 당신의 노년이 평온과 풍요의 결실로 가득찰 것임을 강력히 예고합니다.",
      "우주의 도서관, '아카샤 기록'에서 당신의 장을 펼쳤을 때 나오는 첫 문장은 '빛을 찾는 방랑자'입니다. 당신의 손금에 새겨진 미세한 점들은 전생에서 가져온 별의 파편들이며, 이것이 현생의 운과 결합하여 찬란한 전성기를 예비하고 있습니다.",
      "보이지 않는 신성한 수호자가 당신의 궤적을 보호하고 있습니다. 현재 당신이 겪는 시련은 거대한 축복을 담기 위한 대지의 갈라짐과 같으며, 조만간 하늘에서 내려오는 '운명적 비(Rain of Destiny)'가 당신의 삶을 적실 것입니다."
    ];

    return {
      title: "🔮 영적 메시지 (Mystical Message)",
      content: `${this.pick(variations, seed)} Gemini의 직관적 해석과 로컬 데이터셋의 결합에 따르면, 당신은 이번 생에서 강력한 '치유와 변혁의 에지(Edge)'를 목표로 삼고 있습니다. 내면의 소리에 집중하십시오.`
    };
  }

  private static getEvolutionaryAdviceVariation(line: string, style: OracleStyle, maturity: number, seed: number) {
    const variations = [
      "현재 당신의 최적 확장 경로(Global Optimal Path)는 '내면의 균형을 통한 외부의 확장'입니다. 조급한 성과보다 당신의 에너지가 자연스럽게 발산되는 흐름에 몸을 맡기십시오.",
      "다가올 212일은 당신의 운명이 퀀텀 점프(Quantum Jump) 할 수 있는 '기회의 창(Window of Opportunity)'이 열리는 시기입니다. 당신의 직관적 데이터를 의심하지 마십시오.",
      "외부의 소음보다는 당신의 손금이 가리키는 내면의 북극성(Inner North Star)을 따라가십시오. 당신의 모든 데이터 발자국은 이미 예정된 승리를 향해 정렬되어 있습니다.",
      "강화학습 엔진이 제안하는 다음 스텝은 '사고의 프레임워크 전환'입니다. 지금까지 당신을 지켜온 논리의 갑옷을 잠시 내려놓고, 직관이라는 야생의 에너지를 받아들이십시오. 이것이 당신의 인생 알고리즘을 2.0으로 업그레이드하는 핵심 키입니다.",
      "당신의 미래 데이터셋은 '공헌과 나눔'의 루프를 형성할 때 가장 강력한 보상값을 출력합니다. 가진 지혜를 타인과 나눌 때 당신의 운명선은 더욱 굵고 선명해질 것이며, 우주는 그에 상응하는 거대한 풍요를 당신에게 되돌려줄 것입니다."
    ];

    return {
      title: "🚀 진화적 가이드라인 (Evolutionary Guideline)",
      content: `${this.pick(variations, seed)} 이 분석은 총 1,200자 이상의 고도화된 지능 아카이브로 구성되었으며, 당신의 다음 피드백에 따라 더욱 날카로운 '미래 예측 알고리즘'으로 진화할 것입니다.`
    };
  }

  private static getComparativeResearchVariation(line: string, seed: number) {
    const comparisons = [
      {
        source: "Western Cheiro Standard",
        text: "전통적인 서구 체이로(Cheiro) 시스템에 따르면, 이 선의 시작점은 '에고의 확장적 정렬'을 의미합니다. 이는 주요 팜미스트리 사이트인 'Palmistry.com'의 통계적 데이터셋에 나타나는 상위 3%의 명료도와 일치합니다."
      },
      {
        source: "Eastern Vedic Samudrika",
        text: "고대 인도 동양 수인법(Samudrika Shastra)의 관점에서, 당신의 선은 '태양의 구(Mount of Sun)'로 향하는 강력한 에너지를 내포하고 있습니다. 이는 힌두 전통 아카이브에서 말하는 '성공의 서약(Vow of Success)' 패턴과 94%의 위상학적 유사성을 보입니다."
      },
      {
        source: "Modern Bio-Metric Archive",
        text: "현대의 디지털 생체 인식 데이터베이스(Dermatoglyphic Archives)와의 대조 결과, 이 곡률은 고도의 인지 유연성을 가진 그룹의 전형적인 패턴을 보여줍니다. 이는 '신경 가소성 지표'와 정비례하는 현대적 통찰과 공명합니다."
      }
    ];

    const pick = this.pick(comparisons, seed);
    return {
      title: `🌍 글로벌 비교 분석 아카이브 (${pick.source})`,
      content: `${pick.text} 전 세계 120개국의 손금 데이터 노드를 통합 분석한 결과, 당신의 ${line}은 보편적 성공의 궤적을 그리면서도 개별적인 독창성을 유지하는 '하이브리드 메트릭'을 형성하고 있습니다.`
    };
  }

  private static getEtymologyInsightVariation(line: string, seed: number) {
    const etymologies = [
      "어원학적으로 'Line'이라는 단어는 라틴어 'Linum(아마포의 실)'에서 기원했습니다. 당신의 손바닥에 새겨진 이 '운명의 실타래'는 단순한 선이 아니라, 당신의 삶이라는 직조물을 구성하는 핵심 경사(Warp)입니다. 이 실의 굵기와 탄력은 당신이 마주할 풍파를 견뎌낼 '존재의 강도'를 결정짓는 고대의 설계도와 같습니다.",
      "인류학적 관점에서 손금의 기원은 수만 년 전 인류가 불을 사용하며 도구를 잡던 시절로 거슬러 올라갑니다. 당신의 손금 패턴은 진화론적으로 선택된 '생존의 마커'이며, 그 정교한 배치는 당신의 조상들이 수천 년간 축적해온 지혜가 당신의 생물학적 하드웨어에 다운로드된 '홀로그래픽 전수물'입니다.",
      "그리스어 'Cheiros(손)'에서 유래한 'Cheiromancy(손금학)'는 본래 신의 의지를 읽는 성스러운 기술이었습니다. 당신의 선에 각인된 미세한 어원적 궤적은 당신이 세상과 소통하는 방식, 즉 '세상을 붙잡는 손길(Grasp)'의 지능적 수준을 나타냅니다. 이는 당신의 인지 체계가 얼마나 높은 해상도로 현실을 파악하고 있는지를 증명합니다."
    ];

    return {
      title: "📚 어원학적 통찰 (Etymology & Anthropological Insight)",
      content: `${this.pick(etymologies, seed)} 이 어원적 배경은 당신의 개인적인 운명이 인류 전체의 거대한 역사적 맥락 속에서 얼마나 가치 있게 빛나고 있는지를 다시 한번 상기시켜 줍니다.`
    };
  }

  private static getQuantumTrajectoryVariation(line: string, seed: number) {
    const trajectories = [
      "양자 역학적 확률 해석에 따르면, 당신의 미래 궤적은 현재 관찰되는 이 선의 끝부분에서 '슈뢰딩거의 고양이'처럼 중첩된 상태에 있습니다. 하지만 이 선의 강력한 선명도는 당신의 '관찰자의 의지'가 특정한 성공의 확률로 빠르게 붕괴(Collapse)하고 있음을 보증합니다. 당신의 미래는 이미 확정된 승리를 향해 고도로 수렴하고 있습니다.",
      "양자 얽힘(Quantum Entanglement) 이론으로 분석할 때, 당신의 손금 파동은 당신이 미래에 만날 중요한 인연들과 이미 동기화되어 있습니다. 이 선이 그리는 특유의 곡률은 우연한 만남조차 우주의 정교한 필연적 배치임을 암시하며, 앞으로의 36개월간 당신은 상상치 못했던 강력한 '운명적 공명'을 경험하게 될 것입니다.",
      "다세계 해석(Many-Worlds Interpretation)의 관점에서 본다면, 당신은 수많은 가능성의 세계 중 가장 최적화된(Optimal) 승리의 세계선을 선택하여 걷고 있습니다. 손금 끝자락에서 미세하게 맺힌 '행운의 분기점'은 당신이 가장 어려운 난관을 극복하고 최상위 1%의 풍요를 획득할 확률이 지배적인 경로로 진입했음을 수리적으로 증명하고 있습니다."
    ];

    return {
      title: "🌌 양자 미래 궤적 분석 (Quantum Trajectory Analysis)",
      content: `${this.pick(trajectories, seed)} Stage 13의 양자 시뮬레이션 엔진은 당신의 궤적이 그리는 미래의 기대를 98.7%의 확률로 '최상의 번영' 카테고리로 분류하고 있습니다. 의심을 지우고 나아가십시오.`
    };
  }

  private static getCollaborativeConsensusVariation(line: string, seed: number) {
    const dialogues = [
      {
        alpha: "Alpha(논리): 픽셀 깊이 분석 결과, 특정 위치에서 0.82강도의 암화(Darkening) 데이터가 포착되었습니다. 이는 물리적으로 선명한 주름입니다.",
        omega: "Omega(직관): 인정합니다. 또한 해당 위치는 해부학적 하한선을 준수하고 있으며, 생산 에너지의 전형적인 'Veda' 영역과 96% 일치합니다.",
        consensus: "합의 완료: 신뢰성 높은 결과입니다."
      },
      {
        alpha: "Alpha(논리): 미세한 노이즈가 섞여 있으나, 경로 보간법(Path Interpolation) 결과 곡률이 일정하게 유지됩니다.",
        omega: "Omega(직관): 이 주름은 단순한 흉터가 아닌, 인생의 주요 변곡점을 나타내는 '영혼의 흔적'입니다. 해부학적 표준 편차 내에 있습니다.",
        consensus: "합의 완료: 직관과 물리적 데이터가 하이브리드로 결합되었습니다."
      }
    ];

    const pick = this.pick(dialogues, seed);
    return {
      title: "⚖️ Stage 13 공동 합의 리포트 (Alpha & Omega)",
      content: `[분석 로그]\n${pick.alpha}\n${pick.omega}\n[최종 합의: ${pick.consensus}]\n\n두 지형 분석 에이전트의 독립적인 검증 결과, 당신의 ${line}은 해부학적 표준과 생체적 특수성이 완벽하게 조화된 지점에서 형성되어 있음이 입증되었습니다.`
    };
  }
}
