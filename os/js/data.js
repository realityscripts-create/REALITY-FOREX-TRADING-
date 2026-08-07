/* ============================================================
   REALITY FX OS — Course Data
   Chapter metadata + quiz bank (draft answer keys for verification)
   ============================================================ */

// Ranks by total XP.
// A perfect run of the full course (all slides, all quiz questions, all
// chapter + quiz-pass bonuses) tops out around ~3.4k XP. The final rank is
// deliberately priced BEYOND that ceiling — reaching it requires retakes,
// streaks and sustained engagement, so the top of the ladder stays rare.
const RANKS = [
  { name: "Novice",        min: 0,    icon: "🌱" },
  { name: "Student",       min: 100,  icon: "📘" },
  { name: "Analyst",       min: 300,  icon: "📈" },
  { name: "Risk-Aware",    min: 700,  icon: "🛡️" },
  { name: "Strategist",    min: 1200, icon: "♟️" },
  { name: "Institution",   min: 2000, icon: "🏛️" },
  { name: "Titan of the Markets", min: 5000, icon: "👑" }
];

const PASS_PCT = 70;

// Per-question topic tags — power the performance analytics (weakest/strongest areas)
const QUIZ_TAGS = {
  1: { 0: "Trading psychology", 1: "Sentiment", 2: "Market basics", 3: "Trader types", 4: "Market drivers", 5: "Trader types", 6: "Trader types", 7: "Trader types", 8: "Trader types", 9: "Trading styles" },
  2: { 0: "Derivatives", 1: "Direction", 2: "Direction", 3: "Long & short", 4: "Long & short", 5: "Charts", 6: "Timeframes", 7: "Timeframes", 8: "Timeframes", 9: "Timeframes", 10: "Timeframes", 11: "Timeframes", 12: "Price metrics", 13: "Calculations", 14: "Calculations", 15: "Calculations", 16: "Calculations", 17: "Pairs", 18: "Pairs", 19: "Lots", 20: "Lots", 21: "Lots", 22: "Leverage & margin", 23: "Leverage & margin", 24: "Leverage & margin", 25: "Analysis", 26: "Analysis", 27: "Analysis", 28: "Confluence", 29: "Volatility", 30: "Liquidity", 31: "Markets", 32: "Indices" }
};

// Self-assessment poll shown at the end of every chapter (from the original course)
const POLL_OPTIONS = [
  { label: "Excellently — 80% & above",        pct: "80–100" },
  { label: "Good — 60% to 79%",                pct: "60–79" },
  { label: "Decent — 40% to 59%",              pct: "40–59" },
  { label: "Weak — 20% to 39%",                pct: "20–39" },
  { label: "Fail — 19% & below",               pct: "0–19" }
];

const QUOTE = "Every lesson is a trade. Every trade is a lesson.";

/* ------------------------------------------------------------
   TRADER STYLES — adaptive learning profiles
   Each style carries its own lens: identity, edge, traps and a
   personalized chapter guide. The OS weaves the student's chosen
   style into the lessons they read, the insights they get, and
   the path they're guided along.
   ------------------------------------------------------------ */
const STYLES = {
  scalper: {
    key: "scalper", name: "Scalper",
    icon: "<path d='M13 2L4 14h6l-1 8 9-12h-6l1-8z'/>",
    tagline: "Seconds to minutes — speed is your edge.",
    timeframe: "1m – 5m charts · positions held seconds to minutes",
    profile: "Scalping is sprinting: trades measured in seconds to minutes, dozens of entries a day, each one fighting for a few pips. You live on the smallest timeframes — 1m to 5m — where liquidity, spread and execution speed matter more than any indicator.",
    edge: [
      "Reads price structure and momentum faster than any other style",
      "Compounds small wins daily — no waiting for the 'big move'",
      "20 decisions a day is 20 reps a day: discipline built in volume"
    ],
    watch: [
      "Spread + commission are your first costs — they can silently eat a third of a scalp edge",
      "Trading quiet hours — no volatility, no scalp. Know when the market is asleep",
      "The 10th trade of the day is rarely as clean as the 1st — fatigue is a real risk factor"
    ],
    chapters: [
      { id: 4, why: "Candlesticks are your native language — instant reads on 1m–5m" },
      { id: 5, why: "Micro structure: where support & resistance live in your timeframe" },
      { id: 9, why: "Market orders — your execution precision decides your edge" },
      { id: 10, why: "Momentum & volatility indicators that time your entries" }
    ]
  },
  day: {
    key: "day", name: "Day Trader",
    icon: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'/>",
    tagline: "One day, one plan — flat before the close.",
    timeframe: "15m – 1H charts · everything decided inside one session",
    profile: "Day trading is a daily campaign: form a bias at the open, trade it through the session, and close everything flat before the close. No overnight risk, no gaps — your P&L is decided inside a single day.",
    edge: [
      "Trades daily volatility without ever carrying overnight risk",
      "Every day is a clean slate — losses stay inside their day",
      "Leverages the two highest-liquidity windows: the open and the close"
    ],
    watch: [
      "The open is emotional — a bias without a plan becomes a gamble",
      "Midday chop: quiet hours produce the worst fills and the sloppiest trades",
      "'One more hour' on a losing position — the flat-by-close rule exists for a reason"
    ],
    chapters: [
      { id: 4, why: "Candles set your intraday entries and exits" },
      { id: 5, why: "Daily structure gives your morning bias its direction" },
      { id: 9, why: "Order types executed at the right moment are your whole session" },
      { id: 7, why: "Risk management is your daily survival kit" }
    ]
  },
  swing: {
    key: "swing", name: "Swing Trader",
    icon: "<path d='M3 20L10 6l4 8 3-5 4 11H3z'/>",
    tagline: "Days to weeks — let the market come to you.",
    timeframe: "1H – daily charts · positions held days to weeks",
    profile: "Swing trading is chess, not sprinting: positions held for days to weeks, riding the structure of higher timeframes — 1H, 4H and daily. You let the market come to your levels, and patience is the edge other styles can't copy.",
    edge: [
      "Trades with the daily trend instead of fighting intraday noise",
      "Needs only a few quality setups a month — quality over frequency",
      "Fills are forgiving — you don't pay for the exact tick"
    ],
    watch: [
      "Overnight and weekend gaps can punish a perfect setup — size for them",
      "Fighting the daily trend to catch a 'cheap' retracement",
      "Position size creeping up on 'sure things' — the monthly P&L is what matters"
    ],
    chapters: [
      { id: 3, why: "Fundamentals are the fuel your multi-day moves run on" },
      { id: 5, why: "Trends, support and resistance are your playground" },
      { id: 11, why: "The market cycle tells you which phase your setup sits in" },
      { id: 8, why: "Choosing the right pairs for multi-day structure" }
    ]
  },
  position: {
    key: "position", name: "Position Trader",
    icon: "<circle cx='12' cy='12' r='9'/><path d='M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18'/>",
    tagline: "Weeks to years — trade the theme, not the noise.",
    timeframe: "Daily – weekly charts · positions held weeks to years",
    profile: "Position trading is the long game: positions held for weeks, months, even years, built on fundamental themes rather than chart noise. You think in quarters, not candles — and your account compounds on conviction.",
    edge: [
      "Profits from the big themes impatient traders abandon",
      "Time in the market beats timing the market",
      "Lowest stress of all styles — decisions are measured in weeks"
    ],
    watch: [
      "Every thesis needs an exit trigger — 'it'll recover' is not a plan",
      "Drawdown feels different over months — size so you can hold",
      "Stay current: one news event can invalidate the whole theme"
    ],
    chapters: [
      { id: 3, why: "Fundamental analysis is the engine of every position" },
      { id: 11, why: "The cycle tells you where the theme is heading" },
      { id: 8, why: "Cross-asset pairs match your multi-week horizon" },
      { id: 12, why: "The stock market broadens your long-term universe" }
    ]
  },
  general: {
    key: "general", name: "Explorer",
    icon: "<circle cx='12' cy='12' r='9'/><path d='M15.5 8.5l-2 5-5 2 2-5 5-2z'/>",
    tagline: "Still discovering your edge — that's exactly right.",
    timeframe: "All timeframes, while you explore",
    profile: "You haven't settled on a style yet — and Chapter 1 says that's the correct first position. The OS will show you each style's lens as you go, and your analytics will reveal which one your decisions naturally favour.",
    edge: [
      "Open-minded — not yet locked into one approach",
      "Learning what actually fits before committing",
      "The market will help you choose — and you can change any time"
    ],
    watch: [
      "Don't force a style to fit — let your data reveal it",
      "Avoid collecting styles without mastering one",
      "Stay curious through every chapter — especially the ones that feel 'not for you'"
    ],
    chapters: [
      { id: 2, why: "The language of trading — the foundation everything builds on" },
      { id: 4, why: "Candlesticks — the first skill every style shares" },
      { id: 6, why: "Psychology — your behaviour will reveal your natural style" }
    ]
  }
};

/* ------------------------------------------------------------
   Chapter 4 SVG figure helper — gold/dark themed candlestick charts.
   Each candle: { o, h, l, c } on a 0–100 price scale; c >= o = bullish.
   ------------------------------------------------------------ */
function candFig(list, opts) {
  opts = opts || {};
  const W = 320, H = 140, L = 16, R = 14, T = 14, B = 22;
  const y = v => T + (100 - v) / 100 * (H - T - B);
  const n = Math.max(list.length, 1);
  const cw = (W - L - R) / n;
  const bw = Math.min(22, cw * 0.52);
  let grid = "";
  [0, 25, 50, 75, 100].forEach(g => { grid += `<line x1="${L}" y1="${y(g).toFixed(1)}" x2="${W - R}" y2="${y(g).toFixed(1)}" stroke="rgba(201,162,39,0.10)" stroke-width="1"/>`; });
  const candles = list.map((cd, i) => {
    const x = L + cw * i + (cw - bw) / 2;
    const bull = cd.c >= cd.o;
    const col = bull ? "#3f9d68" : "#c25a54";
    const strk = bull ? "#63c98d" : "#e2827a";
    const bodyTop = y(Math.max(cd.o, cd.c));
    const bodyH = Math.max(2, Math.abs(y(cd.o) - y(cd.c)));
    const wickX = (x + bw / 2).toFixed(1);
    return `<line x1="${wickX}" y1="${y(cd.h).toFixed(1)}" x2="${wickX}" y2="${y(cd.l).toFixed(1)}" stroke="#d8b45f" stroke-width="1.6" stroke-linecap="round"/><rect x="${x.toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${bw}" height="${bodyH.toFixed(1)}" rx="2" fill="${col}" stroke="${strk}" stroke-width="1"/>`;
  }).join("");
  const notes = (opts.notes || []).map(nn => `<text x="${nn.x}" y="${nn.y}" fill="${nn.fill || "#e6c565"}" font-size="9" text-anchor="${nn.anchor || "middle"}" letter-spacing=".04em">${nn.t}</text>`).join("");
  const sig = opts.sig ? `<g>${opts.sig}</g>` : "";
  // structural extras for Chapter 5: horizontal level zones, diagonal lines (trendlines), arrows
  const levels = (opts.levels || []).map(lv => {
    const yy = y(lv.v).toFixed(1);
    const col = lv.color || "#c9a227";
    return `<line x1="${L}" y1="${yy}" x2="${W - R}" y2="${yy}" stroke="${col}" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.9"/><text x="${L + 4}" y="${(parseFloat(yy) - 5).toFixed(1)}" fill="${col}" font-size="8.5" letter-spacing=".06em">${lv.t || ""}</text>`;
  }).join("");
  const lines = (opts.lines || []).map(ln => `<line x1="${ln.x1}" y1="${y(ln.y1).toFixed(1)}" x2="${ln.x2}" y2="${y(ln.y2).toFixed(1)}" stroke="${ln.color || "#d8b45f"}" stroke-width="1.4" ${ln.dash ? "stroke-dasharray=\"5 4\"" : ""}/>`).join("");
  const arrows = (opts.arrows || []).map(ar => {
    const ax = ar.x, ay = y(ar.y).toFixed(1);
    const up = ar.dir === "up", down = ar.dir === "down", right = ar.dir === "right";
    const col = ar.color || "#e6c565";
    const path = right
      ? `M${ax} ${ay} L${ax + 22} ${ay} M${ax + 16} ${ay - 6} L${ax + 22} ${ay} L${ax + 16} ${ay + 6}`
      : up
        ? `M${ax} ${ay} L${ax} ${ay - 22} M${ax - 6} ${ay - 16} L${ax} ${ay - 22} L${ax + 6} ${ay - 16}`
        : `M${ax} ${ay} L${ax} ${ay + 22} M${ax - 6} ${ay + 16} L${ax} ${ay + 22} L${ax + 6} ${ay + 16}`;
    return `<path d="${path}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>${ar.t ? `<text x="${ax + (right ? 26 : 0)}" y="${(parseFloat(ay) + (up ? -26 : down ? 30 : 4)).toFixed(1)}" fill="${col}" font-size="8.5" text-anchor="${right ? "start" : "middle"}" letter-spacing=".05em">${ar.t}</text>` : ""}`;
  }).join("");
  return `<svg class="ch4-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.alt || "candlestick chart"}"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="8" fill="#14120c" stroke="rgba(201,162,39,0.28)"/>${grid}${levels}${lines}${candles}${notes}${arrows}${sig}</svg>`;
}

/* Chapter 6 psychology figures — same visual language as the candlesticks:
   dark card, gold strokes, one clear idea per figure. */
function psyFig(kind) {
  const W = 320, H = 140;
  const box = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="8" fill="#14120c" stroke="rgba(201,162,39,0.28)"/>`;
  const grid = [0, 35, 70, 105].map(g => `<line x1="14" y1="${g + 12}" x2="306" y2="${g + 12}" stroke="rgba(201,162,39,0.08)" stroke-width="1"/>`).join("");
  if (kind === "pendulum") {
    return `<svg class="ch4-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="the fear-greed pendulum swinging over the market">${box}${grid}
      <path d="M28 30 Q 160 108 292 30" fill="none" stroke="rgba(201,162,39,0.35)" stroke-width="1" stroke-dasharray="4 5"/>
      <line x1="160" y1="16" x2="160" y2="84" stroke="#e6c565" stroke-width="2" stroke-linecap="round"/>
      <circle cx="160" cy="92" r="10" fill="#14120c" stroke="#d8b45f" stroke-width="2"/>
      <circle cx="160" cy="92" r="4" fill="#d8b45f"/>
      <text x="44" y="26" fill="#c25a54" font-size="11" text-anchor="middle" letter-spacing=".14em" font-weight="700">FEAR</text>
      <text x="276" y="26" fill="#d8b45f" font-size="11" text-anchor="middle" letter-spacing=".14em" font-weight="700">GREED</text>
      <line x1="60" y1="112" x2="112" y2="112" stroke="rgba(194,90,84,0.6)" stroke-width="1.4"/>
      <line x1="208" y1="112" x2="260" y2="112" stroke="rgba(216,180,95,0.6)" stroke-width="1.4"/>
      <line x1="150" y1="128" x2="170" y2="128" stroke="#e6c565" stroke-width="2" stroke-linecap="round"/>
      <text x="160" y="134" fill="#e6c565" font-size="8.5" text-anchor="middle" letter-spacing=".1em">THE MARKET — BALANCE IS THE EDGE</text>
      <path d="M128 86 q 8 -8 16 0" fill="none" stroke="rgba(230,197,101,0.5)" stroke-width="1.2"/>
      <path d="M176 86 q 8 -8 16 0" fill="none" stroke="rgba(230,197,101,0.5)" stroke-width="1.2"/>
    </svg>`;
  }
  if (kind === "ladder") {
    return `<svg class="ch4-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="fixed risk, flexible reward ladder">${box}${grid}
      <rect x="26" y="78" width="104" height="38" rx="5" fill="rgba(194,90,84,0.10)" stroke="#c25a54" stroke-width="1.4"/>
      <text x="78" y="101" fill="#e6c565" font-size="9.5" text-anchor="middle" letter-spacing=".08em">RISK · 1R FIXED</text>
      <path d="M26 96 H 150" stroke="rgba(216,180,95,0.6)" stroke-width="1.2" stroke-dasharray="4 4"/>
      <rect x="158" y="88" width="44" height="28" rx="4" fill="rgba(216,180,95,0.10)" stroke="#d8b45f" stroke-width="1.2"/>
      <text x="180" y="106" fill="#d8b45f" font-size="9" text-anchor="middle">1R</text>
      <rect x="208" y="68" width="44" height="48" rx="4" fill="rgba(216,180,95,0.12)" stroke="#d8b45f" stroke-width="1.2"/>
      <text x="230" y="94" fill="#d8b45f" font-size="9" text-anchor="middle">2R</text>
      <rect x="258" y="48" width="44" height="68" rx="4" fill="rgba(216,180,95,0.15)" stroke="#e6c565" stroke-width="1.4"/>
      <text x="280" y="82" fill="#e6c565" font-size="9" text-anchor="middle">3R</text>
      <path d="M292 44 l 0 -18 M288 50 l 4 -6 4 6" fill="none" stroke="#e6c565" stroke-width="1.6" stroke-linecap="round"/>
      <text x="160" y="24" fill="#e6c565" font-size="8.5" text-anchor="middle" letter-spacing=".1em">RISK NEVER MOVES · REWARD CAN CLIMB</text>
    </svg>`;
  }
  // cycle — the emotional path of a trade vs the professional's flatline
  return `<svg class="ch4-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="the emotional cycle of a trade and the professional's flatline">${box}${grid}
    <path d="M26 96 C 60 62, 96 118, 140 84 S 216 26, 294 40" fill="none" stroke="#d8b45f" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="26" y1="70" x2="294" y2="70" stroke="#e6c565" stroke-width="1.4" stroke-dasharray="6 4" opacity="0.85"/>
    <text x="294" y="62" fill="#e6c565" font-size="8" text-anchor="end" letter-spacing=".06em">THE PRO'S FLATLINE — CALM THROUGHOUT</text>
    <circle cx="26" cy="96" r="4" fill="#e6c565"/>
    <text x="42" y="118" fill="#d8b45f" font-size="8.5" letter-spacing=".06em">ENTRY</text>
    <text x="150" y="118" fill="#c25a54" font-size="8.5" letter-spacing=".06em">DRAWDOWN</text>
    <text x="216" y="14" fill="#e6c565" font-size="8.5" letter-spacing=".06em">BREAKEVEN</text>
    <text x="272" y="22" fill="#d8b45f" font-size="8.5" letter-spacing=".06em">PROFIT</text>
    <circle cx="294" cy="40" r="4" fill="#d8b45f"/>
  </svg>`;
}

/* Chapter 7 risk figures — same dark-gold visual language. */
function riskFig(kind) {
  const W = 320, H = 140;
  const box = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="8" fill="#14120c" stroke="rgba(201,162,39,0.28)"/>`;
  const grid = [0, 35, 70, 105].map(g => `<line x1="14" y1="${g + 12}" x2="306" y2="${g + 12}" stroke="rgba(201,162,39,0.08)" stroke-width="1"/>`).join("");
  if (kind === "recovery") {
    // the brutal asymmetry: -50% takes +100% to recover
    return `<svg class="ch4-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="drawdown and recovery asymmetry">${box}${grid}
      <line x1="26" y1="16" x2="26" y2="124" stroke="rgba(201,162,39,0.3)" stroke-width="1"/>
      <text x="26" y="134" fill="#d8b45f" font-size="8" text-anchor="middle" letter-spacing=".08em">100%</text>
      <text x="26" y="96" fill="#c25a54" font-size="8" text-anchor="middle" letter-spacing=".08em">50%</text>
      <text x="26" y="46" fill="#9fe3bd" font-size="8" text-anchor="middle" letter-spacing=".08em">100%</text>
      <path d="M38 30 C 90 44, 150 88, 196 96" fill="none" stroke="#c25a54" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M196 96 C 240 56, 278 36, 304 30" fill="none" stroke="#d8b45f" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="196" cy="96" r="4" fill="#c25a54"/>
      <text x="196" y="112" fill="#f0a69e" font-size="8.5" text-anchor="middle" letter-spacing=".06em">-50%</text>
      <text x="252" y="20" fill="#e6c565" font-size="8.5" text-anchor="middle" letter-spacing=".06em">+100% BACK</text>
      <text x="160" y="126" fill="#e6c565" font-size="8" text-anchor="middle" letter-spacing=".1em">THE ASYMMETRY — LOSSES ARE STEEP, RECOVERY IS STEEPER</text>
    </svg>`;
  }
  // escalation — the three risk zones
  return `<svg class="ch4-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="risk escalation zones">${box}${grid}
    <rect x="26" y="70" width="82" height="40" rx="5" fill="rgba(159,227,189,0.08)" stroke="#9fe3bd" stroke-width="1.3"/>
    <text x="67" y="94" fill="#9fe3bd" font-size="9.5" text-anchor="middle" letter-spacing=".06em">1% THE ZONE</text>
    <rect x="120" y="70" width="82" height="40" rx="5" fill="rgba(212,175,55,0.08)" stroke="#d8b45f" stroke-width="1.3"/>
    <text x="161" y="94" fill="#d8b45f" font-size="9.5" text-anchor="middle" letter-spacing=".06em">3% THE EDGE</text>
    <rect x="214" y="70" width="80" height="40" rx="5" fill="rgba(220,90,90,0.10)" stroke="#c25a54" stroke-width="1.4"/>
    <text x="254" y="94" fill="#f0a69e" font-size="9.5" text-anchor="middle" letter-spacing=".06em">5%+ THE BLOW-UP</text>
    <path d="M67 118 v 8 M161 118 v 8 M254 118 v 8" stroke="#e6c565" stroke-width="1.4" stroke-linecap="round"/>
    <text x="160" y="26" fill="#e6c565" font-size="8.5" text-anchor="middle" letter-spacing=".1em">RISK PER TRADE — THREE ZONES, ONE RULE</text>
  </svg>`;
}

/* Chapter metadata.
   slides     — total slide count (from the PDFs)
   quizSlides — slide numbers that are interactive quiz questions (1-indexed)
   quiz       — question bank; null until the answer key is drafted + verified
*/
const CHAPTERS = [
  {
    id: 1, title: "The Forex Market", slides: 38,
    focus: "The market, the players, the mindsets",
    diff: 1, // foundation — concepts and vocabulary, no math
    mins: 60, // estimated completion time (reading + quiz)
    quizSlides: [28,29,30,31,32,33,34,35,36,37],
    quiz: [
      { q: "To be a good sentimental trader you need to trade with YOUR emotions.",
        options: ["True", "False"], answer: 1,
        explain: "Sentiment trading reads the crowd's emotions — not your own. Your feelings are the thing to control, not follow." },
      { q: "What defines a sentimental trader?",
        options: ["A trader that uses market investors' emotions to their advantage", "A trader that disregards analysis"], answer: 0,
        explain: "A sentiment (or sentimental) trader profits from the emotions driving the crowd, not from ignoring analysis." },
      { q: "What is the foreign exchange market?",
        options: ["A market that assists with the exportation of goods and services", "A global market for exchanging currencies"], answer: 1,
        explain: "Forex is the global, decentralised market where currencies are exchanged." },
      { q: "What is a fundamental trader?",
        options: ["Makes financial decisions based on trader sentiment", "Makes financial decisions based on company events and data"], answer: 1,
        explain: "Fundamental traders base decisions on economic events and data (GDP, interest rates, jobs reports)." },
      { q: "The markets are majorly impacted by political & economic events.",
        options: ["True", "False"], answer: 0,
        explain: "Politics and economics move markets — elections, rate decisions, and data releases shift sentiment and price." },
      { q: "A technical trader utilizes…",
        options: ["Charts and graphs to influence trading decisions", "Market sentiment to influence trading decisions"], answer: 0,
        explain: "Technical traders read price via charts, patterns, and indicators." },
      { q: "A swing trader…",
        options: ["Holds positions shorter than a day", "Holds positions longer than a day"], answer: 1,
        explain: "Swing trading holds positions from days to weeks — longer than a single day." },
      { q: "Which example ISN'T part of swing trading?",
        options: ["Holds positions for long periods of time", "Holds positions for short periods of time"], answer: 1,
        explain: "Short-period holding belongs to scalping or day trading — not swing trading." },
      { q: "A retail trader…",
        options: ["Trades securities for personal accounts", "Trades securities for financial institutions"], answer: 0,
        explain: "Retail traders trade their own personal accounts; institutions trade for funds and banks." },
      { q: "What resonates with scalping?",
        options: ["Slow-paced trading", "Fast-paced trading"], answer: 1,
        explain: "Scalping is the fastest style — seconds to minutes per trade." }
    ],
    native: [
      {
        eyebrow: "Chapter 1 · Introduction",
        title: "The Forex Market",
        lead: "Focal points in this chapter",
        body: [
          "You are about to learn the language and the players of the world's largest financial market. By the end of this chapter you will know what the forex market is, who trades in it, and which style of trader you want to become."
        ],
        callout: "Every lesson is a trade. Every trade is a lesson.",
        insight: "No need to pick a style today — this chapter simply shows you the options. The market will help you choose."
      },
      {
        eyebrow: "The market",
        title: "The Foreign Exchange Market",
        body: [
          "The foreign exchange market is a global, decentralized market for the trading of currencies. This market determines foreign exchange rates for every currency.",
          "It includes all aspects of buying, selling and exchanging currencies at current or determined prices."
        ],
        bullets: [
          "In forex, currencies are traded in pairs. Each pair has a base currency and a quote currency.",
          "When you exchange currencies, you are essentially buying one currency and selling another."
        ],
        example: "If you believe the euro will rise against the US dollar, you buy EUR/USD — buying euros and selling an equivalent amount of dollars. If the rate rises as you expect, you sell the euros back for a profit.",
        insight: "Did you know? EUR/USD is the most traded pair in the world — roughly a fifth of all forex volume flows through it."
      },
      {
        eyebrow: "The market",
        title: "Both Sides of the Market",
        body: [
          "If you believe the euro will FALL against the dollar, you sell EUR/USD — selling euros and buying an equivalent amount of US dollars. If the rate falls as you expect, you buy the euros back at a lower price, profiting on the transaction."
        ],
        bullets: [
          "The forex market allows participants — banks and individuals — to buy, sell or exchange currencies for two purposes:",
          "Hedging — buying and selling to minimize risk",
          "Speculation — profiting from price change"
        ],
        insight: "Most retail traders speculate — and there's nothing wrong with that. Just know, on every trade, which one you are."
      },
      {
        eyebrow: "The players",
        title: "The Traders You'll Meet",
        body: [
          "Noise trading — typically non-professional individuals who act illogically, using incomplete or inaccurate data to make trades. As the name suggests, they may execute trades off rumours. As trading has become more popular and easier, their numbers have spiked exponentially.",
          "Market timers — a strategy of buying or selling based on predictive methods that seek to forecast the future price movement of an underlying asset. Common methods include fundamental data, technical data, and economic data."
        ],
        insight: "Noise traders create the short-term chaos. Your job isn't to join them — it's to profit from the clarity when they panic.",
        styles: {
          scalper: "You'll meet the noise traders inside every 1-minute bar you trade. Your edge: trade the structure, never the rumour — and never be the panic seller they feed on.",
          day: "Noise trading spikes at the open and close — the exact windows you trade. Filter the rumour, trade the bias.",
          swing: "Market timers chase every prediction; you ride the daily structure. The noise that shakes them is your entry window.",
          position: "Noise traders and timers are the waves — you're the tide. Fundamentals decide where you're headed; the noise only tells you when it's choppy."
        }
      },
      {
        eyebrow: "The players",
        title: "Institutional vs Retail",
        body: [
          "Institutional traders buy and sell securities for the accounts they manage for a group or institution, as well as exchange-traded funds (ETFs).",
          "Retail traders — often called individual traders — trade with their own equity, funded from personal wealth rather than on behalf of an institution."
        ],
        lead: "Types of equity traders",
        bullets: [
          "Scalping — a style that specializes in profiting off small price changes for a fast profit. It is a heightened-pace style in which the trader opens multiple positions."
        ],
        insight: "Institutions and retail traders both win and lose. Your edge is never the size of your account — it's the quality of your process."
      },
      {
        eyebrow: "The styles",
        title: "Momentum, Technical, Fundamental, Swing",
        bullets: [
          "Momentum trading — traders seek stocks moving significantly in one direction on high volume (a trend) and ride that momentum to the desired profit.",
          "Technical traders — they focus on charts and graphs, analysing lines for signs of convergence or divergence that might indicate buy or sell signals.",
          "Fundamental trading — traders base decisions on corporate events, particularly actual or anticipated earnings reports, stock splits, reorganizations, or acquisitions.",
          "Swing trading — holding positions longer than a day."
        ],
        insight: "Styles aren't prisons. Many traders start as scalpers and graduate into swing trading as their patience matures.",
        styles: {
          scalper: "For you, momentum is everything — you're trading the exact bars where momentum ignites. This card is your native language.",
          day: "Your morning bias is built on technical structure; momentum confirms your entries inside the session. Two tools, one plan.",
          swing: "This card is your chapter in miniature: momentum picks the direction, your patience holds through the noise.",
          position: "Momentum is your exit, not your entry — fundamentals decide the trade, momentum only tells you when to take it."
        }
      },
      {
        eyebrow: "The styles",
        title: "Day Traders & Position Traders",
        body: [
          "Day traders pick a side at the beginning of the day, acting on their bias, and finish the day with either a profit or a loss. They never hold trades overnight.",
          "Position traders hold trades for weeks, months, or even years. They know fundamental themes will be the predominant factor when analysing the markets, and they base their decisions on them."
        ],
        callout: "Most fundamentalists are really swing traders — changes in corporate fundamentals typically take days or even weeks to produce a price movement sufficient for a reasonable profit.",
        insight: "Read that callout twice — it saves years of confusion about which style you're actually trading.",
        styles: {
          scalper: "Even faster than day traders — where they close flat at the day's end, you close in minutes. Your market is the 1m–5m structure inside this card's words.",
          day: "This card is your mirror: bias at the open, flat by the close. Every rule written here is a rule you'll live by daily.",
          swing: "You sit between the two: longer than a day, but not a pure fundamentalist. Your structure lives on the 4H and daily charts.",
          position: "The position trader described here is you — weeks to months, driven by themes. Read the callout as confirmation, not warning."
        }
      },
      {
        kind: "poll",
        eyebrow: "Your identity",
        title: "What kind of trader do you want to be?",
        sub: "Choose what resonates today. This is your starting identity — it will evolve with experience, and the OS will tailor your lessons around it.",
        options: ["Scalper", "Day Trader", "Swing Trader", "Position Trader"]
      },
      {
        eyebrow: "Your identity",
        title: "Keep an Open Mind",
        body: [
          "Your style is not permanent. As you experience the market, your edge will reveal itself — and many great traders combine styles over time.",
          "For now, hold your choice lightly and stay curious through this course."
        ],
        insight: "Consistency beats intensity. The trader who shows up daily — even for 20 minutes — compounds faster than the one who binges.",
        styles: {
          scalper: "Your style is a sprint, but this course still builds your foundation — the best scalpers understand the higher timeframes their entries live inside.",
          day: "Hold your identity lightly: many day traders become swing traders the day they discover the daily chart does the work for them.",
          swing: "You've chosen a patient style — this course rewards exactly that patience. Let it compound.",
          position: "You've chosen the longest view — the fundamental chapters ahead will be your favourite reads. Stay curious anyway."
        }
      },
      {
        eyebrow: "The market",
        title: "The Market That Never Sleeps",
        body: [
          "Forex trades 24 hours a day, five days a week — from the Sydney open on Monday to the New York close on Friday. When one financial centre closes, another opens, and somewhere in the world a market is always alive.",
          "Four sessions rotate across the globe — Sydney, Tokyo, London, New York — and their overlaps are where the market moves with purpose."
        ],
        bullets: [
          "The trading day starts in Sydney, flows through Tokyo, wakes up properly in London, and climaxes in New York.",
          "The London–New York overlap (around midday GMT) carries the highest volume — and the cleanest, most reliable moves.",
          "Quiet sessions trade tight ranges; major news can ignite any session instantly."
        ],
        insight: "You don't need to trade every session — you need to find YOUR session. Professionals don't trade when they're free; they trade when the market is at its best.",
        styles: {
          scalper: "Volume and volatility are your oxygen — the London–New York overlap is where your fastest moves live. Trade the sessions that move.",
          day: "Your whole day is decided in its first hours: open bias at London, execution into the New York open.",
          swing: "Sessions matter less than the daily close — a swing trader reads the week's rhythm, not the minute's noise.",
          position: "Sessions are just weather to you — fundamentals decide the destination; the daily close tells you the tide."
        }
      },
      {
        eyebrow: "The story",
        title: "How Modern Forex Was Born",
        body: [
          "For most of modern history, currencies were pinned to gold. The Bretton Woods system, born after the Second World War, fixed exchange rates and made international trade predictable — and boring.",
          "In 1971 that system collapsed and the world's currencies began to float. Banks suddenly needed a way to exchange them constantly — and the foreign exchange market as we know it was born."
        ],
        bullets: [
          "Before 1971, exchange rates barely moved. After it, they breathed — rising and falling every single day.",
          "That breathing is the opportunity. Volatility is the market's heartbeat, and every heartbeat is a price a trader can read.",
          "Forex is the youngest major market on Earth — it was born out of change, not stability."
        ],
        insight: "You are trading in a market created by the collapse of an old system. The traders who win are the ones who read change — instead of fearing it."
      },
      {
        eyebrow: "The scale",
        title: "The $7.5 Trillion Room",
        body: [
          "Every working day, more than $7.5 trillion changes hands in the foreign exchange market — roughly $87 million every single second. That is larger than every stock exchange on Earth combined.",
          "Why does that matter to you? Liquidity. In a market this deep, you can enter and exit almost any position, almost instantly, in almost any size — and no single player can corner it."
        ],
        bullets: [
          "The New York Stock Exchange trades roughly $30–40 billion a day. Forex trades $7.5 trillion.",
          "You are a minnow swimming in an ocean — which sounds intimidating, until you realise the ocean can't be moved against you.",
          "Deep markets punish manipulation. Your protection as a small trader is the market's sheer size."
        ],
        insight: "Most people never grasp the scale of the room they're trading in. When you finally understand it, you stop trying to outguess the market — and start reading it."
      },
      {
        eyebrow: "The truth",
        title: "Who's on the Other Side of Your Trade",
        body: [
          "Every trade has two sides. When you buy EUR/USD, someone is selling it to you — and understanding who that someone is changes how you think about every position you ever take.",
          "The other side is usually a market maker or liquidity provider — a bank or institution standing ready to fill orders at quoted prices. They profit on the spread and the flow, not on hoping you lose."
        ],
        bullets: [
          "Institutions trade in millions; you trade in thousands. You are never competing with them head-on — you're riding the same ocean.",
          "The real edge is not beating the market — it's refusing to be the weakest trader at the table.",
          "When your stop is hit, someone else took your risk. That's the business — make sure you're managing it, not being managed by it."
        ],
        insight: "You never see the other side of your trade — but it's always there. Trade as if a professional stands opposite you, because statistically, one does.",
        styles: {
          scalper: "Every scalper's fill is matched by an institution's liquidity. Your tiny size is your superpower — you can slip in and out where they can't.",
          day: "Day traders trade against the session's flow — your discipline decides whether you're the smart money or the exit liquidity.",
          swing: "The other side of a swing trade is often a market maker hedging, not a trader with an opinion. Structure, not panic, wins that exchange.",
          position: "Your position's other side is frequently a corporation hedging real currency exposure — which is why fundamentals, not noise, decide your outcome."
        }
      },
      {
        eyebrow: "The mechanism",
        title: "The Money Trail: From Your Click to the Market",
        body: [
          "The moment you click buy, your order doesn't shout into the void — it travels a specific path. Your broker receives it, hedges it or passes it to a liquidity provider, and the fill returns to you in milliseconds.",
          "Some brokers keep your flow internally (market makers); others route it to the interbank market (ECN/STP). Neither is evil — but knowing your broker's model explains how you get filled and what you pay."
        ],
        bullets: [
          "Market maker: your broker takes the other side of your trade internally.",
          "ECN/STP: your order is matched against real liquidity providers and other participants.",
          "Your job isn't to obsess over the plumbing — it's to know your costs and your broker's model before you fund an account."
        ],
        insight: "The market doesn't care about your broker's model. But your edge does — know the plumbing so the spread never silently drains you."
      },
      {
        eyebrow: "The industry",
        title: "The Five Myths the Industry Sells",
        body: [
          "Forex is one of the most aggressively marketed spaces on the internet. Before you trust any promise, run it against these five myths — because the people selling them rarely trade themselves."
        ],
        bullets: [
          "Myth 1 — 'Get rich quick.' Real traders think in months and years, not days. Anyone promising overnight wealth is selling the dream, not the skill.",
          "Myth 2 — 'Signal groups.' If someone had a signal that worked, they wouldn't sell it — they'd trade it quietly and get rich slowly.",
          "Myth 3 — 'Set-and-forget robots.' There is no free-lunch algorithm; most EAs die the moment the market changes character.",
          "Myth 4 — '100% win rate.' A perfect record is a lie or a tiny sample. Professionals win less than half their trades and still make money.",
          "Myth 5 — 'You just need the right indicator.' Indicators read price; they don't replace judgment. The edge is the trader, not the tool."
        ],
        insight: "Every myth sells you certainty. The market sells uncertainty — professionals buy it cheaply and manage it well.",
        styles: {
          scalper: "Scalpers are the biggest targets of EA and signal marketing — your style is speed, not surrender of control.",
          day: "'One trade a day' promises ignore that your style already needs patience — don't let a sales pitch rush your session.",
          swing: "Swing traders get sold 'weekly signals' — you already have the patience; you don't need the subscription.",
          position: "'Set and forget' marketing oversimplifies — position trading still demands a thesis, a risk plan, and an exit."
        }
      },
      {
        eyebrow: "The cost",
        title: "Why 'Free' Brokers Aren't Free",
        body: [
          "No broker works for nothing. If you're not paying a commission, you're paying through the spread — the difference between the buy and sell price, which the broker keeps.",
          "Zero-commission marketing isn't a lie; it's a shift in where the cost hides. The honest question is never 'is it free?' — it's 'what am I really paying, and is the execution worth it?'"
        ],
        bullets: [
          "Spread: the built-in cost of every trade — wider on quiet pairs and during major news.",
          "Commission: an explicit fee per trade on raw-spread accounts.",
          "Swap: the overnight interest charged or paid on open positions.",
          "Your real job isn't finding the 'free' account — it's knowing your costs and sizing them into your plan."
        ],
        insight: "Trading costs are like rain on a walk — you can't stop it, but you can dress for it. Spreads and commissions are part of every trade you'll ever take; plan for them from trade one."
      },
      {
        eyebrow: "The routine",
        title: "A Day in the Life of a Professional",
        body: [
          "The professional's day looks nothing like the fantasy — no Lamborghini, no one-hour workdays. It looks like a routine: preparation before the market opens, a plan for the session, disciplined execution, and review after the close.",
          "A typical day: study the news and higher timeframes in the morning, set levels and alerts, trade the defined window, journal every decision, and close the day with a review — win or lose."
        ],
        bullets: [
          "Preparation is the trade. The entry is just the execution of a decision made hours earlier.",
          "Professionals trade a routine, not a mood. If you're not prepared, you're not trading — you're gambling.",
          "The review is where improvement lives. The trade is the exam; the journal is the class."
        ],
        insight: "Boring is the point. The most profitable traders are the most boring — the same routine, every day, for years. Excitement is what retail pays for; routine is what professionals get paid for.",
        styles: {
          scalper: "Your 'day' is a series of short windows — pre-market prep decides whether those windows are filled with plans or impulses.",
          day: "Your routine IS your edge: same hours, same pairs, same rules. The day trader who wings it is the day trader who gives it back.",
          swing: "Your day is lighter — but the daily close check and the weekly review are non-negotiable.",
          position: "Your routine is quarterly: thesis review, risk review, and patience. The market rewards your calendar."
        }
      },
      {
        eyebrow: "The mindset",
        title: "The First Rule of the Room",
        body: [
          "There is a rule every professional learns the hard way: nobody is coming to save you. No signal service, no broker, no magic mentor, no 'sure thing' — the moment you expect rescue, you stop learning to swim.",
          "The people who make it own their results completely — the wins and the losses. They study, they size risk, they journal, and they show up tomorrow. That ownership is the entire difference."
        ],
        bullets: [
          "Your account is your classroom. Every loss is tuition — make sure you attend the lesson.",
          "Blame is expensive. Ownership is cheap. Choose the currency that pays.",
          "The market is the greatest teacher ever built — but it fails every student who refuses to do the homework."
        ],
        insight: "Insider information doesn't come from a leak — it comes from paying attention to what everyone else ignores: your own process. Own it, and you're already ahead of most of the room.",
        styles: {
          scalper: "In the fast lane there's no time to wait for rescue — your reflex discipline is the lifeline.",
          day: "The day closes with your P&L and your decisions. Own both, and tomorrow is already better.",
          swing: "Swing traders learn ownership over weeks — every held position is a choice you made, not a fate you suffered.",
          position: "You own the thesis, the entry, the risk, and the exit — the long game belongs to those who take full responsibility."
        }
      },
      {
        eyebrow: "The reality",
        title: "Why Most Retail Traders Lose",
        body: [
          "The uncomfortable truth: most retail traders lose money over time. Not because the market is rigged — but because most enter it with the wrong habits, the wrong size, and the wrong expectations.",
          "The losses rarely come from bad analysis. They come from no risk plan, over-leveraged positions, revenge trading after a loss, and quitting before a working system has time to deliver."
        ],
        bullets: [
          "Losing is part of the business — the question is whether you survive the losing streaks long enough to reach the winning ones.",
          "Most blown-up accounts aren't killed by one bad trade — they're killed by one bad trade made far too big.",
          "Knowledge without discipline is just entertainment."
        ],
        insight: "This course won't make losses disappear. It will teach you to make them small, learnable, and survivable — that is the entire difference between a professional and a gambler.",
        styles: {
          scalper: "For scalpers the trap is overtrading — more trades, more commissions, more mistakes. Fewer, higher-quality entries win.",
          day: "Day traders die from revenge trades after lunch. A loss is information, not an invitation to get even.",
          swing: "Swing traders get killed by impatience — entering before the setup completes. The market pays those who wait.",
          position: "Position traders lose slowly when they ignore the fundamentals and trade the noise — your edge is the long view, so keep it."
        }
      },
      {
        eyebrow: "The path",
        title: "The Trader's Journey",
        body: [
          "Every trader walks the same road. First comes the excitement — new strategies, quick wins, a feeling of invincibility. Then reality arrives: losses, confusion, and the urge to chase or quit.",
          "Those who persist reach the stage that matters — discipline. Systems are followed even when they're boring. Losses are expected and managed. Then, slowly, consistency appears."
        ],
        bullets: [
          "Anticipation → Excitement → Disappointment → Discipline → Consistency. There are no shortcuts — only people who believe they've found them.",
          "The traders who fail are rarely the least talented. They're the ones who quit during the disappointing phase.",
          "Wherever you are on this road right now — it's normal. The goal is to move through it faster and safer, not to skip it."
        ],
        insight: "This course is built around the journey, not around tricks. Every chapter moves you one honest step toward discipline.",
        styles: {
          scalper: "Scalpers hit the disappointment phase hardest and fastest — the speed of your style compounds mistakes. Slow down to speed up.",
          day: "Your journey will be decided in the first hundred days. Protect them with small size and a journal.",
          swing: "The swing journey rewards patience early — you'll feel the discipline phase sooner than most. Let it compound.",
          position: "Your journey is measured in quarters, not days. Discipline becomes a lifestyle, not a phase."
        }
      },
      {
        eyebrow: "The foundation",
        title: "Risk First: The Habit That Keeps You Alive",
        body: [
          "Before you learn one more strategy, decide how much you're willing to lose on any single trade. Professionals think in percentages, not in what they could make. A trade only exists if its risk is acceptable first.",
          "The rule that separates survivors from the rest: risk a small, fixed percentage of your account per trade — and never move your stop further away to avoid taking a loss."
        ],
        bullets: [
          "Decide the risk before you enter. If the trade fails, the loss was already decided, accepted, and affordable.",
          "Small losses are tuition. Large losses are dropouts.",
          "You cannot be a good trader with a broken account — protecting capital is always job one."
        ],
        insight: "The market rewards patience and punishes desperation. Risk management is the difference between a bad week and a dead account. Chapter 7 is devoted to it — but the habit starts now.",
        styles: {
          scalper: "For scalpers the risk creeps up trade by trade — a dozen small overshoots become a real hole. Cap every trade, every session.",
          day: "Your enemy is the single oversized trade after a string of wins. Bank the wins; never size up out of confidence.",
          swing: "Swing traders must survive the stop-outs between winners — a fixed percentage keeps you alive for the trade that pays the week.",
          position: "Position risk is decided in the thesis, not the chart — know exactly what invalidates the idea before you enter."
        }
      },
      {
        eyebrow: "The plan",
        title: "Your First 90 Days",
        body: [
          "Success in trading is built in seasons, not moments. For your first 90 days the goal is not profit — it's building the habits that make profit possible later.",
          "Study the course at a steady pace, take notes, and give every concept time to settle before moving on. Slow is smooth; smooth is fast."
        ],
        bullets: [
          "Weeks 1–4: build the foundations — the market, terminology, candlesticks, and market movement.",
          "Weeks 5–8: add risk management and psychology, and start observing charts with the eyes you've built.",
          "Weeks 9–13: deepen technical analysis and practise on a demo account before a single real rand is risked."
        ],
        insight: "A 90-day foundation beats a 90-day lottery ticket. Treat the first three months as training and the market will treat you as a professional.",
        styles: {
          scalper: "Give yourself the full 90 days even though scalping feels fast — the foundation decides whether your speed survives.",
          day: "Use the 90 days to build a routine: same hours, same process, same journal. Day trading is a profession of habits.",
          swing: "Your first swing winners may take weeks to appear — the 90-day plan keeps you consistent until they do.",
          position: "Your first position trade may be entered in week 2 and judged in month 3. The plan honours that rhythm."
        }
      },
      {
        kind: "pause",
        eyebrow: "Pause point",
        title: "Pause & Breathe",
        body: [
          "You've just absorbed a lot — and the brain learns best when it's given room to process. This pause is part of the method, not a break from it.",
          "Step back from the screen. Breathe in for four, hold for four, out for four. Stretch, walk for a minute, and let the ideas settle before you continue."
        ],
        sub: "Optional — take 60 seconds, then continue whenever you're ready.",
        insight: "Professionals guard their focus like capital. The trader who pauses to process compounds faster than the one who never stops."
      },
      {
        eyebrow: "The mindset",
        title: "The Numbers Behind Success",
        body: [
          "Professional traders don't need to be right all the time. A trader who wins 40% of trades can still be very profitable when the winners are larger than the losers and risk stays controlled.",
          "This is what having an edge means — a statistical advantage that plays out over hundreds of trades, not a magic method that wins every time."
        ],
        bullets: [
          "One trade proves nothing. A hundred trades reveal the truth about your system.",
          "The goal is not a perfect record — it's a positive expectancy over many trades with controlled risk.",
          "That's why this course teaches process over prediction: the outcome of one trade is luck; the outcome of a process is a result."
        ],
        insight: "Judge yourself on the process, not on any single outcome. Get the process right, and the numbers take care of themselves.",
        styles: {
          scalper: "You play the most trades — your edge shows itself fastest, and your discipline shows itself soonest. Track every one.",
          day: "A 45% win rate with a good risk-reward keeps day traders profitable — never judge a strategy on one day.",
          swing: "Fewer trades means each one carries more weight — your edge compounds over months, not mornings.",
          position: "Your edge plays out over quarters. Judge a position trade by the thesis and the risk, never by the week's mark-to-market."
        }
      },
      {
        eyebrow: "The habit",
        title: "Journal Like a Professional",
        body: [
          "The most underrated tool in trading is a journal. Every trade — the setup, the reasoning, the emotion, the result — written down and reviewed.",
          "A journal turns experience into education. Without it, you repeat the same mistakes for years and call it learning."
        ],
        bullets: [
          "Record every trade: setup, entry, exit, risk, result — and how you felt while holding it.",
          "Review weekly: what worked, what didn't, and what you'll do differently.",
          "Your journal is the mirror your memory politely edits."
        ],
        insight: "The OS will soon include a built-in trade journal — but start the habit now, even on paper. The habit matters more than the tool."
      },
      {
        eyebrow: "The method",
        title: "How to Study This Course",
        body: [
          "This isn't a course you watch — it's a course you do. Every chapter follows the Reality FX method: Learn the concept, Experience it on the charts, and Reflect on what it means for your trading.",
          "Read every slide slowly. Take one line of notes per slide. When you reach a quiz, treat it like an exam — your certificate depends on it."
        ],
        bullets: [
          "Pace yourself: one or two chapters a week beats rushing all thirteen in a weekend.",
          "Use the reflection windows for real revision — the read-only review exists to help you pass, not to make you wait.",
          "Quiz mistakes are data, not failure. The OS records them so your next attempt is smarter."
        ],
        insight: "From here, the discipline you bring is the edge you build. No one can hand you consistency — only the system that develops it."
      },
      {
        eyebrow: "Before the quiz",
        title: "The Trader's Checklist",
        body: [
          "Before the quiz, make sure you can answer these out loud: What is the foreign exchange market? Who are its players? What are the trading styles — and how do retail and institutional traders differ?",
          "If you can explain each in your own words, you're ready. If not, go back and re-read — the quiz is next, and it counts."
        ],
        bullets: [
          "The market: global, decentralised, always trading in currency pairs.",
          "The players: institutions, retail traders, noise traders, and market timers.",
          "The styles: scalping, day, swing, position — plus fundamental and technical approaches.",
          "Your identity: the style you chose is now tailoring your lessons."
        ],
        insight: "Explaining a concept in your own words is the fastest proof you truly understand it."
      },
      null, null, null, null, null, null, null, null, null, null,
      {
        kind: "close",
        eyebrow: "Chapter complete",
        title: "You Know the Market",
        body: [
          "You now know the market, its players, its rhythms, and the habits that keep traders alive in it. You've seen why most retail traders lose — and the path the disciplined take instead.",
          "You've just answered its first test. Hit finish to see how you did — pass and Chapter 2: Fx Terminology & Concepts, the exact language of the charts, unlocks."
        ]
      }
    ]
  },
  {
    id: 2, title: "Fx Terminology & Concepts", slides: 55,
    focus: "The language of trading — pips, lots, leverage",
    diff: 2, // vocabulary + light math (pips, lots, leverage, margin)
    mins: 75, // estimated completion time (reading + quiz)
    quizSlides: [23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55],
    quiz: [
      { q: "What is a derivative?",
        options: ["A contract", "An asset", "An index fund"], answer: 0,
        explain: "A derivative is a financial contract whose value derives from an underlying asset." },
      { q: "Bullish refers to…",
        options: ["A decrease in price", "An increase in price", "Neutrality (a balance in price)"], answer: 1,
        explain: "Bullish = expecting price to rise." },
      { q: "Bearish refers to…",
        options: ["An increase in price", "Neutrality (a balance in price)", "A decrease in price"], answer: 2,
        explain: "Bearish = expecting price to fall." },
      { q: "Tom went long on EUR/USD. This means…",
        options: ["He bought the currency", "He sold the currency", "He lent the currency"], answer: 0,
        explain: "Going long means buying the base currency (EUR), expecting it to appreciate." },
      { q: "Tom went short on EUR/USD. This means…",
        options: ["He bought the currency", "He sold the currency", "He lent the currency"], answer: 1,
        explain: "Going short means selling the base currency, expecting it to depreciate." },
      { q: "Which option relates to candlesticks?",
        options: ["The highest price in a given period for a stock/currency", "The lowest price in a given period for a stock/currency", "A price chart"], answer: 2,
        explain: "Candlesticks are a style of price chart." },
      { q: "Which is the quickest timeframe of the following?",
        options: ["Daily", "Hourly", "Minute"], answer: 2,
        explain: "The minute chart is the fastest timeframe." },
      { q: "Which is the slowest timeframe of all the options?",
        options: ["Hourly", "Daily", "Minute"], answer: 1,
        explain: "The daily chart is the slowest (longest) timeframe." },
      { q: "Which is the quickest and the slowest timeframe?",
        options: ["Minute / Daily", "Daily / Minute", "Hourly / Minute"], answer: 0,
        explain: "Minute = quickest, Daily = slowest." },
      { q: "Which is the slowest and the quickest timeframe?",
        options: ["Minute / Daily", "Hourly / Minute", "Daily / Minute"], answer: 2,
        explain: "Daily = slowest, Minute = quickest." },
      { q: "Which timeframe resonates with a scalp trader?",
        options: ["Hourly", "Minutes"], answer: 1,
        explain: "Scalpers live on the minute charts." },
      { q: "Which timeframe resonates with a swing trader?",
        options: ["Daily", "Minutes"], answer: 0,
        explain: "Swing traders work from daily charts." },
      { q: "Which is the smallest metric measurement of price?",
        options: ["Point", "Tick", "Both"], answer: 1,
        explain: "A tick is the smallest possible price movement; a point is a larger unit made of ticks." },
      { q: "A share price increase of $155 to $219 would indicate a difference of…",
        options: ["64 points", "5 points", "50 points"], answer: 0,
        explain: "219 − 155 = 64 points. Don't guess — calculate." },
      { q: "A pip increase from 17.523 to 17.900 would indicate a difference of…",
        options: ["80 pips", "180 pips", "377 pips"], answer: 2,
        explain: "17.900 − 17.523 = 0.377 = 377 pips on a 5-decimal quote." },
      { q: "A share price decrease of $110 − $59 would indicate a difference of…",
        options: ["-51 points", "30 points", "77 points"], answer: 0,
        explain: "59 − 110 = −51 points (a decrease)." },
      { q: "A pip decrease from 16.211 to 15.911 would indicate a difference of…",
        options: ["150 pips", "-300 pips", "100 pips"], answer: 1,
        explain: "15.911 − 16.211 = −0.300 = −300 pips." },
      { q: "I went long on USD/JPY, which means I'm expecting…",
        options: ["The base currency to appreciate in value", "The pair currency to depreciate in value", "The base currency to depreciate in value"], answer: 0,
        explain: "Long = buy the base (USD); you expect USD to appreciate against JPY." },
      { q: "I went short on USD/JPY, which means I'm expecting…",
        options: ["The base currency to depreciate in value", "The pair currency to appreciate in value", "The pair currency to depreciate in value"], answer: 0,
        explain: "Short = sell the base (USD); you expect USD to depreciate." },
      { q: "Which units represent a micro lot?",
        options: ["100 000", "10 000", "1000"], answer: 2,
        explain: "Micro lot = 1,000 units (1% of a standard lot)." },
      { q: "Which units represent a mini lot?",
        options: ["100 000", "10 000", "1000"], answer: 1,
        explain: "Mini lot = 10,000 units (10% of a standard lot)." },
      { q: "Which units represent a standard lot?",
        options: ["100 000", "10 000", "1000"], answer: 0,
        explain: "Standard lot = 100,000 units." },
      { q: "Leverage is basically…",
        options: ["A loan", "The use of borrowed funds to increase one's trading position", "The use of personal funds to increase one's trading position"], answer: 1,
        explain: "Leverage is trading with borrowed capital to control a larger position." },
      { q: "Margin is basically…",
        options: ["A security deposit that a broker holds during trades", "The amount of money owed to a broker", "Amount of money donated to a broker"], answer: 0,
        explain: "Margin is the collateral your broker holds to cover open positions." },
      { q: "View margin as…",
        options: ["Donation", "Collateral", "Surplus funds"], answer: 1,
        explain: "Margin = collateral — it locks up funds, it isn't lost or donated." },
      { q: "Fundamental analysis is basically…",
        options: ["The use of future trading activity to predict past price changes", "The use of economic indicators to predict past price changes", "The use of past trading activity to predict future price changes"], answer: 2,
        explain: "Analysis uses known data to project what happens next." },
      { q: "Technical analysis is basically the study of…",
        options: ["How price moves", "What moves price", "Both"], answer: 0,
        explain: "Technical analysis studies HOW price moves (charts); fundamental analysis studies WHAT moves price." },
      { q: "Fundamental analysis is breaking down the impact of…",
        options: ["Past social factors in relation to a currency", "Political & economic data in relation to a currency", "Both"], answer: 1,
        explain: "Fundamentals = political & economic data affecting a currency." },
      { q: "Confluence contributes to…",
        options: ["Accuracy", "Technical analysis", "Fundamental analysis"], answer: 0,
        explain: "Confluence — multiple signals agreeing — raises the accuracy of a setup." },
      { q: "Volatility affects…",
        options: ["Profits", "Losses", "Profits & losses"], answer: 2,
        explain: "Volatility cuts both ways — bigger moves mean bigger profits AND bigger losses." },
      { q: "A currency pair is considered liquid when it can be…",
        options: ["Bought & sold easily", "Bought & sold safely", "Bought & sold conservatively"], answer: 0,
        explain: "Liquidity = how easily an asset is bought or sold without moving its price." },
      { q: "Commodities are in which sector?",
        options: ["Secondary", "Primary", "Tertiary"], answer: 1,
        explain: "Raw materials (gold, oil, grains) belong to the primary sector." },
      { q: "Indices are basically a group of…",
        options: ["Currencies in one index", "Commodities in one index", "Companies in one index"], answer: 2,
        explain: "An index bundles companies (e.g. the S&P 500) into one tradable figure." }
    ],
    native: [
      {
        eyebrow: "Chapter 2 · The language",
        title: "The Language of the Charts",
        lead: "Focal points in this chapter",
        body: [
          "Every profession has a language. A doctor reads a chart differently because she knows what each line means; a pilot speaks in headings and altitudes. Trading is the same — until you own the vocabulary, the market is just noise with numbers attached.",
          "This chapter gives you the words professionals think in: pairs, pips, lots, leverage, margin, and the two schools of analysis. By the end you'll read a quote the way a professional does."
        ],
        callout: "Every lesson is a trade. Every trade is a lesson.",
        insight: "Terminology isn't decoration — it's compression. Each term packs a paragraph of meaning into one word, so your brain can think faster than the market moves."
      },
      {
        eyebrow: "The building blocks",
        title: "The Anatomy of a Currency Pair",
        body: [
          "Currencies always trade in pairs — you buy one currency and sell another at the same moment. The first currency is the base; the second is the quote. The price tells you how much of the quote currency one unit of the base costs."
        ],
        bullets: [
          "Base currency: the first in the pair — the one you're buying or selling.",
          "Quote currency: the second — the one you're priced in.",
          "When the pair's price rises, the base is getting stronger against the quote."
        ],
        example: "EUR/USD at 1.0850 means one euro buys 1.0850 US dollars. If you believe the euro will strengthen, you buy EUR/USD — buying euros, selling dollars.",
        insight: "The pair is a tug of war. Every tick is the market deciding which currency is winning — your job is to pick the winner."
      },
      {
        eyebrow: "The two prices",
        title: "Bid, Ask & The Spread: The Two Prices on Every Screen",
        body: [
          "Every currency pair has two prices at all times: the bid, which is what buyers will pay, and the ask, which is what sellers demand. You sell at the bid and buy at the ask — and the gap between them is the spread, the market's built-in cost."
        ],
        bullets: [
          "Bid: the price at which you can SELL (what the market will pay you).",
          "Ask: the price at which you can BUY (what the market demands from you).",
          "Spread: the distance between them — the cost of trading, and how the broker earns."
        ],
        insight: "A tight spread on a major pair like EUR/USD is a few pips — on exotic pairs it can be a highway. Know the toll before you enter.",
        styles: {
          scalper: "The spread is your payroll tax — across dozens of trades a day it decides whether scalping is profitable or just busy.",
          day: "You pay the spread on every entry and exit — a few pips of slippage per trade is a day's edge silently leaking.",
          swing: "One spread per position matters less to you — but a wide spread on your pair is still a reason to pass.",
          position: "Spread is noise on your timeframe — but the bid/ask tells you where the real liquidity sits."
        }
      },
      {
        eyebrow: "The contract",
        title: "What Is a Derivative?",
        body: [
          "A derivative is a financial contract whose value derives from an underlying asset — a currency, a commodity, a share, an index. You are not buying the asset itself; you are trading a contract priced off it."
        ],
        bullets: [
          "Forex itself is a derivative market — you trade price movements of currencies, not physical banknotes.",
          "Futures, options and CFDs are all derivatives — their value depends on something underneath.",
          "This is why you can profit from BOTH rising and falling markets — the contract doesn't require owning the thing."
        ],
        insight: "The derivative is the shadow of the asset — and shadows are easier to trade than the objects that cast them. You never carry the barrel of oil; you trade its price."
      },
      {
        eyebrow: "The direction",
        title: "Bullish & Bearish: Reading the Market's Mood",
        body: [
          "The market speaks in two directions. Bullish means expecting price to rise; bearish means expecting price to fall. You'll hear 'the market is bullish on the dollar' or 'gold turned bearish' — it's the mood of the crowd, quantified in price."
        ],
        bullets: [
          "Bullish → up. The bull attacks with its horns — upward.",
          "Bearish → down. The bear swipes with its paws — downward.",
          "Every headline, every analyst, every position you take is eventually one of these two statements."
        ],
        insight: "There is no third direction. The entire profession of trading is deciding between two words — and being right more often than wrong, with risk controlled."
      },
      {
        eyebrow: "The position",
        title: "Long & Short: Taking a Side",
        body: [
          "When you go long, you buy a currency expecting its value to rise — you profit if price climbs. When you go short, you sell first, expecting price to fall, and buy it back later at the lower price — profiting on the way down."
        ],
        bullets: [
          "Long = buy now, sell later, profit from a rising price.",
          "Short = sell now, buy back later, profit from a falling price.",
          "You can take either side in forex — that's the freedom of a derivative market."
        ],
        example: "Tom went long on EUR/USD — he bought euros. Tom went short — he sold euros, expecting them to weaken.",
        insight: "Most beginners can only think 'buy.' Professionals decide which side the market favours — and sometimes the most profitable position is the one that feels wrong."
      },
      {
        eyebrow: "The lens",
        title: "Candles & Timeframes: The Trader's Lenses",
        body: [
          "A price chart turns the market into a picture. The candlestick chart is the trader's default: each candle shows the open, high, low and close for a period. The timeframe is how long each candle represents — one minute, one hour, one day."
        ],
        bullets: [
          "Timeframes: minute (fast), hourly (medium), daily (slow) — and many more between.",
          "Scalpers live on minute charts; day traders on hours; swing and position traders on daily and beyond.",
          "Higher timeframes show the big picture; lower timeframes show the fine detail — professionals read both."
        ],
        insight: "The same market looks completely different on different timeframes — a scream on the 1-minute chart is a whisper on the daily. Choose your lens by your style, not your mood.",
        styles: {
          scalper: "Minutes are your home — your entire edge lives and dies in the fine detail of the lowest timeframes.",
          day: "The hourly and 15-minute charts set your entries; the daily gives your bias its direction.",
          swing: "The daily is your map. One daily candle contains the story your swing trade is really riding.",
          position: "The weekly and monthly are your canvases — the daily only tells you when to step in."
        }
      },
      {
        eyebrow: "The measurements",
        title: "Points & Pips: The Smallest Measurements of Price",
        body: [
          "Price moves are measured in tiny units. A tick is the smallest possible price movement. A point is a single unit of price in an index or share. In forex, the pip is the standard unit — usually the fourth decimal place of a currency price."
        ],
        bullets: [
          "Tick: the smallest move a market can make — the heartbeat of price.",
          "Point: one whole unit of price on a share or index (e.g. $1 on a $200 share).",
          "Pip: the standard forex unit — 0.0001 on most pairs (0.01 on JPY pairs).",
          "Most brokers also quote a fifth decimal — a fractional pip, called a pipette."
        ],
        insight: "These tiny units are the grammar of profit and loss. When a trader says 'I'm up 80 pips,' they're counting in the market's native language."
      },
      {
        eyebrow: "The math",
        title: "The Math of Movement: Calculating Pip Difference",
        body: [
          "Reading a pip move is simple subtraction with decimals. Count the distance between the two prices — the difference IS the move, expressed in pips or points.",
          "New price − old price = the move. Positive means up; negative means down. In forex, the decimals after the price are pips; for shares and indices, each whole unit is one point."
        ],
        bullets: [
          "17.523 → 17.900 = 0.377 = 377 pips up.",
          "A share rising from $155 to $219 moved 64 points (219 − 155).",
          "A drop from 16.211 to 15.911 is 0.300 = 300 pips down.",
          "A share falling from $110 to $59 moved −51 points (59 − 110)."
        ],
        insight: "Don't guess the answer — calculate it. The market rewards the student who does the arithmetic, because most traders never bother."
      },
      {
        eyebrow: "The size",
        title: "Lots: Sizing Your Exposure",
        body: [
          "You don't trade currencies one unit at a time — you trade in lots, fixed bundles of currency. The three standard lot sizes are the micro, the mini, and the standard lot."
        ],
        bullets: [
          "Micro lot = 1,000 units — 1% of a standard lot. The beginner's training wheels.",
          "Mini lot = 10,000 units — 10% of a standard lot.",
          "Standard lot = 100,000 units — the full-size contract.",
          "Your lot size decides what every pip is worth — sizing is risk management."
        ],
        insight: "The lot is your throttle. Small lots keep losses small while you learn; big lots are earned, not borrowed. Most blown accounts started with a size that confidence couldn't back.",
        styles: {
          scalper: "You trade many small lots — pip value per trade is small, but your volume of trades decides the day.",
          day: "The mini lot is your workhorse; the standard lot is for when your edge has proof.",
          swing: "One well-placed mini or standard lot on a daily move beats a dozen nervous micro trades.",
          position: "Your lot size IS your risk plan — size for the months-long move, not the week's noise."
        }
      },
      {
        eyebrow: "The power",
        title: "Leverage: The Double-Edged Sword",
        body: [
          "Leverage is the use of borrowed funds to increase your trading position — your broker lends you capital so a small deposit controls a much larger position. It multiplies your buying power in both directions."
        ],
        bullets: [
          "Leverage of 1:100 means $1 of your money controls $100 of position.",
          "It amplifies both ways: bigger profits up, bigger losses down.",
          "The market doesn't care about your leverage — it moves, and your account absorbs the result."
        ],
        example: "With 1:100 leverage, $1,000 of your money controls a $100,000 position — the size of a standard lot. A 1% move either gains you $1,000 or costs you $1,000.",
        insight: "Leverage is the fastest way to lose an account and the fastest way to grow one — identical tool, different users. The variable isn't the leverage; it's the trader.",
        styles: {
          scalper: "High leverage + high speed = high risk of ruin. Cap your size so one bad minute can't end the month.",
          day: "You see the daily range — leverage tempts you to oversize it. Size for the stop, not the dream.",
          swing: "Swing traders rarely need extreme leverage — a patient position with sane size compounds better.",
          position: "The position trader's leverage is time itself. Use just enough to matter, never enough to break."
        }
      },
      {
        eyebrow: "The deposit",
        title: "Margin: Your Trading Collateral",
        body: [
          "Margin is the security deposit your broker holds while a position is open — your collateral for the borrowed funds leverage provides. It's not a fee or a donation; it's money set aside that returns when the position closes."
        ],
        bullets: [
          "View margin as collateral — like the deposit on a rental, held but not spent.",
          "The margin requirement is a percentage of the position's full value.",
          "If losses eat into your free margin, the broker issues a margin call — then a stop out."
        ],
        insight: "Margin is the seatbelt of the leveraged market — it reminds you that the position was never fully yours. Trade with the respect the collateral deserves.",
        styles: {
          scalper: "Scalpers must watch free margin minute by minute — a wide-spread moment can trigger a call mid-trade.",
          day: "Know your margin before the session: oversize on margin and one losing morning closes you out at the worst moment.",
          swing: "Your margin is locked for days — plan for the possibility that losses arrive while your collateral is parked.",
          position: "Months-long positions hold margin the whole way — size so a margin call can never force your thesis to a bad exit."
        }
      },
      {
        eyebrow: "The two schools",
        title: "Fundamental vs Technical: The Two Schools of Analysis",
        body: [
          "Two schools of thought explain and predict price. Fundamental analysis studies the forces behind the market — economic data, political events, interest rates — and uses past activity to forecast future change. Technical analysis studies how price itself moves: the charts, patterns and structure."
        ],
        bullets: [
          "Fundamental analysis: breaking down political and economic data relative to a currency.",
          "Technical analysis: the study of how price moves — reading the chart itself.",
          "Most professionals blend both: fundamentals set the bias, technicals time the entry."
        ],
        insight: "The fundamentals tell you WHAT to trade; the technicals tell you WHEN. Students who master only one are reading half the market."
      },
      {
        eyebrow: "The alignment",
        title: "Confluence: When Evidence Lines Up",
        body: [
          "Confluence is when multiple independent signals point to the same conclusion — support meets a trendline meets a round number meets a fundamental event. Each piece of evidence is weak alone; together they align into conviction."
        ],
        bullets: [
          "One signal is a guess. Two are a hint. Three pointing the same way is confluence.",
          "Confluence contributes to accuracy — aligned evidence raises the probability of a good outcome.",
          "The trader's job: find the trades where the evidence isn't fighting itself."
        ],
        insight: "You're not looking for certainty — you're looking for agreement. When the story on the chart and the story in the news tell the same tale, that's when professionals lean in."
      },
      {
        eyebrow: "The personality",
        title: "Volatility & Liquidity: The Market's Personality",
        body: [
          "Two words describe how a market behaves. Volatility is how much price moves — the size of the swings. Liquidity is how easily an asset is bought and sold without moving its own price. A currency pair is liquid when it can be bought and sold easily."
        ],
        bullets: [
          "High volatility → big moves → big profits AND big losses. It cuts both ways.",
          "High liquidity → tight spreads, instant fills, less slippage.",
          "The major pairs (EUR/USD, USD/JPY, GBP/USD) are the most liquid — the market's expressways."
        ],
        insight: "Volatility is the opportunity; liquidity is the access. You want a market that moves without sticking you in a traffic jam — that combination is the professional's playground."
      },
      {
        eyebrow: "The wider market",
        title: "Commodities & Indices: Beyond the Pairs",
        body: [
          "Forex terminology opens the door to the wider financial market. Commodities — raw materials like gold, oil and grains — belong to the primary sector, the first stage of the economy. Indices bundle a group of companies into one tradable figure."
        ],
        bullets: [
          "Commodities: gold, oil, wheat — the primary sector, where raw materials live.",
          "Indices: a basket of companies — like the S&P 500 — quoted as one number you can trade.",
          "A derivative can be built on any of these — which is why your terminology applies everywhere."
        ],
        insight: "The language you're learning is universal. Master it once and every market — currencies, gold, oil, indices — speaks the same tongue."
      },
      {
        eyebrow: "Behind the curtain",
        title: "Reading a Quote Like an Insider",
        body: [
          "A professional doesn't just see 'EUR/USD 1.0850' — they read a story: the pair's range, where it sits relative to support and resistance, and whether the bid/ask spread is behaving normally. The numbers on your screen are a live biography of the market's mood."
        ],
        bullets: [
          "The last digits are the plot — pips are where the real movement happens.",
          "A widening spread is a warning bell — thin liquidity, news, or volatility arriving.",
          "Your quote is a photograph; the chart is the film. Read both."
        ],
        insight: "Insiders read what's NOT moving — the quiet pairs, the steady spreads, the levels nobody's watching. The obvious move is usually the crowd's move.",
        styles: {
          scalper: "The quote's last two decimals are your battlefield — read them like a heartbeat during your session.",
          day: "A widening spread at the open tells you the day's character before your first trade.",
          swing: "Insiders read the daily quote's context — where the pair sits in its weekly range matters more than the flash.",
          position: "The quote is a symptom; the monthly trend is the diagnosis. Read the long context."
        }
      },
      {
        eyebrow: "Behind the curtain",
        title: "Mental Math: Thinking in Pips",
        body: [
          "Professionals don't reach for a calculator mid-trade — they think in pip distances and percentages so fast it looks like instinct. You can build that reflex: every stop, target and risk decision is just arithmetic practised until it's automatic."
        ],
        bullets: [
          "Count the decimals: 0.0001 = 1 pip. Ten pips = 0.001. The pattern is the skill.",
          "Risk first, math second: 'How many pips to my stop?' is the first question of every trade.",
          "Practise on paper — a month of mental math on demo charts beats a year of guessing live."
        ],
        insight: "The trader who does the arithmetic in their head makes decisions in their head — hesitation is where edge leaks away."
      },
      {
        kind: "pause",
        eyebrow: "Pause point",
        title: "Pause & Breathe",
        body: [
          "You've just absorbed a lot — and the brain learns best when it's given room to process. This pause is part of the method, not a break from it.",
          "Step back from the screen. Breathe in for four, hold for four, out for four. Stretch, walk for a minute, and let the ideas settle before you continue."
        ],
        sub: "Optional — take 60 seconds, then continue whenever you're ready.",
        insight: "Professionals guard their focus like capital. The trader who pauses to process compounds faster than the one who never stops."
      },
      {
        eyebrow: "Behind the curtain",
        title: "The Vocabulary of Confidence",
        body: [
          "Precise language is precise thinking. When you can say exactly what a trade is — 'I'm short EUR/USD, 20 pips to my stop, risking 1%' — you're thinking like a professional. Vague traders speak vaguely, and the market eats vagueness."
        ],
        bullets: [
          "The terms in this chapter are your operating system — they let your brain process the market at speed.",
          "If you can't describe a trade in proper terminology, you can't defend it — and you can't improve it.",
          "Language is the first discipline. The market tests what you can name."
        ],
        insight: "Every word in this chapter is a tool. The traders who know the names of things see the market clearly; the rest just see noise."
      },
      {
        eyebrow: "Before the quiz",
        title: "The Trader's Checklist",
        body: [
          "Before the quiz, make sure you can answer these out loud: What is a derivative? What does bullish mean? What's the difference between long and short? How many units in a micro, mini and standard lot? What are leverage and margin — and which timeframe suits which style?",
          "If you can explain each in your own words, you're ready. If not, go back and re-read — the quiz is next, and it counts."
        ],
        bullets: [
          "Base vs quote: the first currency is the one you're buying or selling.",
          "Bid vs ask: sell at the bid, buy at the ask, pay the spread.",
          "Pips: 0.0001 on most pairs — and you can calculate any pip difference.",
          "The two schools: fundamentals study the data, technicals study the chart.",
          "Liquidity, volatility, confluence — know what each means and why it matters."
        ],
        insight: "If you can explain these in your own words, the quiz is already won. If not, re-read — the questions reward the student who did the reading."
      },
      {
        kind: "close",
        eyebrow: "Before the test",
        title: "You Speak the Language",
        body: [
          "You've learned the vocabulary professionals think in — pairs, pips, lots, leverage, margin, the two schools, and the market's personality.",
          "Now prove it: 33 questions stand between you and Chapter 3. Pass, and Fundamental Analysis unlocks."
        ]
      },
      null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null
    ]
  },
  {
    id: 3, title: "Fundamental Analysis", slides: 42,
    focus: "Reading the economic heartbeat",
    diff: 2, // memorising events/data and their effects on price
    mins: 65,
    quizSlides: [23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42],
    quiz: [
      { q: "A higher forecast compared to previous data can cause the prices to…",
        options: ["Rise", "Stay the same", "Fall"], answer: 0,
        explain: "A higher forecast than previous data lifts expectations — and traders price in the anticipated improvement, pushing prices up." },
      { q: "Select the INCORRECT answer: the intrinsic value can show you when…",
        options: ["A company is OVERVALUED", "It's safe to invest in the FOREX markets", "A company is UNDERVALUED"], answer: 1,
        explain: "Intrinsic value judges a single company's worth — it says nothing about when it's safe to trade forex." },
      { q: "Which method is the most reliable to calculate the intrinsic value of an asset or company?",
        options: ["The metric-based calculation", "The asset-based calculation", "Both methods are useful"], answer: 2,
        explain: "Both roads are useful — metric-based values earning power, asset-based values what is owned. Use whichever fits the asset." },
      { q: "Why do we use the Intrinsic Value Formula?",
        options: ["To sell low and buy high", "To buy low and sell high", "To buy high and sell low"], answer: 1,
        explain: "The formula reveals what an asset is really worth — so you can buy below value and sell above it." },
      { q: "Which option is INCORRECT? Before conducting fundamental analysis on a company you should know the…",
        options: ["Company's debt", "Company's ethos", "Company's profit over the previous years"], answer: 1,
        explain: "Debt and profit history are the financial facts that matter. 'Ethos' — reputation — is not a financial metric." },
      { q: "Which area ISN'T a principle of fundamental analysis?",
        options: ["Central banks", "Media", "Politics"], answer: 1,
        explain: "Central banks and politics directly shape policy and confidence. Media distributes the story — it isn't one of the principles itself." },
      { q: "What is the NFP report?",
        options: ["It indicates the amount of jobs added in the U.S", "It measures the trade balance between the U.S. and other countries", "It tracks the inflation rate and consumer price changes in the U.S"], answer: 0,
        explain: "The Non-Farm Payrolls report counts jobs added in the U.S. outside farming — the single most market-moving release in forex." },
      { q: "Which option is INCORRECT? The NFP report affects…",
        options: ["The Dollar (USD)", "Gold (XAU)", "Corporate governance"], answer: 2,
        explain: "NFP moves the dollar and gold directly. Corporate governance — how a company is run — is untouched by the jobs report." },
      { q: "When the NFP report trends positively, this increases the probability of…",
        options: ["Gold strengthening and the dollar weakening", "The dollar strengthening and gold weakening", "Both the dollar and gold weakening"], answer: 1,
        explain: "A positive jobs trend raises rate expectations — the dollar strengthens and gold, priced in dollars, weakens." },
      { q: "The relationship between gold and the US Dollar is that…",
        options: ["A weak dollar will cause the price of gold to appreciate and vice versa", "A strong dollar will cause the price of gold to consolidate and vice versa", "A strong dollar will cause the price of gold to appreciate and vice versa"], answer: 0,
        explain: "Gold is priced in dollars — a weaker dollar makes gold cheaper for foreign buyers, lifting demand and price." },
      { q: "When the NFP report trends positively we can expect…",
        options: ["The price of oil to depreciate if supply is high", "The price of oil to appreciate especially if demand is high", "The price of oil to depreciate especially if the economy is expanding"], answer: 1,
        explain: "A growing economy consumes more energy — positive NFP plus high demand lifts the price of oil." },
      { q: "Which of the following best describes the nature of the NFP report?",
        options: ["A prediction of future employment levels based on market sentiment", "An estimated figure subject to revisions that requires trend analysis", "A prediction of past employment levels based on market sentiment"], answer: 1,
        explain: "NFP is an estimate that gets revised month to month — which is exactly why professionals analyse the trend, not the single print." },
      { q: "Which option is INCORRECT? The best way to trade the NFP report is to…",
        options: ["Read the report with month-to-month variation", "Analyze the sentiment of investors", "Establish a trend with the data"], answer: 1,
        explain: "The professionals' method is reading the variation and establishing the trend. Trading raw sentiment is how amateurs get caught." },
      { q: "Actual: 400K. Forecast: 200K. Previous: 150K. Dollar probability…",
        options: ["Strong dollar", "Weak dollar"], answer: 0,
        explain: "400K beat the 200K forecast by a mile — a strong surprise lifts the dollar." },
      { q: "Actual: 500K. Forecast: 100K. Previous: 88K. Dollar probability…",
        options: ["Strong dollar", "Weak dollar"], answer: 0,
        explain: "500K smashed the 100K forecast — a massive beat, the dollar strengthens." },
      { q: "Actual: 200K. Forecast: 300K. Previous: 250K. Dollar probability…",
        options: ["Strong dollar", "Weak dollar"], answer: 1,
        explain: "200K MISSED the 300K forecast — disappointment weakens the dollar." },
      { q: "Actual: 150K. Forecast: −240K. Previous: 100K. Dollar probability…",
        options: ["Strong dollar", "Weak dollar"], answer: 0,
        explain: "150K is far above the −240K forecast — the reality beat the terrible expectation, so the dollar strengthens." },
      { q: "Actual: −100K. Forecast: 123K. Previous: 100K. Dollar probability…",
        options: ["Strong dollar", "Weak dollar"], answer: 1,
        explain: "−100K came in far BELOW the +123K forecast — a big miss, the dollar weakens." },
      { q: "Asset-based calculation: Company assets $125M, liabilities $47.5M. Intrinsic value = …",
        options: ["$172.5M", "$77.5M", "−$125M"], answer: 1,
        explain: "Assets − Liabilities = $125M − $47.5M = $77.5M. Don't guess — subtract." },
      { q: "Calculate Apple's intrinsic value: EPS $3.28, growth (r) 10%, P/E 23.87.",
        options: ["$100", "$86.12", "$40"], answer: 1,
        explain: "EPS × (1+r) × P/E = 3.28 × 1.10 × 23.87 = $86.12. The formula, step by step." }
    ],
    native: [
      {
        eyebrow: "Chapter 3 · The economic heartbeat",
        title: "Reading the Room Before the Chart",
        lead: "Focal points in this chapter",
        body: [
          "Price is a vote. Every tick is thousands of traders voting with real money — but the voters are humans reacting to news, data, and central bank decisions. Fundamental analysis is the study of what moves the voters: the economic events that decide whether the dollar strengthens, gold shines, or oil surges.",
          "Technical analysis tells you where price IS. Fundamentals tell you why it might GO there. The best traders read both — and this chapter gives you the 'why' half of the language."
        ],
        callout: "Every lesson is a trade. Every trade is a lesson.",
        insight: "Fundamentals are the wind; technicals are the sails. The trader who reads the wind can point the sails before the gust arrives."
      },
      {
        eyebrow: "The foundation",
        title: "Fundamental Analysis: The Story Behind the Price",
        body: [
          "Fundamental analysis is the method of evaluating an asset by examining the economic, financial, and political factors that influence its value. In forex, that means watching interest rates, inflation, employment data, and central bank policy — the forces that decide whether a currency is strong or weak."
        ],
        bullets: [
          "Currencies don't have 'earnings' like companies — their value is driven by the health of entire economies.",
          "Strong economy → strong currency: money flows toward opportunity.",
          "Weak economy → weak currency: money leaves for safer ground."
        ],
        example: "When U.S. inflation runs hot, the Federal Reserve tends to raise interest rates — and higher rates attract global capital into the dollar, lifting USD against most pairs.",
        insight: "Fundamentals don't predict the next five minutes — they predict the next weeks. That's why swing and position traders lean on them hardest.",
        styles: {
          scalper: "You'll rarely trade fundamentals directly — the data triggers the volatility you scalp. Just know WHICH releases are coming so you're never caught flat-footed when the spike hits.",
          day: "Your session's direction is often decided by a single morning release. Know the calendar before the open — your bias starts with the data.",
          swing: "Fundamentals are your primary edge: a rate decision or inflation trend sets up the multi-day move you ride. Enter with the story, not against it.",
          position: "You ARE a fundamental trader by nature — central bank cycles and economic trends are the tide you position with for weeks at a time."
        }
      },
      {
        eyebrow: "The two schools",
        title: "Technical vs Fundamental: Same Market, Two Questions",
        body: [
          "Technicians ask 'WHAT is price doing?' — patterns, support, resistance, momentum. Fundamentalists ask 'WHY is it doing it?' — the data and policy underneath. Neither is superior; they answer different questions, and professionals combine both."
        ],
        bullets: [
          "Technical: works on any timeframe, any market — pure price action.",
          "Fundamental: sets the direction; technicals time the entry.",
          "Confluence — when the data story AND the chart agree — is the highest-probability setup in trading."
        ],
        insight: "The fundamental sets the destination; the technical drives the car. One without the other is navigation without a wheel — or a wheel without a map."
      },
      {
        eyebrow: "Two zoom levels",
        title: "Macro & Micro: The Wide Lens and the Close-Up",
        body: [
          "Macro analysis watches the whole economy — GDP, inflation, interest rates, employment, trade balances — to judge a currency's strength. Micro analysis zooms into a single company or sector — its revenue, debt, and margins — to judge a stock's value. Forex traders live mostly in the macro world; stock investors in the micro."
        ],
        bullets: [
          "Macro: the forest — entire economies, central bank policy, global flows.",
          "Micro: the trees — one company's fundamentals, one sector's health.",
          "In forex you trade economies, so macro rules your calendar."
        ],
        insight: "Beginners stare at one chart; professionals watch the system around it. The currency is just the mirror — the economy is the face."
      },
      {
        eyebrow: "The calendar",
        title: "The Economic Calendar: The Market's Appointment Book",
        body: [
          "Every week, governments and institutions release scheduled data: inflation (CPI), employment (NFP), interest rate decisions, GDP, retail sales, and more. These releases are the market's heartbeat — and the calendar tells you exactly when the pulse will beat."
        ],
        bullets: [
          "High-impact events: rate decisions, NFP, CPI — move markets instantly.",
          "Medium-impact: retail sales, trade balance, consumer confidence.",
          "The professional's morning ritual: check the calendar BEFORE the charts."
        ],
        insight: "The economic calendar is the trader's weather forecast. You wouldn't sail into a storm you could see coming — so why trade blind into a CPI release?"
      },
      {
        eyebrow: "The puppet masters",
        title: "Central Banks & Interest Rates: The Power Behind the Currency",
        body: [
          "Central banks — the Fed, ECB, BoE, SARB and others — control the short-term interest rate, the price of money. Raise rates, and holding that currency becomes more attractive; capital floods in and the currency strengthens. Cut rates, and capital looks elsewhere; the currency weakens."
        ],
        bullets: [
          "Higher rates → stronger currency (more demand for its yield).",
          "Lower rates → weaker currency (capital seeks better returns).",
          "Traders obsess over 'hawkish' (rate-hike) vs 'dovish' (rate-cut) signals."
        ],
        example: "The Fed signals two rate hikes. Traders price the dollar up for weeks before the decision itself — that's why the announcement matters less than the expectation.",
        insight: "Central banks move currencies in waves that last months. One sentence from a central bank governor is worth a hundred charts."
      },
      {
        eyebrow: "What moves the market",
        title: "Central Banks, Politics & Media: The Three Forces",
        body: [
          "Fundamental analysis in forex rests on three pillars. Central banks set policy; politics sets the environment — elections, trade wars, and fiscal policy shift confidence; and the media distributes it all, translating events into market narratives that traders act on."
        ],
        bullets: [
          "Central banks: the policy engine — rates, stimulus, guidance.",
          "Politics: elections, tariffs, geopolitical tension — risk on/off.",
          "Media: not a source of truth, but a source of MOVEMENT — headlines drive the herd."
        ],
        insight: "News doesn't move markets — the EXPECTATION of what it means does. By the time the headline is public, the smart money has already moved."
      },
      {
        eyebrow: "The king of the calendar",
        title: "The NFP Report: The Market's Biggest Appointment",
        body: [
          "The Non-Farm Payrolls report — released on the first Friday of every month — reveals how many jobs the U.S. added outside of farming. It is the single most market-moving piece of data in forex: it shapes expectations for interest rates, the dollar, gold, and oil."
        ],
        bullets: [
          "More jobs → stronger economy → higher rate expectations → stronger dollar.",
          "Fewer jobs → weaker economy → rate-cut expectations → weaker dollar.",
          "NFP moves the Dollar (USD) and Gold (XAU) hardest — and ripples through every USD pair."
        ],
        insight: "Jobs are the pulse of the world's reserve currency. When America hires, the dollar flexes — and every pair with USD in it feels the change."
      },
      {
        eyebrow: "The probability framework",
        title: "Actual vs Forecast vs Previous: The Three Numbers That Decide",
        body: [
          "The NFP release contains three numbers: the PREVIOUS month's figure, the FORECAST economists predicted, and the ACTUAL number just reported. The dollar's reaction is decided by one comparison: did reality beat expectation, or miss it?"
        ],
        bullets: [
          "Actual > Forecast → surprise beat → strong dollar.",
          "Actual < Forecast → disappointment → weak dollar.",
          "The previous figure matters only as context — the FORECAST is the bar to beat."
        ],
        example: "Actual 400K vs Forecast 200K: a massive beat — the dollar strengthens. Actual 200K vs Forecast 300K: a miss — the dollar weakens. It's never about the number itself; it's about the number vs the expectation.",
        insight: "The market doesn't trade reality — it trades the gap between reality and expectation. Learn to read that gap and you'll read every data release for the rest of your career.",
        styles: {
          scalper: "The minutes after NFP are the most volatile of the month — spreads blow out and the whip is brutal. If you trade it, size down and treat liquidity as a minefield.",
          day: "The NFP shock often sets the entire day's bias. Read the beat or miss, then trade with the new direction — not against it.",
          swing: "A strong NFP beat can shift the trend for weeks. Mark the reaction — it's often the first clue of a regime change.",
          position: "Months of NFP beats vs misses tell you the employment trend — the tide you position with. One release is noise; the sequence is signal."
        }
      },
      {
        eyebrow: "The inverse dance",
        title: "Gold & the Dollar: The Eternal Seesaw",
        body: [
          "Gold and the U.S. dollar move in opposite directions more often than not. Gold is priced in dollars, so a weaker dollar makes gold cheaper for foreign buyers — demand rises, and gold appreciates. A stronger dollar does the reverse."
        ],
        bullets: [
          "Weak dollar → gold appreciates.",
          "Strong dollar → gold depreciates.",
          "The correlation isn't perfect — crises can lift both — but it's the default setting."
        ],
        insight: "Gold is the market's fear gauge wearing jewellery. When confidence in the dollar drops, the oldest money on Earth gets rediscovered."
      },
      {
        eyebrow: "The growth gauge",
        title: "Oil: The Economy's Fuel Gauge",
        body: [
          "Oil prices are fundamentally tied to economic activity. An expanding economy consumes more energy — so when the NFP trends positively and demand is high, oil tends to appreciate. When the economy stalls and supply stays high, oil weakens."
        ],
        bullets: [
          "Expanding economy + high demand → oil appreciates.",
          "Weak economy / oversupply → oil depreciates.",
          "Oil feeds inflation → which feeds central bank decisions → which move currencies."
        ],
        insight: "Oil is the raw material of the modern world — its price is the economy's metabolic rate. Watch it and you're watching global growth in real time."
      },
      {
        eyebrow: "The micro lens",
        title: "Reading a Company: Debt, Profit & Reputation",
        body: [
          "When fundamental analysis moves from currencies to companies, you evaluate the business itself: its debt load, its profit history, and its credibility. Before you buy a company's stock, you should know the numbers behind the brand."
        ],
        bullets: [
          "Debt: how much the company owes — heavy debt is risk.",
          "Profit history: can it actually make money over time?",
          "'Ethos' is NOT a financial metric — a good reputation doesn't pay the bills by itself."
        ],
        insight: "A company's story is marketing; its balance sheet is truth. Fundamentals separate the two."
      },
      {
        eyebrow: "The hidden number",
        title: "Intrinsic Value: What an Asset Is Really Worth",
        body: [
          "Intrinsic value is the true worth of an asset — what it's worth on its own merits, regardless of what the market currently pays for it. Compare intrinsic value to the market price and you find opportunity: undervalued assets are priced below their worth; overvalued ones above it."
        ],
        bullets: [
          "Undervalued → priced below intrinsic value → potential buy.",
          "Overvalued → priced above intrinsic value → potential avoid/sell.",
          "The goal of the formula: buy low and sell high — with evidence, not hope."
        ],
        insight: "Price is what you pay; intrinsic value is what you get. The gap between them is where fortunes are made.",
        styles: {
          scalper: "Intrinsic value is a slow tool — you won't use it on a 1-minute chart. But knowing an asset is genuinely cheap stops you scalping a falling knife.",
          day: "A surprise earnings gap can catch day traders on the wrong side. Knowing intrinsic value tells you whether the gap is a bargain or a trap.",
          swing: "This is your bread and butter — entering when price drifts below value, exiting when it overshoots. The formula gives you the anchor.",
          position: "Your entire philosophy lives here: buy real value, hold through the noise, sell when price exceeds worth."
        }
      },
      {
        eyebrow: "Two ways to measure worth",
        title: "Metric-Based vs Asset-Based: The Two Roads to Value",
        body: [
          "There are two main ways to calculate intrinsic value. The METRIC-BASED method uses earnings, growth, and ratios — how much the company produces. The ASSET-BASED method uses the balance sheet — assets minus liabilities — what it owns. Neither is 'better'; both are useful, and professionals use whichever fits the asset."
        ],
        bullets: [
          "Metric-based: EPS × growth × P/E — value from future earnings power.",
          "Asset-based: total assets − total liabilities — value from what it owns.",
          "Use both when you can — two roads agreeing is strong confirmation."
        ],
        insight: "The metric road values what a company can DO; the asset road values what it OWNS. A trader who knows both sees the whole picture."
      },
      {
        eyebrow: "The math of worth",
        title: "The Intrinsic Value Formula: EPS × (1+r) × P/E",
        body: [
          "The most common intrinsic value formula multiplies a company's Earnings Per Share (EPS) by its expected growth rate (1 + r) by its Price-to-Earnings ratio (P/E). It's simple enough to do on the back of a napkin — and powerful enough to guide real investment decisions."
        ],
        bullets: [
          "EPS: the profit per share of stock.",
          "(1 + r): one plus the expected earnings growth rate.",
          "P/E: how much the market pays for each dollar of earnings.",
          "Asset-based shortcut: Assets − Liabilities = Intrinsic Value."
        ],
        example: "Apple: EPS $3.28 × (1 + 0.10) × P/E 23.87 = 3.28 × 1.10 × 23.87 = $86.12. And an asset-based check: Assets $125M − Liabilities $47.5M = $77.5M. Two roads, one answer.",
        insight: "The formula is a flashlight, not a crystal ball — it shows you value, but your discipline still decides the trade."
      },
      {
        eyebrow: "The professional's approach",
        title: "The Discipline of the NFP Trade",
        body: [
          "The best way to trade the NFP report is with trend analysis: read the data month to month, spot the pattern, and trade the established direction — never the raw emotion of the moment. Sentiment alone is a trap; a single month is noise; a sequence of beats or misses is a trend."
        ],
        bullets: [
          "Read the month-to-month variation — one release proves nothing.",
          "Establish a trend in the data before trusting a direction.",
          "Don't trade investor sentiment — trade the pattern in the numbers.",
          "Treat every NFP figure as an estimate subject to revision — expect the numbers to change later."
        ],
        insight: "Amateurs trade the headline; professionals trade the trend hidden inside it. The NFP is revised every month — smart money knows the first number is never the whole story.",
        styles: {
          scalper: "If you trade the release itself, stay small and use limit orders — the spread explodes. The trend that follows the first spike is safer to scalp than the spike itself.",
          day: "Let the first five minutes of chaos settle, then trade the direction the trend supports. Patience in the storm is a day trader's edge.",
          swing: "A beat or miss only matters if it flips the data trend. Trade the series, not the single print.",
          position: "Employment trends shape rate cycles — and rate cycles shape your multi-week positions. The NFP is a data point in your map, not your destination."
        }
      },
      {
        kind: "pause",
        eyebrow: "Pause point",
        title: "Pause & Breathe",
        body: [
          "You've just absorbed a lot — and the brain learns best when it's given room to process. This pause is part of the method, not a break from it.",
          "Step back from the screen. Breathe in for four, hold for four, out for four. Stretch, walk for a minute, and let the ideas settle before you continue."
        ],
        sub: "Optional — take 60 seconds, then continue whenever you're ready.",
        insight: "Professionals guard their focus like capital. The trader who pauses to process compounds faster than the one who never stops."
      },
      {
        eyebrow: "Behind the curtain",
        title: "The Currency Market's Weather Report",
        body: [
          "Professionals don't watch news channels for direction — they watch the calendar, the consensus forecasts, and the gap between expectation and reality. Every release is a weather system: rate decisions are storms, NFP is a hurricane, CPI is a pressure shift. Knowing the forecast tells you what the market has ALREADY priced in."
        ],
        bullets: [
          "The market prices the EXPECTATION before the release — the surprise is what moves it.",
          "Consensus forecasts come from economists; the street trades against them.",
          "By release time, the smart money is usually already positioned — you're trading the leftover."
        ],
        insight: "The release is the final act of a play the professionals rehearsed all week. Your edge isn't reacting faster — it's knowing the plot beforehand."
      },
      {
        eyebrow: "Inside the release",
        title: "The First Sixty Seconds: What Really Happens at NFP",
        body: [
          "At 8:30am ET on NFP day, the number hits every screen at once. In the first seconds, liquidity vanishes — spreads triple, orders slip, and price whipsaws in both directions before committing. The initial spike is noise; the real move often comes 10–30 minutes later, once the algorithms and institutions finish arguing over what the number means."
        ],
        bullets: [
          "First 5 seconds: pure chaos — spreads blow out, avoid market orders.",
          "First 10–30 minutes: the market 'finds the truth' — the real direction emerges.",
          "Institutions trade the revision potential; retail chases the headline.",
          "The safest professional play: wait for the trend to form, then join it."
        ],
        insight: "The first candle after NFP is the most lied-to candle in forex. Let the market finish lying before you trade the truth."
      },
      {
        eyebrow: "The hidden layer",
        title: "The Revision Game: Why the First Number Is Never Final",
        body: [
          "Every NFP print is later revised — sometimes by tens of thousands of jobs. Professionals who understand this trade the TREND of revisions, not the headline. Two months of upward revisions after weak prints? The economy is stronger than the market believes — that's an edge the headline traders never see."
        ],
        bullets: [
          "Track revisions month to month — they reveal the underlying trend.",
          "A sequence of beats matters more than any single print.",
          "The best fundamental traders are data archaeologists — they dig past the headline."
        ],
        insight: "The headline is written for television; the revisions are written for professionals. Dig one layer deeper than the crowd and the market pays you for it."
      },
      {
        eyebrow: "Before the quiz",
        title: "The Trader's Checklist",
        body: [
          "Before the quiz, make sure you can answer these out loud: What does fundamental analysis study, and how does it differ from technical? What are the three pillars that move currencies — and which one ISN'T one? What does the NFP report measure, and how does a beat or miss move the dollar, gold and oil? What are the two ways to calculate intrinsic value — and can you do the formula?"
        ],
        bullets: [
          "Actual vs Forecast vs Previous: beat → strong dollar, miss → weak dollar.",
          "Weak dollar → gold appreciates; strong dollar → gold depreciates.",
          "The NFP is an estimate subject to revision — trade the trend, not the headline.",
          "Intrinsic value: EPS × (1+r) × P/E — and Assets − Liabilities as the check.",
          "Before analysing a company: know its debt and its profit history."
        ],
        insight: "If you can explain these in your own words, the quiz is already won. If not, re-read — the questions reward the student who did the reading."
      },
      {
        kind: "close",
        eyebrow: "Before the test",
        title: "You Can Read the Economy",
        body: [
          "You've learned to read the forces behind the charts — central banks, employment, the gold-dollar seesaw, and the quiet math of intrinsic value. You now understand why price moves, not just where it's been.",
          "Now prove it: 20 questions stand between you and Chapter 4: Candlesticks. Pass, and the language of price itself unlocks."
        ]
      },
      null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null
    ]
  },
  {
    id: 4, title: "Candlesticks", slides: 55,
    focus: "Reading price through candles",
    diff: 2, // pattern memorisation + interpretation
    mins: 90,
    quizSlides: [34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55],
    quiz: [
      { q: "Past price movement has…",
        options: ["No effect on future price movement", "Full effect on future price movement"], answer: 0,
        explain: "Candles report what already happened — they raise probabilities, they never force the future. Past movement alone never guarantees the next move." },
      { q: "A doji candlestick forms when a currency pair's open and close are…",
        options: ["Horizontally equal (width)", "Virtually equal", "Both"], answer: 1,
        explain: "A doji means the open and close are virtually equal — the market opened and closed at almost the same price." },
      { q: "You can trade dojis in isolation…",
        options: ["True", "False"], answer: 1,
        explain: "A doji alone is indecision, not a signal — it needs the confirmation of the next candle before it means anything." },
      { q: "A dragonfly doji, with the confirmation of a bullish engulfing candle, can signal a trend reversal…",
        options: ["To the upside", "To the downside", "Both A and B"], answer: 0,
        explain: "The dragonfly's long lower wick rejected the lows; the bullish engulfing confirmation turns that rejection into an upside signal." },
      { q: "The dragonfly doji candle can also be a sign of indecision in the marketplace…",
        options: ["True", "False"], answer: 0,
        explain: "All dojis are indecision first — the dragonfly adds the rejection of the lows that can turn it into a reversal with confirmation." },
      { q: "A gravestone doji, with the confirmation of a bearish engulfing candle, can signal a trend reversal…",
        options: ["To the upside", "To the downside", "Both A and B"], answer: 1,
        explain: "The gravestone's long upper wick rejected the highs; the bearish engulfing confirmation turns that rejection into a downside signal." },
      { q: "A long-legged doji indicates…",
        options: ["An increase in price", "A decrease in price", "Neutrality in price"], answer: 2,
        explain: "Price thrashed up and down but closed where it opened — maximum indecision, neutrality." },
      { q: "A spinning top indicates that…",
        options: ["Bulls are in control of the markets", "Bears are in control of the market", "Neither bulls nor bears are in control of the market"], answer: 2,
        explain: "A small body with wicks both ways means neither side took control — uncertainty." },
      { q: "Wicks indicate…",
        options: ["Bearish strength", "Exhaustion", "Both"], answer: 2,
        explain: "A long upper wick shows rejection of the highs (bearish pressure); a long lower wick shows rejection of the lows (bullish pressure). Wicks show strength on one side or exhaustion of the move." },
      { q: "A hammer, especially in a downtrend, indicates…",
        options: ["Bullish strength", "Bearish weakness", "Both"], answer: 0,
        explain: "Price was driven down and bought all the way back — in a downtrend that's buyers arriving: bullish strength." },
      { q: "The morning star pattern indicates…",
        options: ["Bullish weakness", "Bullish strength", "Both"], answer: 1,
        explain: "Sell-off, pause, then a strong bullish close deep into the first candle — a classic bullish reversal." },
      { q: "A bullish engulfing pattern indicates…",
        options: ["Bullish strength", "Bearish strength", "Both"], answer: 0,
        explain: "A large bullish candle that fully covers the previous bearish candle — buyers arrived with force." },
      { q: "A bearish engulfing candle indicates…",
        options: ["Bullish strength", "Bearish strength", "Both"], answer: 1,
        explain: "A large bearish candle that fully covers the previous bullish candle — sellers took control." },
      { q: "Three white soldiers indicate…",
        options: ["Bullish strength", "Bearish strength"], answer: 0,
        explain: "Three rising green candles, each closing higher — a disciplined bullish march." },
      { q: "Three black crows indicate…",
        options: ["Bearish strength", "Bullish strength"], answer: 0,
        explain: "Three falling red candles, each closing lower — a methodical bearish march." },
      { q: "Tweezer bottoms indicate bullish strength…",
        options: ["True", "False"], answer: 0,
        explain: "Two candles closing at the same low show the market twice refused to go lower — a support signal." },
      { q: "There's always a reversal or breakout in a checkmate pattern…",
        options: ["True", "False"], answer: 1,
        explain: "The checkmate is a high-probability setup, not a guarantee — 'always' is a word the market punishes." },
      { q: "Candlestick patterns can help you stay in or out of a trade…",
        options: ["True", "False"], answer: 0,
        explain: "Patterns are part of the decision framework — they help you hold winners and avoid weak entries." },
      { q: "Patterns are 100% accurate…",
        options: ["True", "False"], answer: 1,
        explain: "Every pattern fails sometimes. The edge is the probability; risk management carries the rest." },
      { q: "'Candlestick patterns are the same as price action trading'…",
        options: ["True", "False"], answer: 1,
        explain: "Candles are one tool inside price action — which also reads structure, support/resistance, liquidity and context." },
      { q: "'Candlesticks can predict what the market will do'…",
        options: ["True", "False"], answer: 1,
        explain: "Candles show what happened and what is probable next — prediction is a fantasy. Probabilities plus risk management is the professional's edge." },
      { q: "Fill in the blanks: a red candle is a ___ candle, and a green candle is a ___ candle.",
        options: ["bearish · bullish", "bullish · bearish"], answer: 0,
        explain: "Red closes below its open (bearish); green closes above its open (bullish)." }
    ],
    native: [
      {
        eyebrow: "Chapter 4 · The language of price",
        title: "The Language of the Candles",
        lead: "Focal points in this chapter",
        body: [
          "Before charts, before platforms, before the internet — Japanese rice traders in the 1700s were already doing what you're about to learn. They recorded every open, high, low and close as a picture, and discovered those pictures repeat. We still use their invention: the candlestick.",
          "This chapter turns the raw material into one coherent language — single candles, multi-candle patterns, and the discipline of confirmation. By the end you won't just recognize a doji; you'll know what it's asking you to do."
        ],
        callout: "Every lesson is a trade. Every trade is a lesson.",
        insight: "Candles are the market's native alphabet. Everything else — indicators, patterns, systems — is commentary on what the candles already said.",
        fig: candFig([{ o: 55, h: 80, l: 52, c: 73 }, { o: 28, h: 42, l: 8, c: 16 }], { alt: "one bullish and one bearish candlestick" })
      },
      {
        eyebrow: "The origin",
        title: "Munehisa Homma: The Rice Trader Who Saw Patterns",
        body: [
          "In 18th-century Osaka, a rice merchant named Munehisa Homma noticed prices didn't move randomly — they moved with the emotions of the traders: fear, greed, hope. He began recording each day's open, high, low and close, and reading the mood of the market through them.",
          "His candlestick method made him one of the richest men in Japan — and it's the same method you're learning now. The market's emotions haven't changed; only the speed."
        ],
        bullets: [
          "Candlesticks compress four prices into one picture: open, high, low, close.",
          "The method survived 300 years because human behaviour repeats.",
          "You're not learning an indicator — you're learning to read the crowd."
        ],
        insight: "Homma didn't invent candles; he invented attention. The traders who win are the ones who actually look."
      },
      {
        eyebrow: "The anatomy",
        title: "The Five Numbers Inside Every Candle",
        body: [
          "Every candle tells you five things about the period it covers: the open (where price started), the high (the peak), the low (the trough), the close (where it ended) — and the wicks, the lines above and below the body that mark the extremes."
        ],
        bullets: [
          "Body: the distance between open and close — who won the period.",
          "Upper wick: how far buyers pushed price before it was rejected.",
          "Lower wick: how far sellers pushed price before it was rejected.",
          "Close is the most important number — it's where the market settled."
        ],
        fig: candFig([{ o: 55, h: 82, l: 52, c: 74 }, { o: 30, h: 44, l: 8, c: 18 }], { notes: [{ x: 88, y: 24, t: "HIGH" }, { x: 88, y: 80, t: "BODY" }, { x: 233, y: 112, t: "LOW" }, { x: 233, y: 38, t: "BODY" }], alt: "candlestick anatomy with high, low and body labels" }),
        insight: "A candle is a photograph of a fight. The wicks are where the fight was lost; the body is the score."
      },
      {
        eyebrow: "The two colours",
        title: "Green and Red: The Scoreboard of Each Period",
        body: [
          "A green (bullish) candle closes higher than it opened — buyers controlled that period. A red (bearish) candle closes lower than it opened — sellers controlled it. The colours aren't decoration; they're a scoreboard."
        ],
        bullets: [
          "Green candle = close above open → bullish period.",
          "Red candle = close below open → bearish period.",
          "The colour tells you the past; the pattern tells you the probability."
        ],
        fig: candFig([{ o: 55, h: 80, l: 52, c: 73 }, { o: 28, h: 42, l: 8, c: 16 }], { notes: [{ x: 88, y: 112, t: "BULLISH — close above open" }, { x: 233, y: 112, t: "BEARISH — close below open" }], alt: "green bullish and red bearish candlesticks" }),
        insight: "Colour is the summary; the wicks are the detail. A green candle with a huge upper wick isn't pure victory — it's a win under attack."
      },
      {
        eyebrow: "The body",
        title: "The Body: How Decisive Was the Fight?",
        body: [
          "The longer the body, the more decisive the period: a big green body means buyers overwhelmed sellers; a big red body means the reverse. A tiny body means the fight was close — nobody really won."
        ],
        bullets: [
          "Long body → strong conviction in that direction.",
          "Short body → hesitation, a close contest.",
          "Body length matters most at turning points — indecision there is a warning."
        ],
        insight: "Markets don't move on information; they move on conviction. The body is how much conviction showed up."
      },
      {
        eyebrow: "The wicks",
        title: "Wicks: Rejection and Exhaustion",
        body: [
          "A wick is a rejection. Price travelled there — and was pushed back. A long upper wick means buyers tried to push higher and failed; a long lower wick means sellers tried to push lower and failed. Wicks show where the market said 'no'."
        ],
        bullets: [
          "Upper wick = rejection of higher prices (bearish pressure).",
          "Lower wick = rejection of lower prices (bullish pressure).",
          "Long wicks at the end of a move often signal exhaustion — the trend is tired."
        ],
        fig: candFig([{ o: 52, h: 90, l: 46, c: 58 }], { notes: [{ x: 160, y: 20, t: "REJECTED HERE" }, { x: 160, y: 112, t: "SUPPORTED HERE" }], alt: "candle with long wicks showing rejection" }),
        insight: "The wick is the market's footprint. The places price was rejected are the places where orders live — that's where your entries and stops belong."
      },
      {
        eyebrow: "The premise",
        title: "Why Patterns Repeat: Behaviour, Not Magic",
        body: [
          "Candlestick patterns work because human beings react the same way to the same situations — fear at the lows, greed at the highs. When thousands of traders behave alike, the shapes they make repeat. Past price movement doesn't force the future; it gives you the probabilities the future tends to follow."
        ],
        bullets: [
          "Patterns are crowd behaviour made visible.",
          "They raise probability — they never guarantee.",
          "The same pattern means less at random times than at key levels."
        ],
        insight: "Patterns are not magic — they're the echo of human nature. That's why they've worked for 300 years and will work for 300 more."
      },
      {
        eyebrow: "The indecision",
        title: "The Doji: Perfect Indecision",
        body: [
          "A doji forms when the open and close are virtually equal — after a full period of trading, the market ended almost exactly where it began. Nobody won. The doji is the candle of pure indecision, and indecision at a turning point is worth watching."
        ],
        bullets: [
          "Open ≈ close → tiny or invisible body.",
          "The wicks tell you where the battle happened.",
          "Alone it says 'undecided' — it needs the next candle to vote."
        ],
        fig: candFig([{ o: 50, h: 86, l: 14, c: 50 }], { notes: [{ x: 160, y: 20, t: "INDECISION" }, { x: 160, y: 108, t: "OPEN ≈ CLOSE" }], alt: "doji candlestick" }),
        insight: "A doji is the market shrugging. At the top of a rally it can mean buyers gave up; at the bottom of a sell-off, sellers gave up."
      },
      {
        eyebrow: "The doji family",
        title: "The Dragonfly Doji: Rejection at the Lows",
        body: [
          "The dragonfly doji has its tiny body at the top of the range and a long lower wick — price was driven down hard, then bought straight back up to close near the high. Sellers tried, failed, and the market absorbed them."
        ],
        bullets: [
          "Long lower wick, tiny body at the top.",
          "Strong rejection of lower prices.",
          "In a downtrend, it can mark the shift — with confirmation."
        ],
        fig: candFig([{ o: 50, h: 53, l: 8, c: 50 }], { notes: [{ x: 160, y: 30, t: "BODY AT THE TOP" }, { x: 160, y: 108, t: "LONG LOWER WICK — sellers rejected" }], alt: "dragonfly doji candlestick" }),
        insight: "The dragonfly asks one question: if sellers were so strong, why did price come all the way back? The answer is usually the beginning of the turn."
      },
      {
        eyebrow: "The doji family",
        title: "The Gravestone Doji: Rejection at the Highs",
        body: [
          "The gravestone doji is the dragonfly's mirror: tiny body at the bottom of the range, long upper wick. Buyers drove price up hard — then it collapsed back to close near the low. The rally was rejected."
        ],
        bullets: [
          "Long upper wick, tiny body at the bottom.",
          "Strong rejection of higher prices.",
          "In an uptrend, it can mark the shift — with confirmation."
        ],
        fig: candFig([{ o: 50, h: 94, l: 47, c: 50 }], { notes: [{ x: 160, y: 22, t: "LONG UPPER WICK — buyers rejected" }, { x: 160, y: 106, t: "BODY AT THE BOTTOM" }], alt: "gravestone doji candlestick" }),
        insight: "After a long rally, a gravestone doji is the market's headstone for the trend — if the next candle confirms the burial."
      },
      {
        eyebrow: "The doji family",
        title: "The Long-Legged Doji: Maximum Chaos",
        body: [
          "The long-legged doji has long wicks in both directions — price was slammed up, slammed down, and still closed where it started. The market thrashed in every direction and decided nothing. That's maximum indecision."
        ],
        bullets: [
          "Both wicks long, body tiny.",
          "Huge volatility, zero resolution.",
          "Often marks the end of a violent move — exhaustion."
        ],
        fig: candFig([{ o: 50, h: 96, l: 4, c: 50 }], { notes: [{ x: 160, y: 18, t: "UP — rejected" }, { x: 160, y: 112, t: "DOWN — rejected" }], alt: "long legged doji candlestick" }),
        insight: "The long-legged doji is a bar fight where everyone got tired. What follows is often quiet — or the direction nobody expected."
      },
      {
        eyebrow: "The indecision family",
        title: "The Spinning Top: Nobody in Control",
        body: [
          "The spinning top has a small body with wicks on both sides — neither bulls nor bears could take control. It's a smaller, gentler version of the doji: uncertainty without the drama."
        ],
        bullets: [
          "Small body, wicks both ways.",
          "Neither side is in control.",
          "In a strong trend it's a pause; at a turning point, a warning."
        ],
        fig: candFig([{ o: 46, h: 88, l: 12, c: 56 }], { notes: [{ x: 160, y: 20, t: "NEITHER SIDE WINS" }], alt: "spinning top candlestick" }),
        insight: "The spinning top is the market catching its breath. Trends pause here — the question is whether the pause becomes a turn."
      },
      {
        eyebrow: "The reversals",
        title: "The Hammer: Strength Found at the Lows",
        body: [
          "The hammer has a small body at the top of its range and a long lower wick — price was driven down, then bought all the way back. In a downtrend, that's a sign buyers have arrived. The hammer's shape looks ready to strike upward."
        ],
        bullets: [
          "Small body, long lower wick, little or no upper wick.",
          "A hammer in a downtrend indicates bullish strength.",
          "Confirmation is the next candle closing higher."
        ],
        fig: candFig([{ o: 50, h: 63, l: 8, c: 58 }], { notes: [{ x: 160, y: 24, t: "SMALL BODY AT TOP" }, { x: 160, y: 110, t: "LONG LOWER WICK — buyers stepped in" }], alt: "hammer candlestick" }),
        insight: "The hammer is the market saying 'we tested the floor and it holds'. The trend's worst day might be the one that ends it."
      },
      {
        eyebrow: "The reversals",
        title: "The Shooting Star: A Rally That Died",
        body: [
          "The shooting star is the hammer's dark twin: small body at the bottom of the range, long upper wick. Price spiked up — and was sold straight back down. In an uptrend, that's the first sign the buyers are losing."
        ],
        bullets: [
          "Small body, long upper wick, little or no lower wick.",
          "A shooting star in an uptrend warns of bearish pressure.",
          "Confirmation is the next candle closing lower."
        ],
        fig: candFig([{ o: 54, h: 94, l: 46, c: 44 }], { notes: [{ x: 160, y: 20, t: "LONG UPPER WICK — rally rejected" }, { x: 160, y: 104, t: "SMALL BODY AT BOTTOM" }], alt: "shooting star candlestick" }),
        insight: "The shooting star is a promising rally that ran out of buyers. When the enthusiasm dies in one candle, the trend listens."
      },
      {
        eyebrow: "The rule",
        title: "Don't Trade a Doji Alone",
        body: [
          "A doji is information, not a signal. It tells you the market is undecided — but indecision alone doesn't tell you which way it breaks. That's why professionals wait for the confirmation candle before acting."
        ],
        bullets: [
          "Dojis say 'something changed' — not 'trade now'.",
          "The signal is the pair: the doji + the confirming candle.",
          "Trading a doji alone is gambling on a coin flip."
        ],
        insight: "The market rewards patience at indecision. Let the next candle cast the vote before you commit."
      },
      {
        kind: "pause",
        eyebrow: "Pause point",
        title: "Pause & Breathe",
        body: [
          "You've just absorbed a lot — and the brain learns best when it's given room to process. This pause is part of the method, not a break from it.",
          "Step back from the screen. Breathe in for four, hold for four, out for four. Stretch, walk for a minute, and let the ideas settle before you continue."
        ],
        sub: "Optional — take 60 seconds, then continue whenever you're ready.",
        insight: "Professionals guard their focus like capital. The trader who pauses to process compounds faster than the one who never stops."
      },
      {
        eyebrow: "The discipline",
        title: "Confirmation: The Second Candle Decides",
        body: [
          "Every reversal signal in this chapter follows one rule: the pattern identifies the risk, the confirmation pulls the trigger. A dragonfly doji with a bullish engulfing candle behind it becomes a signal to the upside; a gravestone with a bearish engulfing candle, to the downside."
        ],
        bullets: [
          "Pattern = alert. Confirmation = action.",
          "The confirming candle trades in the direction of the reversal.",
          "No confirmation, no trade — that's the whole discipline."
        ],
        insight: "Confirmation is not optional decoration — it's what separates a pattern from a guess."
      },
      {
        eyebrow: "The two-candle patterns",
        title: "The Bullish Engulfing Pattern",
        body: [
          "The bullish engulfing pattern is two candles: a small bearish candle, then a large bullish candle whose body completely covers (engulfs) the first. The market was falling — then buyers came in and wiped out the entire previous loss in one period."
        ],
        bullets: [
          "First candle: bearish. Second candle: bullish, body engulfs the first.",
          "Strong bullish strength after a downtrend.",
          "Best when it appears at support or after a sell-off."
        ],
        fig: candFig([{ o: 58, h: 62, l: 38, c: 42 }, { o: 34, h: 76, l: 28, c: 72 }], { notes: [{ x: 120, y: 108, t: "SMALL BEARISH" }, { x: 250, y: 108, t: "LARGE BULLISH — engulfs the first" }], alt: "bullish engulfing pattern" }),
        insight: "The engulfing candle doesn't just win the period — it erases the last period entirely. That's buyers arriving with force."
      },
      {
        eyebrow: "The two-candle patterns",
        title: "The Bearish Engulfing Pattern",
        body: [
          "The bearish engulfing pattern is the mirror image: a small bullish candle, then a large bearish candle that engulfs it. The rally was fully erased in one period — sellers took control with force."
        ],
        bullets: [
          "First candle: bullish. Second candle: bearish, body engulfs the first.",
          "Strong bearish strength after an uptrend.",
          "Best when it appears at resistance or after a rally."
        ],
        fig: candFig([{ o: 42, h: 62, l: 38, c: 58 }, { o: 70, h: 76, l: 26, c: 30 }], { notes: [{ x: 120, y: 108, t: "SMALL BULLISH" }, { x: 250, y: 108, t: "LARGE BEARISH — engulfs the first" }], alt: "bearish engulfing pattern" }),
        insight: "When one candle swallows the optimism of the previous period, the crowd that bought it is suddenly underwater. That's how reversals start."
      },
      {
        eyebrow: "The three-candle patterns",
        title: "The Morning Star: Night Turns to Day",
        body: [
          "The morning star is a three-candle reversal: a large bearish candle (the night), a small candle (the pause — selling exhausts), then a large bullish candle (the day) that closes well into the first candle's range. The market was falling, paused, and turned."
        ],
        bullets: [
          "Big bearish → small body → big bullish.",
          "The small middle candle is the turning point.",
          "Indicates strong bullish strength after a decline."
        ],
        fig: candFig([{ o: 65, h: 68, l: 26, c: 30 }, { o: 38, h: 48, l: 30, c: 44 }, { o: 34, h: 76, l: 30, c: 72 }], { notes: [{ x: 80, y: 108, t: "THE SELL-OFF" }, { x: 160, y: 108, t: "THE PAUSE" }, { x: 250, y: 108, t: "THE TURN" }], alt: "morning star pattern" }),
        insight: "The morning star is the market's night ending. The pause candle is where the sellers ran out — and the buyers found their moment."
      },
      {
        eyebrow: "The three-candle patterns",
        title: "The Evening Star: Day Turns to Night",
        body: [
          "The evening star is the morning star's mirror: a large bullish candle, a small candle of indecision, then a large bearish candle closing deep into the first candle's range. The rally ran out of buyers, paused, and reversed."
        ],
        bullets: [
          "Big bullish → small body → big bearish.",
          "The small middle candle signals the loss of momentum.",
          "Indicates strong bearish strength after a rally."
        ],
        fig: candFig([{ o: 30, h: 70, l: 26, c: 66 }, { o: 60, h: 72, l: 46, c: 54 }, { o: 70, h: 76, l: 28, c: 30 }], { notes: [{ x: 80, y: 108, t: "THE RALLY" }, { x: 160, y: 108, t: "THE PAUSE" }, { x: 250, y: 108, t: "THE TURN" }], alt: "evening star pattern" }),
        insight: "The evening star is enthusiasm stalling. What looks like a normal pullback can become the top — the star marks where buyers stopped showing up."
      },
      {
        eyebrow: "The continuation patterns",
        title: "Three White Soldiers: The March Upward",
        body: [
          "Three white soldiers are three consecutive bullish candles, each closing higher and opening within the previous candle's body — a disciplined advance. The market isn't jumping; it's marching, and marches are harder to stop."
        ],
        bullets: [
          "Three green candles, each higher than the last.",
          "Each opens inside the previous body, closes near its high.",
          "Indicates strong bullish strength."
        ],
        fig: candFig([{ o: 30, h: 48, l: 26, c: 46 }, { o: 42, h: 62, l: 38, c: 60 }, { o: 55, h: 76, l: 50, c: 74 }], { alt: "three white soldiers pattern" }),
        insight: "The soldiers are the market walking, not running — and walking trends last longer than running ones."
      },
      {
        eyebrow: "The continuation patterns",
        title: "Three Black Crows: The March Downward",
        body: [
          "Three black crows are three consecutive bearish candles, each closing lower and opening within the previous body. Selling isn't panicking — it's methodical, and methodical selling is heavy."
        ],
        bullets: [
          "Three red candles, each lower than the last.",
          "Each opens inside the previous body, closes near its low.",
          "Indicates strong bearish strength."
        ],
        fig: candFig([{ o: 70, h: 74, l: 52, c: 56 }, { o: 58, h: 62, l: 40, c: 44 }, { o: 45, h: 50, l: 26, c: 30 }], { alt: "three black crows pattern" }),
        insight: "The crows are distribution without drama. By the time the panic comes, the smart money already sold into the march."
      },
      {
        eyebrow: "The two-candle patterns",
        title: "Tweezer Bottoms & Tops: The Double Refusal",
        body: [
          "A tweezer bottom is two candles that close at the same low — the market touched a level twice and was rejected both times. That double refusal is a support signal; the tweezer top mirrors it at the highs."
        ],
        bullets: [
          "Two candles with matching lows (bottom) or highs (top).",
          "The equal level becomes a reference point.",
          "Tweezer bottoms indicate bullish strength."
        ],
        fig: candFig([{ o: 62, h: 66, l: 22, c: 44 }, { o: 42, h: 66, l: 22, c: 60 }], { notes: [{ x: 160, y: 112, t: "SAME LOW — twice refused" }], alt: "tweezer bottom pattern" }),
        insight: "The market tested that level twice and bounced twice — a level that holds twice is a level the crowd believes in."
      },
      {
        eyebrow: "The high-probability setup",
        title: "The Checkmate Pattern: The Market Trapped",
        body: [
          "The checkmate is Reality FX's high-probability setup: the market is pushed into a corner — a strong move into a key level — and usually resolves with a reversal or a breakout. The pattern sets the trap; the resolution is the move you trade."
        ],
        bullets: [
          "A sharp move into a significant level creates the corner.",
          "The market usually chooses: reverse or break through.",
          "High probability — but 'always' doesn't exist in trading."
        ],
        fig: candFig([{ o: 28, h: 48, l: 24, c: 46 }, { o: 44, h: 64, l: 40, c: 62 }, { o: 60, h: 76, l: 56, c: 74 }, { o: 76, h: 80, l: 22, c: 28 }], { notes: [{ x: 160, y: 20, t: "THE CORNER — resolution coming" }], alt: "checkmate pattern" }),
        insight: "Checkmate isn't a prediction — it's a prepared response. You don't guess which way it breaks; you wait for the break and trade it."
      },
      {
        eyebrow: "The honesty",
        title: "Patterns Are Probabilities, Not Promises",
        body: [
          "No pattern is 100% accurate, and candles don't predict what the market will do — they tell you what's probable. The professional treats a pattern as an edge, never as certainty, and lets risk management carry the uncertainty."
        ],
        bullets: [
          "Every pattern fails sometimes — that's the cost of the edge.",
          "Patterns can help you stay in a good trade or get out of a bad one.",
          "The question is never 'will it work?' — it's 'what do I do if it doesn't?'"
        ],
        insight: "The market pays the disciplined for probabilities and charges the hopeful for certainties."
      },
      {
        eyebrow: "The bigger picture",
        title: "Candles vs Price Action: The Difference Matters",
        body: [
          "Candlesticks are one tool inside the larger discipline of price action. Price action reads structure, support and resistance, liquidity, and context — candles are the alphabet, price action is the language."
        ],
        bullets: [
          "Candles = the shapes and patterns you've learned here.",
          "Price action = candles + structure + context + liquidity.",
          "Master the alphabet first — the language comes next."
        ],
        insight: "Don't stop at the candles. They're the first page of a much deeper book — and you've just learned to read page one fluently."
      },
      {
        eyebrow: "Your identity",
        title: "Your Timeframe, Your Candles",
        lead: "How your trading style reads the same candle",
        body: [
          "Every trader sees the same candle — but what it means depends on the timeframe you live in. The doji that ends a scalper's session is a footnote on a swing trader's daily chart. Learn the patterns once; apply them through your own lens."
        ],
        styles: {
          scalper: "You live on the 1m-5m — dojis and hammers are your every-minute vocabulary, and the wicks are where your entries live. The confirmation candle is your trigger, every time.",
          day: "Your 15m-1H candles filter the noise. One engulfing pattern on your session timeframe is worth ten on a scalper's — size the signal by the timeframe.",
          swing: "Daily candles are your bread and butter. The morning star or checkmate on the daily is a multi-day position forming — patience, then entry.",
          position: "Weekly and monthly candles reveal the tides your positions ride. The patterns here still matter — they're the waves on top of your current."
        },
        insight: "The same pattern, four different meanings. Know your timeframe and the candle will speak your language."
      },
      {
        eyebrow: "Behind the curtain",
        title: "The Wicks Are Stop Hunts",
        body: [
          "Here's what the textbooks don't tell you: many of those long wicks aren't natural rejection — they're engineered. Big players push price into a pool of stop-losses, trigger them, take the liquidity, and let price snap back. The wick you see is the footprint of a hunt."
        ],
        bullets: [
          "Stops cluster just beyond obvious highs and lows.",
          "A long wick through a level often sweeps those stops.",
          "The return after the sweep is the real story.",
          "Trade the sweep, don't chase it — the level that holds after the hunt is stronger."
        ],
        insight: "The wicks that scare retail are often the professionals' payday. When you know what a wick really is, it stops scaring you and starts informing you."
      },
      {
        eyebrow: "Inside the release",
        title: "The Confirmation Habit: Pros Never Guess",
        body: [
          "Ask a professional what separates them from the crowd and most will say the same thing: they don't act on the first candle. They wait for the pattern, the confirmation, and the level — and by then, the trade is obvious instead of hopeful."
        ],
        bullets: [
          "Pattern + confirmation + level = a trade worth taking.",
          "Missing the very first tick of a move is the price of certainty.",
          "The best entries feel late — that's how you know they're confirmed.",
          "Discipline on entry is where the edge actually lives."
        ],
        insight: "The market rewards the trader who can wait. Every confirmation you skip a guess — every guess you skip a loss."
      },
      {
        eyebrow: "The hidden layer",
        title: "The Pattern Trap: Why Pattern-Blind Traders Lose",
        body: [
          "Patterns fail most often for one reason: the trader saw the shape but ignored the context. A hammer in the middle of nowhere is a nothing candle; a hammer at a major support after a sell-off is a signal. The pattern is the excuse — the context is the edge."
        ],
        bullets: [
          "Same shape, different location, completely different meaning.",
          "Context = trend, level, volatility and what came before.",
          "The best pattern in the wrong place is still a loss.",
          "Read the story, not just the shape."
        ],
        insight: "The traders who lose to patterns are the ones who memorized the shapes and skipped the story. Context is the difference between a pattern and a setup."
      },
      {
        eyebrow: "Before the quiz",
        title: "The Trader's Checklist",
        body: [
          "Before the quiz, make sure you can answer these out loud: What is a doji, and what does it mean? What's the difference between a dragonfly and a gravestone doji — and which direction does each warn about? What does a long lower wick on a hammer tell you? Which way does a bullish engulfing pattern signal, and what does confirmation mean? What do three white soldiers indicate? And what's the honest truth about pattern accuracy?"
        ],
        bullets: [
          "Doji = open ≈ close = indecision; never trade it alone.",
          "Dragonfly (long lower wick) → upside with confirmation; gravestone → downside.",
          "Hammer in a downtrend = bullish strength; morning star = bullish strength.",
          "Bullish engulfing = bullish strength; bearish engulfing = bearish strength.",
          "Three white soldiers = bullish; three black crows = bearish.",
          "Tweezer bottoms = bullish; checkmate = high probability, never 'always'.",
          "Patterns are probabilities, not predictions — and not 100% accurate."
        ],
        insight: "If you can explain these in your own words, the quiz is already won. If not, re-read — the questions reward the student who did the reading."
      },
      {
        kind: "close",
        eyebrow: "Before the test",
        title: "The Candles Speak",
        body: [
          "You've learned the market's oldest language — single candles, the doji family, the reversals, the marches, and the discipline of confirmation. Every pattern is now a word; context is the sentence.",
          "Now prove it: 22 questions stand between you and Chapter 5: Market Movement. Pass, and you'll learn what the candles are saying inside the bigger flow."
        ]
      },
      null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null
    ]
  },
  {
    id: 5, title: "Market Movement", slides: 58,
    focus: "Trends, support, resistance, breakouts",
    diff: 2, // concepts that need chart-time to sink in
    mins: 95,
    quizSlides: [36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58],
    quiz: [
      { q: "Impulsive moves let you know that…",
        options: ["The imbalance between the buyers and sellers is really strong", "Buyers are in control in that moment", "The sellers are in control in that moment"], answer: 0,
        explain: "An impulse is a decisive push — it reveals a strong imbalance between buyers and sellers, whichever side is winning." },
      { q: "Corrections only occur during…",
        options: ["Down trends", "Up trends", "Trends in general"], answer: 2,
        explain: "Corrections happen in every trend — up and down alike. Any trend moves in impulses and breathes in corrections." },
      { q: "Impulses and corrections are…",
        options: ["Similar", "Opposite", "Both (A & B)"], answer: 1,
        explain: "Impulses move with the trend; corrections move against it. They're opposite forces — the push and the pullback." },
      { q: "If your support zone remains intact after prices dip for a correction, then it's a…",
        options: ["Buy signal", "Sell signal"], answer: 0,
        explain: "Price fell to support and the zone held — the correction failed to break it. That's a buy signal: buyers still control the floor." },
      { q: "If your resistance zone remains intact after prices rise, then it's a…",
        options: ["Buy signal", "Sell signal"], answer: 1,
        explain: "Price rose to resistance and the zone held — the rally was rejected. That's a sell signal: sellers still control the ceiling." },
      { q: "When resistance turns into support, we…",
        options: ["Buy", "Sell"], answer: 0,
        explain: "A broken resistance level that now holds price from below has flipped to support — a bullish continuation, so we buy the retest." },
      { q: "When support turns into resistance, we…",
        options: ["Buy", "Sell"], answer: 1,
        explain: "A broken support level that now caps price from above has flipped to resistance — bearish, so we sell the retest." },
      { q: "Retests negatively affect trading…",
        options: ["True", "False"], answer: 1,
        explain: "Retests are your friend — they confirm the breakout and give you a defined entry. They affect trading positively." },
      { q: "A zone of support is a lower boundary that the price has not previously broken through…",
        options: ["True", "False"], answer: 0,
        explain: "Support is the floor price has respected — a lower boundary it has not convincingly broken." },
      { q: "A zone of resistance is a higher boundary that the price has not previously broken through…",
        options: ["True", "False"], answer: 0,
        explain: "Resistance is the ceiling price has respected — a higher boundary it has not convincingly broken." },
      { q: "A zone is valid only if price has respected that zone twice or less…",
        options: ["True", "False"], answer: 1,
        explain: "The opposite — a zone gets MORE valid the more times price respects it. Two touches is the minimum to call it a zone." },
      { q: "A point where the head and the bottom (or the bottom and head) of price deflect each other: choose the correct term…",
        options: ["Support", "Resistance", "Reference Point"], answer: 2,
        explain: "Where price's swing high and swing low bounce off the same area, that shared spot is a Reference Point — the pivot of the market." },
      { q: "The point when a market breaks beyond a key support or resistance level: choose the correct term…",
        options: ["Breakout level", "Reference Point", "Retest"], answer: 0,
        explain: "When price decisively clears a key level, that's the Breakout level — the moment the old boundary is crossed." },
      { q: "Most breakouts occur after a period of consolidation…",
        options: ["True", "False"], answer: 0,
        explain: "True — consolidation builds energy, and most breakouts launch out of a range." },
      { q: "In a trend, higher highs and lows indicate…",
        options: ["An up trend", "A down trend", "Consolidation"], answer: 0,
        explain: "Each swing making a higher high and a higher low is the signature of an uptrend." },
      { q: "In a trend, lower highs and lows indicate…",
        options: ["An up trend", "A down trend", "Consolidation"], answer: 1,
        explain: "Each swing making a lower high and a lower low is the signature of a downtrend." },
      { q: "Consecutive highs and lows in a similar position each impulse and retest indicate…",
        options: [["An up trend", "A down trend", "Consolidation"]], answer: 0,
        explain: "When swings keep returning to the same area instead of trending, the market is consolidating." },
      { q: "The wider your trend lines are, the less effective it'll be for you to find breakout patterns…",
        options: ["True", "False"], answer: 0,
        explain: "Wide channels are mushy — breakouts from them are weak and unreliable. Tight structure gives clean breakouts." },
      { q: "The more narrow your trend lines are, the more effective it'll be for you to find breakout patterns…",
        options: ["True", "False"], answer: 0,
        explain: "Narrow channels compress energy — when price finally breaks, the move is sharper and more tradable." },
      { q: "A change in the price direction of an asset, which could occur to the upside or downside…",
        options: ["Breakout", "Reversal", "Consolidation"], answer: 1,
        explain: "A change of direction — up to down or down to up — is a Reversal." },
      { q: "Consolidation could last for a couple of years (in respect of your selective timeframe)…",
        options: ["True", "False"], answer: 0,
        explain: "True — on higher timeframes, ranges can persist for years. Timeframe decides what 'long' means." },
      { q: "The stability observed during market consolidation inherently limits the identification of high-probability trading opportunities…",
        options: ["True", "False"], answer: 0,
        explain: "In a quiet range there are few clean trends to trade — stability means fewer high-probability setups until the break." },
      { q: "Successful trading is reactive, not predictive…",
        options: ["True", "False"], answer: 0,
        explain: "Professionals react to what price proves — levels holding, breaks happening — rather than predicting the future." }
    ],
    native: [
      {
        eyebrow: "Chapter 5 · The flow of price",
        title: "The Flow of the Market",
        lead: "Focal points in this chapter",
        body: [
          "The market never stands still — it flows. Up, down, or sideways, price moves in a rhythm: strong pushes, gentle breathers, and levels that hold or break. Chapter 4 taught you the alphabet; this chapter teaches you the sentences — trends, support and resistance, breakouts, and retests.",
          "By the end you won't just see candles; you'll see the structure they're building, and you'll know what to do when that structure breaks."
        ],
        callout: "Every lesson is a trade. Every trade is a lesson.",
        insight: "Price doesn't move randomly — it moves in structure. Learn to read the structure and the chaos becomes a pattern.",
        fig: candFig([{ o: 20, h: 32, l: 16, c: 28 }, { o: 26, h: 40, l: 22, c: 36 }, { o: 34, h: 50, l: 30, c: 46 }, { o: 44, h: 62, l: 40, c: 58 }, { o: 55, h: 74, l: 50, c: 70 }], { alt: "market flowing upward in a trend" })
      },
      {
        eyebrow: "The three states",
        title: "The Three States of Price",
        body: [
          "At any moment the market is in one of three states: moving up (an uptrend), moving down (a downtrend), or going nowhere (consolidation). Every strategy on Earth is built on identifying which state you're in — because your job is different in each one."
        ],
        bullets: [
          "Uptrend: higher highs and higher lows — buy the pullbacks.",
          "Downtrend: lower highs and lower lows — sell the rallies.",
          "Consolidation: sideways — wait for the break.",
          "Trends make the money; ranges build the energy."
        ],
        insight: "Half of trading is knowing which state you're in. The other half is doing the right thing for that state."
      },
      {
        eyebrow: "The foundation",
        title: "What Is a Trend?",
        body: [
          "A trend is the market's directional memory — a sustained preference for higher or lower prices over time. Trends exist because money flows toward opportunity and away from risk, and that flow persists long enough to be traded."
        ],
        bullets: [
          "A trend is not a few candles — it's a sequence of swings.",
          "The trend is your friend until it bends.",
          "Your bias starts with the trend you're standing in."
        ],
        insight: "Trends are the market's longest memory. Trade with them and the market pulls you; trade against them and you fight the tide."
      },
      {
        eyebrow: "The uptrend",
        title: "The Uptrend: Higher Highs, Higher Lows",
        body: [
          "An uptrend is a series of swings where each high is higher than the last, and each low is higher than the last. Price keeps proving buyers are willing to pay more — and every pullback finds buyers at a higher floor."
        ],
        bullets: [
          "Higher high = buyers keep paying more.",
          "Higher low = sellers can't push price back to old levels.",
          "The strategy: buy the higher lows (pullbacks), not the highs."
        ],
        fig: candFig([{ o: 20, h: 32, l: 16, c: 28 }, { o: 26, h: 40, l: 22, c: 36 }, { o: 34, h: 50, l: 30, c: 46 }, { o: 44, h: 62, l: 40, c: 58 }, { o: 55, h: 74, l: 50, c: 70 }], { notes: [{ x: 262, y: 18, t: "HIGHER HIGHS" }, { x: 262, y: 104, t: "HIGHER LOWS" }], alt: "uptrend with higher highs and higher lows" }),
        insight: "The uptrend's engine is simple: buyers bid higher each time. Your job is to buy the dips the trend itself creates."
      },
      {
        eyebrow: "The downtrend",
        title: "The Downtrend: Lower Highs, Lower Lows",
        body: [
          "A downtrend is the mirror: each high is lower than the last, and each low is lower. Sellers keep demanding less, and every rally finds sellers at a lower ceiling."
        ],
        bullets: [
          "Lower high = sellers keep offering cheaper.",
          "Lower low = buyers can't lift price back to old levels.",
          "The strategy: sell the lower highs (rallies), not the lows."
        ],
        fig: candFig([{ o: 70, h: 74, l: 56, c: 62 }, { o: 62, h: 66, l: 48, c: 54 }, { o: 54, h: 58, l: 40, c: 46 }, { o: 46, h: 50, l: 32, c: 38 }, { o: 38, h: 42, l: 24, c: 30 }], { notes: [{ x: 262, y: 18, t: "LOWER HIGHS" }, { x: 262, y: 104, t: "LOWER LOWS" }], alt: "downtrend with lower highs and lower lows" }),
        insight: "The downtrend is sellers taking control of each rally. Sell the bounces the trend hands you, not the falls."
      },
      {
        eyebrow: "The range",
        title: "Consolidation: The Market Catches Its Breath",
        body: [
          "Consolidation is the sideways state: highs and lows in a similar position, each impulse and retest returning to the same area. The market is deciding — and while it decides, energy builds for the next move."
        ],
        bullets: [
          "No higher highs, no lower lows — just a range.",
          "Consolidation is the pause before the break.",
          "Most breakouts launch out of consolidation."
        ],
        fig: candFig([{ o: 48, h: 62, l: 40, c: 52 }, { o: 50, h: 60, l: 42, c: 46 }, { o: 44, h: 58, l: 38, c: 54 }, { o: 52, h: 64, l: 44, c: 48 }, { o: 46, h: 60, l: 40, c: 55 }], { notes: [{ x: 160, y: 20, t: "SAME AREA, OVER AND OVER" }, { x: 160, y: 108, t: "CONSOLIDATION — energy building" }], alt: "consolidation range" }),
        insight: "Consolidation is a coiled spring. The longer it coils, the sharper the break — your job is to be ready when it goes."
      },
      {
        eyebrow: "The heartbeat",
        title: "Impulse vs Correction: The Push and the Pullback",
        body: [
          "Every trend is built from two alternating moves: the impulse, a decisive push in the trend's direction that reveals a strong imbalance between buyers and sellers — and the correction, a smaller move against the trend while it breathes."
        ],
        bullets: [
          "Impulse: with the trend, strong, reveals the imbalance.",
          "Correction: against the trend, smaller, the market resting.",
          "Corrections happen in every trend — up and down alike.",
          "Trade the impulse; wait out the correction."
        ],
        fig: candFig([{ o: 18, h: 30, l: 14, c: 26 }, { o: 24, h: 38, l: 20, c: 34 }, { o: 32, h: 46, l: 28, c: 42 }, { o: 38, h: 42, l: 26, c: 30 }, { o: 34, h: 52, l: 30, c: 48 }], { notes: [{ x: 70, y: 110, t: "IMPULSE — strong push" }, { x: 190, y: 18, t: "CORRECTION — the breather" }, { x: 268, y: 110, t: "IMPULSE continues" }], alt: "impulse and correction in a trend" }),
        insight: "The impulse is the trend's true strength; the correction is its invitation. Professionals enter on the correction, not the impulse."
      },
      {
        eyebrow: "The rhythm",
        title: "Corrections Happen in Every Trend",
        body: [
          "A trend that never pulls back is a trend that can't be bought well. Corrections aren't the trend failing — they're the trend reloading. Down trends correct upward; up trends correct downward."
        ],
        bullets: [
          "Corrections are normal in trends in general.",
          "A correction that holds a key level = the trend is intact.",
          "Fear the trend that corrects INTO the old trend, not the one that breathes."
        ],
        insight: "The correction is where entries live. Without the pullback, there's no room to enter with a tight stop."
      },
      {
        eyebrow: "The bias",
        title: "Why Trade With the Trend?",
        body: [
          "Trading with the trend means you only take signals in the direction of the larger flow. It doesn't guarantee wins — but it stacks the odds: the market's momentum pulls your position along, and your pullback entries sit with a tight stop behind structure."
        ],
        bullets: [
          "Trend-following entries fail less often than counter-trend ones.",
          "With-trend pullbacks have a defined invalidation point.",
          "Against the trend, you're fighting institutions and momentum."
        ],
        insight: "The trend is the market's gravity. You can swim against it occasionally — but the professional rows with the current."
      },
      {
        eyebrow: "The floor",
        title: "Support: The Floor That Holds",
        body: [
          "Support is a lower boundary where price has repeatedly found buyers and bounced — a level the market has not convincingly broken through. Every touch of support is the market testing the floor, and every hold confirms it."
        ],
        bullets: [
          "Support = a lower boundary price respects.",
          "Each touch that holds makes the floor stronger.",
          "A floor that holds after a dip = the buyers are still in charge."
        ],
        fig: candFig([{ o: 55, h: 62, l: 28, c: 48 }, { o: 50, h: 58, l: 27, c: 56 }, { o: 58, h: 66, l: 30, c: 52 }, { o: 54, h: 60, l: 26, c: 58 }], { levels: [{ v: 28, t: "SUPPORT" }], notes: [{ x: 160, y: 96, t: "PRICE KEEPS BOUNCING" }], alt: "support level holding price" }),
        insight: "Support is the market's floor — and floors are made of buyers' orders. When price tests the floor and holds, someone big is standing there."
      },
      {
        eyebrow: "The ceiling",
        title: "Resistance: The Ceiling That Rejects",
        body: [
          "Resistance is a higher boundary where price has repeatedly found sellers and been pushed down — a level the market has not convincingly broken through. Every touch of resistance is the market testing the ceiling, and every rejection confirms it."
        ],
        bullets: [
          "Resistance = a higher boundary price respects.",
          "Each rejection makes the ceiling stronger.",
          "A ceiling that holds after a rally = the sellers are still in charge."
        ],
        fig: candFig([{ o: 42, h: 74, l: 36, c: 52 }, { o: 48, h: 75, l: 40, c: 45 }, { o: 40, h: 72, l: 34, c: 50 }, { o: 44, h: 76, l: 38, c: 47 }], { levels: [{ v: 74, t: "RESISTANCE" }], notes: [{ x: 160, y: 14, t: "PRICE KEEPS GETTING REJECTED" }], alt: "resistance level rejecting price" }),
        insight: "Resistance is the market's ceiling — made of sellers' orders. When price tests the ceiling and falls, someone big is selling there."
      },
      {
        eyebrow: "The refinement",
        title: "Zones, Not Lines",
        body: [
          "Levels aren't razor-thin lines — they're zones: an area where orders cluster. Price respects the area, not the exact number. Draw support and resistance as bands, and you'll stop getting wicked out by one-pip hunts."
        ],
        bullets: [
          "Draw the zone, not the line.",
          "A zone gets more valid the more times price respects it — two touches is the minimum.",
          "Zones hold because orders sit behind them — the more touches, the more orders."
        ],
        insight: "The exact price is the rumour; the zone is the truth. Trade the area and the one-pip noise stops mattering."
      },
      {
        eyebrow: "The psychology",
        title: "Why Zones Hold: The Orders Behind the Level",
        body: [
          "Support and resistance aren't magic lines — they're crowds. Buyers cluster at support, sellers cluster at resistance, and their orders hold the level. Every trader who missed the last breakout is waiting at the old level, ready to join the next one."
        ],
        bullets: [
          "Levels are made of resting orders — real money, not lines.",
          "Broken levels become magnets for the traders who missed them.",
          "That's why a broken support often becomes resistance — the crowd flips sides."
        ],
        insight: "A level is only as strong as the people standing on it. Read the crowd behind the line and you'll know whether it holds."
      },
      {
        eyebrow: "The pivot",
        title: "The Reference Point: Where Price Deflects",
        body: [
          "Watch how price behaves around a level and you'll notice a point where the head and the bottom of price deflect each other — the swing high and swing low both respect the same area. That shared spot is the Reference Point: the market's pivot."
        ],
        bullets: [
          "A Reference Point is where opposing swings meet the same area.",
          "It marks the battleground both sides are defending.",
          "Break it, and the defence collapses in one direction."
        ],
        insight: "The Reference Point is the market's decision spot. Both armies fight for it — and the one that breaks it wins the next move."
      },
      {
        eyebrow: "The event",
        title: "The Breakout Level: When the Boundary Falls",
        body: [
          "The breakout level is the moment price decisively clears a key support or resistance level. The old boundary is crossed, the defending orders are consumed, and the market commits to the new side. Breakouts are where trends are born."
        ],
        bullets: [
          "Breakout = price clears the level with force.",
          "Volume and conviction confirm a real break.",
          "The level that broke now watches from the other side."
        ],
        fig: candFig([{ o: 44, h: 58, l: 38, c: 50 }, { o: 46, h: 60, l: 40, c: 52 }, { o: 48, h: 62, l: 42, c: 54 }, { o: 60, h: 88, l: 56, c: 84 }], { levels: [{ v: 66, t: "RESISTANCE" }], arrows: [{ x: 272, y: 80, dir: "right", t: "BREAKOUT" }], alt: "breakout through resistance" }),
        insight: "The breakout isn't the end — it's the beginning. The level that held for weeks has finally lost, and the market now trades on the other side of the crowd."
      },
      {
        eyebrow: "The launchpad",
        title: "Most Breakouts Follow Consolidation",
        body: [
          "Breakouts rarely come from nowhere — they launch from ranges. Consolidation builds the energy: traders accumulate, volatility compresses, and when the spring finally releases, price breaks with conviction. The range is the runway; the breakout is the takeoff."
        ],
        bullets: [
          "Consolidation compresses energy before the break.",
          "The longer the range, the sharper the breakout.",
          "Mark the range edges — the break gives you the direction."
        ],
        fig: candFig([{ o: 44, h: 58, l: 38, c: 50 }, { o: 46, h: 60, l: 40, c: 52 }, { o: 48, h: 62, l: 42, c: 54 }, { o: 60, h: 88, l: 56, c: 84 }], { levels: [{ v: 66, t: "RESISTANCE" }], notes: [{ x: 70, y: 108, t: "THE RANGE" }, { x: 250, y: 108, t: "THE BREAK" }], alt: "consolidation range then breakout" }),
        insight: "Patience in the range is the price of the breakout. The traders who waited get the clean move; the ones who churned inside the range paid for it."
      },
      {
        kind: "pause",
        eyebrow: "Pause point",
        title: "Pause & Breathe",
        body: [
          "You've just absorbed a lot — and the brain learns best when it's given room to process. This pause is part of the method, not a break from it.",
          "Step back from the screen. Breathe in for four, hold for four, out for four. Stretch, walk for a minute, and let the ideas settle before you continue."
        ],
        sub: "Optional — take 60 seconds, then continue whenever you're ready.",
        insight: "Professionals guard their focus like capital. The trader who pauses to process compounds faster than the one who never stops."
      },
      {
        eyebrow: "The confirmation",
        title: "Breakout & Retest: The Professional's Sequence",
        body: [
          "After a breakout, price often returns to test the broken level — and that retest is where professionals enter. The old resistance, now holding price from above, becomes support. The retest confirms the break was real and hands you a defined entry with a tight stop."
        ],
        bullets: [
          "Break → retest → continue: the classic sequence.",
          "The retested level flips sides: resistance becomes support.",
          "Retests positively affect trading — they confirm and define."
        ],
        fig: candFig([{ o: 44, h: 58, l: 38, c: 50 }, { o: 46, h: 60, l: 40, c: 52 }, { o: 58, h: 82, l: 54, c: 78 }, { o: 70, h: 74, l: 60, c: 64 }, { o: 66, h: 92, l: 62, c: 88 }], { levels: [{ v: 66, t: "OLD RESISTANCE → NEW SUPPORT" }], notes: [{ x: 70, y: 100, t: "THE RANGE" }, { x: 175, y: 108, t: "BREAK" }, { x: 250, y: 100, t: "RETEST — the entry" }], alt: "breakout then retest of the broken level" }),
        insight: "The retest is the market proving the break was real. When the old ceiling holds price from above, the crowd has flipped — and so has the trade."
      },
      {
        eyebrow: "The flip",
        title: "Resistance Becomes Support: We Buy",
        body: [
          "When resistance is broken and then holds price from above, it has flipped into support. The traders who missed the breakout now buy the retest — and so do we. The flip is one of the most reliable concepts in structure trading."
        ],
        bullets: [
          "Broken resistance + retest that holds = buy.",
          "The stop goes below the retest low — tight and defined.",
          "The flip works because the crowd flips with it."
        ],
        fig: candFig([{ o: 44, h: 58, l: 38, c: 50 }, { o: 46, h: 60, l: 40, c: 52 }, { o: 58, h: 82, l: 54, c: 78 }, { o: 70, h: 74, l: 60, c: 64 }, { o: 66, h: 92, l: 62, c: 88 }], { levels: [{ v: 66, t: "RESISTANCE → SUPPORT" }], arrows: [{ x: 215, y: 88, dir: "up", t: "BUY THE RETEST" }], alt: "resistance flipped to support, buy the retest" }),
        insight: "When the ceiling becomes the floor, the market has changed its mind — and it usually means it."
      },
      {
        eyebrow: "The flip",
        title: "Support Becomes Resistance: We Sell",
        body: [
          "The same flip works downward: when support is broken and then caps price from below, it has turned into resistance. The traders who missed the breakdown now sell the retest — and so do we."
        ],
        bullets: [
          "Broken support + retest that rejects = sell.",
          "The stop goes above the retest high — tight and defined.",
          "Selling the flip is selling into the new crowd."
        ],
        insight: "When the floor becomes the ceiling, the buyers who defended it have become trapped sellers. That's a gift."
      },
      {
        eyebrow: "The signals",
        title: "Support Intact → Buy Signal",
        body: [
          "Combine the pieces: if price dips for a correction and your support zone remains intact — the floor holds — that's a buy signal. The correction failed to break the structure, so the trend's buyers are still in control."
        ],
        bullets: [
          "Correction down + support holds = buy.",
          "The stop sits below support, the target at resistance.",
          "This is the trend trader's highest-probability entry."
        ],
        insight: "A floor that survives the dip isn't just holding — it's telling you who's winning. Listen."
      },
      {
        eyebrow: "The signals",
        title: "Resistance Intact → Sell Signal",
        body: [
          "The mirror: if price rises for a rally and your resistance zone remains intact — the ceiling holds — that's a sell signal. The rally failed to break structure, so the sellers are still in control."
        ],
        bullets: [
          "Rally up + resistance holds = sell.",
          "The stop sits above resistance, the target at support.",
          "Rejection at a respected ceiling is the short seller's setup."
        ],
        insight: "A ceiling that survives the rally isn't just resisting — it's announcing who's in charge."
      },
      {
        eyebrow: "The angle",
        title: "Trendlines: The Angle of the Flow",
        body: [
          "A trendline is a line drawn along the swing lows of an uptrend (or the swing highs of a downtrend) that captures the trend's angle. It's your dynamic support — as long as price stays above it, the trend is alive."
        ],
        bullets: [
          "Uptrend line: connect the higher lows.",
          "Downtrend line: connect the lower highs.",
          "The trendline holds = trend intact; it breaks = the trend bends."
        ],
        fig: candFig([{ o: 20, h: 34, l: 16, c: 30 }, { o: 28, h: 42, l: 24, c: 38 }, { o: 36, h: 50, l: 32, c: 46 }, { o: 44, h: 60, l: 40, c: 56 }], { lines: [{ x1: 52, y1: 16, x2: 268, y2: 40, color: "#3f9d68" }], notes: [{ x: 160, y: 106, t: "THE TRENDLINE — price stays above" }], alt: "trendline along the rising lows" }),
        insight: "The trendline is the trend's spine. While it holds, the market is healthy; the moment it snaps, the structure is asking for a new plan."
      },
      {
        eyebrow: "The refinement",
        title: "Narrow vs Wide Channels: Tight Is Tradable",
        body: [
          "Trend channels can be narrow or wide — and the width changes everything. A narrow channel compresses price into a tight, disciplined path: breakouts from it are sharp and clean. A wide, mushy channel gives weak, unreliable breaks. The tighter the structure, the better the setup."
        ],
        bullets: [
          "Narrow channels → compressed energy → clean breakouts.",
          "Wide channels → scattered price → weak breakouts.",
          "Trade the tight channels; skip the sloppy ones."
        ],
        fig: candFig([{ o: 24, h: 34, l: 20, c: 30 }, { o: 30, h: 40, l: 26, c: 36 }, { o: 36, h: 46, l: 32, c: 42 }, { o: 42, h: 52, l: 38, c: 48 }], { lines: [{ x1: 52, y1: 20, x2: 268, y2: 44, color: "#3f9d68" }, { x1: 52, y1: 32, x2: 268, y2: 56, color: "#c25a54" }], notes: [{ x: 160, y: 106, t: "NARROW CHANNEL — clean breakouts" }], alt: "narrow trend channel" }),
        insight: "The market respects discipline. Tight structure breaks cleanly; loose structure breaks loosely — match your risk to the channel."
      },
      {
        eyebrow: "The change",
        title: "Reversal: The Change of Direction",
        body: [
          "A reversal is a change in the price direction of an asset — a shift from up to down or down to up. Reversals end trends and begin new ones, and they're only confirmed when the structure actually turns: the first broken swing, the first flipped level."
        ],
        bullets: [
          "Reversal = direction change, up or down.",
          "Breakout breaks a level; reversal breaks the trend.",
          "Wait for the confirmation — the first lower high or higher low."
        ],
        insight: "Reversals are where trends die and fortunes are made — but only the patient see them, because they never announce themselves."
      },
      {
        eyebrow: "The timeline",
        title: "Consolidation Can Last for Years",
        body: [
          "Ranges don't care about your schedule. On higher timeframes, consolidation can persist for a couple of years — price respecting the same boundaries while the market accumulates. What counts as 'long' depends entirely on your timeframe."
        ],
        bullets: [
          "Years-long ranges exist on weekly and monthly charts.",
          "The longer the range, the bigger the eventual break.",
          "Your timeframe decides what 'patient' means."
        ],
        insight: "The market's patience is your lesson: the biggest moves are earned by the traders who could wait for them."
      },
      {
        eyebrow: "The reality",
        title: "Consolidation Limits High-Probability Setups",
        body: [
          "The stability of consolidation is a double-edged sword: safe, but quiet. Inside a range there are few clean trends to ride, so high-probability opportunities are inherently limited until the break. That's not a flaw — it's the market telling you when to stand down."
        ],
        bullets: [
          "Stability = fewer clean trends to trade.",
          "Inside a range, opportunities are choppy and low-probability.",
          "The professional's answer: wait for the break, then act."
        ],
        insight: "Knowing when NOT to trade is a skill. Consolidation is the market's way of asking you to wait for a better fight."
      },
      {
        eyebrow: "The philosophy",
        title: "Reactive, Not Predictive",
        body: [
          "The professionals' deepest habit: they react to what price proves, instead of predicting what it might do. You don't need to guess the future — you need to respond to the present: the level held, the level broke, the retest confirmed. Successful trading is reactive, not predictive."
        ],
        bullets: [
          "React to confirmed structure — not to hopes.",
          "The market tells you when it's ready; you don't tell it.",
          "Every reaction is simple: level holds, level breaks, trade accordingly."
        ],
        insight: "Prediction is the amateur's drug; reaction is the professional's edge. The market pays for what you saw, not what you guessed."
      },
      {
        eyebrow: "The framework",
        title: "The Flow Framework: Putting It Together",
        body: [
          "Every concept in this chapter is one system. The trend gives you the direction (impulses and corrections). The levels give you the places (support and resistance zones). The break gives you the moment (breakout and retest). And the philosophy keeps you honest: react to what price proves."
        ],
        bullets: [
          "Direction: trade with the trend, enter on corrections.",
          "Places: support and resistance zones define your entries and stops.",
          "Moments: breakouts and retests trigger the trade.",
          "Honesty: reactive, not predictive."
        ],
        insight: "The trend is the current, the levels are the banks, and the breakout is the gate. Read all three and the flow carries you."
      },
      {
        eyebrow: "Your identity",
        title: "Your Structure, Your Timeframe",
        lead: "How your trading style reads the flow",
        body: [
          "Structure looks different on every timeframe — and your style lives on a specific one. A scalper's support is a 1-minute floor; a swing trader's is a daily zone. Learn the structure once; read it through your own lens."
        ],
        styles: {
          scalper: "Your structure is minutes old — support and resistance on the 1m-5m, and your retests last seconds. React fast; the levels still hold.",
          day: "Your zones are the 15m-1H levels that set the session bias. A daily open above a broken level is your signal to buy the pullback.",
          swing: "Daily and 4H structure is your map — swing points, big zones, retests over days. The flow framework is your entire edge.",
          position: "Your structure is weekly and monthly — year-long ranges and decade trends. The retests you trade are measured in weeks."
        },
        insight: "The same support, four different meanings. Know your timeframe and the flow speaks your language."
      },
      {
        eyebrow: "Behind the curtain",
        title: "The Level Nobody Sees",
        body: [
          "The levels that matter most are the ones you can't see yet: the pools of orders sitting just beyond obvious highs and lows — stop-losses, pending orders, breakout hunters. When price sweeps a level and snaps back, it's often a liquidity grab: the market collected the orders behind the line."
        ],
        bullets: [
          "Stops cluster beyond obvious structure — that's fuel.",
          "A sweep through a level often hunts those stops, then reverses.",
          "The 'fake' break is sometimes the real signal.",
          "Zones + sweeps: watch how price leaves the level, not just that it touched it."
        ],
        insight: "The obvious level is the bait; the invisible orders are the fish. Read the sweep and you'll stop getting caught by it."
      },
      {
        eyebrow: "Inside the release",
        title: "Break & Retest: The Entry Professionals Wait For",
        body: [
          "Retests positively affect trading — and here's the real reason: the retest is where the risk is smallest. At the moment of breakout, everything is uncertain. At the retest, the level has already proven itself once. The professional skips the excitement of the break and takes the certainty of the retest."
        ],
        bullets: [
          "The breakout tells you the direction; the retest gives you the entry.",
          "Retest entries have a natural stop — beyond the retest extreme.",
          "Missing the first spike is the price of a definable risk.",
          "Every retest that holds is the market confirming itself twice."
        ],
        insight: "Let the market do the risky part first. You arrive after it proves itself — that's not late, that's professional."
      },
      {
        eyebrow: "The hidden layer",
        title: "The False Breakout: The Trap That Trains Traders",
        body: [
          "Not every break is real. A false breakout pierces a level, sucks in the breakout hunters, then closes back inside the range — leaving the latecomers trapped. The false breakout is the market's most expensive lesson, and the fix is the same one you've learned all chapter: wait for confirmation."
        ],
        bullets: [
          "A pierce without a close beyond the level is a fakeout.",
          "The trap: buying the wick, not the close.",
          "Confirmation = price closes beyond and holds the retest.",
          "The false breakout trains exactly the patience the market pays for."
        ],
        fig: candFig([{ o: 44, h: 58, l: 38, c: 50 }, { o: 46, h: 60, l: 40, c: 52 }, { o: 62, h: 80, l: 58, c: 66 }, { o: 58, h: 64, l: 50, c: 52 }], { levels: [{ v: 66, t: "RESISTANCE" }], notes: [{ x: 190, y: 16, t: "PIERCED — then closed back inside" }], alt: "false breakout piercing resistance then closing back inside" }),
        insight: "The wick is the promise; the close is the proof. Trade closes, not wicks, and the trap springs on someone else."
      },
      {
        eyebrow: "Before the quiz",
        title: "The Trader's Checklist",
        body: [
          "Before the quiz, make sure you can answer these out loud: What are the three states of price, and how do you identify each? What's the difference between an impulse and a correction? What do higher highs and higher lows tell you? What is support, what is resistance, and when do they flip? What's the breakout sequence, and why do retests help? What makes a channel tradable? And is trading reactive or predictive?"
        ],
        bullets: [
          "Uptrend = higher highs + higher lows; downtrend = lower highs + lower lows; consolidation = same area.",
          "Impulses push with the trend; corrections breathe against it — in every trend.",
          "Support holds → buy; resistance holds → sell.",
          "Resistance broken → becomes support → buy the retest; support broken → becomes resistance → sell the retest.",
          "Breakout → retest → continue; most breakouts follow consolidation.",
          "Narrow channels give clean breakouts; wide channels are weak.",
          "Successful trading is reactive, not predictive."
        ],
        insight: "If you can explain these in your own words, the quiz is already won. If not, re-read — the questions reward the student who did the reading."
      },
      {
        kind: "close",
        eyebrow: "Before the test",
        title: "The Flow Is the Edge",
        body: [
          "You've learned to read the market's flow — the trends, the floors and ceilings, the breakouts and retests, and the discipline of reacting to what price proves. Structure is no longer noise; it's a map.",
          "Now prove it: 23 questions stand between you and Chapter 6: Trading Psychology. Pass, and you'll learn to protect the edge you just built."
        ]
      },
      null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null
    ]
  },
  {
    id: 6, title: "Trading Psychology", slides: 48,
    focus: "The trader's greatest edge",
    diff: 3, // the hardest chapter to OBEY — theory is easy, behaviour is the fight
    mins: 52,
    quizSlides: [37,38,39,40,41,42,43,44,45,46,47,48],
    quiz: [
      { q: "In the case of fear, traders should…",
        options: ["Liquidate their positions and sit on the cash", "Consider what they are afraid of and why they are afraid", "Take risks"], answer: 1,
        explain: "Fear is a signal, not a command. The professional pauses and asks what the fear is protecting them from — then decides with the brain, not the gut. Sitting on cash forever is still fear, just dressed as safety." },
      { q: "You should never…",
        options: ["Indicate fear during a trade", "Indicate patience during a trade", "Indicate rationality during a trade"], answer: 0,
        explain: "Patience and rationality are strengths to show. Fear is the leak — it reads as hesitation in your entries, panic in your exits, and it invites the market to punish exactly that. Never trade scared." },
      { q: "Fear can affect both…",
        options: ["The markets and sentiment", "Fundamental and macro analysis", "Your portfolio and you"], answer: 2,
        explain: "Fear doesn't move the market — it moves YOU. It distorts your decisions before they ever reach the chart, and every distorted decision lands in your portfolio. The battlefield is between your ears." },
      { q: "In the case of a live bad trade, you should end the position and take the current loss.",
        options: ["True", "False"], answer: 0,
        explain: "A trade that broke your plan is a bad trade — end it and take the small, defined loss. Hoping it 'comes back' turns a 1R mistake into a 5R disaster. Cut fast, stay alive, fight tomorrow." },
      { q: "In the case of a live good trade, you should end the position and take the current profit.",
        options: ["True", "False"], answer: 1,
        explain: "The opposite — a good trade running according to plan should be LET to run toward its target. Taking profit early on winners is fear in disguise: it caps your winners while your losses stay full-sized." },
      { q: "Regardless of your sentiment and perception of any current trade, every trade has to live up to its fullest potential and be left to run without a premature end.",
        options: ["True", "False"], answer: 0,
        explain: "Once the plan is valid, your job is to execute it — not to re-feel it. Letting winners reach their potential is how 1R risks become 3R rewards. The premature exit is the retail signature." },
      { q: "As long as you maintain a fixed risk, you may alter your reward (profits).",
        options: ["True", "False"], answer: 0,
        explain: "Risk is the anchor — it never changes mid-session. Reward is flexible: you may manage the exit, trail the stop, or take partials. Fixed risk + flexible reward is the professional's formula." },
      { q: "If you achieve a winning streak longer than 12 days, you may alter your risk management.",
        options: ["True", "False"], answer: 1,
        explain: "A long winning streak is exactly when you should touch NOTHING. Streaks inflate confidence and quietly raise your risk — that is how 12 good days hand back 3 months of work. Risk stays fixed, always." },
      { q: "If you lose all of your 3 trades in a day, you should consider…",
        options: ["Altering your risk management system", "Accepting it, knocking off, and waiting for the next day", "Balancing it out by trading until you make it back"], answer: 1,
        explain: "Three losses means the day is over — emotionally and statistically. Chasing it back is revenge trading: the fastest way to turn one bad day into a blown account. Accept, stop, come back fresh." },
      { q: "How can you overcome fear if you ever have to face it?",
        options: ["Acquire knowledge and understand the market", "Avoid the market entirely whenever you feel scared", "Risk more to prove you're not afraid"], answer: 0,
        explain: "Knowledge is the cure — you can't fear what you understand, which is why the chapter pairs size reduction with study: smaller size buys you the calm to keep executing while the knowledge builds. Avoiding the market forever is still fear in disguise, and risking MORE to prove yourself is how fear gets you blown up." },
      { q: "You should focus more on your account balance than on your system.",
        options: ["True", "False"], answer: 1,
        explain: "Watch the system, not the scoreboard. The balance is the OUTPUT of your process — if the process is right, the balance follows. Staring at P&L mid-trade is how traders abandon perfect plans." },
      { q: "Successful traders find or blame losses on external reasons.",
        options: ["True", "False"], answer: 1,
        explain: "The opposite. Professionals own every result — win or loss — because ownership is the only path to fixing the next one. Blaming the broker, the news, or the market hands your edge to someone else." }
    ],
    native: [
      {
        eyebrow: "Chapter 6 · The trader's greatest edge",
        title: "Trading Psychology",
        lead: "Focal points in this chapter",
        body: [
          "Every strategy in this course runs on the same engine: you. Your fear, your greed, your discipline, your patience. The market is a mirror — it simply reflects back whoever is holding the mouse.",
          "By the end of this chapter you will understand why psychology decides your P&L more than any setup, and you'll learn the exact habits professionals use to keep their emotions out of the trade."
        ],
        insight: "This is the only chapter where the lesson is about the reader. Read it slowly — you are the subject."
      },
      {
        eyebrow: "Why it matters",
        title: "The $1 Trillion Lesson",
        body: [
          "Ask any trading floor veteran what separates the winners from the crowd and you'll hear a version of the same answer: it was never the strategy. Two traders can run identical systems — same entries, same exits — and produce opposite results. The difference lives entirely in how each one behaves under pressure.",
          "Industry studies consistently show that the majority of retail losses trace back to behaviour, not analysis: cutting winners early, holding losers too long, overtrading after a loss, and abandoning the plan at the first sign of drawdown."
        ],
        bullets: [
          "The same system + different psychology = different P&L.",
          "Most retail losses are behavioural — fear and greed executing trades the brain never approved.",
          "Your edge is not the setup. Your edge is your ability to execute the setup, exactly, over and over."
        ],
        insight: "You don't need a better strategy. You need to stop being the strategy's weakest link."
      },
      {
        eyebrow: "The three pillars",
        title: "Strategy · Risk · Psychology",
        body: [
          "Every profitable trader stands on three pillars — and they must all bear weight. Strategy tells you WHAT to trade. Risk management tells you HOW MUCH you can afford to be wrong. Psychology decides whether you can actually do it when it matters.",
          "A broken pillar collapses the roof. A great strategy with sloppy risk still loses. Great risk with an emotional trader still loses. Psychology is the pillar that holds the other two up."
        ],
        bullets: [
          "Strategy — the edge: where, when and why you enter and exit.",
          "Risk — the survival: position size, stop loss, daily loss limits.",
          "Psychology — the execution: doing pillar one and two on your worst day, not just your best."
        ],
        insight: "You will lose with a bad strategy. You will go bankrupt without risk. But without psychology, you'll do both — while knowing better."
      },
      {
        eyebrow: "The inner market",
        title: "The Two Wolves",
        body: [
          "There's an old story: inside every trader two wolves fight. One is fear — it wants to protect you, freeze you, and make you run. The other is greed — it wants more, faster, and never enough. Whichever one you feed is whichever one trades your account.",
          "Fear and greed aren't enemies to destroy — they're instincts that misfired. Fear kept your ancestors alive. Greed drove them to hunt. The market weaponises both against you, which is why awareness is your first defence."
        ],
        bullets: [
          "Fear protects → but makes you exit winners early and avoid good setups.",
          "Greed drives → but makes you oversize, overtrade and hold too long.",
          "Awareness is the third wolf — the one that watches the other two and refuses to let either hold the mouse."
        ],
        insight: "You cannot silence the wolves. You can only stop feeding them. Every trade is a choice about which one eats."
      },
      {
        eyebrow: "Understand the enemy",
        title: "The Anatomy of Fear",
        body: [
          "Fear is not weakness — it is a survival programme wired millions of years deep. In the wild it kept you from being eaten. In the markets it makes you act exactly when you shouldn't: it cuts your winners, rescues your losers, and freezes you out of the move you analysed perfectly.",
          "The trader's fear is almost always the same creature: loss aversion. The pain of losing feels roughly twice as strong as the pleasure of winning the same amount. So the brain quietly re-writes the plan — take the small win now, protect the losing position, avoid the risk entirely."
        ],
        bullets: [
          "Loss aversion: losing 1R hurts about twice as much as gaining 1R feels good.",
          "That asymmetry makes the brain sabotage the plan to 'avoid the pain'.",
          "You cannot delete the wiring — but you can override it with rules written BEFORE the trade."
        ],
        insight: "Fear doesn't knock — it whispers. It whispers 'just this once', 'what if', 'are you sure'. Write your rules so loud that the whisper can't be heard."
      },
      {
        eyebrow: "How it shows up",
        title: "Fear at the Keyboard",
        body: [
          "Fear never announces itself. It disguises itself as logic. Recognise these three costumes — every trader wears at least one of them at some point."
        ],
        bullets: [
          "The Freeze — you see a perfect setup and do nothing, convincing yourself 'it's too risky today'.",
          "The Rescue — a losing position 'needs more time'; you move the stop further, hoping.",
          "The Fade — you win quickly and bail, terrified the profit will vanish — capping every winner at 0.5R."
        ],
        insight: "If you can name the costume, you can remove it. The freeze, the rescue and the fade all break the same rule: the plan made before the trade is the only plan allowed during it."
      },
      {
        eyebrow: "The two antidotes",
        title: "Knowledge and Size",
        body: [
          "Fear is powered by uncertainty — and uncertainty shrinks when you feed it information. The trader who knows exactly what the setup requires, exactly where the stop sits, and exactly what the risk is has very little left to fear. That is why this course exists.",
          "And when fear still bites, there is a second, mechanical answer: risk less. If a position size keeps you up at night, cut it until it doesn't. Trading at a size you can watch calmly is not weakness — it is the professional's secret weapon."
        ],
        bullets: [
          "Knowledge shrinks fear: study the setup until the trade becomes boring and obvious.",
          "Size is the volume knob on emotion: smaller size = calmer execution.",
          "Never fight fear by risking MORE — that is greed wearing fear's coat."
        ],
        insight: "Every trader fears the same three things: being wrong, losing money, and missing out. Know them, size for them, and they lose their power."
      },
      {
        eyebrow: "The other wolf",
        title: "The Greed Machine",
        body: [
          "Greed is the quieter killer. Fear makes you freeze; greed makes you move too much. It arrives dressed as confidence: 'the market is moving — double the size', 'one more trade', 'this one is different'.",
          "Greed compounds in silence. A trader who is afraid and knows it will act cautiously. A trader who is greedy rarely realises it until the loss is too big to ignore — because greed feels GOOD while it's happening."
        ],
        bullets: [
          "Greed oversizes: it mistakes a good streak for a sure thing.",
          "Greed overtrades: it converts boredom into 'opportunity'.",
          "Greed holds: it turns a winning trade into a losing one by refusing to take profit at the target."
        ],
        insight: "Fear costs you the trade in front of you. Greed costs you the account behind you. Fear is the loud enemy — greed is the polite one. Watch them both."
      },
      {
        eyebrow: "See it clearly",
        title: "The Fear–Greed Pendulum",
        body: [
          "Every market cycle is a pendulum swinging between fear and greed. At the extremes, the crowd is most confident and least right. Professionals study the pendulum's position the way sailors study the wind — they never fight it, they set sails to it."
        ],
        fig: psyFig("pendulum"),
        bullets: [
          "Extreme fear = panic selling = prices below value.",
          "Extreme greed = euphoric buying = prices above value.",
          "The professional's job is the balance point — where emotion is loudest, opportunity is clearest."
        ],
        insight: "The crowd is most wrong exactly when it feels most certain. If you feel euphoric or terrified, the pendulum is telling you where the crowd stands — and you should be somewhere else."
      },
      {
        eyebrow: "The core skill",
        title: "Discipline Is a System, Not a Feeling",
        body: [
          "Amateurs rely on motivation. Professionals rely on systems — because motivation is weather and systems are architecture. The trader who 'feels like trading' today and 'doesn't feel like it' tomorrow is a coin flip with a dashboard.",
          "Discipline is not gritting your teeth through a bad trade. It is building the trade before the market opens: the checklist, the stop, the size, the target — written down, decided, sealed. When the market arrives, you don't decide anything. You simply execute what you already decided."
        ],
        bullets: [
          "Decide BEFORE the session; execute DURING it.",
          "Rules are the anti-fear vaccine — they work even when your feelings don't.",
          "Motivation gets you to the desk. Systems keep you profitable."
        ],
        insight: "The market pays you for the trades you planned and executes against the ones you improvised. Every impulse trade is a gift to someone else's edge."
      },
      {
        eyebrow: "Where your eyes go",
        title: "Watch the System, Not the Account",
        body: [
          "Beginners watch the balance. Professionals watch the process — and let the balance take care of itself. Staring at P&L mid-trade is the fastest way to abandon a perfect plan: a 0.4R unrealised loss feels like a crisis when it's actually just the trade breathing."
        ],
        bullets: [
          "The balance is the OUTPUT of the process, not the target of your attention.",
          "Judge yourself on checklist adherence, not on the current floating number.",
          "Cover the P&L if you have to — the market will show you the score at the end of the session."
        ],
        insight: "You cannot trade the balance into profit by watching it. You trade the system — the balance is just the echo.",
        styles: {
          scalper: "Your account swings every minute by design. Judge each of your 20 daily trades by the checklist, never by the running total — scalpers who watch P&L mid-session stop taking their own signals.",
          day: "Mid-session P&L is the day trader's classic trap — one red hour and the plan is gone. Check the process at the close, not the ticker during it.",
          swing: "Your position breathes for days. The daily P&L is noise; the weekly process review is the signal. Never let one day's float change a multi-day plan.",
          position: "Your P&L will be red for weeks inside a correct thesis. The only number you should watch is whether the thesis is still true — not the float."
        }
      },
      {
        eyebrow: "The first law",
        title: "Cut Losers, Fast",
        body: [
          "The market has exactly one law that never breaks: a small loss taken early is cheaper than a big loss taken late. Professionals take the loss the moment the trade stops being the trade they planned — not when it stops hurting.",
          "The stop is not a suggestion. It is a pre-commitment you made while calm, and the only person who can break it is the panicked version of you. When the trade is bad, you end it and take the current loss. That act — not the strategy — is what keeps you in the game long enough to win."
        ],
        bullets: [
          "A bad trade is one that broke your plan — wrong market, missed level, invalidated setup.",
          "End it and take the small loss. The loss is tuition; the hope is compounding.",
          "'It might come back' is the most expensive sentence in trading."
        ],
        insight: "Winners are made of many small losses and a few large gains. The trader who can't take a 1R loss simply can't stay alive for the 3R win."
      },
      {
        eyebrow: "The second law",
        title: "Let Winners Run",
        body: [
          "Cutting losers fast is half the formula. The other half is letting winners reach their potential — and this is the half most retail traders fail. They exit at the first hint of green, terrified the profit will vanish, and then wonder why their winners are all tiny.",
          "A premature exit on a winning trade is fear wearing the mask of prudence. The trade was planned to reach a target — give it the room to get there. The market rewards the exit you planned, not the exit you feared."
        ],
        bullets: [
          "A good trade, running to plan, should be left to run toward its target.",
          "Taking profit early caps every winner while your losses stay full-size — a losing formula.",
          "If the setup was worth entering, it is worth letting finish."
        ],
        insight: "Every trader who consistently wins has mastered the same asymmetry: small, fast losses and patient, full winners. The maths only works if you let the winners breathe."
      },
      {
        eyebrow: "The contract",
        title: "Every Trade's Full Potential",
        body: [
          "Here is the psychological contract you sign with every entry: I will not re-feel this trade. I decided while calm what it deserves — its stop, its target, its potential — and my sentiment during the trade has no vote.",
          "The trade lives or dies by its plan. You let it live up to its fullest potential and run without a premature end — because the moment you start 'managing' it with emotion, you are no longer trading the market. You are trading your feelings."
        ],
        bullets: [
          "The plan was written by your best self — the scared version of you is not allowed to edit it.",
          "No premature exits: the target is the target until the structure says otherwise.",
          "Sentiment has a seat, not a vote, in every trade you take."
        ],
        insight: "The trade doesn't care how you feel about it. Care about it enough to follow the plan, and not enough to break it.",
        styles: {
          scalper: "Your full potential is measured in seconds — a scalp that hits its 8-pip target must be allowed to GET there before you second-guess. Trust the plan for the 90 seconds it takes.",
          day: "Your winner deserves the session's whole move, not the first leg. If the plan says ride to the close, ride — the 9am exit is fear, not analysis.",
          swing: "Your trades take days to mature. A premature exit on day one is how swing traders turn 3R winners into 1R losers — let the structure play out.",
          position: "Your thesis plays out over weeks. Emotional noise on a given Tuesday has no authority over a position sized for a quarter."
        }
      },
      {
        eyebrow: "The formula",
        title: "Fixed Risk, Flexible Reward",
        body: [
          "Professionals keep one number completely frozen and let the other flex. The frozen number is risk — the amount you lose if the trade is wrong never changes mid-session. The flexible number is reward — you may trail the stop, take partials, or let the winner climb.",
          "The maths is brutal and beautiful: if your loss is always 1R but your wins average 2–3R, you can be right less than half the time and still grow. That only works if the risk side never moves."
        ],
        fig: psyFig("ladder"),
        bullets: [
          "Fixed risk: the stop is decided before entry and never widened.",
          "Flexible reward: exits can be managed — trail, partial, target.",
          "A 40% win rate with a 2.5R average win still compounds."
        ],
        insight: "The market can take your profit target away from you. It can never take your stop — unless you give it to them. Guard the fixed side like your life, because it is your trading life."
      },
      {
        eyebrow: "Know the ride",
        title: "The Emotional Cycle of a Trade",
        body: [
          "Every trade is a small emotional journey. You enter hopeful, watch it dip and feel dread, watch it recover and feel hope, and then either relief or euphoria at the end. The amateur's mood is a rollercoaster that matches the chart — and the professional's is a flatline.",
          "The flatline is not numbness. It is preparation. The professional has already lived this trade a hundred times in review and simulation, so the drawdown is expected, the breakeven is planned, and the profit is simply the plan working. Nothing in the trade is a surprise — so nothing in it can scare them."
        ],
        fig: psyFig("cycle"),
        bullets: [
          "Entry: excitement — the most dangerous emotion, it invites oversizing.",
          "Drawdown: dread — the moment most plans get abandoned.",
          "Breakeven: hope — where patience either earns the winner or gives it away.",
          "Profit: relief or euphoria — either way, the NEXT trade starts at zero."
        ],
        insight: "You can't control the market's cycle, but you can control your cycle: the more you rehearse the ride, the flatter your line gets."
      },
      {
        eyebrow: "The unglamorous hour",
        title: "The Boring Middle",
        body: [
          "Between the exciting entry and the satisfying exit lies the boring middle — hours, sometimes days, of nothing visibly happening. The amateur's brain reads boredom as failure and 'does something': adds, exits, re-enters, checks the balance 40 times. The professional reads boredom as the plan working and does nothing.",
          "Mastering the boring middle is the most profitable skill in this entire chapter. It is where most traders lose the trade they already won — not by bad entries, but by refusing to wait."
        ],
        bullets: [
          "Boredom is the plan working, not the plan failing.",
          "Doing nothing, deliberately, is an action — often the correct one.",
          "Set the trade, close the chart, live your life. The market doesn't need supervision."
        ],
        insight: "The market pays professionals for their patience and charges amateurs for their restlessness. The boring middle is where the money is actually made."
      },
      {
        kind: "pause",
        eyebrow: "Mid-chapter reflection",
        title: "Breathe. You've Earned It.",
        body: [
          "You're halfway through the hardest chapter to obey — and that deserves a pause, not a sprint. Step back from the screen, take a breath, and let the first half of this chapter settle before the second half begins."
        ],
        insight: "Reflection is where reading becomes understanding. The trader who pauses, absorbs and writes a note learns twice as fast as the one who never stops."
      },
      {
        eyebrow: "The dangerous wins",
        title: "Streak Inflation",
        body: [
          "Winning streaks are the market's most seductive trap. After a run of green days, the brain quietly rewrites the rules: you are 'in the zone', you are 'due', your risk should 'match your momentum'. This is streak inflation — and it is exactly when professionals freeze every setting.",
          "A long winning streak is not evidence that the market changed. It is evidence that your system is working — which means the worst thing you can do is alter it. The streak is the reward for the discipline; don't spend it by abandoning the discipline."
        ],
        bullets: [
          "Streaks inflate confidence faster than they inflate your account.",
          "Altering risk after wins is how 12 good days hand back 3 months of work.",
          "The system that made the streak is the system that keeps it — touch nothing."
        ],
        insight: "The market's cruelest trick is making you feel invincible right before it tests whether you really are. Your streak is the trophy for the rules — not permission to break them.",
        styles: {
          scalper: "Your 20-trade days make streaks fast — and fast streaks inflate size fast. A scalper who doubles size after 5 green trades is one bad hour from giving it all back.",
          day: "A week of green days whispers 'you've figured it out'. The pro's reply: same size, same plan, same flat-by-close — forever.",
          swing: "Multi-week streaks feel like mastery. They are not — they are a run of good luck inside a good system. Keep the risk identical and let the system compound.",
          position: "A long winning thesis can convince you the market owes you more. It owes you nothing — re-size only when the THESIS changes, never when the P&L is green."
        }
      },
      {
        eyebrow: "The daily circuit breaker",
        title: "The 3-Loss Rule",
        body: [
          "The most important rule most traders refuse to write down: three losses in a day means the day is over. Not because the market says so, but because YOU have changed. After three losses, your judgment is no longer yours — the brain is chasing, compensating, and hunting for revenge.",
          "The professional's response to a 3-loss day is embarrassingly simple: accept it, knock off, and wait for the next day. The market will still be open tomorrow — it always is. What it will not give back is the account you blew trying to make today better."
        ],
        bullets: [
          "Three losses = emotional fatigue, regardless of size.",
          "Accepting the day is a discipline, not a defeat.",
          "The next day is a fresh mind and a fresh session — protect it."
        ],
        insight: "No trade is worth taking from a tilted mind. The 3-loss rule isn't about the losses — it's about the version of you that appears after them."
      },
      {
        eyebrow: "The danger loop",
        title: "Revenge Trading",
        body: [
          "Revenge trading is the market's favourite way to eat accounts: lose a trade, feel the sting, and immediately re-enter to 'win it back'. The loss was 1R — but the revenge trade is 3R, rushed, undersized in logic, and aimed at recovering the loss instead of following the setup.",
          "The loop feeds itself. The revenge trade usually loses too, so the next one is bigger, angrier, later at night. Traders don't blow up on bad signals — they blow up on the trades taken after the bad signals, when the account is being driven by ego instead of edge."
        ],
        bullets: [
          "Revenge is the ego's attempt to refund a loss it couldn't accept.",
          "Every revenge trade skips the plan — by definition, it's not a setup, it's a reaction.",
          "The only winning move is to stop: the market will not be forced, but it can be waited on."
        ],
        insight: "The market doesn't know you lost, and it doesn't care. The only person trying to make the loss back is the version of you that's about to make it worse."
      },
      {
        eyebrow: "Own the result",
        title: "Responsibility Over Blame",
        body: [
          "There are two kinds of traders. One loses a trade and blames the broker, the news, the spread, the manipulators, the 'bad luck'. The other loses a trade and asks one question: what did MY process do wrong, and what do I fix?",
          "Blame is comfortable and useless — it explains nothing and changes nothing. Ownership is uncomfortable and priceless: it is the only place where the next trade can be better. Professionals never hand their results to external reasons, because that would mean handing their edge away with it."
        ],
        bullets: [
          "Blame hands your power to forces you cannot control.",
          "Ownership gives you the one thing the market can't take: the ability to improve.",
          "The loss was yours. So is the lesson. And so is the next trade."
        ],
        insight: "You will never meet a consistently profitable trader who blames the market for their losses. The account is the mirror — and you are the only one in it."
      },
      {
        eyebrow: "The mirror",
        title: "The Journal Is a Mirror",
        body: [
          "Your trading journal is not a record of the market — it is a record of YOU. Price data is public; your decisions are the only private information you have, and they are the only thing you can actually improve.",
          "The most powerful journal entry is the one that includes the invisible data: how you felt at entry, what you feared, what you were chasing. Weeks later, the pattern leaps out — you cut winners on Tuesdays, you revenge-traded after lunch, you skipped your best setup when you were tired. Patterns you cannot see in real time become obvious on paper."
        ],
        bullets: [
          "Record the trade: setup, entry, exit, R-multiple.",
          "Record the human: emotion at entry, fear during the trade, state of mind.",
          "Review weekly: one pattern fixed a month beats ten strategies memorised."
        ],
        insight: "A trade you don't journal is a lesson you chose not to take. The market charges tuition either way — write it down so you only pay once."
      },
      {
        eyebrow: "The modern fear",
        title: "FOMO — The Fear of Missing Out",
        body: [
          "The newest wolf is FOMO — the fear of missing out. It whispers while the market runs without you: 'it's moving, get in, you're being left behind'. It is greed and fear wearing one coat: the fear of missing the gain greed insists you deserve.",
          "FOMO's signature is entry without analysis. The trade is not a setup — it is a reaction to price moving without you. Chasing it usually means buying the top of a move that has already happened, then holding a position that was never planned."
        ],
        bullets: [
          "If the move already happened, the opportunity already happened — the trade is now risk.",
          "There is always another setup. The market has produced one every day for decades.",
          "Missed trades are not losses. They are prices you chose not to pay."
        ],
        insight: "You will never run out of markets, pairs, or sessions. The trader who accepts missing one move is the trader who is calm for the next hundred."
      },
      {
        eyebrow: "After the wins",
        title: "Overconfidence After Wins",
        body: [
          "Winning is a drug, and the market is the dealer. After a string of wins, confidence inflates past competence — the brain starts believing the wins were skill and the losses were bad luck, when in reality your win rate barely moved.",
          "Overconfidence is dangerous precisely because it feels excellent. It quietly raises your size, lowers your standards, and skips your checklist. The professional treats every win the same as every loss: as data. The system did the work; your job is to do nothing differently."
        ],
        bullets: [
          "Wins and losses are both just outputs of the process — neither deserves a rule change.",
          "Confidence follows competence. If your behaviour didn't change, your confidence shouldn't either.",
          "After a win streak, run your checklist twice. Before a loss streak, run it twice too."
        ],
        insight: "The market doesn't care how good your last five trades felt. It cares what you do on trade six. Same size, same plan, same discipline.",
        styles: {
          scalper: "For scalpers, overconfidence hits intraday — 7 green trades by 10am and suddenly the 11th isn't checked the same way. That 11th trade is the one the market designed for you.",
          day: "The day trader's danger window is after lunch on a green morning. The session isn't won until it's flat at the close — no size changes, no 'confident' adds.",
          swing: "A winning swing position can feel like genius. It isn't — let it run per plan, but never add size just because it's already green.",
          position: "A thesis that's working is the most tempting time to double down. Compounding is real — but it belongs in your plan, not your mood."
        }
      },
      {
        eyebrow: "Inside the 1%",
        title: "How Professionals Think",
        body: [
          "What do consistently profitable traders actually do differently? It is not secret indicators or hidden knowledge. It is a set of boring, repeatable habits that the crowd finds too unglamorous to copy.",
          "They take the same size whether they're winning or losing. They review every trade in a journal. They treat a 3-loss day as a stop sign. They let winners run per plan and cut losers without negotiation. They measure success in process, not in the P&L of any single day. None of this is secret — all of it is hard, which is exactly why it works."
        ],
        bullets: [
          "Same risk every trade — streaks change nothing.",
          "Journal every trade — including the skipped ones and the emotions.",
          "Judge on checklist adherence — the P&L is the echo, not the target.",
          "Walk away on tilt — the market is eternal, your discipline is finite."
        ],
        insight: "The 1% don't have a different brain. They have a different relationship with discomfort — they do the unglamorous thing the crowd is too bored to do."
      },
      {
        eyebrow: "Your lens",
        title: "Psychology Wears Your Style",
        lead: "The same emotional traps, wearing the clothes of your trading style",
        body: [
          "Fear and greed don't look identical in every trader — your style gives them a uniform. A scalper's fear is a different creature from a position trader's. Know the shape of YOUR enemy."
        ],
        styles: {
          scalper: "Your enemy is reaction speed — fear shows as hesitating on a signal that's already moving, greed as taking the 11th trade when you're tired. The fix: a strict daily trade limit and a checklist shorter than your timeframe.",
          day: "Your enemy is the session — fear shows as abandoning a valid morning bias by midday, greed as 'one more hour' of trading chop. The fix: bias written at the open, flat-by-close, and no decisions after lunch.",
          swing: "Your enemy is the wait — fear shows as exiting on day two of a five-day plan, greed as adding size mid-position. The fix: targets and stops set at entry, reviewed only at the daily close, never intraday.",
          position: "Your enemy is the thesis — fear shows as closing a correct position during a routine drawdown, greed as over-allocating to a 'sure' theme. The fix: the thesis has an exit trigger written at entry; everything else is noise."
        },
        insight: "The emotional trap is always the same — it just wears your timeframe's uniform. Name yours and you've already disarmed it."
      },
      {
        eyebrow: "Build the ritual",
        title: "The Pre-Trade Ritual",
        body: [
          "Professionals don't walk from their lives straight into the market. There is a bridge — a pre-trade ritual that turns the person who argues with their spouse or stresses about rent into the person who executes a plan. The ritual is the door between the two.",
          "It doesn't need to be spiritual. It needs to be repeatable: check the calendar for news, review the higher timeframe, write the bias, mark the levels, confirm the size, read the checklist out loud. Ten minutes. Every session. Non-negotiable."
        ],
        bullets: [
          "Check the event calendar — never trade blind into a release.",
          "Write today's bias BEFORE price starts moving.",
          "Pre-mark levels: entry, stop, target, size — decided in advance.",
          "If you can't articulate the setup in one sentence, you don't have one."
        ],
        insight: "The ritual isn't about the market. It's about which version of you sits at the keyboard — the ritualed version is the only one allowed to trade."
      },
      {
        eyebrow: "Know your state",
        title: "Tilt Detection",
        body: [
          "Tilt is the fog that rolls in before a bad decision: irritation, excitement, fatigue, or that specific hunger to 'get it back'. Tilt doesn't announce itself — it arrives as confidence, urgency, or boredom, and by the time you notice you're already mid-mistake.",
          "So professionals build a tripwire: a state check before every trade. Am I tired? Am I angry? Am I bored? Am I chasing? If the answer to any is yes, the trade is off — not because the setup is bad, but because YOU are not the trader who should take it."
        ],
        bullets: [
          "A two-second state check: tired? angry? bored? chasing?",
          "One 'yes' = no trade. The setup will still be there tomorrow; your tilt won't be.",
          "Physical state is psychological state — sleep and hunger are risk factors."
        ],
        insight: "The best traders don't have more willpower. They have better tripwires — and they respect the tripwire over their own excuses."
      },
      {
        eyebrow: "The body keeps the score",
        title: "Sleep, Fuel, and Focus",
        body: [
          "Your psychology runs on biology. A sleep-deprived trader processes risk differently — studies show tired brains become more impulsive, more optimistic about losses, and worse at reading threats. The market is not a place to negotiate with your own fatigue.",
          "The professional's performance stack is unglamorous: enough sleep, real food, water, and a session timed to your sharpest hours. Trading is a performance sport — the instrument is your nervous system, and you only get one."
        ],
        bullets: [
          "Sleep is a risk-management tool: exhausted traders over-risk by measurable amounts.",
          "Trade your peak hours — not the hours you're 'free'.",
          "No trading from bed, from stress, or from the middle of a fight."
        ],
        insight: "The market never pays you for trading tired. It pays you for trading sharp — which means the night before a session is part of the session."
      },
      {
        eyebrow: "Fail cheap",
        title: "Fail Cheap in the Lab",
        body: [
          "This is where everything in this chapter becomes practical: the Laboratory. Every emotion you've met here — fear, greed, FOMO, revenge — you can experience it safely inside a simulator, at zero cost, with full honesty, because nobody is watching your P&L.",
          "That is the entire point of practice: the market will not give you a rehearsal, so take one anyway. Fail a hundred times on a demo chart, learn what your fear feels like, build your tripwires there — so that when real money is on the line, the reactions are already trained."
        ],
        bullets: [
          "Simulate the emotions, not just the setups — trade the lab like it's real.",
          "Journal your lab trades the same way: feelings included.",
          "The trader who fails cheap in practice is the trader who fails small in reality."
        ],
        insight: "Practice isn't about getting it right. It's about meeting your own psychology somewhere safe — before the market charges you tuition for the meeting."
      },
      {
        eyebrow: "Reframe the game",
        title: "Redefine Winning",
        body: [
          "If you define winning as 'green P&L today', the market will win most days — because you cannot control the outcome of any single trade. But if you define winning as executing the plan perfectly, you can win every single day, because that is entirely in your control.",
          "This reframe is the quiet engine of professional psychology. The trader chasing money chases a moving target and feels the sting of every loss. The trader chasing execution gets the same results — with a calm mind, a process that compounds, and no emotional debt."
        ],
        bullets: [
          "A perfect execution on a losing trade is a win. A sloppy execution on a winning trade is a loss.",
          "Process wins are available every day; P&L wins are not.",
          "Compounding favours the calm — the calm comes from the definition."
        ],
        insight: "Change what you're playing for and the whole game changes. The professionals aren't luckier — they're playing a different, winnable game."
      },
      {
        eyebrow: "Release perfection",
        title: "The 70% Rule",
        body: [
          "No trader wins them all. A 60–70% win rate with a positive expectancy is elite — and even the best traders lose roughly a third of their trades. The amateur treats every loss as a personal failure and lets it poison the next decision. The professional treats a loss as the price of doing business, pays it, and moves on.",
          "Chasing 100% is the most expensive goal in trading. It makes you hold losers hoping they recover (to avoid the loss), exit winners early (to secure the win), and skip valid setups (to protect the record). Perfectionism is just fear wearing a gold medal."
        ],
        bullets: [
          "Expect to lose: it's not a bug in your system, it's the system.",
          "One loss says nothing about the next trade — the sequence is what matters.",
          "Aim for consistent execution, not a flawless record."
        ],
        insight: "The market is not grading your perfection. It is rewarding your consistency. One loss, taken correctly, is a professional trade."
      },
      {
        eyebrow: "The portrait",
        title: "What a Professional Looks Like",
        body: [
          "Put it all together and a clear portrait emerges. The professional trader is not the loudest person in the room — they are the calmest. They are not the most excited about wins — they are the most consistent. They are not fearless — they are prepared."
        ],
        bullets: [
          "Takes the same risk whether winning or losing.",
          "Cuts losers without negotiation; lets winners run to plan.",
          "Stops at the 3-loss rule and the daily limit — always.",
          "Journals every trade, emotions included.",
          "Blames no one, owns everything, improves weekly.",
          "Trades their sharpest hours, never their tired or angry ones."
        ],
        insight: "You don't need to become someone else to trade well. You need to become someone who follows rules — and that someone is already in you, waiting to be chosen."
      },
      {
        eyebrow: "Before the quiz",
        title: "The Trader's Creed",
        body: [
          "Before you prove this chapter, say the creed out loud — it is the whole chapter in one breath: I watch my system, not my account. I cut losers fast and let winners run. My risk is fixed; my reward may climb. I stop at three losses. I own every result. I write it down. I do the boring, unglamorous work — and the market pays me for exactly that.",
          "If you can say it and mean it, the twelve questions ahead are simply the confirmation of what you already believe."
        ],
        bullets: [
          "Fear is a signal — name it, size down, and trade the plan anyway.",
          "Greed is quiet — same size, same plan, every day.",
          "The journal and the checklist are your anti-tilt tripwires.",
          "Winning is execution. Losing a planned trade is tuition, not failure."
        ],
        insight: "The quiz tests the chapter. The market will test the creed. Learn the creed now and the market's test becomes a formality."
      },
      {
        kind: "close",
        eyebrow: "Before the test",
        title: "The Mind Is the Edge",
        body: [
          "You have now met the market's real opponent: not other traders, but yourself. The fear, the greed, the streak inflation, the revenge loop, the FOMO — every trap has a name now, and every name is a tripwire you can set.",
          "Now prove it: 12 questions stand between you and Chapter 7: Risk Management — the chapter that will turn this psychology into a survival system. Pass, and you'll learn how the trader who stays calm also stays alive."
        ]
      },
      null, null, null, null, null, null, null, null, null, null, null, null
    ]
  },
  {
    id: 7, title: "Risk Management", slides: 77,
    focus: "Protecting capital, staying alive",
    diff: 3, // the hardest chapter — real math + discipline that fights human instinct
    mins: 85,
    quizSlides: [48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77],
    quiz: [
      { q: "Margin is a percentage of the full value of a trading position that you are required to put forward in order to open your trade.",
        options: ["True", "False"], answer: 0,
        explain: "True — margin is the deposit your broker holds as a percentage of the position's full value, not the full amount itself. It's your ticket into the position." },
      { q: "Leverage affects profits only.",
        options: ["True", "False"], answer: 1,
        explain: "False — leverage multiplies BOTH directions. It magnifies your profits AND your losses by exactly the same factor. That symmetry is the whole danger." },
      { q: "Leverage gives you the ability to control smaller positions with a larger capital investment.",
        options: ["True", "False"], answer: 1,
        explain: "The opposite — leverage lets you control LARGER positions with SMALLER capital. 1:30 leverage on $1,000 controls $30,000 of position. That power is exactly why the risk side must be controlled." },
      { q: "I want to open a position worth $150,000 and I have $5,000 as my balance. Which leverage could I use to facilitate this move?",
        options: ["1:50", "1:40", "1:30"], answer: 2,
        explain: "150,000 ÷ 5,000 = 30 — you need at least 1:30 leverage. Always match leverage to the position you can actually defend, never to the position you dream about." },
      { q: "The higher the leverage amount you choose, the better.",
        options: ["True", "False"], answer: 1,
        explain: "False — higher leverage multiplies your risk just as fast as your reward. Professionals use the LOWEST leverage that fits their plan, not the highest their broker offers." },
      { q: "As your margin level increases, your equity decreases.",
        options: ["True", "False"], answer: 1,
        explain: "False — margin level is equity divided by used margin; it's a ratio, not a value. A falling margin level (from losses or open positions) is the danger signal, not the other way around." },
      { q: "The minimum amount of equity that must be kept in a trader's account in order to keep their positions open is referred to as…",
        options: ["Margin control", "Maintenance Margin", "Margin level"], answer: 1,
        explain: "Maintenance margin is the minimum equity the broker requires to keep positions open. Fall below it and the broker acts — that's the line you never want to cross." },
      { q: "If your personal equity in your account falls below 25% of the current market value of the purchased asset, you will be subject to a margin call.",
        options: ["True", "False"], answer: 0,
        explain: "True — when equity drops below the maintenance level (often around 25% of the position's value, broker-dependent), the broker issues a margin call: add funds or positions get closed for you." },
      { q: "Volatility in forex trading is a measure of the frequency and extent of changes in a currency's value.",
        options: ["True", "False"], answer: 0,
        explain: "True — volatility measures how often and how far price moves. High volatility means big swings; low volatility means a quiet, ranging market. It's a description of the market, not a verdict." },
      { q: "Volatility has the ability to greatly affect the profits you may earn in the markets only, and minimize the losses you may encounter in a leveraged position.",
        options: ["True", "False"], answer: 1,
        explain: "False — volatility swings BOTH ways. The same big move that supercharges your profit will just as easily magnify your loss. Volatility is a multiplier, and it doesn't care which side you're on." },
      { q: "Select something you can control: politics, volatility, or risk.",
        options: ["Politics", "Volatility", "Risk"], answer: 2,
        explain: "Risk is the only one you control. You can't control elections or the market's swings — but you can control your position size, your stop, and your daily limit. That control is the whole point of this chapter." },
      { q: "The difference between volatility and risk is that volatility is out of your control, whereas risk is not.",
        options: ["True", "False"], answer: 0,
        explain: "True — you cannot command the market to be calm, but you can decide exactly how much of your account any trade may cost. Volatility is weather; risk is how much of the storm you choose to stand in." },
      { q: "Consider popular opinion before using your own judgment, and take risks in accordance with it.",
        options: ["True", "False"], answer: 1,
        explain: "False — the crowd is usually wrong at the extremes, and following it means risking what they won't. Your risk must follow YOUR plan and YOUR analysis, never the herd." },
      { q: "Keeping your position size high is a prudent decision for any volatility trader.",
        options: ["True", "False"], answer: 1,
        explain: "False — high volatility demands SMALLER positions, not larger. The bigger the swings, the more room a stop needs and the smaller the size that fits the same 1% risk." },
      { q: "It's advisable that you should risk more than 3% of your account on open trades.",
        options: ["True", "False"], answer: 1,
        explain: "False — 3% is the danger ceiling most professionals never approach. Above it, a normal losing streak becomes an account-ending event. 1% is the professional's home." },
      { q: "Which risk percentage is suitable for a trader starting up?",
        options: ["1%", "2%", "3%"], answer: 0,
        explain: "1% — the beginner's advantage is survival, not speed. At 1% you can be wrong 20 times in a row and still have most of your account to learn from. Speed comes later." },
      { q: "It is only during high-probability trades that you may alter your risk management.",
        options: ["True", "False"], answer: 1,
        explain: "False — NEVER alter risk, not even for a 'sure' setup. High-probability trades still fail, and the moment you size up for certainty is the moment certainty becomes expensive." },
      { q: "A trading journal is optional, especially when you have a winning streak.",
        options: ["True", "False"], answer: 1,
        explain: "False — the journal matters MOST during streaks, because that's when overconfidence creeps in and risk creeps up. The streak is when discipline needs its evidence." },
      { q: "The following steps are in the incorrect order. Arrange them correctly: 1. Determine your risk per trade 2. Check your net liquidation 3. Determine your position size for each trade.",
        options: ["1, 2, 3", "2, 3, 1", "1, 3, 2"], answer: 0,
        explain: "1, 2, 3 — decide the % you'll risk, check the account's net liquidation, then compute the position size. Risk first, account second, size third. That order keeps every trade in proportion." },
      { q: "Calculate the position size: net liquidation $3,000 × 1.4% risk ÷ (10-pip stop × $0.10 pip value per micro lot).",
        options: ["42 contracts × 1000 (micro lot)", "68 contracts × 1000 (micro lot)", "84 contracts × 1000 (micro lot)"], answer: 0,
        explain: "3,000 × 0.014 = $42 at risk ÷ (10 × 0.10 = $1.00) = 42 micro contracts. The formula converts your chosen risk into a size the market can't argue with." },
      { q: "If I have a balance of $2,000 and my risk is valued at 2%, this means I am prepared to lose… each trade.",
        options: ["$400", "$14", "$40"], answer: 2,
        explain: "2% of $2,000 = $40. That's your maximum loss per trade — the number that stays fixed whether the trade is good or bad, winning or losing." },
      { q: "The further the stop loss, the smaller the number of lots (contracts).",
        options: ["True", "False"], answer: 0,
        explain: "True — a wider stop means more room to be wrong, so the size must shrink to keep the same dollar risk. Stop distance and position size are inversely locked." },
      { q: "A trader with a high win rate doesn't need any risk management.",
        options: ["True", "False"], answer: 1,
        explain: "False — a high win rate with no risk management is one oversized loss away from ruin. A 90% win rate cannot survive a single trade that risks 50% of the account. Survival comes first, always." },
      { q: "It's always a good thing to consider the amount of money you may make in a trade.",
        options: ["True", "False"], answer: 1,
        explain: "False — dream about the profit and you'll size for it. Decide what you're willing to LOSE first; the profit is whatever the market chooses to give. Loss-first thinking is the professional's order." },
      { q: "Being aware of how much you are prepared to lose on each trade is good.",
        options: ["True", "False"], answer: 0,
        explain: "True — knowing your exact maximum loss before entry is the foundation of every other risk decision. If you can't answer 'how much can this trade cost me?', you can't take the trade." },
      { q: "Concurrent trades may be correlated in the case of high-probability trades.",
        options: ["True", "False"], answer: 1,
        explain: "False — correlation exists whether the trade is 'high probability' or not. Two USD pairs moving together double your exposure into one hidden bet, no matter how good each setup looks alone." },
      { q: "To avoid concurrently correlated trades, which option would you choose? Option 1: Buy EUR/USD and Buy USD/CAD. Option 2: Sell EUR/USD and Buy USD/CAD.",
        options: ["Option 1", "Option 2"], answer: 1,
        explain: "Option 2 — selling EUR/USD and buying USD/CAD balances the USD exposure, so one pair's move doesn't double your risk. Option 1 stacks two USD legs into one correlated bet." },
      { q: "Successful traders think in terms of 'R' multiples.",
        options: ["True", "False"], answer: 0,
        explain: "True — measuring every outcome in R (risk units) strips away the emotion of dollars and reveals the process: one 3R win pays for three 1R losses. R-thinking is how professionals stay calm and consistent." },
      { q: "I won 35 out of the total 50 trades I took this month. Calculate my win rate.",
        options: ["65%", "70%", "75%"], answer: 1,
        explain: "35 ÷ 50 = 0.70 = 70%. A great win rate — but remember, win rate alone means nothing without the R-size of the wins and losses that follow it." },
      { q: "Account balance: $1,000. Win rate 65%, average win 1.5R, average loss 1R. What is my expectancy per trade? (0.65 × $15) − (0.35 × $10).",
        options: ["$8", "$6.25", "$5"], answer: 1,
        explain: "(0.65 × 15) − (0.35 × 10) = 9.75 − 3.50 = $6.25 positive expectancy per trade. Over 100 trades that's roughly $625 — the compounding engine your risk system protects." }
    ],
    native: [
      {
        eyebrow: "Chapter 7 · Protecting capital, staying alive",
        title: "Risk Management",
        lead: "Focal points in this chapter",
        body: [
          "This is the chapter that decides whether you survive long enough for your strategy to work. Strategy tells you what to trade; risk tells you how much you can afford to be wrong — and the answer, always, is a number you choose.",
          "By the end you will master the vocabulary (margin, leverage, volatility, R), the rules (the 1% and 3% lines), and the maths (position sizing and expectancy) that keep professionals in the game for decades."
        ],
        insight: "The market has never met a trader it couldn't take money from. It has also never beaten a trader who refused to risk more than a plan allows."
      },
      {
        eyebrow: "The starting point",
        title: "The Only Thing You Control",
        body: [
          "Walk through everything a trader touches and you'll find almost none of it is under your command. Politics moves markets. Interest-rate decisions move markets. Volatility — the frequency and size of price swings — moves markets. You control none of it.",
          "You control exactly three things: the risk you take per trade, the size of the position, and when you stop. That is the entire job description of a risk manager — and this chapter is that job, taught."
        ],
        bullets: [
          "Politics: out of your control. Volatility: out of your control.",
          "Risk: entirely in your control — it is a number you choose, not a condition you endure.",
          "Professionals stop trying to control the market and pour all that energy into controlling risk."
        ],
        insight: "You cannot command the wind, but you can decide how much sail you hoist. Every wind is survivable when the sail is sized first."
      },
      {
        eyebrow: "The two words",
        title: "Volatility vs Risk",
        body: [
          "Beginners use these words as if they were the same. They are not. Volatility is the market's temperament — how often and how far price moves. Risk is your exposure to that movement — how much of your account a move can cost you.",
          "The difference is the entire philosophy of this chapter: volatility is out of your control, risk is not. You can't calm a volatile market, but you can size every position so that even the wildest swing costs you a planned amount."
        ],
        bullets: [
          "Volatility = the market's behaviour. Risk = your exposure to it.",
          "A volatile market with tiny positions is low risk. A calm market with huge positions is high risk.",
          "The market provides the weather; you provide the umbrella — and the umbrella is always position size."
        ],
        insight: "Volatility is what the market does to everyone. Risk is what you do to yourself. The first is weather — the second is a choice."
      },
      {
        eyebrow: "Read the temperature",
        title: "What Is Volatility?",
        body: [
          "Volatility is a measure of the frequency and extent of changes in a currency's value. High volatility means price is swinging far, fast, and often; low volatility means a quiet, compressed market that moves in tight ranges.",
          "Volatility is not good or bad on its own — it's a condition. News releases, central-bank surprises and economic data all spike it. Your job is to know what the current volatility allows: wider stops and smaller size in storms, tighter plans in calm water."
        ],
        bullets: [
          "High volatility = big, fast swings — opportunity and danger in one.",
          "Low volatility = tight ranges — cleaner entries, smaller moves.",
          "Volatility tells you how to trade, not whether to trade."
        ],
        insight: "The trader who ignores volatility is the trader who gets surprised by it. Read the temperature before you walk into the market — it decides your coat and your size."
      },
      {
        eyebrow: "The multiplier",
        title: "Volatility Isn't Your Enemy",
        body: [
          "Here's the honest math: volatility greatly affects the profits you can earn AND the losses you can suffer — in exactly equal measure. The move that pays you 3R on a good trade is the same move that costs you 3R on a bad one.",
          "So volatility is not the enemy. Unpreparedness is. The trader who sizes for the swing profits from it; the trader who ignores the swing gets destroyed by it. Same market, same moment, different risk."
        ],
        bullets: [
          "Volatility multiplies wins and losses by the same factor — it never picks sides.",
          "In storms, size shrinks and stops widen; in calm, size grows and stops tighten.",
          "The professional doesn't fear volatility — they price it into every position."
        ],
        insight: "Volatility is a multiplier, not a judge. It doesn't care if you win or lose — it just makes whatever you do bigger. Size is the only input you control."
      },
      {
        eyebrow: "The double-edged sword",
        title: "The Great Leverage Illusion",
        body: [
          "Leverage is the broker's loan that lets you control a large position with a small deposit. And it is the single most misunderstood gift in trading — because it feels like free money and behaves like a debt.",
          "The illusion: leverage affects profits only. The reality: leverage multiplies profits AND losses with perfect symmetry. At 1:30, a 1% move against you costs 30% of your margin. The loan has a repayment date, and it's called the margin call."
        ],
        bullets: [
          "Leverage controls larger positions with smaller capital — that's the power.",
          "The same power magnifies losses exactly as much as profits.",
          "Leverage is not income. It is a multiplier on whatever you decide to risk."
        ],
        insight: "Leverage doesn't make you smarter or luckier — it makes your mistakes bigger. Use the smallest leverage your plan requires, never the largest your broker offers."
      },
      {
        eyebrow: "The mechanics",
        title: "How Leverage Actually Works",
        body: [
          "Imagine a $100,000 position on a $1,000 account. That's 1:100 leverage — a 1% move against you wipes out the entire account. Now imagine the same $100,000 position with 1:30 leverage: the broker demands roughly $3,333 as your share. The position is the same; the loan terms are the danger.",
          "Leverage lets you control larger positions with smaller capital — and that sentence has a mirror image: a smaller loss of price becomes a larger loss of YOUR money. The ratio you choose is a promise about how much pain a normal market move will cause."
        ],
        bullets: [
          "Leverage 1:30 means $1 controls $30 of position.",
          "The higher the ratio, the thinner your margin cushion against normal moves.",
          "The position size is yours to choose — the multiplier is just the lens."
        ],
        insight: "Every leverage ratio is a deal with the market: I'll control more, in exchange for being hurt faster. Read the terms before you sign."
      },
      {
        eyebrow: "The arithmetic",
        title: "Choosing Your Leverage",
        body: [
          "The calculation is simple division: position value ÷ your balance. Want a $150,000 position with $5,000 in the account? 150,000 ÷ 5,000 = 30 — you need 1:30 leverage to facilitate the move. Any less and the broker simply won't open it.",
          "But 'need' is the wrong question. The right question is 'can I defend it?' A $150,000 position means a 1% adverse move costs $1,500 — 30% of a $5,000 account. The leverage makes the trade possible; the risk makes it reckless. Choose the leverage that fits a position you can lose gracefully."
        ],
        bullets: [
          "Leverage needed = position value ÷ account balance.",
          "Possible ≠ wise. The market will test the largest position you can open.",
          "Match leverage to the position your risk plan can defend — not the one you dream about."
        ],
        insight: "The broker will happily give you the leverage to destroy yourself. Choosing the smallest workable ratio is the first act of professional discipline."
      },
      {
        eyebrow: "The trap",
        title: "Higher Leverage Is NOT Better",
        body: [
          "If a little leverage is good, a lot must be better — that's the trap the marketing departments bank on. The truth is the opposite: higher leverage doesn't improve your edge, it just increases the speed at which your account reacts to being wrong.",
          "Compare two traders with the same strategy: one at 1:10, one at 1:100. Over a normal losing week, the first loses a planned percentage; the second may be wiped out by a margin call before the week ends. The strategy never got a chance to be right."
        ],
        bullets: [
          "Leverage amplifies drawdowns faster than it amplifies gains in the long run.",
          "A margin call ends the game — no recovery, no next month, no lesson applied.",
          "Professionals treat high leverage offers like high-interest loans: politely decline."
        ],
        insight: "Nobody ever blew an account because their leverage was too low. The lowest workable ratio is the only correct one."
      },
      {
        eyebrow: "The deposit",
        title: "Margin — Your Deposit",
        body: [
          "Margin is a percentage of the full value of a trading position that your broker holds to open the trade. It is not a fee and not a cost — it's a security deposit that says you can cover the position you're controlling.",
          "Think of it as the deposit on a rental: the broker lends you the position, and margin is the collateral. The moment your equity can't support the collateral, the arrangement ends — violently, from your point of view."
        ],
        bullets: [
          "Margin = a percentage of the position's full value, held as collateral.",
          "More leverage = less margin required per position = thinner safety buffer.",
          "Margin isn't gone — it's locked. Losses eat the equity BEHIND it."
        ],
        insight: "Margin is the price of entry, not the price of the trade. The real cost is whatever you choose to risk — and that choice is still yours."
      },
      {
        eyebrow: "Watch the ratio",
        title: "Margin Level & Equity",
        body: [
          "Margin level is a ratio: your equity divided by your used margin, shown as a percentage. It is the dashboard light of your account — rising when you have plenty of buffer, falling when positions eat into it.",
          "A common beginner confusion: 'as margin level increases, equity decreases' — false. Equity is the value of the account; margin level is how much of that equity is still free. The danger reading is a FALLING margin level with open positions, not a rising one."
        ],
        bullets: [
          "Margin level = equity ÷ used margin (%).",
          "Falling margin level = shrinking free equity = approaching danger.",
          "High margin level is comfort; low margin level is a warning siren."
        ],
        insight: "Learn to read the ratio, not just the balance. The account can look fine while the margin level quietly warns that one more pip decides your fate."
      },
      {
        eyebrow: "The floor",
        title: "Maintenance Margin",
        body: [
          "Your broker doesn't let you hold a position with unlimited grace. There's a floor called maintenance margin — the minimum amount of equity that must be kept in the account to keep your positions open. Cross below it and the broker stops waiting.",
          "Maintenance margin is the line in the sand drawn by the lender, not by you. Your own line should always be far above theirs: your stop, your daily limit and your 1% rule exist so you never discover where their line is."
        ],
        bullets: [
          "Maintenance margin = the broker's minimum equity to keep positions open.",
          "Below it, the broker intervenes — adding funds or closing positions.",
          "Your risk rules should trip long before the broker's ever does."
        ],
        insight: "The broker's floor is a trap door. Professional risk management is simply never being anywhere near it."
      },
      {
        eyebrow: "The intervention",
        title: "The Margin Call",
        body: [
          "When your equity falls below the maintenance threshold — commonly around 25% of the purchased asset's market value — you receive a margin call: a demand to deposit more funds or have your positions closed for you, at the worst possible prices.",
          "A margin call is not a suggestion; it is the end of your agency. The market closes your positions at whatever price exists, which is usually the exact bottom. Every oversized trade you take is a vote to meet this moment eventually."
        ],
        bullets: [
          "Equity below ~25% of position value → margin call (broker-dependent).",
          "The broker can close positions without your permission, at market price.",
          "Margin calls happen to oversized positions during normal volatility — never to properly sized ones."
        ],
        insight: "A margin call is the market confiscating the risk you refused to manage. Size every position so this phone call can never be made."
      },
      {
        eyebrow: "The golden rule",
        title: "The 1% Rule",
        body: [
          "If this chapter had a single sentence it would be this: risk 1% of your account on any single trade. Not 2%, not 5% — 1%, especially while you're starting.",
          "Why so small? Because trading is a game of being wrong a lot and surviving it. At 1% risk, you can lose 20 trades in a row and still have most of your capital — and 20 consecutive losses, while painful, are statistically normal in a 40% win-rate system. At 5%, those same 20 losses leave you with nothing to learn on."
        ],
        bullets: [
          "1% per trade = survival through any normal losing streak.",
          "The beginner's edge is capital, and capital is bought with small risk.",
          "Your size grows with your skill — your risk % stays small forever."
        ],
        insight: "The 1% rule isn't about being timid. It's about being alive long enough to be good."
      },
      {
        eyebrow: "The ceiling",
        title: "The 3% Ceiling",
        body: [
          "If 1% is the professional's home, 3% is the absolute ceiling — the highest risk per trade a serious trader ever approaches, and only after years of consistent proof. Above 3%, the maths turns against you: a normal losing streak stops being a setback and becomes an account-ending event.",
          "Here's the brutal arithmetic: at 1% risk, ten consecutive losses cost 9.6% of the account — recoverable. At 5%, the same ten losses cost 40% — a hole that needs a 67% gain to refill. The difference between 1% and 5% is not speed; it's survivability."
        ],
        fig: riskFig("escalation"),
        bullets: [
          "1% — the professional zone: mistakes are tuition, not tragedy.",
          "3% — the absolute ceiling, reserved for proven, consistent edge.",
          "5%+ — the blow-up zone: one streak from the margin call."
        ],
        insight: "Risk more than 3% and you aren't trading — you're gambling with a timer. The ceiling exists so you never meet the floor."
      },
      {
        eyebrow: "The unbreakable rule",
        title: "Never Alter Risk",
        body: [
          "There is no condition — not a high-probability setup, not a winning streak, not 'just this once' — under which you alter your risk management. The rule is absolute because every exception is the same trade: the one that ends the account.",
          "High-probability trades still fail. In fact, the 'sure thing' is statistically the most dangerous trade you'll take, because it's the one you'll size up. The system that protects you on normal days is the same system that must protect you on the days you feel certain."
        ],
        bullets: [
          "High-probability ≠ guaranteed. Certainty is a feeling, not data.",
          "Altering risk for a 'sure' trade converts a small loss into a catastrophe.",
          "The rule is absolute — that's what makes it a rule."
        ],
        insight: "Every blown account began with a harmless 'just this once'. The unbreakable rule is the price of never meeting the margin call."
      },
      {
        eyebrow: "The order of thinking",
        title: "Risk First, Reward Second",
        body: [
          "Beginners enter a trade thinking about how much they might make. Professionals enter thinking about how much they might lose. The order of thinking decides everything that follows — because the size of the dream becomes the size of the position.",
          "It's not that profit is unimportant — it's that profit is a consequence. You cannot size a position from hope; you can only size it from risk. Decide the loss first, place the stop accordingly, and let the reward be whatever the market offers within that frame."
        ],
        bullets: [
          "Consider the money you may make and you'll size for the fantasy.",
          "Consider the money you may lose and you'll size for survival.",
          "The trade is designed from the loss backward — never from the profit forward."
        ],
        insight: "Dreaming about profit is how accounts die. Calculating the loss is how accounts live. Same trade, same market — different math, different fate."
      },
      {
        eyebrow: "The number that matters",
        title: "Know What You Can Lose",
        body: [
          "Before every trade you should be able to answer one question instantly: exactly how much of my account is this trade allowed to cost? If you can't answer it, you don't have a trade — you have a hope with a login.",
          "Being aware of what you're prepared to lose is not pessimism; it's the definition of professional trading. It converts the emotional ride of 'will it win?' into the mechanical question of 'did it respect the limit?' — and that shift is where calm comes from."
        ],
        bullets: [
          "Know your max loss in dollars before entry — always.",
          "Awareness of loss is the root of every other risk decision.",
          "The calmest traders aren't fearless — they're pre-calculated."
        ],
        insight: "You can't manage a risk you haven't named. Name the loss, and you've already taken the first step to controlling it."
      },
      {
        eyebrow: "The machine",
        title: "The Position Sizing Formula",
        body: [
          "Position sizing is where risk management becomes arithmetic — and it always runs in the same three-step order: first determine your risk per trade, second check your net liquidation, third compute the position size. Never the other way around.",
          "The formula: (Net Liquidation × %Risk per trade) ÷ (Stop-loss distance × $ pip value) = Number of lots. Decide the % you're willing to lose, convert it to dollars, then convert those dollars into contracts the market will respect."
        ],
        bullets: [
          "Step 1: risk % → Step 2: net liquidation → Step 3: size. Always in order.",
          "Dollar risk = balance × risk % — the fixed number every trade serves.",
          "Size is the output, never the input. Nobody sizes the account to the trade."
        ],
        insight: "The formula is the machine that turns your discipline into position sizes. Feed it the right risk and it prints the right size, every time, emotion-free."
      },
      {
        eyebrow: "Worked example",
        title: "Sizing, Worked",
        body: [
          "Let's run the machine. Account: $3,000. Risk: 1.4%. Stop: 10 pips. Pip value: $0.10 per micro lot (EUR/USD).",
          "Dollar risk = 3,000 × 0.014 = $42. Cost per contract = 10 pips × $0.10 = $1.00. Size = 42 ÷ 1.00 = 42 micro contracts. That's it — 42 contracts, because $42 is the most this trade is allowed to cost, and nothing in the market gets to argue with that number."
        ],
        bullets: [
          "$3,000 × 1.4% = $42 at risk — the fixed number.",
          "10 pips × $0.10/pip = $1.00 risked per micro lot.",
          "42 contracts. The market can move, but the loss cannot exceed $42."
        ],
        insight: "Notice what the formula never asked: how confident you feel. Feelings don't get a vote in position sizing."
      },
      {
        eyebrow: "In dollars",
        title: "Risk in Dollars",
        body: [
          "The percentage rule is just a doorway to a dollar figure — and the dollar figure is the thing you actually protect. $2,000 balance at 2% risk means you are prepared to lose $40 on each trade. That $40 is your real stake in every position you open.",
          "Holding that dollar number in your head changes the whole experience. A trade stops being 'will this make money?' and becomes 'is this respecting the $40?'. When the answer is no — the stop fires, mechanically, without negotiation."
        ],
        bullets: [
          "2% of $2,000 = $40 — your maximum loss per trade.",
          "The dollar figure is what you defend; the percentage is just how you compute it.",
          "Know both, trade on the dollar."
        ],
        insight: "Accounts are destroyed by percentages and saved by dollars. Convert your risk to cash before every trade and the market loses its power to scare you into size."
      },
      {
        eyebrow: "The inverse lock",
        title: "Stop Distance ↔ Position Size",
        body: [
          "Stop loss distance and position size are locked in a perfect inverse relationship: the further your stop, the smaller your size. Because the dollar risk never changes, a wider stop can only be paid for with fewer contracts.",
          "This lock is your freedom — it means you can trade ANY timeframe with the SAME risk. A scalper's 5-pip stop and a swing trader's 60-pip stop both protect exactly 1% of the account; one just uses more contracts with a tighter leash. The formula makes every market tradeable."
        ],
        bullets: [
          "Wider stop → smaller size. Narrower stop → larger size. Dollar risk constant.",
          "The same 1% rule works on every timeframe and every pair.",
          "Never widen a stop to keep a size — size always bends to the stop."
        ],
        insight: "The stop is your honest estimate of being wrong. Let the size follow it faithfully, and every loss — big stop or small — costs the same planned amount."
      },
      {
        eyebrow: "The excuse breaker",
        title: "Win Rate Doesn't Excuse Risk",
        body: [
          "'But I win 80% of my trades!' is the most expensive sentence in trading — because it's usually true, and it's usually followed by one oversized loss that gives it all back. A high win rate with poor risk is a leaky bucket: lots of small wins, one fatal hole.",
          "Consider the math: a 90% win rate with a 1:1 ratio is a coin flip with extra steps. It's the R-size of your wins and losses — not the win rate — that decides profitability. And it's the risk that decides whether any of it survives contact with a losing streak."
        ],
        bullets: [
          "Win rate measures frequency; risk measures survival.",
          "One 50% loss erases 50 wins of 1% each.",
          "High win rate + no risk management = the most common route to zero."
        ],
        insight: "The market doesn't grade you on how often you win. It grades you on how much it can take when you're wrong — and that number is the one you control."
      },
      {
        eyebrow: "The professional's language",
        title: "Think in R",
        body: [
          "Professionals don't measure trades in dollars — they measure them in R. R is one unit of risk: the amount you planned to lose on the trade. A loss to the stop is −1R. A win to the target is +3R. Every trade, past and future, speaks the same language.",
          "R-thinking does two things. It strips emotion from the money (a −1R loss is not a failure — it's the cost of doing business), and it reveals your process's true shape: the size of your average win in R, your average loss, and your win rate — the three numbers that make up expectancy."
        ],
        bullets: [
          "1R = your planned risk on the trade — the fixed reference point.",
          "Outcomes in R: −1R, +2R, −1R… a pure signal, no currency to panic over.",
          "R-thinking is the bridge between risk management and long-term profitability."
        ],
        insight: "Dollars make you emotional. R makes you clear. The trader who can say 'I lost 1R' calmly is the trader who will still be trading in ten years."
      },
      {
        eyebrow: "The frequency stat",
        title: "Win Rate, Computed",
        body: [
          "Win rate is the simplest statistic in trading: winners ÷ total trades. Win 35 of 50 trades this month and your win rate is 70%. It answers one question — how often are you right? — and nothing more.",
          "The trap is treating win rate as a verdict on your edge. It isn't. A 70% win rate with an average loss of 2R is a losing system; a 40% win rate with 3R average wins is a fortune engine. Win rate is one ingredient of expectancy, never the whole recipe."
        ],
        bullets: [
          "Win rate = winners ÷ total trades (35 ÷ 50 = 70%).",
          "Win rate without R-size tells you almost nothing.",
          "High win rate + tiny wins + big losses = slow bleed."
        ],
        insight: "Win rate is the applause meter. Expectancy is the bank balance. Trade for the balance, not the applause."
      },
      {
        eyebrow: "The real number",
        title: "Expectancy — the Real Number",
        body: [
          "Expectancy is the single number that tells you whether your system makes money over time: (Win rate × Average win) − (Loss rate × Average loss). On a $1,000 account with a 65% win rate, 1.5R average win ($15) and 1R average loss ($10): (0.65 × 15) − (0.35 × 10) = $6.25 per trade.",
          "Positive expectancy means the edge is real — every 100 trades add roughly $625, before compounding. Negative expectancy means no amount of psychology can save you. This is the number your whole risk system exists to protect."
        ],
        bullets: [
          "Expectancy = (%W × avg win) − (%L × avg loss).",
          "$6.25 per trade on $1,000 is an edge worth protecting with 1% risk.",
          "If expectancy is negative, stop trading and fix the system first."
        ],
        insight: "Psychology gets you through the losing days. Expectancy is the proof they're worth it. Know your number — and protect it with the smallest risk that lets it compound."
      },
      {
        eyebrow: "The caveat",
        title: "Expectancy Is a Compass, Not a Promise",
        body: [
          "Expectancy is computed over MANY trades — it says nothing about the next one. A system with $6.25 positive expectancy can still lose 10 trades in a row, because randomness doesn't read your expectations. That's precisely why the risk rule is separate from the edge.",
          "The combination is the whole game: a positive expectancy tells you the direction to walk; a 1% risk rule makes sure you're still walking after the bad patch. Remove either and the system collapses — edge without survival is a lottery ticket, survival without edge is a job."
        ],
        bullets: [
          "Expectancy is a long-run average; single trades are noise.",
          "Losing streaks are normal — expectancy doesn't promise smoothness.",
          "Edge decides the destination; risk decides whether you arrive.",
          "Judge the system by 100 trades, never by this week."
        ],
        insight: "The market will test your expectancy with ugly sequences. The 1% rule is the seatbelt that makes the turbulence survivable."
      },
    {
      eyebrow: "The hidden double",
      title: "Correlated Trades = Hidden Risk",
      body: [
        "Two trades can look independent and secretly be one. If you're long EUR/USD and long GBP/USD, you're not taking two risks — you're taking one big dollar risk wearing two hats, because both pairs move with the dollar. That's correlation: hidden, silent, and dangerous.",
        "The danger isn't the setups themselves; it's the exposure they create together. Ten 'unrelated' trades that all go south in the same news release are one trade, sized ten times. Your risk management must see through the pairs to the shared exposure underneath."
      ],
      bullets: [
        "Correlated pairs move together — they don't diversify, they concentrate.",
        "The danger exists in every trade, 'high-probability' or not.",
        "Count real exposure, not position count."
      ],
      insight: "You can hold five positions and be one trade. Correlation is the magician of risk — it makes one exposure look like five."
    },
    {
      eyebrow: "The fix",
      title: "Choosing Uncorrelated Pairs",
      body: [
        "The cure for correlation is choosing positions that balance each other. Sell EUR/USD and buy USD/CAD, and the two USD legs offset — when the dollar rallies, one trade profits and the other loses by design. That's not a mistake; that's diversification.",
        "The rule of thumb: if two trades share a currency on the same side, they're correlated. Check your open positions for shared legs before adding — the goal is a book of genuinely separate risks, not a stack of identical bets."
      ],
      bullets: [
        "Sell EUR/USD + buy USD/CAD balances the USD exposure — diversification.",
        "Buy EUR/USD + buy USD/CAD doubles it — concentration.",
        "Before every new trade: does this share a leg with something I'm already holding?"
      ],
      insight: "Diversification is not owning more trades. It's owning fewer, genuinely separate ones."
    },
    {
      eyebrow: "The herd",
      title: "Herding: Popular Opinion Is Not a Plan",
      body: [
        "When everyone agrees, the market is usually done moving — because the crowd buys after the move, at the top, with maximum confidence. Following popular opinion with your risk means taking the herd's worst timing with your own capital.",
        "Your risk decisions must come from your plan, your analysis and your limits — never from what everyone else is doing. The crowd doesn't size your position, doesn't set your stop, and won't refund your margin call. Popular opinion is information, not instruction."
      ],
      bullets: [
        "The crowd is most confident exactly when the move is exhausted.",
        "Risk follows YOUR analysis — never the herd's mood.",
        "Independence isn't contrarianism; it's simply having a plan."
      ],
      insight: "The market pays the crowd's tuition. Don't co-sign the loan."
    },
    {
      eyebrow: "The volatility trap",
      title: "Size Discipline for Volatility Traders",
      body: [
        "High volatility feels like the time to trade big — the moves are huge, the opportunity is loud. The professional does the opposite: the bigger the swings, the smaller the position. A 100-pip day demands a wider stop, and a wider stop with the same dollar risk means fewer contracts.",
        "Remember the lock: stop distance and size are inverse. Volatility stretches the stop, and the size shrinks to keep the risk constant. The trader who sizes up 'because the market is moving' is really just raising their risk on the days it's most dangerous."
      ],
      bullets: [
        "High volatility → wider stops → smaller size. Same 1%.",
        "Keeping position size HIGH in a volatile market is reckless, not brave.",
        "The risk stays constant; only the mechanics adapt."
      ],
      insight: "Volatility is a reason to shrink, not a license to grow. The same percentage of risk keeps you alive in every weather."
    },
    {
      eyebrow: "The discipline evidence",
      title: "Journal Even on Streaks",
      body: [
        "The journal is never optional — and least of all during a winning streak. Streaks are exactly when the discipline starts to slip unnoticed: size creeps up, checklists get skipped, and the streak becomes the excuse. The journal is the evidence that catches it.",
        "Write down every trade, every size, every emotion — especially when it's going well. A journal you keep only during bad times is a diary of pain; a journal you keep during good times is the map of the edge that made them. Both are needed."
      ],
      bullets: [
        "Streaks hide risk creep — the journal exposes it.",
        "Record size and emotion, not just entries and exits.",
        "The winning-streak journal is the blueprint of your edge."
      ],
      insight: "The market's favourite trap is confidence. The journal is the trap-detector — the one habit that works when you're winning and when you're losing."
    },
    {
      eyebrow: "The deep hole",
      title: "Drawdown: The Math of Getting Back",
      body: [
        "Drawdown is the distance from your peak to your trough — and it's the most honest number in trading, because it measures what's already happened. The brutal truth is the recovery math: a 50% drawdown needs a 100% gain to return to break-even. The deeper the hole, the steeper the climb.",
        "This asymmetry is why risk management is not optional: the account is a one-way escalator down once the drawdown grows. Protecting the account from deep drawdowns isn't conservative — it's the only way the compounding engine can work at all."
      ],
      fig: riskFig("recovery"),
      bullets: [
        "−50% requires +100% to recover. −25% requires +33%.",
        "The deeper the drawdown, the more unrealistic the recovery.",
        "Drawdown is measured after the fact — risk rules are set before it."
      ],
      insight: "Every account is one deep drawdown away from giving up. The 1% rule is cheap insurance against the most expensive outcome in trading."
    },
    {
      eyebrow: "The unbreakable floor",
      title: "The Recovery Trap",
      body: [
        "After a loss, the mind does a terrible calculation: 'I need to win back what I lost, so I'll trade bigger.' This is the recovery trap — and it's the exact moment the math stops being on your side. Recovering with bigger size doesn't climb faster; it digs deeper.",
        "The professional's recovery is the opposite: risk LESS after a loss, not more. A smaller size lets the mind reset, the strategy keep working, and the account slowly climb its way out of the hole the market dug — on the same terms it dug it. Patience is the recovery strategy."
      ],
      bullets: [
        "'Win it back fast' is the most expensive sentence after a loss.",
        "Oversizing to recover = the fastest route to the margin call.",
        "The professional recovers by shrinking, not by swinging."
      ],
      insight: "The market doesn't care about your hole — it cares about your size. Trade small after the drawdown, and the recovery becomes a matter of time, not luck."
    },
    {
      eyebrow: "The daily budget",
      title: "Your Daily Risk Budget",
      body: [
        "Risk per trade is only half the system. The other half is the daily budget: the maximum total you'll lose in one day before the session is over. Many professionals stop at −3R or −2% of the account — a line drawn before the market opens that emotion is not allowed to move.",
        "The daily budget is the bridge between this chapter and the last: Chapter 6's 3-loss rule and this chapter's percentages are the same principle in two languages. A daily budget makes a bad day expensive in a bounded, survivable way — and makes the next day always available."
      ],
      bullets: [
        "Set a daily loss limit (−2% or −3R) before the session opens.",
        "Hit it → stop. Not 'slow down' — stop. The day is done.",
        "The daily budget is what makes the weekly math work."
      ],
      insight: "You can't control the market's day. You CAN control the day's damage — and that's the entire point of a budget."
    },
    {
      eyebrow: "The merge",
      title: "The 3-Loss Rule Meets Risk",
      body: [
        "Chapter 6 taught you the 3-loss rule; this chapter gives it its maths. Three losses at 1% each is −3% of the account — a fully survivable day that the market cannot compound into a disaster. The rule isn't arbitrary: it's risk management wearing psychology's clothes.",
        "The two chapters are one system. Psychology decides WHEN you stop (three losses, the tilt tripwire); risk management decides HOW MUCH it costs (1% per trade, a bounded day). Together they guarantee the worst day you can have is one you can walk away from."
      ],
      bullets: [
        "3 losses × 1% = a −3% day. Painful, normal, survivable.",
        "The 3-loss rule is a daily budget with a human-readable trigger.",
        "Psychology sets the when; risk sets the how much."
      ],
      insight: "A trader with a −3% day and a clear head is unbeatable. A trader with a −3% day and revenge in their eyes is already beaten — the two chapters keep them apart."
    },
    {
      eyebrow: "The normal drought",
      title: "Consecutive Losses Are Normal",
      body: [
        "Even a great system loses 4, 5, 6 trades in a row. At a 50% win rate, a 6-loss streak is a routine event, not a crisis. The amateuer mistakes the streak for evidence the strategy broke; the professional recognizes it as weather and stays on plan.",
        "This is why the risk rules are fixed in advance: when the streak arrives, you don't need to make a decision — the size, the stop and the daily budget were decided when you were calm. The streak's only power is making you change them. Refuse, and it's just a few small losses."
      ],
      bullets: [
        "Losing streaks are statistically normal — plan for them, don't panic at them.",
        "The rules decided while calm are the only defence against the streak's panic.",
        "Streaks cost 1% each. They can't kill you; only your reaction can."
      ],
      insight: "The market will hand you 6 losses in a row sooner or later. The trader who shrugs and takes the 7th, correctly sized, is the trader who survives the market's schedule."
    },
    {
      eyebrow: "The after-hours risk",
      title: "Overnight & Gap Risk",
      body: [
        "The chart closes, but risk doesn't. Between the Friday close and the Monday open — or across any night with major news — price can gap past your stop, and you're filled at the gap, not at your level. Your planned 1R loss can become a 3R one without a single pip trading in between.",
        "The management is sizing and awareness: overnight positions need a size that survives a gap, or a flat book before major events. Knowing when you hold exposure while the market is closed is itself a risk decision."
      ],
      bullets: [
        "Gaps fill at the open price, not at your stop — planned risk can stretch.",
        "News events + overnight = the highest gap risk windows.",
        "Size overnight positions as if the gap WILL happen."
      ],
      insight: "The market doesn't need your permission to move while you sleep. Size every position that stays open as if it will be tested at the worst possible moment."
    },
    {
      eyebrow: "The compounding shrink",
      title: "Shrink as You Shrink",
      body: [
        "Your risk percentage stays the same; your dollars don't. After a drawdown, 1% of a smaller account is a smaller dollar amount — and that's correct. The size must shrink with the equity, or the fixed percentage quietly becomes a bigger percentage of what you actually have.",
        "The symmetry works in reverse too: as the account grows, 1% grows with it, and the position sizes compound safely. The rule is the same at every equity — the account sets the size, never the other way around."
      ],
      bullets: [
        "1% of a smaller account = smaller positions. Correct, not defeat.",
        "Never hold the dollar size constant while the equity falls.",
        "The percentage rule is the same at $1,000 and $100,000."
      ],
      insight: "The account is the master of the size, always. Recalculate after every drawdown and every peak — the math doesn't care how the money got there."
    },
    {
      eyebrow: "The confidence killer",
      title: "The 'Sure Thing' Is a Risk Event",
      body: [
        "The trade you're most certain about is the trade you're most likely to blow up on — because certainty is what makes you oversize. A 'sure thing' that fails is just a normal loss, unless you risked 10% on it because you were sure. Then it's the beginning of the end.",
        "Certainty is a feeling, and feelings have a poor record against markets. The professional treats every trade as equally fallible — same size, same stop, same budget — and lets the probability play out over hundreds of trades, not one confident one."
      ],
      bullets: [
        "Certainty is not an edge — it's the oldest oversizing excuse.",
        "The 'sure' trade gets the same 1% as the uncertain one.",
        "If you wouldn't size it when unsure, you shouldn't size it when sure."
      ],
      insight: "The market's favourite meal is certainty. Feed it the same small size as everything else and it has nothing to take."
    },
    {
      eyebrow: "The engine",
      title: "Compounding Works Both Ways",
      body: [
        "Compounding is the reason the 1% rule is powerful instead of timid. At 1% risk with a $6.25 expectancy, a $1,000 account compounds slowly at first — but the growth is exponential, and the curve bends upward dramatically with time. Small, consistent edges become large fortunes through patience.",
        "The same compounding works against you. A 20% loss needs 25% to recover; a 33% loss needs 50%. Drawdowns compound the damage exactly as gains compound the reward. Risk management isn't about avoiding growth — it's about making sure the compounding is always in your direction."
      ],
      bullets: [
        "Compounding rewards patience: small edges, long time horizons, big results.",
        "Compounding punishes drawdowns: the deeper the hole, the steeper the climb.",
        "The 1% rule keeps the curve pointing up — by limiting how far down it can go."
      ],
      insight: "The account doesn't grow by winning more. It grows by never losing much — the compounding engine only runs in one direction, and risk is the clutch."
    },
    {
      eyebrow: "Before the session",
      title: "The Risk Manager's Checklist",
      body: [
        "Before the market opens, run the checklist. It takes two minutes and it's the entire risk chapter in action."
      ],
      bullets: [
        "Net liquidation: what's my account worth right now?",
        "Risk per trade: 1% — what is that in dollars today?",
        "Daily budget: −2% or −3R — the line I stop at, pre-decided.",
        "Correlation check: do any open positions share a leg with today's setups?",
        "News calendar: what could gap me tonight, and am I flat for it?",
        "Sizes: every planned setup sized by the formula, before price moves."
      ],
      insight: "The market doesn't care if you're ready. The checklist is how you make sure you are — before the first tick removes the option."
    },
    {
      eyebrow: "The rhythm",
      title: "Weekly Risk Review",
      body: [
        "Daily discipline handles the day; a weekly review handles the trajectory. Once a week, open the journal and ask: what was my average risk per trade, and did it ever creep? How many R did the week cost or gain? Did I respect the daily budget every day? Were any of my losses larger than planned, and why?",
        "The weekly review is where risk management improves — not in the heat of a session, but in the quiet after. Patterns the day hides (size creep on Fridays, revenge trades after lunch) become obvious over seven days of data. Fix one pattern a week and the account compounds on the improvement."
      ],
      bullets: [
        "Average risk per trade: constant? Did any trade exceed the plan?",
        "Weekly R total: positive expectancy or a leak?",
        "Daily budgets: respected every session?",
        "One fix per week — that's 52 improvements a year."
      ],
      insight: "The market runs every week; so does your review. The trader who audits their risk weekly is the trader whose risk never gets a chance to silently drift."
    },
    {
      eyebrow: "The brutal truth",
      title: "Why Most Traders Blow Up",
      body: [
        "Most retail accounts are not lost to bad strategy. They're lost to the same three events, in order: first, a winning streak inflates confidence; second, size creeps up 'just a little'; third, one oversized trade meets one normal adverse move, and the margin call does the rest. The strategy was never the problem.",
        "Read that list again — it's the entire course in one paragraph. Chapter 6 stopped the streak from inflating your psychology; this chapter stops the size from creeping. Together they're the difference between a trader who learns and a trader who blows up and blames the market."
      ],
      bullets: [
        "Blown accounts are 90% risk events, not strategy failures.",
        "The sequence: streak → size creep → one oversized trade → margin call.",
        "Fixed risk kills the sequence before it starts."
      ],
      insight: "The market doesn't need a better strategy to take your account — it needs one careless size. That's the only hole worth patching, and it's the one this chapter patches."
    },
    {
      eyebrow: "Your lens",
      title: "Risk Wears Your Style",
      lead: "The same rules, tuned to the way YOU trade",
      body: [
        "The 1% rule is universal; how it feels is not. Each style meets risk at a different hour and in a different size — know the shape of your exposure."
      ],
      styles: {
        scalper: "Your 1% is spent in dozens of small clips — spread and commission are your hidden taxes, and a 1-pip slippage on a 10-pip stop is 10% of your risk. Guard execution costs like part of the stop.",
        day: "Your risk window is one session: a daily budget of −2% and flat-by-close keeps every loss inside its day. The overnight gap can never touch you if you're always flat at night.",
        swing: "Your stops are wide, so your sizes are small — a 60-pip stop protects the same 1% as a scalper's 10. Size for the weekend gap: the position that survives Monday is the one sized like the gap is coming.",
        position: "Your drawdowns are measured in weeks inside a correct thesis. Size so you can hold: 1% of the account must feel like nothing, because your patience is the product and panic is the tax."
      },
      insight: "Risk management is one rule in four uniforms. The scalper, the day trader, the swing trader and the position trader all protect the same 1% — differently sized, identically sacred."
    },
    {
      eyebrow: "Before the quiz",
      title: "The Risk Creed",
      body: [
        "Say it before every session, the way the psychology chapter taught you the creed: my risk is 1% — fixed, forever. I know my net liquidation before I size. The stop is set by the market's structure; the size bends to the stop. My daily budget is drawn before the open. I never alter risk — not for streaks, not for 'sure things', not for revenge. I think in R, I journal every trade, and I review weekly.",
        "If you can say it and mean it, the thirty questions ahead are just the confirmation of the survival system you've built."
      ],
      bullets: [
        "1% risk, fixed forever — the non-negotiable.",
        "Size follows the stop; the stop follows the structure.",
        "Daily budget before the open; the 3-loss rule as the trigger.",
        "R-thinking, journaling, weekly review — the habits that protect the edge."
      ],
      insight: "The quiz tests the chapter. The market will test the creed — and the creed is what this entire course has been building toward."
    },
    {
      kind: "close",
      eyebrow: "Before the test",
      title: "The Survival System",
      body: [
        "You now hold the complete survival system: the psychology to stop (Chapter 6) and the maths to size (this chapter). Margin, leverage, volatility, the 1% rule, the 3% ceiling, R-multiples and expectancy — every concept now speaks one language: how much can this cost, and is that acceptable?",
        "Now prove it: 30 questions stand between you and Chapter 8: Pairs — the chapter that chooses your battlefield. Pass, and the survival system you've built here will follow you into every trade you ever take."
      ]
    },
    null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
    ]
  },
  { id: 8,  title: "Pairs",                      slides: 43, focus: "Choosing your battlefield", diff: 2, /* correlation logic + pip-value maths */ mins: 40, quizSlides: [20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40], quiz: null },
  { id: 9,  title: "Market Orders",              slides: 43, focus: "Executing with precision", diff: 2, /* mechanics + knowing which order fits the situation */ mins: 40, quizSlides: [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40], quiz: null },
  { id: 10, title: "Technical Indicators",       slides: 63, focus: "Adding confirmation tools", diff: 3, /* heavy formula load + which indicator to trust when */ mins: 65, quizSlides: [31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60], quiz: null },
  { id: 11, title: "Market Cycle",               slides: 37, focus: "The rhythm of markets", diff: 2, /* abstract phases — takes repetition to internalise */ mins: 35, quizSlides: [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34], quiz: null },
  { id: 12, title: "The Stock Market",           slides: 86, focus: "The bigger financial picture", diff: 2, /* new asset class — broad but mostly familiar concepts */ mins: 75, quizSlides: [35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85], quiz: null },
  { id: 13, title: "Technical Analysis",         slides: 95, focus: "Charts, patterns & confluence", diff: 3, /* the capstone — everything combined under pressure */ mins: 95, quizSlides: [55,56,57,58,59,60,61,62,63,64,65,66,68,69,70,71,72,73,74,75,76,77,78,79,81,82,83,84,85,86,87,88,89,90,91,92], quiz: null }
];

function slidePath(ch, n) {
  return "assets/slides/ch" + ch + "/slide-" + String(n).padStart(2, "0") + ".png";
}
