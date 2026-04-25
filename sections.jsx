/* sections.jsx — concept, contents, flow tour, reflection, faq, join */
const { useState: useS, useEffect: useE, useRef: useR } = React;

/* ============== CONCEPT ============== */
function Concept() {
  return (
    <section id="concept" style={sx.section}>
      <div className="container">
        <SectionHead
          kicker="01 / Concept"
          title={<>作り方だけを教える教室<br/>では<span className="grad-text">ありません</span>。</>}
          lede="自分にとっての正解を考えて、伝える力を育てる教室です。AIが出てきたことで、表現のハードルは大きく下がりました。だからこれから大切になるのは、「何を作るか」「何を良い答えとするか」「それは本当に自分の考えか」を、自分で考えること。"
        />

        <div style={sx.beforeAfter}>
          <div className="card" style={{...sx.baCard, background: "var(--paper-2)"}}>
            <div className="kicker" style={{marginBottom: 12}}>BEFORE / AI以前</div>
            <h3 style={sx.baH}>表現力が、壁になっていた。</h3>
            <p style={sx.baP}>良い考えがあっても、うまく話せるか、うまく書けるかで届き方が大きく変わっていた。</p>
            <div style={sx.baViz}>
              <BarsBefore />
            </div>
          </div>

          <div style={sx.baArrow} aria-hidden="true">
            <svg viewBox="0 0 80 24" style={{width: "100%", height: 24}}>
              <line x1="0" y1="12" x2="68" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <polyline points="60,4 72,12 60,20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="card grad" style={sx.baCard}>
            <div className="kicker" style={{marginBottom: 12, color: "white", opacity: 0.85}}>AFTER / AI以後</div>
            <h3 style={sx.baH}>入口の差は、小さくできる。</h3>
            <p style={sx.baP}>文章を整える、説明をわかりやすくする、表現を磨くことはAIで補える。だからこそ、考える力で差が出る。</p>
            <div style={sx.baViz}>
              <BarsAfter />
            </div>
          </div>
        </div>

        <div style={sx.creed}>
          <div style={sx.creedItem}>
            <div className="bignum" style={sx.creedNum}>01</div>
            <h4 style={sx.creedH}>下諏訪町にいても、世界と同じスタートラインに立てる。</h4>
            <p style={sx.creedP}>小さな町にいても、経験がまだ少ない子どもでも、AIを通じて世界レベルの知恵に触れ、知り、作り、試せる時代になりました。</p>
          </div>
          <div style={sx.creedItem}>
            <div className="bignum" style={sx.creedNum}>02</div>
            <h4 style={sx.creedH}>ただし、考える力の差は、残る。</h4>
            <p style={sx.creedP}>AIは人のできる能力の差を小さくします。でも、その人の考える力が差を生むようになる。だからこの教室では、考える時間を大切にします。</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BarsBefore() {
  return (
    <svg viewBox="0 0 240 80" style={{width: "100%", height: 80}}>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={i*48+8} y={70 - (i*8+12)} width="32" height={i*8+12} fill="var(--ink)" rx="3"/>
      ))}
    </svg>
  );
}
function BarsAfter() {
  return (
    <svg viewBox="0 0 240 80" style={{width: "100%", height: 80}}>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={i*48+8} y="20" width="32" height="50" fill="rgba(255,255,255,0.85)" rx="3"/>
      ))}
    </svg>
  );
}

/* ============== INTERACTIVE TOUR ============== */
const TOUR_OPTIONS = [
  { id: "app",    emoji: "▣", title: "アプリを作りたい",    sub: "ゲーム / クイズ / 学習ツール", color: "#1d4ed8",
    sample: "九九が苦手な弟のための、ゆっくりできる九九アプリ。", outcome: "Webで公開して、家族に使ってもらう。" },
  { id: "write",  emoji: "✎", title: "作文や感想文を書きたい", sub: "読書感想文 / 意見文",      color: "#7c3aed",
    sample: "自分の好きな本について、なぜ好きかを順序立てて書く。", outcome: "学校の感想文として提出できる形に。" },
  { id: "self",   emoji: "◉", title: "自分を表現したい",     sub: "自己紹介 / プロフィール",   color: "#ec4899",
    sample: "新学期で使える自己紹介文と、人前で話す原稿。", outcome: "自信を持って言葉にできるように。" },
  { id: "future", emoji: "✦", title: "未来を描きたい",       sub: "未来予想図 / 町のアイデア",  color: "#ffd400",
    sample: "10年後の下諏訪はどんな町だといいか、絵と言葉で。", outcome: "自分の意見として人に伝えられる形に。" },
];

function FlowTour() {
  const [pick, setPick] = useS("app");
  const opt = TOUR_OPTIONS.find(o => o.id === pick);

  const steps = [
    { n: 1, t: "やってみたいを見つける", d: `「${opt.title}」を選んだあなたへ。まずは小さな"作ってみたい"を言葉にします。` },
    { n: 2, t: "AIで形にしてみる",       d: `例えば「${opt.sample}」のように、AIと対話しながら最初の形を作ります。` },
    { n: 3, t: "違和感に気づく",         d: `「なんか違う」「これじゃない」が出てきます。ここが大事なスタートです。` },
    { n: 4, t: "自分の正解を探す",       d: `何を直したいのか、どこを大事にしたいのか、自分で考えて言葉にします。` },
    { n: 5, t: "人に伝わる形にする",     d: `${opt.outcome}` },
  ];

  return (
    <section id="flow" style={{...sx.section, background: "var(--ink)", color: "var(--paper)"}}>
      <div className="container">
        <SectionHead
          dark
          kicker="02 / Try the flow"
          title={<>あなたなら、<br/><span className="shimmer-text">何を作りますか？</span></>}
          lede="気になるものを選んでみてください。あなた専用の体験フローが、その場で動きます。"
        />

        <div style={sx.tourPicker}>
          {TOUR_OPTIONS.map(o => (
            <button
              key={o.id}
              onClick={() => setPick(o.id)}
              style={{
                ...sx.tourBtn,
                ...(pick === o.id ? { background: o.color, color: o.id === "future" ? "#0a0a14" : "white", borderColor: o.color, transform: "translateY(-4px)" } : {})
              }}
            >
              <span style={sx.tourBtnEmoji}>{o.emoji}</span>
              <span style={sx.tourBtnTitle}>{o.title}</span>
              <span style={sx.tourBtnSub}>{o.sub}</span>
            </button>
          ))}
        </div>

        <div key={pick} style={sx.tourResult}>
          <div style={sx.tourResultHead}>
            <div className="kicker" style={{color: opt.color}}>あなた向けのフロー</div>
            <h3 style={sx.tourResultH}>「{opt.title}」を選びました。</h3>
          </div>

          <div style={sx.steps}>
            {steps.map((s, i) => (
              <div key={s.n} className="reveal in" style={{...sx.step, animationDelay: `${i*0.08}s`, animation: `bobble 0.6s ease-out ${i*0.08}s both`}}>
                <div style={{...sx.stepNum, background: opt.color, color: opt.id === "future" ? "#0a0a14" : "white"}}>{s.n}</div>
                <div style={sx.stepBody}>
                  <h4 style={sx.stepT}>{s.t}</h4>
                  <p style={sx.stepD}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== CONTENTS ============== */
const CONTENTS = [
  { tag: "App",     title: "アプリ・便利ツールを作る", items: ["ゲーム、クイズ、カレンダー、学習補助ツール", "自分や誰かの役に立つ小さなアプリ", "作ったものをWebで公開する体験"], grad: "linear-gradient(135deg, #1d4ed8, #7c3aed)" },
  { tag: "Write",   title: "作文・感想文・意見文を書く", items: ["読書感想文の整理", "自分の考えを筋道立てて言葉にする", "社会の出来事に対する自分の意見を書く"], grad: "linear-gradient(135deg, #7c3aed, #ec4899)" },
  { tag: "Self",    title: "自分を表現する",          items: ["自己紹介文、プロフィール、ブログ", "自分の好きなことや大切にしたいことを言葉に", "人前で話すための原稿を作る"], grad: "linear-gradient(135deg, #ec4899, #ffd400)" },
  { tag: "Future",  title: "未来を描く",              items: ["自分の未来予想図", "町や社会についてのアイデア", "「こうなったらいいな」を形にする"], grad: "linear-gradient(135deg, #ffd400, #1d4ed8)" },
];

function Contents({ sectionStyle, columns }) {
  return (
    <section id="contents" style={sx.section}>
      <div className="container">
        <SectionHead
          kicker="03 / What you can make"
          title={<>アプリだけにしない。<br/>入口を、<span className="wiggle">広く</span>します。</>}
          lede="ものづくりの入口は人によって違います。プログラミングが好きな子も、文章、アイデア、将来の夢、気持ちの整理、意見を言うことに興味がある子も。だから、「自分が形にしたいもの」を出発点にします。"
        />

        <div data-section-style={sectionStyle} style={{...sx.contentsGrid, gridTemplateColumns: `repeat(${columns}, 1fr)`}}>
          {CONTENTS.map((c, i) => (
            <div key={i} className="switchable" style={{position: "relative", overflow: "hidden"}}>
              <div style={{...sx.contentBadge, background: c.grad}}>{c.tag}</div>
              <h3 style={sx.contentH}>{c.title}</h3>
              <ul style={sx.contentList}>
                {c.items.map((it, j) => (
                  <li key={j} style={sx.contentLi}>
                    <span style={{...sx.bullet, background: c.grad}} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== REFLECTION ============== */
function Reflection() {
  return (
    <section id="reflection" style={{...sx.section, background: "var(--paper-2)"}}>
      <div className="container">
        <SectionHead
          kicker="04 / From last time"
          title={<>4月19日の反省を、<br/>次の<span className="grad-text">強み</span>に変えます。</>}
        />

        <div style={sx.reflGrid}>
          <div className="card" style={sx.reflCard}>
            <div style={sx.reflLabel}>前回 · 4月19日</div>
            <div style={sx.reflBody}>
              <p>男の子と女の子の計3人が参加。</p>
              <p>プログラミングやアプリに比較的興味がある子には、かなり役立つ時間に。</p>
              <p style={{opacity: 0.6}}>一方で「そもそも何を作りたいかまだ分からない」「アプリにそこまで興味がない」という子にとっては、最初の入口が少し狭かった。</p>
            </div>
            <div style={{...sx.reflStamp, background: "var(--ink)", color: "var(--paper)"}}>反省</div>
          </div>

          <div style={sx.reflArrow}>
            <div className="bignum" style={{fontSize: 64, lineHeight: 1}}>→</div>
            <div style={{fontSize: 13, fontWeight: 600, marginTop: 8}}>入口を広げる</div>
          </div>

          <div className="card grad" style={sx.reflCard}>
            <div style={{...sx.reflLabel, color: "white", opacity: 0.85}}>次回 · 5月下旬</div>
            <div style={sx.reflBody}>
              <p>アプリだけではなく、文章、紹介文、意見文、未来のアイデアまで幅を広げる。</p>
              <p>自分の興味から入れる教室にしていきます。</p>
              <p style={{opacity: 0.92}}>自分の関心に合った入口が見つかれば、AIは一気に「表現を手伝ってくれる相棒」に変わります。</p>
            </div>
            <div style={{...sx.reflStamp, background: "var(--accent-yellow)", color: "var(--ink)"}}>改善</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== OUTCOMES ============== */
function Outcomes() {
  const items = [
    { t: "「できない」が減る", d: "うまく書けない、うまく話せない、形にできない、という壁が低くなります。最初の一歩が踏み出しやすくなります。", icon: "↓" },
    { t: "自分は何をしたいかを考えるようになる", d: "ただ答えをもらうのではなく、「自分はどうしたい？」「これは自分にとって本当に良い答え？」と考える習慣がついてきます。", icon: "?" },
    { t: "人に伝えることが近くなる", d: "アイデアや気持ちを、自分なりの形で人に渡せるようになります。学校でも日常でも、これから先にずっと生きる力です。", icon: "→" },
  ];
  return (
    <section style={sx.section}>
      <div className="container">
        <SectionHead
          kicker="05 / What changes"
          title={<>明日から、<br/>何が<span className="grad-text">変わるのか</span>。</>}
        />
        <div style={sx.outGrid}>
          {items.map((o, i) => (
            <div key={i} style={sx.outItem}>
              <div style={sx.outIcon}>{o.icon}</div>
              <h3 style={sx.outH}>{o.t}</h3>
              <p style={sx.outP}>{o.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== FAQ ============== */
const FAQS = [
  { q: "アプリにあまり興味がなくても参加できますか？", a: "できます。今回の教室はアプリ制作だけに絞りません。文章、紹介文、意見文、未来のアイデア、人に伝えるものなど、自分の関心に合った入口から始められるようにします。" },
  { q: "文章が苦手でも大丈夫ですか？", a: "大丈夫です。むしろ、文章が苦手だったり、気持ちをうまく表現しにくかったりする子にこそ、AIは良い助けになります。そのうえで、最後は自分の言葉として選び直すことを一緒にやります。" },
  { q: "AIに頼ると、自分で考えなくなりませんか？", a: "任せきりにすれば、そうなる可能性はあります。だからこの教室では、AIの答えをそのまま使うのではなく、「これは本当に自分の考えか？」「もっと良い形はないか？」と見直す時間を大事にします。" },
  { q: "保護者も同席できますか？", a: "はい、訪問授業形式なのでご家庭で実施します。保護者の方が見守られても、別室で過ごされても大丈夫です。" },
];

function Faq() {
  const [open, setOpen] = useS(0);
  return (
    <section id="faq" style={{...sx.section, background: "var(--ink)", color: "var(--paper)"}}>
      <div className="container">
        <SectionHead
          dark
          kicker="06 / FAQ"
          title={<>アプリに興味がなくても?<br/>文章が苦手でも?<span className="grad-text"> 大丈夫。</span></>}
        />
        <div style={sx.faqList}>
          {FAQS.map((f, i) => (
            <div key={i} style={sx.faqItem}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={sx.faqQ}>
                <span style={{display: "flex", gap: 16, alignItems: "baseline"}}>
                  <span className="bignum" style={{fontSize: 18, opacity: 0.5}}>0{i+1}</span>
                  <span>{f.q}</span>
                </span>
                <span style={{...sx.faqPlus, transform: open === i ? "rotate(45deg)" : "rotate(0deg)"}}>+</span>
              </button>
              <div style={{...sx.faqA, maxHeight: open === i ? 400 : 0, opacity: open === i ? 1 : 0}}>
                <div style={{padding: "0 0 24px 50px"}}>{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== JOIN ============== */
function Join() {
  const detailsLeft = [
    ["開催時期", "5月下旬予定"],
    ["形式",     "各ご家庭への訪問授業"],
    ["時間",     "90分（40分＋10分＋40分）"],
    ["目安",     "13:00 〜 15:00"],
    ["参加費",   "無料"],
  ];
  const detailsRight = [
    ["対象", "ある程度パソコンが操作できる方（インターネット検索ができるレベル）"],
    ["定員", "先着3名"],
    ["主催", "宮坂 進"],
    ["申込", "Googleフォームまたはメール"],
    ["問合せ", "farm@lucky-bright.com"],
  ];
  return (
    <section id="join" style={sx.section}>
      <div className="container">
        <div style={sx.joinHero}>
          <div className="kicker" style={{marginBottom: 24}}>07 / Join</div>
          <h2 className="hero-type" style={sx.joinH}>
            AIは、できることを<br/>
            増やします。<br/>
            でも、<span style={{...sx.outlineWordSm}}>こたえ</span>を<br/>
            <span className="grad-text">考えるのは、人。</span>
          </h2>
          <p style={sx.joinLede}>
            この教室は、AIを使う練習だけをする場所ではありません。AIを使って、自分は何を作りたいのか、自分にとっての良い答えは何か、それをどう人に伝えるかを考える場所です。
          </p>
        </div>

        <div style={sx.joinDetails}>
          <div style={sx.joinCol}>
            <h3 style={sx.joinColH}>開催概要</h3>
            <dl style={sx.dl}>
              {detailsLeft.map(([k, v]) => (
                <div key={k} style={sx.dlRow}>
                  <dt style={sx.dt}>{k}</dt>
                  <dd style={sx.dd}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div style={sx.joinCol}>
            <h3 style={sx.joinColH}>対象・申込</h3>
            <dl style={sx.dl}>
              {detailsRight.map(([k, v]) => (
                <div key={k} style={sx.dlRow}>
                  <dt style={sx.dt}>{k}</dt>
                  <dd style={sx.dd}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div style={sx.joinCta}>
          <a className="btn grad" href="https://docs.google.com/forms/d/e/1FAIpQLSfPle-aidQCRKUvQ7w-qayl-i3efI5qZyfUVa97v9Rq3pjKiQ/viewform?usp=header" target="_blank" rel="noreferrer">
            申込フォームへ進む →
          </a>
          <a className="btn outline" href="mailto:farm@lucky-bright.com">
            メールで問い合わせる
          </a>
        </div>
        <div style={{...sx.note, textAlign: "center", marginTop: 16}}>
          ※ 勧誘やセールスなどを目的としたものではありません。教材販売・継続契約・営業目的のご案内は行いません。
        </div>
      </div>
    </section>
  );
}

/* ============== FOOTER ============== */
function Footer() {
  return (
    <footer style={sx.footer}>
      <div className="container" style={sx.footerInner}>
        <div className="bignum" style={sx.footerBig}>
          SHIMOSUWA<br/>
          <span className="grad-text">L A B</span>
        </div>
        <div style={sx.footerRight}>
          <div style={{fontSize: 14, opacity: 0.7, marginBottom: 8}}>下諏訪Lab / AIでものづくり教室</div>
          <div style={{fontSize: 13, opacity: 0.5, lineHeight: 1.7}}>
            主催: 宮坂 進<br/>
            お問い合わせ: farm@lucky-bright.com<br/>
            このページは「AIでものづくり教室」の募集ページです。
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============== SECTION HEAD ============== */
function SectionHead({ kicker, title, lede, dark }) {
  return (
    <div style={sx.head}>
      <div className="kicker" style={{opacity: dark ? 0.5 : 0.6, color: dark ? "var(--paper)" : "var(--ink)"}}>{kicker}</div>
      <h2 className="hero-type" style={sx.headH}>{title}</h2>
      {lede && <p style={sx.headLede}>{lede}</p>}
    </div>
  );
}

/* ============== STYLES ============== */
const sx = {
  section: { padding: "clamp(80px, 12vh, 160px) 0", position: "relative" },
  head: { maxWidth: 920, marginBottom: 64 },
  headH: {
    fontSize: "clamp(40px, 6vw, 88px)",
    margin: "8px 0 24px",
    letterSpacing: "-0.03em",
  },
  headLede: { fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.8, opacity: 0.8, maxWidth: 720 },

  /* before/after */
  beforeAfter: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 24,
    alignItems: "stretch",
    marginBottom: 80,
  },
  baCard: { padding: 36, display: "flex", flexDirection: "column" },
  baH: { fontSize: 28, margin: "0 0 12px", letterSpacing: "-0.02em" },
  baP: { fontSize: 15, lineHeight: 1.8, margin: 0, marginBottom: 24, flex: 1 },
  baViz: { borderTop: "1.5px dashed currentColor", paddingTop: 16, opacity: 0.85 },
  baArrow: { display: "grid", placeItems: "center", color: "var(--ink)", width: 80 },

  creed: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 64,
    marginTop: 48,
    paddingTop: 48,
    borderTop: "1.5px solid var(--ink)",
  },
  creedItem: {},
  creedNum: { fontSize: 22, opacity: 0.4, marginBottom: 12 },
  creedH: { fontSize: 28, lineHeight: 1.4, margin: "0 0 12px", letterSpacing: "-0.02em" },
  creedP: { fontSize: 15, lineHeight: 1.85, margin: 0, opacity: 0.78 },

  /* tour */
  tourPicker: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 48,
  },
  tourBtn: {
    background: "transparent",
    color: "var(--paper)",
    border: "1.5px solid rgba(250, 247, 242, 0.25)",
    borderRadius: 22,
    padding: "28px 24px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
    cursor: "pointer",
  },
  tourBtnEmoji: { fontSize: 32, lineHeight: 1, marginBottom: 8 },
  tourBtnTitle: { fontSize: 18, fontWeight: 700 },
  tourBtnSub: { fontSize: 12, opacity: 0.7 },

  tourResult: {
    background: "rgba(250, 247, 242, 0.04)",
    border: "1.5px solid rgba(250, 247, 242, 0.15)",
    borderRadius: 28,
    padding: "clamp(32px, 4vw, 56px)",
  },
  tourResultHead: { marginBottom: 32 },
  tourResultH: { fontSize: "clamp(28px, 3.5vw, 44px)", margin: "8px 0 0", letterSpacing: "-0.02em" },

  steps: { display: "flex", flexDirection: "column", gap: 20 },
  step: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 24,
    alignItems: "start",
    padding: "20px 0",
    borderTop: "1px dashed rgba(250, 247, 242, 0.18)",
  },
  stepNum: {
    width: 56, height: 56,
    borderRadius: "50%",
    display: "grid", placeItems: "center",
    fontFamily: "var(--font-en)",
    fontWeight: 800,
    fontSize: 22,
  },
  stepBody: {},
  stepT: { fontSize: 22, margin: "12px 0 6px", letterSpacing: "-0.01em" },
  stepD: { fontSize: 15, lineHeight: 1.8, margin: 0, opacity: 0.75 },

  /* contents */
  contentsGrid: {
    display: "grid",
    gap: 20,
  },
  contentBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: 999,
    fontFamily: "var(--font-en)",
    fontWeight: 700,
    fontSize: 12,
    color: "white",
    letterSpacing: "0.08em",
    marginBottom: 20,
  },
  contentH: { fontSize: 24, margin: "0 0 20px", letterSpacing: "-0.02em", lineHeight: 1.4 },
  contentList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 },
  contentLi: { display: "flex", gap: 12, fontSize: 14, lineHeight: 1.7, alignItems: "start" },
  bullet: { width: 8, height: 8, borderRadius: "50%", marginTop: 7, flexShrink: 0 },

  /* reflection */
  reflGrid: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "stretch" },
  reflCard: { padding: 36, position: "relative", overflow: "hidden" },
  reflLabel: { fontFamily: "var(--font-en)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.6, marginBottom: 16 },
  reflBody: { display: "flex", flexDirection: "column", gap: 12, fontSize: 15, lineHeight: 1.8 },
  reflStamp: {
    position: "absolute", top: 24, right: 24,
    padding: "6px 14px", borderRadius: 6,
    fontFamily: "var(--font-jp)", fontWeight: 700, fontSize: 13,
    transform: "rotate(8deg)",
  },
  reflArrow: { display: "grid", placeItems: "center", textAlign: "center", color: "var(--ink)" },

  /* outcomes */
  outGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1.5px solid var(--ink)" },
  outItem: { padding: "40px 32px", borderRight: "1.5px solid var(--ink)", borderBottom: "1.5px solid var(--ink)" },
  outIcon: {
    fontFamily: "var(--font-en)",
    fontSize: 64, fontWeight: 800,
    background: "var(--grad)",
    WebkitBackgroundClip: "text", backgroundClip: "text",
    color: "transparent",
    marginBottom: 16, lineHeight: 1,
  },
  outH: { fontSize: 22, margin: "0 0 12px", letterSpacing: "-0.01em", lineHeight: 1.4 },
  outP: { fontSize: 14, lineHeight: 1.8, margin: 0, opacity: 0.78 },

  /* faq */
  faqList: { display: "flex", flexDirection: "column" },
  faqItem: { borderBottom: "1px solid rgba(250, 247, 242, 0.18)" },
  faqQ: {
    width: "100%", textAlign: "left",
    background: "transparent", border: "none", color: "inherit",
    padding: "28px 0",
    fontSize: 18, fontWeight: 600,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    cursor: "pointer",
  },
  faqPlus: { fontSize: 28, fontWeight: 300, transition: "transform 0.3s ease", color: "var(--accent-yellow)" },
  faqA: { overflow: "hidden", transition: "max-height 0.5s ease, opacity 0.4s ease", fontSize: 15, lineHeight: 1.85, opacity: 0.85 },

  /* join */
  joinHero: { marginBottom: 64 },
  joinH: { fontSize: "clamp(48px, 7vw, 110px)", margin: 0, letterSpacing: "-0.03em" },
  outlineWordSm: { WebkitTextStroke: "1.5px var(--ink)", color: "transparent", fontWeight: 900 },
  joinLede: { fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.85, marginTop: 32, maxWidth: 720 },

  joinDetails: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, padding: "48px 0", borderTop: "1.5px solid var(--ink)", borderBottom: "1.5px solid var(--ink)" },
  joinCol: {},
  joinColH: { fontSize: 14, fontFamily: "var(--font-en)", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 24px", opacity: 0.6 },
  dl: { margin: 0 },
  dlRow: { display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, padding: "14px 0", borderBottom: "1px dashed var(--line)" },
  dt: { fontSize: 13, fontWeight: 700, opacity: 0.6, paddingTop: 2 },
  dd: { fontSize: 16, fontWeight: 500, margin: 0 },

  joinCta: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 48 },
  note: { fontSize: 12, opacity: 0.6 },

  /* footer */
  footer: { background: "var(--ink)", color: "var(--paper)", padding: "80px 0 40px" },
  footerInner: { display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "end" },
  footerBig: { fontSize: "clamp(64px, 12vw, 180px)", lineHeight: 0.9, letterSpacing: "-0.04em" },
  footerRight: { textAlign: "right" },
};

Object.assign(window, { Concept, FlowTour, Contents, Reflection, Outcomes, Faq, Join, Footer });
