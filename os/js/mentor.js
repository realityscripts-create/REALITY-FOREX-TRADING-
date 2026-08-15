/* ============================================================
   REALITY FX OS — The Mentor (AI trading twin)
   ------------------------------------------------------------
   A robotic version of the founder: opinions routed through
   experience, grounded in the 13-chapter Reality FX curriculum
   and the student's LIVE OS data. This is not Sarah (front-desk
   support) — this is the trading brain. It reads the student's
   state straight from localStorage (rfx_os_v1) on every message,
   so its coaching always reflects where they actually are:
   their style, their quiz scores, their weak chapters, their
   streaks, their fair-play flags and their study hours.

   Standalone on purpose: it only needs the course-data globals
   (CHAPTERS / STYLES) from data.js. Chat history persists under
   its own key so it never touches the OS save rail.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "rfx_os_v1";
  var CHAT_KEY = "rfx_os_mentor_chat";

  /* ---------- tiny stroke icon set (same family as the OS) ---------- */
  var I = function (p) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  };
  var IC = {
    robot: I('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M2 14v-2M22 14v-2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/>'),
    send: I('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
    spark: I('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>'),
    check: I('<polyline points="20 6 9 17 4 12"/>'),
    alert: I('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>')
  };

  /* ---------- the founder's voice ----------
     A guru with a hint of spice: bold enough to call out exactly where the
     student is going wrong, warm enough to sit with them when it stings,
     funny enough that the lessons land, and logical to the bone. Every line
     below is written to feel like the founder talking, not a machine. */
  var QUOTES = [
    "The market will humble you as many times as it takes. Your only job is to still be standing for the lesson each time.",
    "You don't lose when you make a mistake. You lose the day you stop learning from them.",
    "A loss is tuition. The only question is whether you paid attention in class.",
    "Every master was once a disaster who refused to stay one.",
    "The market pays the patient and taxes the desperate — and the tax is brutal.",
    "Show me a trader who never lost and I'll show you a trader who never traded.",
    "Discipline is choosing what you want most over what you want right now.",
    "It's not about how hard you fall. It's about what you do the morning after.",
    "Fear is a terrible advisor and an even worse trader.",
    "The charts don't lie. People do — especially to themselves.",
    "You can't win the game in one trade. You can lose it in one, though. Guard that side.",
    "The market owes you nothing. Everything you take from it, you take with process."
  ];
  function quote() { return QUOTES[Math.floor(Math.random() * QUOTES.length)]; }

  // Rotating funny openers — the Mentor greets like a friend with a file,
  // not a lecturer. Fresh line every message keeps the greeting from going stale.
  var OPENERS = [
    "There he is. I'd say I was starting to worry, but I've been watching your stats the whole time — that's not creepy, that's preparation.",
    "Good to see you, {name}. The market's been asking about you. Mostly in a worried tone, but still.",
    "Ah, {name} — the market's favourite kind of student: the one who actually shows up. It notices attendance, you know.",
    "There he is. I already read your numbers before you said a word. Some call that intuition; I call it having read your numbers.",
    "Welcome back, {name}. I didn't touch your trades while you were gone. Much.",
    "Look who decided to appear. I was just reviewing your weakest chapter — you know, as a treat.",
    "{name}! Perfect timing — I was about to send a search party. Or another quiz. One of the two."
  ];
  function opener(name) {
    return OPENERS[Math.floor(Math.random() * OPENERS.length)].replace("{name}", name || "trader");
  }

  /* ---------- student snapshot (read fresh every message) ---------- */
  function readState() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function profileOf(st) {
    var p = st.profile || {};
    return (p.name && p.name.trim()) || st.name || "";
  }
  function styleOf(st) {
    if (!st.traderStyle) return null;
    var k = String(st.traderStyle).toLowerCase().trim().replace(/\s*trader$/, "");
    return (STYLES && STYLES[k]) ? STYLES[k] : null;
  }
  function chRec(st, id) {
    return (st.chapters || {})[id] || {};
  }
  function gradedChapters(st) {
    var out = [];
    (CHAPTERS || []).forEach(function (ch) {
      if (!ch.quiz) return;
      var c = chRec(st, ch.id);
      var best = (c.quizBest != null) ? c.quizBest : null;
      if (best != null) out.push({ ch: ch, best: best, passed: !!c.passed, retries: c.retries || 0, reviewSecs: c.reviewSecs || 0, agg: (st.chapStats || {})[ch.id] });
    });
    return out;
  }
  function avgGrade(st) {
    var g = gradedChapters(st);
    if (!g.length) return null;
    return Math.round(g.reduce(function (a, r) { return a + r.best; }, 0) / g.length);
  }
  function weakChapters(st) {
    var rows = [];
    (CHAPTERS || []).forEach(function (ch) {
      if (!ch.quiz) return;
      var c = chRec(st, ch.id);
      var agg = (st.chapStats || {})[ch.id];
      var best = (c.quizBest != null) ? c.quizBest : null;
      var wrongRatio = (agg && agg.n >= 4) ? agg.wrong / agg.n : null;
      if (best != null && best < 85) {
        rows.push({ ch: ch, best: best, why: best < PASS_PCT ? "this chapter beat you once — that's the one that matters" : "passed, but under the excellence line (85%)" });
      } else if (wrongRatio != null && wrongRatio >= 0.25) {
        rows.push({ ch: ch, best: best, why: Math.round(wrongRatio * 100) + "% of your logged answers here were misses" });
      }
    });
    return rows.sort(function (a, b) { return (a.best == null ? 100 : a.best) - (b.best == null ? 100 : b.best); }).slice(0, 3);
  }
  function flagsOf(st) {
    return (st.flags || []).filter(function (f) { return f.type !== "fast" || true; });
  }
  function hours(st) { return Math.floor((st.secs || 0) / 3600); }

  /* ---------- the Mentor's voice ----------
     Strong opinions, routed through experience. Every answer is
     grounded in the Reality FX curriculum — and every topic ends
     with the trap, because the trap is where accounts die. */
  var TOPICS = [
    {
      keys: ["what is forex", "forex market", "fx market", "foreign exchange", "currency market", "what is trading", "what does the market", "decentralised", "decentralized"],
      reply: "The forex market is the world's largest financial room — roughly $7.5 trillion changing hands every single day. Currencies trade in pairs: you're always buying one and selling the other, and the pair's price is simply the exchange rate between them.\n\nThe part most beginners never hear: **every trade has someone on the other side**. When you buy, someone with real money is selling you that position — often an institution that knows more than you do. That's not scary, it's clarifying. It means your edge has to come from process and risk, not from hoping the market is nice to you.\n\nThe trap: treating a global, 24-hour market like a lottery ticket. It's not. It's a profession with a language, a structure and a cost of entry — and Chapter 1 exists to teach you the language before you ever risk a rand.",
      ref: 1
    },
    {
      keys: ["lot", "pip", "pips", "spread", "leverage", "margin", "bid", "ask", "long", "short", "timeframe", "terminology", "contract size", "pip value", "what is a pip"],
      reply: "This is the vocabulary that separates people who trade from people who gamble. Four words matter more than any chart:\n\n• **Pip** — the smallest meaningful price move (usually the 4th decimal). It's your unit of profit and loss.\n• **Lot** — contract size. Standard lots are big money; micro and mini lots let beginners survive their mistakes.\n• **Spread** — the broker's cut, built into the price. On a scalp it can eat a third of your edge before you even enter.\n• **Leverage & margin** — leverage multiplies your position; margin is the deposit that holds it. Both are tools, and both are knives.\n\nMy opinion, and I don't soften it: **leverage is how beginners blow up, not how they get rich.** A beginner on 500:1 isn't trading — they're renting a faster way to zero. Keep leverage modest, keep your risk per trade at 1–2%, and let Chapter 2's calculations become reflexes you can do in your head.\n\nThe trap: knowing the words but not the math. Knowing what a pip is worth in *your* account — before you click — is non-negotiable. Chapter 2, slides on calculations. Learn them cold.",
      ref: 2
    },
    {
      keys: ["fundamental", "news", "gdp", "interest rate", "inflation", "jobs", "nfp", "economic", "central bank", "data release", "rate decision", "nonfarm"],
      reply: "Fundamentals are the big forces behind price: rate decisions, GDP, jobs, inflation — the things that push currencies for weeks and months, not seconds.\n\nThe honest bit nobody tells you: the five minutes around a news release is the most dangerous time in trading, and it's not where beginners belong. The spread blows out, price whipsaws both ways, and by the time your order fills, the move's gone — usually against you. I've seen more accounts die on a news spike than on any strategy mistake.\n\nWhat fundamentals are for you right now: context. Knowing the rate cycle and the market's mood tells you *why* price is moving — and that's what makes your technicals make sense.\n\nThe trap: trading the release itself because it feels exciting. Excitement isn't an edge. Wait for the dust to settle, trade the reaction higher up — or sit out. Sitting out is a position too, and it's free.",
      ref: 3
    },
    {
      keys: ["candlestick", "candle", "doji", "hammer", "engulf", "wick", "shadow", "body", "pattern", "candles"],
      reply: "Candlesticks are the market's graffiti — every one is a story of a fight between buyers and sellers. The body shows who won that session; the wicks show where the other side pushed back.\n\nThe classics I actually respect: the **doji** (open ≈ close — pure indecision, a coin flip, never trade it alone), the **hammer** (a long lower wick — sellers tried to dump it and failed), and the **engulfing** candle (one side completely swallowed the previous session — a genuine shift in control).\n\nMy opinion: **a single candle is a clue, not a signal.** Beginners fall in love with one pretty pattern and start seeing it everywhere. The market doesn't care about your favourite candle — it cares about where that candle sits. A hammer at the bottom of a downtrend at a support level, with a confluence of confirmation, means something. The same hammer in the middle of nowhere means nothing.\n\nThe trap: trading candles without context. Chapter 4 teaches you the language; Chapter 13 teaches you to read the sentence. Learn the candles, then learn to place them.",
      ref: 4
    },
    {
      keys: ["trend", "support", "resistance", "structure", "breakout", "liquidity", "momentum", "movement", "market moves", "how price moves", "pullback", "retest"],
      reply: "Price moves because money moves. Market structure — the highs, the lows, the levels where buyers and sellers already proved themselves — is the difference between reading a map and wandering into a forest.\n\n• **Trend** — price moves in swings. Higher highs and higher lows is an uptrend until it isn't.\n• **Support & resistance** — not magic lines, just memories of where real orders sat.\n• **Liquidity** — the market hunts it. Price gets drawn to where stops cluster, because that's where the fuel is.\n\nThe opinion you came for: **trade with the trend, not against it.** 'Buy the dip' sounds clever until you're catching a falling knife. In an uptrend, buy pullbacks to support — that's where the odds live.\n\nThe trap: drawing lines on a past chart and believing you'd have traded it. Everyone's a genius in hindsight. The test is what you do when price is *at* the level, live, with money on the line. That's what Chapter 5 trains.",
      ref: 5
    },
    {
      keys: ["psycholog", "emotion", "fear", "greed", "discipline", "mindset", "mental", "tilt", "revenge", "stress", "anxiety", "nervous", "scared", "afraid", "give up", "losing", "confidence", "overconfident"],
      reply: "Now we're at the real game — the one that decides whether your strategy ever gets a chance. Psychology isn't the soft chapter; it's the edge. I've watched brilliant analysts blow up because they couldn't sit still, while average traders compound quietly because they could. The market pays discipline and collects from everyone else.\n\nThe short version, from years of watching traders (including me):\n\n• **Fear** cuts winners early and freezes losers. Both are expensive.\n• **Greed** overtrades and over-leverages — the two fastest roads to zero.\n• **Revenge trading** is how one bad day becomes a blown account. The 3-loss breaker exists for exactly that.\n• **The outcome isn't feedback.** A losing trade with a perfect process is a good trade; a winning trade with a broken process is a landmine with a delay fuse.\n\nBlunt opinion: if a 2% loss doesn't feel like 'process, next', you're not ready for real money — no matter how good the strategy. The market will find your weak spot and hammer it until you fix it or you're out.\n\nThe trap: thinking you'll be disciplined when it matters. Discipline is built in the lab, long before it's tested for real. Chapter 6 is a training chapter, not a reading chapter. Train.",
      ref: 6
    },
    {
      keys: ["risk", "stop loss", "stop-loss", "stop", "take profit", "position size", "sizing", "2%", "two percent", "drawdown", "reward", "r multiple", "risk reward", "manage money", "money management", "risk management", "circuit breaker"],
      reply: "You're asking about the only part of trading you actually control — my favourite question. The market decides if you're right; you decide what you lose when you're wrong. That asymmetry is the whole profession.\n\nThe Reality FX standard:\n\n• **Risk 1–2% per trade.** A 2% loser is a bruise; a 10% loser starts a spiral.\n• **Reward-to-risk of at least 1.5:1 before you enter** — otherwise you're paying the market to be right.\n• **Every trade gets a stop before it gets an entry.** No stop, no trade — it's a donation, not a trade.\n• **Drawdown is the real enemy.** A 50% loss needs a 100% gain back. That's the math that kills gamblers.\n\nThe trap — the most expensive one in trading: increasing size after a loss to 'get it back'. That's not confidence, that's revenge in a suit. Use the 3-Loss Circuit Breaker until it bores you. Boring is the goal. Chapter 7 is the foundation of the building, not one of the bricks — treat it that way.",
      ref: 7
    },
    {
      keys: ["pairs", "majors", "eurusd", "gbpusd", "usdjpy", "cross", "correlation", "commodity currency", "which pair", "best pair", "audusd", "usdcad", "usdchf"],
      reply: "Not all pairs are created equal. The **majors** (EUR/USD, GBP/USD, USD/JPY) are the most liquid — tight spreads, deep order books, cleaner structure. The crosses and exotics carry wider spreads and thinner liquidity, which means they move harder *against* you when they move at all.\n\nMy practical take:\n\n• **Start on the majors.** Liquidity is a beginner's best friend; it makes execution honest and slippage small.\n• **Know what a pair is made of.** USD/JPY is sensitive to risk sentiment; AUD/USD follows commodities and China; EUR/USD is the most 'textbook' pair on the board. Your pair's personality matters as much as your strategy.\n• **Watch correlation.** Trading EUR/USD and GBP/USD at the same time is often the same trade twice — you've doubled your risk without doubling your odds.\n\nMy opinion: **specialise.** One or two pairs you know like a childhood friend beats twenty pairs you sort of know. The traders I respect have a home market; the ones who blow up are everywhere at once.\n\nThe trap: hopping pairs every week chasing 'the one that's moving'. The pair isn't the problem — your patience is. Chapter 8 gives you the map; give yourself the discipline to stay on it.",
      ref: 8
    },
    {
      keys: ["order", "market order", "limit order", "stop order", "pending order", "execution", "fill", "slippage", "buy stop", "sell stop", "entry order", "how to enter"],
      reply: "Orders are how your intention meets the market — and the difference between what you *intend* and what *fills* is where beginners lose money without ever seeing it.\n\n• **Market order** — instant execution at the current price. You pay for immediacy with slippage in fast markets.\n• **Limit order** — you name your price and wait. Better price, but no guarantee you'll be filled.\n• **Stop order** — triggers a trade when price hits a level. This is how you enter a breakout *and* how you exit a disaster (stop-loss).\n\nMy opinion: **your exit orders matter more than your entry order.** The stop-loss is the only opinion the market has to respect. It's the line where you admit you were wrong and live to fight again — that's not weakness, that's the entire business model of surviving.\n\nThe trap: 'mental stops'. I don't care how disciplined you think you are — when price is ripping against you, your brain will find a thousand reasons to move the line. If the stop isn't in the market, it isn't real. Chapter 9 makes this concrete; make it a reflex.",
      ref: 9
    },
    {
      keys: ["indicator", "moving average", "ma ", "rsi", "macd", "bollinger", "oscillator", "stochastic", "ema", "sma", "indicators"],
      reply: "Straight truth from someone paid to watch them: **indicators are opinions, price is fact.** Every indicator is a calculation of what price *already did* — a rear-view mirror with pretty colours, and the market's ahead of you, not behind.\n\nThat's not 'useless' — it's 'know your tools':\n\n• **Moving averages** — a trend filter. Above the 200 is a different world from below it.\n• **RSI** — a momentum gauge, not a signal. 'RSI says oversold' is the most expensive sentence in retail.\n• **Bollinger Bands** — volatility context, not commands.\n\nBlunt take: **a chart full of indicators is a trader full of doubt.** Two or three you truly understand beat fifteen you half-trust. Structure and price first; indicators are seasoning, not the meal.\n\nThe trap: adding an indicator to fix a losing strategy. More indicators don't fix a broken process — they hide it. Chapter 10 teaches the tools; Chapter 13 teaches when to use them. Price first, always.",
      ref: 10
    },
    {
      keys: ["cycle", "accumulation", "markup", "distribution", "markdown", "phase", "smart money", "institutional cycle", "market cycle", "wyckoff"],
      reply: "Markets don't move in straight lines — they move in **cycles**, and the professionals who move them play the cycle like a chess game.\n\nThe four phases:\n\n• **Accumulation** — the smart money quietly builds positions while the crowd is bored or bearish. Price ranges; nobody cares.\n• **Markup** — the trend begins. Price starts climbing as the crowd finally notices.\n• **Distribution** — the smart money sells into the excitement. Price ranges again, but this time it's a top, not a base.\n• **Markdown** — the crowd realizes too late and the descent begins.\n\nThe opinion: **knowing where you are in the cycle changes everything.** Buying at the start of a markup is a gift; buying at the end of a distribution is a tax. The same chart, same pattern, opposite outcomes — depending on the phase.\n\nThe trap: fighting the phase. Trying to catch falling knives during markdown, or shorting a healthy markup because 'it's gone up too much'. The market doesn't owe you a reversal. Chapter 11 teaches you to read the room before you walk into it.",
      ref: 11
    },
    {
      keys: ["stock", "shares", "equity", "index", "s&p", "nasdaq", "dividend", "stock market", "equities"],
      reply: "The stock market is where companies trade as shares — and it's where a lot of forex traders find their second market. The connection matters: **stock indices like the S&P 500 and the Nasdaq move currency pairs too** — risk sentiment flows straight from equities into forex.\n\nWhat I want you to take from this:\n\n• **Indices are the mood ring of the market.** Equities rallying = risk-on = currencies like AUD and NZD tend to strengthen. Equities dumping = risk-off = safe havens (USD, JPY, gold) get bid.\n• **Timeframes are longer.** Stocks and indices trend for months and years, not minutes. That's a different discipline than scalping forex — a calmer, more patient game.\n• **One skill, two markets.** Everything you learn about structure, risk and psychology transfers. The vehicle changes; the driver doesn't.\n\nThe trap: assuming because you can read a forex chart you can trade stocks with the same rules. Same philosophy, different mechanics — earnings, gaps and dividends behave differently. Chapter 12 maps it; trade it on demo first like everything else.",
      ref: 12
    },
    {
      keys: ["technical", "chart pattern", "pattern", "triangle", "head and shoulders", "confluence", "multi timeframe", "fib", "fibonacci", "double top", "double bottom", "wedge"],
      reply: "Technical analysis is the art of reading the map — patterns, levels and structure — and it only pays when you combine it with the one word that separates winners from tourists: **confluence**.\n\nA signal means something when it lines up:\n\n• A **pattern** (double top, triangle, head & shoulders) at a **key level**,\n• in the direction of the **higher-timeframe trend**,\n• with **structure** confirming — that's a trade worth considering.\n\nOne pattern in the middle of nowhere is noise. Two or three things agreeing is a signal.\n\nThe opinion you came for: **higher timeframes decide, lower timeframes execute.** A 5-minute signal that fights the daily trend is a losing habit wearing a fancy name. Zoom out, find the story, then zoom in to find the entry — that's how professionals read the same chart you do and see something different.\n\nThe trap: pattern-hunting. If you stare at a chart long enough, you'll find a head and shoulders in the clouds. The market doesn't owe you a pattern — it owes you nothing. Chapter 13 is the capstone: it's where the language of every earlier chapter becomes a sentence you can actually trade.",
      ref: 13
    },
    {
      keys: ["sentiment", "sentimental", "crowd", "positioning", "contrarian", "retail vs institution", "who is on the other side", "institutional", "institution"],
      reply: "Sentiment trading reads the crowd's emotions — **not yours**. That's the whole distinction, and it's the one most people get backwards. Your own fear and greed are the thing to control; the crowd's fear and greed are the thing to read.\n\nThe uncomfortable truth about the other side of your trade: when you buy, an institution is often selling you that position — and they're not doing it because they're stupid. They're doing it because they're on the other side of a much bigger plan.\n\nMy opinion: **the crowd is usually right about direction and usually wrong about timing.** Sentiment extremes — euphoria at the top, panic at the bottom — are the moments that matter. That's when the smart money is quietly doing the opposite of what feels safest.\n\nThe trap: confusing your own emotions with market sentiment. 'I'm scared, so the market must be scared' is how beginners rationalise bad exits. Learn to read positioning, not your pulse. Chapter 1 and the sentiment work in the course show you the room; the laboratory lets you practise reading it without losing money.",
      ref: 1
    }
  ];

  /* ---------- meta intents (checked before topics) ---------- */
  var META = [
    {
      id: "help",
      test: function (t) { return /what can you do|help me|how do i use you|your features|what do you do|menu|options/.test(t); },
      reply: function (st) {
        return "Here's what I can do — and I only deal in trading, not admin. That's Sarah's desk, and she's brilliant at it. Me? I'm the curriculum with opinions.\n\n• **What should I study?** — I read your quiz data and point at your weak chapters. No guessing, just data.\n• **Am I ready to trade live?** — an honest readiness check from your real numbers. I'll be the one to tell you what you don't want to hear.\n• **Review my trade** — walk me through a trade and I'll tear it apart like a mentor should. Gently, but thoroughly.\n• **Ask me anything** — risk, psychology, candlesticks, pairs, indicators, the market cycle. I know this course like it's my own diary.\n• **How am I doing?** — your rank, streak, grades and hours at a glance.\n\nTry one of the chips below, or just ask me like you'd ask a friend who happens to know a ridiculous amount about markets. And remember the house rule: **every lesson is a trade, every trade is a lesson.**";
      }
    },
    {
      id: "status",
      test: function (t) { return /how am i doing|my progress|my rank|my stats|my status|my xp|where do i stand|how am i performing/.test(t); },
      reply: function (st) {
        var g = gradedChapters(st);
        var avg = avgGrade(st);
        var done = (st.chapters ? Object.keys(st.chapters).filter(function (id) { var c = st.chapters[id]; return c && c.passed; }).length : 0);
        var total = (CHAPTERS || []).filter(function (ch) { return ch.quiz; }).length;
        var weak = weakChapters(st);
        var name = profileOf(st) || "trader";
        var lines = [
          "Here's where you stand, " + name + " — and I'll give it to you straight, the way you deserve:",
          "• **" + done + "/" + total + " chapters passed**" + (avg != null ? " · average quiz grade **" + avg + "%**" : " · no quizzes graded yet — go pass one, the data changes everything"),
          "• **" + (st.xp || 0) + " XP** · " + (st.streak || 0) + "-day streak" + (hours(st) ? " · **" + hours(st) + "h** of study logged" : "")
        ];
        if (weak.length) {
          lines.push("\nMy honest read: **" + weak[0].ch.title + "** needs work — " + weak[0].why + ". Don't feel bad about it; feel *informed*. That's the highest-leverage place you can spend your next hour.");
        } else if (avg != null && avg >= 85) {
          lines.push("\nAnd the part worth celebrating, because it's earned: **no chapter sits under the excellence line.** That's rarer than you think. Now make it boring — consistency beats brilliance every single time.");
        }
        if ((st.flags || []).length) {
          lines.push("\nOne thing I notice: there are **" + st.flags.length + " fair-play flags** on your record. I don't judge — but the moderator does. Review before you retake; the reflection window exists to study, not to memorise answers. Keep it clean and this stays nothing.");
        }
        lines.push("\nThe score was never the point. The process is. Keep showing up and the numbers follow — that's not hope, that's arithmetic.");
        return lines.join("\n");
      }
    },
    {
      id: "weakness",
      test: function (t) { return /what should i study|my weakness|weak chapters|what do i need to work|where should i focus|recommend|what next|what should i review|which chapter/.test(t); },
      reply: function (st) {
        var weak = weakChapters(st);
        var g = gradedChapters(st);
        if (!g.length) {
          return "Nothing to analyse yet — you haven't graded a single quiz. That's not a criticism, it's a starting line, and every serious trader has stood on it. **Go pass Chapter 1's quiz**, come back, and I'll show you exactly where to aim next.\n\nThe market rewards people who know their weaknesses. Knowing them starts with having data — so let's get you some. It's the only honest way to aim.";
        }
        if (!weak.length) {
          return "Your quiz record is clean — every graded chapter sits at 85% or better. That deserves real respect, not a participation trophy. Genuinely — well done.\n\nNow the dangerous part, because I'd be failing you if I didn't say it: **comfort is where complacency lives.** Keep the streak alive, push one chapter to 90%+, and when the course ends, come back and let me build you a demo plan. The excellence line isn't a ceiling — it's a floor. The market pays the patient, and you're proving you can be patient.";
        }
        var lines = ["I read your quiz data. Here's what I'd do if I were you — no sugar, no mercy, all logic:\n"];
        weak.forEach(function (w, i) {
          lines.push("**" + (i + 1) + ". " + w.ch.title + "** — " + w.why + ".");
        });
        lines.push("\nMy advice: start with #1. It's the weakest link, which means it's the biggest upgrade available to you right now. Re-read the chapter in revision mode, take notes like you're explaining it to a friend — if you can teach it, you know it — then retake when the reflection window clears.");
        if (st.streak >= 3) lines.push("\nAnd keep the streak alive while you fix it — showing up daily is the habit that makes the studying work. That streak is your edge before you even touch a chart.");
        return lines.join("\n");
      }
    },
    {
      id: "ready",
      test: function (t) { return /am i ready|trade live|real money|go live|start trading|demo account|live account|fund my account|deposit|should i trade/.test(t); },
      reply: function (st) {
        var g = gradedChapters(st);
        var avg = avgGrade(st);
        var weak = weakChapters(st);
        var flags = (st.flags || []).length;
        var streak = st.streak || 0;
        var hoursN = hours(st);
        var verdicts = [];
        if (!g.length) {
          return "Not yet — and I say that with love, like a father who just watched his kid reach for the cookie jar before dinner. **You haven't passed a single quiz.** The market is not a casino and it does not owe you a learning experience with real money.\n\nHere's the gate, and it's a fair one: pass Chapter 1's quiz at 70%+, finish the first three chapters, then come back and ask me again. That's not a wall — it's a door, and it's the exact door every professional walked through. The market will still be there. It always is.";
        }
        if (avg < 70) verdicts.push("your average grade is **" + avg + "%** — below the pass line");
        if (weak.length >= 2) verdicts.push("**" + weak.length + " chapters** still sit under the excellence line");
        if (flags > 0) verdicts.push("you have **" + flags + " fair-play flags** — the integrity monitor is watching");
        if (hoursN < 10) verdicts.push("you've logged only **" + hoursN + "h** of study — the market punishes the unprepared");
        if (streak < 3) verdicts.push("your discipline streak is only **" + streak + " day" + (streak === 1 ? "" : "s") + "** — consistency is the edge");
        if (verdicts.length) {
          return "Straight answer: **not yet.** And here's why I say it — " + verdicts.join("; ") + ".\n\nNone of this is a judgement. It's a checklist — and checklists are the most loving thing I can give you, because they turn vague fear into specific action. Fix the list: push your grades up, review before retakes, show up daily. When you can answer 'no' to all of it, the answer to your question becomes yes — and you'll know it before I tell you.\n\nThe market will still be there. It always is. Show up ready, or don't show up at all — and I'd rather you show up ready.";
        }
        return "Here's the honest answer: **you're close — closer than most ever get.** Your average grade is **" + avg + "%**, no chapter under the excellence line, a **" + streak + "-day streak**, and a clean record. That's not nothing. That's a foundation.\n\nBut 'close' isn't 'yes', and I'd be lying to you if I pretended otherwise. Here's my gate: before a single rand goes live, **log 20 demo trades** — same rules, same size, same journal. If 14 of those 20 follow your plan (stop respected, size respected, no revenge), we talk. If the process falls apart in demo, it will fall apart ten times harder with real money on the line — and I refuse to watch that happen to you.\n\n**The market doesn't care how ready you think you are. Prove it in the lab first — then we'll both know.**";
      }
    },
    {
      id: "style",
      test: function (t) { return /which style|what style|my style|scalp|scalper|day trade|swing|position trade|am i a|what kind of trader|trader type|should i scalp|should i swing/.test(t); },
      reply: function (st) {
        var prof = styleOf(st);
        if (prof) {
          return "You've claimed your identity as a **" + prof.name + "** — “" + prof.tagline + "” — and I respect the commitment. The OS now teaches you through that lens, and here's what I want you to remember about being one:\n\n" + prof.timeframe + "\n\nYour traps to watch (and these are *your* traps, not general advice):\n• " + (prof.watch || []).slice(0, 3).join("\n• ") + "\n\nMy advice: stay in your lane. Every time you catch yourself eyeing a different timeframe or a different style's setups, ask one question — **is this my game, or am I just bored?** Boredom is the most expensive emotion in trading.\n\nYou can change your identity any time — the OS adapts. But pick a lane and master it before you shop for another.";
        }
        var lines = [
          "You haven't chosen a trader identity yet — and that's the first trade you need to make. Four main lanes:\n",
          "• **Scalper** — seconds to minutes. Speed, spread discipline, dozens of decisions a day. Adrenaline with a plan.\n• **Day trader** — minutes to hours, flat by close. The most common professional lane; no overnight risk.\n• **Swing trader** — days to weeks. Fewer trades, bigger moves, patience as the edge.\n• **Position trader** — weeks to months. The slowest, most institutional lane; macro-driven.",
          "\nThe mistake is picking by what sounds cool. Pick by **who you actually are**: how long can you sit still? How do you react under time pressure? Can you hold a position overnight without checking it?\n\nInside Chapter 1 there's an identity question designed to find your lane — go answer it, then come back and I'll coach you inside it. **A trader without a lane is a tourist with a chart.**"
        ];
        return lines.join("\n");
      }
    },
    {
      id: "review",
      test: function (t) { return /review my trade|my trade|trade review|journal my trade|critique|evaluate my trade/.test(t); },
      reply: function (st) {
        return "Let's do this properly — like a real mentor would, not a cheerleader. Walk me through the trade in **one message**:\n\n• The **setup** — what did you see? What was the pattern, level or confluence?\n• Your **entry** — where, and why exactly there?\n• Your **stop** — where was it, and what % of your account did it risk?\n• Your **target** — and the reward-to-risk ratio.\n• Your **size** — how much did you risk in rands?\n\nInclude as much as you remember — even the uncomfortable parts. I'll tell you what was right, what was luck, and what will get you hurt if you repeat it.";
      }
    },
    {
      id: "size",
      test: function (t) { return /how much.*risk|what size|position size|how many lots|risk per trade|what %|how big.*position|sizing/.test(t); },
      reply: function (st) {
        return "Position sizing is the one calculation you must do before every single trade — here's the Reality FX method:\n\n1. **Decide your risk per trade: 1–2% of your account.** That's the fixed number. Everything else bends around it.\n2. **Find your stop distance in pips** — from entry to stop.\n3. **Size so that *that* many pips equals your 1–2%.** More stop distance = smaller size. Less distance = larger size. The risk never changes — only the size does.\n\nExample: R10,000 account, 2% risk = **R200 risk**. Stop 40 pips away → your position must be sized so 40 pips ≈ R200. If that means a micro lot, so be it. **Humility in size is what keeps you in the game long enough to get good.**\n\nThe trap: sizing for the profit you *want* instead of the risk you *allow*. That's how a 'sure thing' becomes a margin call. Chapter 7 and the Risk Calculator in the Laboratory will make this a reflex — run the numbers until you can do them in your sleep.";
      }
    },
    {
      id: "failed",
      test: function (t) { return /fail|failed|didn'?t pass|didnt pass|couldn'?t pass|couldnt pass|flunk|bombed|scored (only )?[0-9]{1,2}%|got [0-9]{1,2}%|failed the quiz|failed my quiz|failed the exam|failed the test|failed again|missed it|didn'?t make it/.test(t); },
      reply: function (st) {
        var name = profileOf(st) || "trader";
        var worst = null;
        Object.keys(st.chapters || {}).forEach(function (id) {
          var c = st.chapters[id];
          if (!c) return;
          var best = (c.quizBest != null) ? c.quizBest : null;
          if (best != null && best < 70 && (!worst || best < worst.best)) {
            var ch = null;
            (CHAPTERS || []).forEach(function (x) { if (x.id === Number(id)) ch = x; });
            worst = { best: best, ch: ch };
          }
        });
        var target = worst && worst.ch ? "Chapter " + worst.ch.id + " — “" + worst.ch.title + "”" : "the chapter that beat you";
        return "Sit down, " + name + ". Breathe — I mean it, one slow breath in, one out. Because I'm about to tell you something you need to hear, and I need you relaxed enough to actually hear it.\n\nYou failed. So what? Do you know how many of the best traders I've watched got knocked flat on their way up? **All of them. Every single one.** The market doesn't care about your report card — it cares about whether you got back up and studied the tape. The people who make it aren't the ones who never fell. They're the ones who fell and treated it as information instead of a verdict.\n\nHere's what I tell myself when the red gets loud: “" + quote() + "”\n\nNow the logic part, because I care about you enough to be honest: **a failed quiz isn't bad luck — it's a message.** It's the chapter telling you, in no uncertain terms, exactly which concept you haven't turned into instinct yet. That's not a wall. That's a signpost. The only real failure would be feeling bad and doing nothing with it.\n\nSo here's the plan, and I expect you to follow it:\n\n• **Step away for real.** Two hours minimum. Walk. Eat. Sleep on it. Let your brain file the lesson — you'll come back sharper, not softer.\n• **Re-read " + target + " in revision mode**, notes open, like you're explaining it to your younger self out loud. If you can teach it, you know it.\n• **Then retake when the reflection window clears** — and this time you'll walk in already knowing what the exam was really asking. That's not memorising. That's mastery.\n\nYou're not behind, " + name + ". You're early in a very long road that rewards exactly this kind of stubbornness. Every master was once a disaster who refused to stay one — now it's your turn to refuse.\n\nTell me which chapter it was, and I'll point you at the exact slides to study. Deal?";
      }
    },
    {
      id: "psych",
      test: function (t) { return /i'm scared|im scared|i'm nervous|im nervous|i'm losing|im losing|i lost|i keep losing|revenge|tilt|frustrated|anxious|stressed|can't handle|cant handle|give up|want to quit|broke|blown|blew|feel like.*fail|discouraged|demoralized|demoralised|motivat/.test(t); },
      reply: function (st) {
        return "Okay, pause. Breathe with me — in... and out. Good. See? Alive, still trading tomorrow. You scared yourself, not the market.\n\nI've been exactly where you are — I once stared at a red chart so long I started naming the candles by first name. Stress is part of this game; the trick isn't to kill it, it's to stop it from driving.\n\nThree quick rules, no lecture, I promise:\n\n• **You are not your last trade.** A loss is tuition — you paid for the lesson, don't skip class.\n• **Shrink, don't stop.** Emotions loud? Halve your size or trade demo. Sitting out is a position, and it's free.\n• **Never revenge-trade.** One bad day + one revenge trade = one blown account. The 3-Loss Circuit Breaker is a seatbelt, not a suggestion — wear it.\n\nAnd the secret nobody tells you: **fear isn't the enemy. Fear without rules is.** “" + quote() + "”\n\nTell me what this one taught you — make it a rule and I'll hold you to it. Deal?";
      }
    }
  ];

  /* ---------- response engine ---------- */
  function clean(t) { return String(t || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function inText(t) { return clean(t); }

  function respond(text, st) {
    var t = clean(text);
    if (!t) return "Say something, trader — I can't read minds yet. (Give me a trade, a question, or a fear.)";

    // 1. trade review flow — continue if one is in progress
    //    (flow state lives in the chat store)

    // 2. meta intents
    for (var i = 0; i < META.length; i++) {
      if (META[i].test(t)) return META[i].reply(st);
    }

    // 3. greetings — and I read your file before you even say hi
    if (/^(hi|hello|hey|yo|howdy|good (morning|afternoon|evening)|hiya|what's up|sup|greetings)\b/.test(t) || t === "hi" || t === "hello" || t === "hey") {
      var name = profileOf(st) || "trader";
      var prof = styleOf(st);
      var g = gradedChapters(st);
      var weak = weakChapters(st);
      var flags = (st.flags || []).filter(function (f) { return f.type !== "fast"; }).length;
      var line = opener(name) + "\n\n";
      if (prof) line += "You ride as a **" + prof.name + "** — I'll coach you through that lens, and I'll be the first to call it when your own lane is the problem. Someone has to.\n\n";
      if (!g.length) line += "You haven't graded a quiz yet — and that's not a criticism, it's a starting line. Go pass Chapter 1 and I'll have real data to work with. That's when I get dangerous, and trust me, you want me dangerous on *your* side.\n\n";
      else {
        line += "Last I checked you're sitting at **" + avgGrade(st) + "%** across " + g.length + " graded quiz" + (g.length === 1 ? "" : "zes") + " — that's a trader's number, and I mean that.\n\n";
        if (weak.length) line += "Before you even ask: **" + weak[0].ch.title + "** is your weakest chapter. That's not a judgement — it's your highest-leverage hour today. Fix that one and your average jumps.\n\n";
      }
      if (flags) line += "One honest note, because I don't sugarcoat: there are fair-play flags on your record. I'm not judging you — but the moderator will look, so review before you retake. Play it straight and this amounts to nothing.\n\n";
      if (st.streak >= 3) line += "And that " + st.streak + "-day streak? Keep feeding it. That habit is the engine behind every other number.\n\n";
      line += "So — what's on your mind? A trade, a fear, or a chapter that's fighting you?";
      return line;
    }

    // 4. thanks
    if (/thank|thanks|appreciate|legend|cheers/.test(t)) {
      return "Anytime. But don't thank me — **prove it.** Take what we just said and apply it to your next decision. That's the only thanks that matters in this game, and honestly, it's the only kind I respect.\n\nNow go make me proud — and come back when you have a trade to review or a chapter to conquer.";
    }

    // 5. topic knowledge
    var best = null, bestScore = 0;
    TOPICS.forEach(function (topic) {
      var score = 0;
      topic.keys.forEach(function (k) {
        var kt = k.toLowerCase().trim();
        var re = new RegExp("(^|\\s)" + kt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|\\s|[?.!,;])");
        if (re.test(t)) score += kt.length; // longer, more specific keys win
      });
      if (score > bestScore) { bestScore = score; best = topic; }
    });
    if (best) {
      var out = best.reply;
      if (best.ref && CHAPTERS) {
        var ch = null;
        (CHAPTERS || []).forEach(function (c) { if (c.id === best.ref) ch = c; });
        if (ch) out += "\n\n**Go deeper:** Chapter " + ch.id + " — “" + ch.title + "” is where this lives in the course. Read it in revision mode with your notes open.";
      }
      return out;
    }

    // 6. fallback — honest, with direction and a wink
    return "Ha — that one's outside my lane, and I'll never fake it for you. I'm a trading twin, not a general assistant: ask me about the **market, risk, psychology, candlesticks, pairs, indicators, the market cycle**, or your **own progress and weaknesses**.\n\nTry one of these and watch what happens:\n• “What should I study?”\n• “Am I ready to trade live?”\n• “Review my trade”\n• “Fix my risk management”\n\nOr name a chapter — 1 through 13 — and I'll point you at the core idea. I know this course like the back of my hand. It's the only hand I've got.";
  }

  /* ---------- review flow (persisted) ----------
     A real mentor interrogates: setup → stop → reward/risk → verdict. */
  var REVIEW_STEPS = [
    { key: "setup", ask: "Good — start with the **setup**. What did you see before you entered? The pattern, the level, the confluence. Why did this trade exist?" },
    { key: "stop", ask: "Now the uncomfortable one: **where was your stop-loss, and what % of your account did it risk?** Be precise — 'about there' is not an answer." },
    { key: "rr", ask: "And the **target** — where was your take-profit, and what was the reward-to-risk ratio? If you didn't have one, say so. That's the answer I respect most." }
  ];

  function runReviewStep(store, studentText, st) {
    var step = store.review || { step: 0, notes: [] };
    step.notes.push(studentText);
    if (step.step < REVIEW_STEPS.length) {
      var reply = REVIEW_STEPS[step.step].ask;
      step.step++;
      return reply;
    }
    // verdict
    var notes = step.notes.join(" ").toLowerCase();
    var hasStop = /stop|sl\b/.test(notes);
    var hasRr = /reward|rr|ratio|target|tp\b/.test(notes);
    var hasSize = /%|percent|risk|rand|lot/.test(notes);
    var lines = ["Alright — that's enough for a real verdict. Here's the review:\n"];
    if (!hasStop) lines.push("• **No stop-loss mentioned.** That's the headline. A trade without a stop isn't a trade — it's a donation. Non-negotiable from today: stop first, then entry.");
    else lines.push("• **Stop in place** — good. That's the baseline every professional pays respect to.");
    if (!hasRr) lines.push("• **No reward-to-risk structure.** If you don't know your target before you enter, you're not trading a plan — you're hoping. 1.5:1 minimum, always.");
    else lines.push("• **Reward-to-risk thought through** — that's the sign of a trader, not a gambler.");
    if (!hasSize) lines.push("• **Sizing unstated.** Your risk per trade is the only number you control. Make it 1–2% and make it a reflex.");
    lines.push("\nThe process matters more than the outcome — **a losing trade with a perfect process is a good trade.** Review your journal entry, note what the market taught you, and come back with the next one. That's how the academy works.");
    store.review = null; // flow complete
    return lines.join("\n");
  }

  /* ---------- chat store ---------- */
  function loadChat() {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "null") || { msgs: [], review: null, lastGreet: "" }; }
    catch (e) { return { msgs: [], review: null, lastGreet: "" }; }
  }
  function saveChat(c) {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(c)); } catch (e) { /* storage full — ignore */ }
  }

  function fmt(s) {
    var out = String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/^• /gm, '<span class="m-dot">•</span> ');
    return out.replace(/\n/g, "<br>");
  }

  /* ---------- UI ---------- */
  var rootEl = null, chatEl = null, inputEl = null, sendEl = null, chipsEl = null;
  var typingTimer = null, mounted = false;

  var CHIPS = [
    "What should I study?",
    "Am I ready to trade live?",
    "Review my trade",
    "Fix my risk management",
    "Trading psychology",
    "Which style fits me?",
    "How am I doing?"
  ];

  function bubble(role, html) {
    var wrap = document.createElement("div");
    wrap.className = "m-msg " + role;
    wrap.innerHTML = (role === "mentor" ? '<div class="m-ava">' + IC.robot + "</div>" : "") +
      '<div class="m-bubble">' + html + "</div>";
    return wrap;
  }
  function appendMsg(role, text) {
    var b = bubble(role, fmt(text));
    chatEl.appendChild(b);
    chatEl.scrollTop = chatEl.scrollHeight;
    return b;
  }
  function typing() {
    var t = document.createElement("div");
    t.className = "m-msg mentor m-typing-row";
    t.innerHTML = '<div class="m-ava">' + IC.robot + '</div><div class="m-bubble m-typing"><span></span><span></span><span></span></div>';
    chatEl.appendChild(t);
    chatEl.scrollTop = chatEl.scrollHeight;
    return t;
  }
  function renderChat(store) {
    chatEl.innerHTML = "";
    store.msgs.forEach(function (m) { appendMsg(m.role, m.text); });
    if (!store.msgs.length) chatEl.innerHTML = '<div class="m-empty"><div class="m-empty-ic">' + IC.robot + "</div><p>Your trading twin is here — grounded in the full 13-chapter curriculum and your live OS data. Ask it anything.</p></div>";
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function send(text) {
    var store = loadChat();
    var t = String(text || "").trim();
    if (!t) return;
    // PII guard — the same scan every chat runs. Hard blocks are refused
    // outright (card numbers, national IDs, passwords, 2FA codes, …);
    // contact details get a gentle heads-up before the answer.
    var warnNote = "";
    if (window.RFXpii) {
      var dlp = window.RFXpii.scan(t);
      if (dlp.level === "block") {
        appendMsg("mentor", "🚫 Not sending that — it looks like " + dlp.found.join(", ") + ". Chats aren't a protected place for sensitive details, and no real RFX team member will ever ask for those here. Ask me anything about trading, though!");
        inputEl.focus();
        return;
      }
      if (dlp.level === "warn") warnNote = "Quick heads-up: that included " + dlp.found.join(", ") + ". It's your call to share, but chats aren't a protected place for personal details. ";
    }
    store.msgs.push({ role: "student", text: t });
    saveChat(store);
    appendMsg("student", t);
    inputEl.value = "";

    // continue a review flow if one is live
    var isReviewReply = store.review && store.review.step > 0 && store.review.step <= REVIEW_STEPS.length;

    var st = readState();
    var trow = typing();
    inputEl.disabled = true; if (sendEl) sendEl.disabled = true;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      var reply, nstore = loadChat();
      if (nstore.review && nstore.review.step > 0 && nstore.review.step <= REVIEW_STEPS.length) {
        reply = runReviewStep(nstore, t, st);
      } else if (/review my trade|my trade|trade review|journal my trade|critique|evaluate my trade/.test(clean(t))) {
        nstore.review = { step: 0, notes: [] };
        // first step asked immediately
        reply = REVIEW_STEPS[0].ask;
        nstore.review.step = 1;
      } else {
        reply = respond(t, st);
      }
      nstore.msgs.push({ role: "mentor", text: warnNote + reply });
      saveChat(nstore);
      if (trow.parentNode) trow.parentNode.removeChild(trow);
      appendMsg("mentor", reply);
      inputEl.disabled = false; if (sendEl) sendEl.disabled = false;
      inputEl.focus();
    }, 650 + Math.min(1400, replyLen(text) * 40));
  }
  function replyLen(t) { return String(t).length; }

  function chipsRow() {
    chipsEl.innerHTML = "";
    CHIPS.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "m-chip";
      b.textContent = c;
      b.addEventListener("click", function () { send(c); });
      chipsEl.appendChild(b);
    });
  }

  function greeting(store) {
    var today = new Date().toISOString().slice(0, 10);
    if (store.lastGreet === today) return;
    store.lastGreet = today;
    var st = readState();
    var g = gradedChapters(st);
    var name = profileOf(st);
    var weak = weakChapters(st);
    var flags = (st.flags || []).filter(function (f) { return f.type !== "fast"; }).length;
    var open = opener(name || "trader") + "\n\n";
    if (g.length) {
      open += "You're sitting at **" + avgGrade(st) + "%** across " + g.length + " graded quiz" + (g.length === 1 ? "" : "zes") + " — the work is compounding, and I notice.\n";
      if (weak.length) open += "And before you ask: **" + weak[0].ch.title + "** is your weakest chapter. That's your highest-leverage hour today — fix it and everything else gets easier.\n";
    } else {
      open += "Still early days — and I respect that more than you know. The first step is the one most people never take, and you've taken it. Go pass Chapter 1's quiz and I'll have real data to work with.\n";
    }
    if (flags) open += "One honest note: fair-play flags are on your record. I'm not judging — but review before you retake, and this becomes nothing.\n";
    if (st.streak >= 3) open += "That " + st.streak + "-day streak is the engine. Keep feeding it.\n";
    open += "\nWhat's on your mind — a trade, a fear, or a chapter that's fighting you?";
    store.msgs.push({ role: "mentor", text: open });
    saveChat(store);
  }

  window.RFXMentor = {
    mount: function (root) {
      if (mounted) { window.RFXMentor.destroy(); }
      mounted = true;
      rootEl = root;
      rootEl.innerHTML =
        '<div class="page-head">' +
          '<p class="eyebrow">AI Mentor · your trading twin</p>' +
          '<h2>The Mentor</h2>' +
          '<p class="page-sub">A robotic version of your founder — opinions routed through experience, reading your live academy data. Grounded in the full Reality FX curriculum.</p>' +
        "</div>" +
        '<div class="mentor-card">' +
          '<div class="mentor-chat" id="m-chat"></div>' +
          '<div class="mentor-chips" id="m-chips"></div>' +
          '<div class="mentor-input">' +
            '<input id="m-in" type="text" placeholder="Ask the Mentor anything about trading…" autocomplete="off">' +
            '<button id="m-send" aria-label="Send">' + IC.send + "</button>" +
          "</div>" +
        "</div>";

      chatEl = root.querySelector("#m-chat");
      chipsEl = root.querySelector("#m-chips");
      inputEl = root.querySelector("#m-in");
      sendEl = root.querySelector("#m-send");

      var store = loadChat();
      greeting(store);
      renderChat(store);
      chipsRow();

      var onSend = function () { send(inputEl.value); };
      sendEl.addEventListener("click", onSend);
      inputEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); onSend(); } });
      setTimeout(function () { inputEl.focus(); }, 50);
    },
    destroy: function () {
      clearTimeout(typingTimer);
      mounted = false;
      rootEl = null; chatEl = null; inputEl = null; sendEl = null; chipsEl = null;
    }
  };
})();
