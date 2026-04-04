"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RLEngine } from "@/lib/rl_engine";
import styles from "./page.module.css";
import {
  Zap,
  Brain,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Activity,
  Globe,
  Camera,
  Layers,
  Flame,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  resetConfig,
  loadConfigFromServer,
  saveConfigToServer,
  type HomepageConfig,
} from "@/lib/homepage-config";

function ET({
  value,
  onChange,
  isEditing,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  multiline?: boolean;
}) {
  if (!isEditing) return <>{value}</>;
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.editInput}
        rows={2}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.editInput}
    />
  );
}

export default function Home() {
  const [globalScore, setGlobalScore] = useState(42500);
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_CONFIG);
  const [draft, setDraft] = useState<HomepageConfig>(DEFAULT_CONFIG);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setGlobalScore(RLEngine.getGlobalIntelligenceScore());
    // Server first, localStorage as fallback
    loadConfigFromServer().then((serverConfig) => {
      const loaded = serverConfig ?? loadConfig();
      setConfig(loaded);
      setDraft(loaded);
      if (serverConfig) saveConfig(serverConfig);
      // 다른 페이지에서 연필 버튼 클릭 시 자동 편집 모드 진입
      if (new URLSearchParams(window.location.search).get("edit") === "1") {
        setIsEditing(true);
        window.history.replaceState({}, "", "/");
      }
    });
  }, []);

  function startEditing() {
    setDraft(JSON.parse(JSON.stringify(config)));
    setIsEditing(true);
    setSaveStatus("idle");
  }
  void startEditing; // editing disabled — kept for future use

  async function handleSave() {
    setSaveStatus("saving");
    const { ok, simulated } = await saveConfigToServer(draft);
    if (ok) {
      saveConfig(draft); // update localStorage cache
      setConfig(draft);
      setSaveStatus(simulated ? "saved" : "saved");
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus("idle");
      }, 1200);
    } else {
      // Fallback: localStorage only
      saveConfig(draft);
      setConfig(draft);
      setSaveStatus("error");
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus("idle");
      }, 2000);
    }
  }

  function handleReset() {
    if (!confirm("모든 텍스트를 기본값으로 초기화할까요?")) return;
    resetConfig();
    setConfig(DEFAULT_CONFIG);
    setDraft(DEFAULT_CONFIG);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(config);
    setIsEditing(false);
  }

  function setHero(field: keyof HomepageConfig["hero"], value: string) {
    setDraft((d) => ({ ...d, hero: { ...d.hero, [field]: value } }));
  }

  function setFeature(
    i: number,
    field: "title" | "description",
    value: string
  ) {
    setDraft((d) => {
      const features = [...d.features];
      features[i] = { ...features[i], [field]: value };
      return { ...d, features };
    });
  }

  function setStep(i: number, value: string) {
    setDraft((d) => {
      const steps = [...d.process.steps] as [string, string, string];
      steps[i] = value;
      return { ...d, process: { ...d.process, steps } };
    });
  }

  function setFooter(field: keyof HomepageConfig["footer"], value: string) {
    setDraft((d) => ({ ...d, footer: { ...d.footer, [field]: value } }));
  }

  const c = isEditing ? draft : config;

  return (
    <main className={styles.container}>
      {/* Edit Mode Toolbar */}
      {isEditing && (
        <div className={styles.editToolbar}>
          <span className={styles.editToolbarTitle}>✦ 편집 모드</span>
          <button
            className={`${styles.editBtn} ${styles.editBtnSave}`}
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            <Check size={14} />
            {saveStatus === "saving" ? "저장 중…" : saveStatus === "saved" ? "저장됨 ✓" : saveStatus === "error" ? "로컬 저장됨" : "저장"}
          </button>
          <button className={`${styles.editBtn} ${styles.editBtnReset}`} onClick={handleReset}>
            <RotateCcw size={14} /> 초기화
          </button>
          <button className={`${styles.editBtn} ${styles.editBtnCancel}`} onClick={handleCancel}>
            <X size={14} /> 취소
          </button>
        </div>
      )}

      {/* Floating Edit Button — hidden */}

      {/* 🌌 Animated Cosmic Background */}
      <div className={styles.auroraBg} />
      <div className={styles.starField} />

      <div className={`${styles.content} ${isEditing ? styles.editingMode : ""}`}>
        {/* 🏛️ Hero Section */}
        <section className={`${styles.hero} fade-in-up`}>
          <div className={styles.logoWrapper}>
            <div className={styles.palmPulse} />
            <div className={styles.scannerLine} />
            <h1 className="mystical-font glow-text-secondary">
              <ET
                value={c.hero.title}
                onChange={(v) => setHero("title", v)}
                isEditing={isEditing}
              />
            </h1>
          </div>
          <p className={styles.heroTagline}>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={draft.hero.taglineMain}
                  onChange={(e) => setHero("taglineMain", e.target.value)}
                  className={styles.editInput}
                  style={{ display: "block", marginBottom: "0.5rem" }}
                />
                <input
                  type="text"
                  value={draft.hero.taglineSub}
                  onChange={(e) => setHero("taglineSub", e.target.value)}
                  className={styles.editInput}
                  style={{ display: "block" }}
                />
              </>
            ) : (
              <>
                {c.hero.taglineMain}
                <br />
                <span>{c.hero.taglineSub}</span>
              </>
            )}
          </p>
          <div className={styles.statusBadges}>
            <div className={styles.statusBadge}>
              <ShieldCheck size={14} />
              <span>
                <ET
                  value={c.hero.badge1}
                  onChange={(v) => setHero("badge1", v)}
                  isEditing={isEditing}
                />
              </span>
            </div>
            <div className={styles.statusBadgeSecondary}>
              <Activity size={14} />
              <span>Global Intelligence: {globalScore.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* 🚀 Main CTA */}
        <div
          className={`${styles.ctaSection} fade-in-up`}
          style={{ animationDelay: "0.2s" }}
        >
          {isEditing ? (
            <div className={styles.ctaEditWrapper}>
              <input
                type="text"
                value={draft.cta.text}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, cta: { text: e.target.value } }))
                }
                className={`${styles.editInput} ${styles.ctaEditInput}`}
              />
              <span className={styles.ctaEditHint}>버튼 텍스트</span>
            </div>
          ) : (
            <Link href="/scan" className={styles.mainCta}>
              <span>{c.cta.text}</span>
              <ChevronRight size={20} />
            </Link>
          )}
        </div>

        {/* 🧠 Core Feature Grid */}
        <section className={styles.featureGrid}>
          {c.features.map((feat, i) => (
            <div key={i} className={`${styles.featureCard} glass-card`}>
              <div className={styles.iconBox}>
                {i === 0 && <Brain size={24} />}
                {i === 1 && <Zap size={24} color="#00F2FF" />}
                {i === 2 && <Sparkles size={24} color="#FFD700" />}
              </div>
              <h3>
                <ET
                  value={feat.title}
                  onChange={(v) => setFeature(i, "title", v)}
                  isEditing={isEditing}
                />
              </h3>
              <p>
                <ET
                  value={feat.description}
                  onChange={(v) => setFeature(i, "description", v)}
                  isEditing={isEditing}
                  multiline
                />
              </p>
            </div>
          ))}
        </section>

        {/* 🗺️ Process Guide */}
        <section className={styles.processSection}>
          <h2 className="mystical-font text-center mb-8 opacity-80">
            <ET
              value={c.process.sectionTitle}
              onChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  process: { ...d.process, sectionTitle: v },
                }))
              }
              isEditing={isEditing}
            />
          </h2>
          <div className={styles.processPath}>
            {(["Camera", "Layers", "Flame"] as const).map((_, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className={styles.processStep}>
                  <div className={styles.stepCircle}>
                    {i === 0 && <Camera size={20} />}
                    {i === 1 && <Layers size={20} />}
                    {i === 2 && <Flame size={20} />}
                  </div>
                  <span>
                    <ET
                      value={c.process.steps[i]}
                      onChange={(v) => setStep(i, v)}
                      isEditing={isEditing}
                    />
                  </span>
                </div>
                {i < 2 && <div className={styles.processLine} />}
              </div>
            ))}
          </div>
        </section>

        {/* 🏺 History & Globe */}
        <footer className={styles.footer}>
          <div className={styles.footerLinks}>
            <Link href="/history" className={styles.footerLink}>
              <Globe size={16} />
              <span>
                <ET
                  value={c.footer.link1Text}
                  onChange={(v) => setFooter("link1Text", v)}
                  isEditing={isEditing}
                />
              </span>
            </Link>
            <Link href="/community" className={styles.footerLink}>
              <Activity size={16} />
              <span>
                <ET
                  value={c.footer.link2Text}
                  onChange={(v) => setFooter("link2Text", v)}
                  isEditing={isEditing}
                />
              </span>
            </Link>
          </div>
          <p className={styles.copyright}>
            <ET
              value={c.footer.copyright}
              onChange={(v) => setFooter("copyright", v)}
              isEditing={isEditing}
            />
          </p>
        </footer>
      </div>
    </main>
  );
}
