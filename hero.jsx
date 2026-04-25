/* hero.jsx — giant typography hero with animated blobs */
const { useEffect, useRef, useState } = React;

function Hero() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let raf;
    let start = performance.now();
    const tick = () => {
      setTime((performance.now() - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="hero" style={heroStyles.root}>
      {/* animated background blobs */}
      <div style={heroStyles.blobsLayer} aria-hidden="true">
        <div style={{ ...heroStyles.blob, ...heroStyles.blob1 }} />
        <div style={{ ...heroStyles.blob, ...heroStyles.blob2 }} />
        <div style={{ ...heroStyles.blob, ...heroStyles.blob3 }} />
      </div>

      {/* grid overlay */}
      <div style={heroStyles.grid} aria-hidden="true" />

      {/* top bar */}
      <header style={heroStyles.topbar}>
        <div style={heroStyles.brand}>
          <div style={heroStyles.brandMark}>
            <div style={{ ...heroStyles.brandMarkInner, transform: `rotate(${time * 30}deg)` }} />
          </div>
          <div>
            <div style={heroStyles.brandName}>SHIMOSUWA LAB</div>
            <div style={heroStyles.brandTag}>下諏訪Lab / since 2025</div>
          </div>
        </div>
        <nav style={heroStyles.nav}>
          <a href="#concept">考え方</a>
          <a href="#contents">できること</a>
          <a href="#flow">体験フロー</a>
          <a href="#reflection">前回から</a>
          <a href="#faq">よくある質問</a>
          <a href="#join" style={heroStyles.navCta}>申込 →</a>
        </nav>
      </header>

      <div className="container" style={heroStyles.content}>
        <div style={heroStyles.kickerRow}>
          <span className="tag grad">参加費 無料 · 先着3名</span>
          <span className="tag outline">5月下旬 開催予定</span>
          <span className="tag outline">訪問授業 / 90分</span>
        </div>

        <h1 className="hero-type" style={heroStyles.h1}>
          <span style={heroStyles.line1}>
            <span className="grad-text">AI</span>で、
          </span>
          <span style={heroStyles.line2}>
            <span style={heroStyles.outlineWord}>つくる</span>
          </span>
          <span style={heroStyles.line3}>
            <span style={{ position: "relative" }}>
              <span style={heroStyles.kotae}>こたえ</span>
              <Squiggle />
            </span>
            は、自分で。
          </span>
        </h1>

        <div style={heroStyles.subRow}>
          <p style={heroStyles.lede}>
            アプリも、作文も、自己紹介も、未来予想図も。<br />
            「何を作るか」「何を良い答えとするか」を一緒に考える、<br />
            下諏訪町の小さな<span className="wiggle">ものづくり教室</span>です。
          </p>
          <div style={heroStyles.ctaCol}>
            <a href="#join" className="btn grad">
              申込フォームを見る
              <Arrow />
            </a>
            <a href="#concept" className="btn outline">
              教室の考え方
              <Arrow />
            </a>
            <div style={heroStyles.note}>
              ※ 勧誘・セールス一切なし。安心してご検討ください。
            </div>
          </div>
        </div>

        {/* big stats row */}
        <div style={heroStyles.stats}>
          <Stat big="¥0" label="参加費" sub="無料体験です" />
          <Stat big="3" label="名 / 回" sub="先着・少人数制" />
          <Stat big="90" label="分間" sub="40＋10＋40 構成" />
          <Stat big="∞" label="作るもの" sub="アプリも作文も" />
        </div>
      </div>

      {/* bottom marquee */}
      <div className="ticker" style={{ marginTop: 80 }}>
        <div className="marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "flex" }}>
              {[
                "AIでものづくり",
                "作りたいを形に",
                "下諏訪町から世界へ",
                "考える力を育てる",
                "答えは自分で",
                "アプリも作文も",
                "参加費無料",
                "5月下旬 開催"
              ].map((t, j) => (
                <span key={j} className="item">
                  <span className="dot" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ big, label, sub }) {
  return (
    <div style={heroStyles.stat}>
      <div className="bignum" style={heroStyles.statBig}>{big}</div>
      <div style={heroStyles.statLabel}>{label}</div>
      <div style={heroStyles.statSub}>{sub}</div>
    </div>
  );
}

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function Squiggle() {
  return (
    <svg style={heroStyles.squiggle} viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 7 Q 25 0 50 7 T 100 7 T 150 7 T 200 7" stroke="#ffd400" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const heroStyles = {
  root: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    background: "var(--paper)",
    isolation: "isolate",
  },
  blobsLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    filter: "blur(60px)",
    opacity: 0.55,
    pointerEvents: "none",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    animation: "blob 18s ease-in-out infinite",
  },
  blob1: {
    width: 520, height: 520,
    background: "var(--grad-start)",
    top: "-10%", left: "-10%",
    animationDelay: "0s",
  },
  blob2: {
    width: 600, height: 600,
    background: "var(--grad-mid)",
    top: "20%", right: "-12%",
    animationDelay: "-6s",
  },
  blob3: {
    width: 480, height: 480,
    background: "var(--grad-end)",
    bottom: "-12%", left: "30%",
    animationDelay: "-12s",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(10,10,20,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,20,0.06) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
    backgroundPosition: "-1px -1px",
    zIndex: 1,
    pointerEvents: "none",
    maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
    WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
  },
  topbar: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px clamp(24px, 4vw, 56px)",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: {
    width: 44, height: 44,
    borderRadius: 12,
    background: "var(--ink)",
    display: "grid", placeItems: "center",
    overflow: "hidden",
  },
  brandMarkInner: {
    width: 24, height: 24,
    background: "var(--grad)",
    borderRadius: 4,
  },
  brandName: { fontFamily: "var(--font-en)", fontWeight: 700, fontSize: 14, letterSpacing: "0.12em" },
  brandTag: { fontSize: 11, opacity: 0.6, fontFamily: "var(--font-en)", letterSpacing: "0.08em" },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 28,
    fontWeight: 600,
    fontSize: 14,
  },
  navCta: {
    background: "var(--ink)",
    color: "var(--paper)",
    padding: "10px 18px",
    borderRadius: 999,
  },
  content: {
    position: "relative",
    zIndex: 2,
    paddingTop: "clamp(40px, 7vh, 80px)",
    paddingBottom: 40,
  },
  kickerRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 36,
  },
  h1: {
    fontSize: "clamp(64px, 14vw, 240px)",
    margin: 0,
    marginBottom: 40,
  },
  line1: { display: "block" },
  line2: { display: "block" },
  line3: { display: "block", fontSize: "clamp(40px, 8vw, 140px)", marginTop: "0.05em" },
  outlineWord: {
    WebkitTextStroke: "2px var(--ink)",
    color: "transparent",
    fontWeight: 900,
  },
  kotae: {
    background: "var(--ink)",
    color: "var(--paper)",
    padding: "0 0.15em",
    borderRadius: 6,
  },
  squiggle: {
    position: "absolute",
    left: 0, right: 0, bottom: "-0.15em",
    width: "100%", height: "0.18em",
    pointerEvents: "none",
  },
  subRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 40,
    alignItems: "end",
    marginTop: 24,
  },
  lede: {
    fontSize: "clamp(16px, 1.4vw, 20px)",
    lineHeight: 1.8,
    margin: 0,
    fontWeight: 500,
  },
  ctaCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  note: { fontSize: 12, opacity: 0.6, marginTop: 4 },
  stats: {
    marginTop: 64,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 0,
    borderTop: "1.5px solid var(--ink)",
    borderBottom: "1.5px solid var(--ink)",
  },
  stat: {
    padding: "28px 24px",
    borderRight: "1.5px solid var(--ink)",
  },
  statBig: {
    fontSize: "clamp(48px, 7vw, 96px)",
    background: "var(--grad)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: 8,
  },
  statLabel: {
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.04em",
  },
  statSub: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 4,
  },
};

window.Hero = Hero;
