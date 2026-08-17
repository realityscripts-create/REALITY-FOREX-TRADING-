/* ============================================================
   RFX SIMULATED TRADING — the machine-judged challenge arena
   ------------------------------------------------------------
   Learn → Practise → Replay → TRADE → Measure → Improve.
   Controlled demo accounts, institutional challenge rules, and
   a machine that grades ability — not just profit. No student
   money ever touches this; the environment is simulation by
   design, and the machine keeps the score.
   ============================================================ */
(function () {
  "use strict";

  const KEY = "rfx_os_sim_v1";

  /* ---------- identity (read-only from the OS store) ---------- */
  function ident() {
    try {
      const s = JSON.parse(localStorage.getItem("rfx_os_v1") || "{}");
      const p = s.profile || {};
      return {
        name: (p.name && p.name.trim()) || s.name || "Student",
        id: (s.handoff && s.handoff.studentId) || (p.code && /^RFX-\d{5,6}$/.test(p.code) ? p.code : "RFX-DEMO")
      };
    } catch (e) { return { name: "Student", id: "RFX-DEMO" }; }
  }

  /* ---------- tiny UI helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  let toastTimer = null;
  function toast(msg, kind) {
    let t = document.getElementById("sim-toast");
    if (!t) { t = document.createElement("div"); t.id = "sim-toast"; t.className = "toast"; document.body.appendChild(t); }
    t.className = "toast show" + (kind ? " toast-" + kind : "");
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3400);
  }
  function money(n) { return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(n) { return (n * 100).toFixed(1) + "%"; }

  /* ---------- the market ---------- */
  const SIM_PAIRS = {
    "EUR/USD": { base: "EUR", quote: "USD", pip: 0.0001, spread: 1.0, lot: 100000, vol: 1.0,  session: "London–NY overlap", seed: 1.0850 },
    "GBP/USD": { base: "GBP", quote: "USD", pip: 0.0001, spread: 1.2, lot: 100000, vol: 1.18, session: "London", seed: 1.2700 },
    "USD/JPY": { base: "USD", quote: "JPY", pip: 0.01,  spread: 0.8, lot: 100000, vol: 0.9,  session: "Asia", seed: 150.20 },
    "AUD/USD": { base: "AUD", quote: "USD", pip: 0.0001, spread: 1.1, lot: 100000, vol: 0.95, session: "Sydney–London", seed: 0.6550 },
    "USD/ZAR": { base: "USD", quote: "ZAR", pip: 0.0001, spread: 30,  lot: 100000, vol: 1.55, session: "London–NY", seed: 18.400 }
  };
  const FEED = { rates: {}, ts: 0, mode: "sim", err: 0 };
  function rateFor(pair) {
    const p = SIM_PAIRS[pair];
    if (!p) return 0;
    if (FEED.rates[pair] && FEED.rates[pair] > 0) return FEED.rates[pair];
    return p.seed;
  }
  function tickRate(pair) {
    const p = SIM_PAIRS[pair];
    if (!p) return;
    const cur = rateFor(pair);
    const drift = (Math.random() - 0.5) * p.vol * 0.0018;
    let next = cur * (1 + drift);
    // the exotic toll: thin books lurch more
    if (p.spread >= 20) next = cur * (1 + (Math.random() - 0.5) * p.vol * 0.004);
    FEED.rates[pair] = next;
  }
  /* Live prices come from a free feed when reachable; the sim never depends
     on it — offline, the market walks a seeded path and keeps teaching. */
  async function refreshFeed() {
    if (Date.now() - FEED.ts < 45000) return;
    FEED.ts = Date.now();
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", { cache: "no-store", signal: ctl.signal });
      clearTimeout(to);
      if (!r.ok) throw new Error("feed " + r.status);
      const j = await r.json();
      const d = j && j.usd ? j.usd : null;
      if (d && d.eur && d.gbp && d.jpy && d.aud && d.zar) {
        FEED.rates["EUR/USD"] = 1 / d.eur;
        FEED.rates["GBP/USD"] = 1 / d.gbp;
        FEED.rates["USD/JPY"] = d.jpy;
        FEED.rates["AUD/USD"] = 1 / d.aud;
        FEED.rates["USD/ZAR"] = d.zar;
        FEED.mode = "live";
        FEED.err = 0;
        return;
      }
      throw new Error("shape");
    } catch (e) {
      FEED.mode = "sim";
      FEED.err = FEED.err + 1;
      for (const pair in SIM_PAIRS) if (!FEED.rates[pair]) FEED.rates[pair] = SIM_PAIRS[pair].seed;
    }
  }
  function feedLabel() { return FEED.mode === "live" ? "Live feed · refreshed from the market" : "Simulated path · offline-safe, same rules"; }

  /* ---------- challenges ---------- */
  const SIM_CHALLENGES = [
    {
      id: "ftmo", name: "RFX FTMO Challenge", tag: "The flagship", ic: "trophy",
      start: 10000, target: 0.08, maxRiskPerTrade: 0.02, maxDrawdown: 0.10,
      minTrades: 5, maxTradesPerDay: 8, days: 30, pairs: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"],
      rules: ["$10,000 demo account", "Max 2% risk per trade", "Max 10% drawdown from peak", "Target +8% in 30 days", "Min 5 trades — the machine watches how, not just how much"],
      prize: "Top performers are invited to work with the Academy — the old FTMO spirit, institution-grade.",
      badge: "FTMO Challenge finisher", rewardCredit: 2500
    },
    {
      id: "risk", name: "Risk Management Challenge", tag: "Who loses least, stays longest", ic: "shield",
      start: 10000, target: 0.05, maxRiskPerTrade: 0.01, maxDrawdown: 0.05,
      minTrades: 10, maxTradesPerDay: 10, days: 21, pairs: ["EUR/USD", "GBP/USD", "USD/JPY"],
      rules: ["$10,000 demo account", "Max 1% risk per trade — the tightest leash on the board", "Max 5% drawdown", "Target +5% — smaller, cleaner, deliberate", "10+ trades so the machine can read your behaviour"],
      prize: "The student who proves the best risk control earns the Risk Officer recognition.",
      badge: "Risk Officer", rewardCredit: 1500
    },
    {
      id: "consistency", name: "Consistency Challenge", tag: "The machine grades your rhythm", ic: "chart",
      start: 10000, target: 0.06, maxRiskPerTrade: 0.02, maxDrawdown: 0.08,
      minTrades: 15, maxTradesPerDay: 6, days: 21, pairs: ["EUR/USD", "AUD/USD", "USD/JPY"],
      rules: ["$10,000 demo account", "15+ trades so your R-distribution is readable", "The machine scores the steadiness of your risk multiples — a spike of genius with reckless swings loses to a calm, consistent edge", "Max 8% drawdown"],
      prize: "Consistency is the hardest professional skill — the leaderboard here is the truest test of a trader's identity.",
      badge: "Consistency master", rewardCredit: 1500
    },
    {
      id: "prop", name: "Prop-Style Challenge", tag: "The two-step institution test", ic: "institution",
      start: 50000, target: 0.10, maxRiskPerTrade: 0.02, maxDrawdown: 0.08,
      minTrades: 8, maxTradesPerDay: 8, days: 45, pairs: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"],
      rules: ["$50,000 demo account — prop-style size, prop-style discipline", "Phase 1: reach +10% with max 8% drawdown", "Phase 2: repeat at a 5% target with the same rules", "Every rule break is machine-recorded — the machine, not staff, keeps the score"],
      prize: "Pass both phases and the machine issues the institutional-grade pass — the closest thing to a funded-trader path the Academy offers.",
      badge: "Institutional-grade pass", rewardCredit: 5000
    }
  ];
  // The machine-signed reward: a PASS is a signed result, and a signed result
  // earns what the challenge promised. Paid into the student's RFX wallet as
  // credit — the same rail prize money uses. No staff hand, no negotiation.
  function grantReward(chId, assessment) {
    if (!assessment || !assessment.passed) return null;
    const ch = challenge(chId);
    if (!ch || !ch.badge) return null;
    SIM.rewards = SIM.rewards || {};
    SIM.rewards[chId] = { badge: ch.badge, credit: ch.rewardCredit || 0, at: Date.now() };
    saveSim();
    return SIM.rewards[chId];
  }
  function challenge(id) { return SIM_CHALLENGES.find(c => c.id === id); }

  /* ---------- sim store ---------- */
  function loadSim() {
    try { return Object.assign({ accounts: {} }, JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return { accounts: {} }; }
  }
  let SIM = loadSim();
  function saveSim() { try { localStorage.setItem(KEY, JSON.stringify(SIM)); } catch (e) { /* full store — trading continues in memory */ } }

  function accountFor(chId) {
    const ch = challenge(chId);
    if (!ch) return null;
    if (!SIM.accounts[chId]) {
      SIM.accounts[chId] = {
        challenge: chId, startedAt: Date.now(), start: ch.start, balance: ch.start,
        equity: ch.start, peak: ch.start, maxDD: 0, trades: [], violations: [],
        blockedTrades: 0, locked: false, closed: false, endedAt: 0, assessment: null,
        tradeDay: null, tradeDayCount: 0
      };
      saveSim();
    }
    return SIM.accounts[chId];
  }

  /* ---------- the engine ---------- */
  function openRisk(acc, ch, entry, sl, lots, pair) {
    const p = SIM_PAIRS[pair];
    return Math.abs(entry - sl) * lots * p.lot;
  }
  function suggestLots(acc, ch, pair, entry, sl, riskPct) {
    const p = SIM_PAIRS[pair];
    const riskUSD = acc.balance * (riskPct || ch.maxRiskPerTrade);
    const perLot = Math.abs(entry - sl) * p.lot;
    if (perLot <= 0) return 0;
    return Math.floor((riskUSD / perLot) * 100) / 100;
  }
  function tradesToday(acc) {
    const d = new Date().toISOString().slice(0, 10);
    return acc.trades.filter(t => new Date(t.openedAt).toISOString().slice(0, 10) === d).length;
  }
  function openTrade(acc, ch, opts) {
    if (acc.closed || acc.locked) return { ok: false, reason: acc.locked ? "The machine has locked this account — the drawdown red line was breached. Close your open positions." : "This challenge has ended." };
    const p = SIM_PAIRS[opts.pair];
    if (!p) return { ok: false, reason: "Unknown pair." };
    if (ch.pairs.indexOf(opts.pair) < 0) return { ok: false, reason: opts.pair + " is not in this challenge's allowed list: " + ch.pairs.join(", ") + "." };
    const lots = Number(opts.lots);
    if (!(lots > 0)) return { ok: false, reason: "Enter a position size." };
    const entry = rateFor(opts.pair);
    const sl = Number(opts.sl);
    const tp = Number(opts.tp);
    if (!(sl > 0) || !(tp > 0)) return { ok: false, reason: "Every order needs a stop-loss and a take-profit — no stop, no trade." };
    const dir = opts.dir === "sell" ? -1 : 1;
    const risk = openRisk(acc, ch, entry, sl, lots, opts.pair);
    const maxRisk = acc.balance * ch.maxRiskPerTrade;
    if (risk > maxRisk + 0.001) {
      acc.blockedTrades = (acc.blockedTrades || 0) + 1;
      saveSim();
      return { ok: false, reason: "Risk rejected by the machine: " + money(risk) + " on the table exceeds the challenge's " + pct(ch.maxRiskPerTrade) + " cap (" + money(maxRisk) + "). Suggested size: " + suggestLots(acc, ch, opts.pair, entry, sl) + " lots." };
    }
    // revenge-sizing guard: a bigger risk right after a loss is the martingale trap
    const closed = acc.trades.filter(t => t.closed);
    const last = closed[closed.length - 1];
    if (last && last.pnl < 0 && risk > Math.abs(last.riskUSD) * 1.5) {
      acc.violations.push({ at: Date.now(), code: "size-after-loss", detail: "Increased risk after a loss — " + money(risk) + " vs the previous loss's " + money(Math.abs(last.riskUSD)) + ". That is the martingale door." });
      saveSim();
    }
    // overtrading guard
    if (tradesToday(acc) + 1 > ch.maxTradesPerDay) {
      acc.violations.push({ at: Date.now(), code: "overtrade", detail: "More than " + ch.maxTradesPerDay + " trades in a day — that is overtrading, and the machine reads it." });
      saveSim();
    }
    const t = {
      id: "T" + Math.floor(Math.random() * 90000 + 10000),
      pair: opts.pair, dir: dir > 0 ? "buy" : "sell", lots: lots,
      entry: entry, sl: sl, tp: tp,
      riskUSD: risk, r: 0,
      openedAt: Date.now(), closed: false
    };
    acc.trades.push(t);
    markDay(acc);
    saveSim();
    return { ok: true, trade: t };
  }
  function markDay(acc) {
    const d = new Date().toISOString().slice(0, 10);
    if (acc.tradeDay !== d) { acc.tradeDay = d; acc.tradeDayCount = 0; }
    acc.tradeDayCount++;
  }
  function closeTrade(acc, ch, id, price) {
    const t = acc.trades.find(x => x.id === id && !x.closed);
    if (!t) return { ok: false, reason: "Position not found or already closed." };
    const p = SIM_PAIRS[t.pair];
    const px = price || rateFor(t.pair);
    const dir = t.dir === "buy" ? 1 : -1;
    const move = (px - t.entry) * dir;
    const pnl = move * t.lots * p.lot;
    t.closed = true; t.closePrice = px; t.closedAt = Date.now(); t.pnl = pnl;
    t.r = Math.abs(t.riskUSD) > 0 ? pnl / t.riskUSD : 0;
    acc.balance = acc.balance + pnl;
    sample(acc);
    saveSim();
    return { ok: true, trade: t };
  }
  /* mark-to-market + stop/target fills + drawdown sampling */
  function sample(acc) {
    if (acc.balance > acc.peak) acc.peak = acc.balance;
    const dd = acc.peak > 0 ? (acc.peak - acc.balance) / acc.peak : 0;
    if (dd > acc.maxDD) acc.maxDD = dd;
  }
  function tick(acc, ch) {
    if (!acc || acc.closed) return;
    for (const pair in SIM_PAIRS) tickRate(pair);
    // fills: check open trades against the ticked prices
    let equity = acc.balance;
    for (const t of acc.trades) {
      if (t.closed) continue;
      const px = rateFor(t.pair);
      const dir = t.dir === "buy" ? 1 : -1;
      const pnl = (px - t.entry) * dir * t.lots * SIM_PAIRS[t.pair].lot;
      equity += pnl;
      // stop / target hit
      if (dir > 0 && px <= t.sl) closeTrade(acc, ch, t.id, t.sl);
      else if (dir > 0 && px >= t.tp) closeTrade(acc, ch, t.id, t.tp);
      else if (dir < 0 && px >= t.sl) closeTrade(acc, ch, t.id, t.sl);
      else if (dir < 0 && px <= t.tp) closeTrade(acc, ch, t.id, t.tp);
    }
    acc.equity = equity;
    sample(acc);
    // the drawdown red line
    if (!acc.locked && acc.balance < acc.start * (1 - ch.maxDrawdown)) {
      acc.locked = true;
      acc.violations.push({ at: Date.now(), code: "drawdown", detail: "Equity fell below the " + pct(ch.maxDrawdown) + " red line — the machine has locked the account. The point of the rule is the lesson." });
      saveSim();
    }
    if (!acc.locked && acc.balance <= 0) { acc.locked = true; acc.violations.push({ at: Date.now(), code: "ruin", detail: "The account hit zero — the hardest lesson the lab teaches." }); saveSim(); }
  }

  /* ---------- the machine assessment ---------- */
  function avg(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
  function stddev(a) {
    if (a.length < 2) return 0;
    const m = avg(a);
    return Math.sqrt(avg(a.map(x => (x - m) * (x - m))));
  }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function assess(acc, ch) {
    const closed = acc.trades.filter(t => t.closed);
    const wins = closed.filter(t => t.pnl > 0);
    const losses = closed.filter(t => t.pnl <= 0);
    const net = acc.balance - acc.start;
    const ret = acc.start > 0 ? net / acc.start : 0;
    const winRate = closed.length ? wins.length / closed.length : 0;
    const avgWinR = wins.length ? avg(wins.map(t => t.r)) : 0;
    const avgLossR = losses.length ? avg(losses.map(t => Math.abs(t.r))) : 0;
    const expectancy = closed.length ? avg(closed.map(t => t.r)) : 0;
    const rs = closed.map(t => t.r);
    const sd = stddev(rs);
    const cons = closed.length >= 3 ? clamp(100 - (sd / 0.8) * 40, 0, 100) : (closed.length >= 1 ? 40 : 0);
    const disc = clamp(100 - acc.violations.length * 12, 0, 100);
    const profitScore = ch.target > 0 ? clamp((ret / ch.target) * 100, 0, 120) : 0;
    const riskScore = acc.maxDD > 0 ? clamp(100 - (acc.maxDD / ch.maxDrawdown) * 100, 0, 100) : 50;
    const score = Math.round(profitScore * 0.28 + riskScore * 0.25 + disc * 0.27 + cons * 0.20);
    const passed = ret >= ch.target && acc.maxDD <= ch.maxDrawdown && closed.length >= ch.minTrades && acc.violations.length <= 2;
    return {
      net: net, ret: ret, maxDD: acc.maxDD, winRate: winRate,
      avgWinR: avgWinR, avgLossR: avgLossR, expectancy: expectancy,
      consistency: Math.round(cons), discipline: Math.round(disc),
      profitScore: Math.round(profitScore), riskScore: Math.round(riskScore),
      trades: closed.length, score: clamp(score, 0, 100), passed: passed,
      violations: acc.violations.slice()
    };
  }
  function endChallenge(chId) {
    const acc = accountFor(chId);
    if (!acc || acc.closed) return;
    tick(acc, challenge(chId));
    acc.assessment = assess(acc, challenge(chId));
    acc.closed = true;
    acc.endedAt = Date.now();
    grantReward(chId, acc.assessment);
    saveSim();
    return acc.assessment;
  }
  function abandonChallenge(chId) {
    const acc = accountFor(chId);
    if (!acc) return;
    acc.closed = true; acc.endedAt = Date.now();
    acc.assessment = assess(acc, challenge(chId));
    grantReward(chId, acc.assessment);
    saveSim();
    return acc.assessment;
  }

  /* ---------- leaderboard rail ---------- */
  function fetchBoards() {
    return fetch("api/challenge/leaderboard", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }
  function postResult(chId, assessment) {
    const me = ident();
    fetch("api/challenge/leaderboard", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: chId, studentId: me.id, name: me.name, score: assessment.score, verdict: assessment.passed ? "PASS" : "REVIEW", returnPct: Math.round(assessment.ret * 10000) / 100, trades: assessment.trades })
    }).catch(() => { /* offline — the local result still stands */ });
  }

  /* ---------- render ---------- */
  let viewEl = null, simTimer = null, currentTab = "hub", currentCh = null, livePanel = null;
  function render(root) {
    viewEl = root;
    root.appendChild(elHead());
    if (simTimer) clearInterval(simTimer);
    simTimer = setInterval(function () {
      refreshFeed();
      if (currentTab === "trade" && currentCh) {
        const acc = accountFor(currentCh);
        tick(acc, challenge(currentCh));
        if (livePanel) {
          // The tick updates ONLY the live boxes in place — prices, stats,
          // positions, history. It never re-renders the panel, so the loaded
          // market chart stays exactly where it is: one load, zero flicker.
          // A full re-render (paintTrade) happens only on state changes: an
          // order placed, closed, the challenge ended, the account locked.
          if (acc.closed || acc.locked) paintTrade(livePanel);
          else paintLive(livePanel, acc, challenge(currentCh));
        }
      }
    }, 5000);
    root.__simTimer = simTimer;
    paint();
  }
  /* The trader's picture at a glance: the percentage red line (drawdown) and
     the ACTUAL money — unrealized on the open book, realized from closed
     trades, and the total. Percentages tell you where the line is; the rand
     amount tells you what it means to the account right now. */
  function statsHTML(acc, ch) {
    const openTrades = acc.trades.filter(t => !t.closed);
    let unrealized = 0;
    for (const t of openTrades) {
      const px = rateFor(t.pair);
      const dir = t.dir === "buy" ? 1 : -1;
      unrealized += (px - t.entry) * dir * t.lots * SIM_PAIRS[t.pair].lot;
    }
    let realized = 0;
    for (const t of acc.trades) if (t.closed) realized += (t.pnl || 0);
    const total = realized + unrealized;
    return `<div class="sim-stat"><span>Balance</span><b>${money(acc.balance)}</b></div>
      <div class="sim-stat"><span>Equity</span><b>${money(acc.equity)}</b></div>
      <div class="sim-stat ${acc.maxDD >= ch.maxDrawdown ? "bad" : ""}"><span>Max drawdown</span><b>${pct(acc.maxDD)} <em>/ ${pct(ch.maxDrawdown)} cap</em></b></div>
      <div class="sim-stat ${unrealized >= 0 ? "up" : "down"}"><span>Unrealized P/L</span><b>${unrealized >= 0 ? "+" : ""}${money(unrealized)}</b></div>
      <div class="sim-stat"><span>Open positions</span><b>${openTrades.length}</b></div>
      <div class="sim-stat ${total >= 0 ? "up" : "down"}"><span>Total P/L</span><b>${total >= 0 ? "+" : ""}${money(total)}</b></div>
      <div class="sim-stat"><span>Violations</span><b>${acc.violations.length}</b></div>`;
  }
  /* The open-position list — rebuilt only when the open SET changes. On the
     5s tick it updates each row's price / P/L in place, so hundreds of rows
     cost a handful of text swaps instead of an innerHTML teardown. (The same
     lesson the chart rail taught: never rebuild what only needs updating.) */
  function renderOpenBox(openBox, acc, ch, panel) {
    const open = acc.trades.filter(t => !t.closed);
    const ids = open.map(t => t.id).join("|");
    const cur = [...openBox.querySelectorAll(".sim-pos")].map(r => r.getAttribute("data-tid")).join("|");
    if (open.length && ids === cur) {
      for (const t of open) {
        const row = openBox.querySelector('[data-tid="' + t.id + '"]');
        if (!row) continue;
        const px = rateFor(t.pair);
        const dir = t.dir === "buy" ? 1 : -1;
        const pnl = (px - t.entry) * dir * t.lots * SIM_PAIRS[t.pair].lot;
        row.className = "sim-pos " + (pnl >= 0 ? "up" : "down");
        const mid = row.querySelector(".sp-mid");
        if (mid) mid.textContent = "in @ " + t.entry.toFixed(4) + " · now " + px.toFixed(4) + " · SL " + t.sl.toFixed(4) + " / TP " + t.tp.toFixed(4);
        const pnlEl = row.querySelector(".sp-pnl");
        if (pnlEl) pnlEl.textContent = (pnl >= 0 ? "+" : "") + money(pnl);
      }
      return;
    }
    openBox.innerHTML = open.length ? open.map(t => {
      const px = rateFor(t.pair);
      const dir = t.dir === "buy" ? 1 : -1;
      const pnl = (px - t.entry) * dir * t.lots * SIM_PAIRS[t.pair].lot;
      return `<div class="sim-pos ${pnl >= 0 ? "up" : "down"}" data-tid="${t.id}">
        <span class="sp-pair">${esc(t.pair)} <em>${t.dir}</em> · ${t.lots} lots</span>
        <span class="sp-mid">in @ ${t.entry.toFixed(4)} · now ${px.toFixed(4)} · SL ${t.sl.toFixed(4)} / TP ${t.tp.toFixed(4)}</span>
        <span class="sp-pnl">${pnl >= 0 ? "+" : ""}${money(pnl)}</span>
        <button class="btn-ghost sm" data-close="${t.id}">Close</button>
      </div>`;
    }).join("") : `<p class="live-note">No open positions — the market waits for your decision.</p>`;
    openBox.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => {
      closeTrade(acc, ch, b.dataset.close);
      paintTrade(panel);
    }));
  }

  /* The 5s heartbeat — touches ONLY the boxes that change, in place. */
  function paintLive(panel, acc, ch) {
    const prices = panel.querySelector(".sim-prices");
    if (prices) prices.innerHTML = ch.pairs.map(p => {
      const r = rateFor(p);
      const move = r >= SIM_PAIRS[p].seed ? "up" : "down";
      return `<span class="sim-price ${move}"><b>${esc(p)}</b> ${r.toFixed(SIM_PAIRS[p].pip < 0.01 ? 4 : 2)}</span>`;
    }).join("");
    const accBox = panel.querySelector(".sim-acc");
    if (accBox) accBox.innerHTML = statsHTML(acc, ch);
    const openBox = panel.querySelector("#simOpen");
    const histBox = panel.querySelector("#simHist");
    if (openBox) renderOpenBox(openBox, acc, ch, panel);
    if (histBox) {
      const closed = acc.trades.filter(t => t.closed).slice().reverse().slice(0, 12);
      histBox.innerHTML = closed.length ? closed.map(t => `<div class="sim-hist ${t.pnl >= 0 ? "up" : "down"}">
        <span class="sp-pair">${esc(t.pair)} ${t.dir} · ${t.lots} lots</span>
        <span class="sp-mid">${t.entry.toFixed(4)} → ${t.closePrice.toFixed(4)} · ${t.r >= 0 ? "+" : ""}${t.r.toFixed(2)}R</span>
        <span class="sp-pnl">${t.pnl >= 0 ? "+" : ""}${money(t.pnl)}</span></div>`).join("") : `<p class="live-note">No closed trades yet.</p>`;
    }
    // A lock that lands mid-session swaps the order form for the red banner
    // in place — no full re-render, so the chart never blinks.
    const form = panel.querySelector(".sim-order");
    if (form && acc.locked) {
      const banner = document.createElement("div");
      banner.className = "sim-locked";
      banner.innerHTML = "⚠ The drawdown red line was breached — this account is locked by the machine. Close your positions; the lesson is the prize.";
      form.replaceWith(banner);
    }
  }
  function elHead() {
    const d = document.createElement("div");
    d.className = "page-head";
    d.innerHTML = `<p class="eyebrow">Reality FX OS · the arena</p>
      <h1 class="page-title">Trading Challenge</h1>
      <p class="page-sub">Simulated accounts, institutional rules, and a machine that grades ability — not just profit. Learn → Practise → Replay → <b>Trade</b> → Measure → Improve. No real money ever touches this floor.</p>`;
    return d;
  }
  function tabsHtml() {
    return `<div class="sim-tabs">
      <button class="sim-tab ${currentTab === "hub" ? "on" : ""}" data-tab="hub">Challenges</button>
      <button class="sim-tab ${currentTab === "trade" ? "on" : ""}" data-tab="trade">${currentCh ? "My sim account · " + esc(challenge(currentCh).name) : "My sim account"}</button>
      <button class="sim-tab ${currentTab === "board" ? "on" : ""}" data-tab="board">Leaderboard</button>
      <button class="sim-tab ${currentTab === "machine" ? "on" : ""}" data-tab="machine">How the machine judges</button>
    </div>`;
  }
  function paint() {
    if (!viewEl) return;
    const prev = viewEl.querySelector(".sim-body");
    const body = document.createElement("div");
    body.className = "sim-body";
    body.innerHTML = tabsHtml();
    const panel = document.createElement("div");
    panel.className = "sim-panel" + (currentTab === "trade" ? " trade" : "");
    livePanel = panel;
    body.appendChild(panel);
    if (prev) prev.replaceWith(body); else viewEl.appendChild(body);
    body.querySelectorAll(".sim-tab").forEach(b => b.addEventListener("click", () => {
      currentTab = b.dataset.tab;
      if (currentTab === "trade" && !currentCh) { const first = SIM_CHALLENGES.find(c => !!accountFor(c.id)); currentCh = first ? first.id : SIM_CHALLENGES[0].id; }
      paint();
    }));
    if (currentTab === "hub") paintHub(panel);
    else if (currentTab === "trade") paintTrade(panel);
    else if (currentTab === "board") paintBoard(panel);
    else paintMachine(panel);
  }

  /* ---------- trader track ---------- */
  // The same ladder the Academy's trading roles follow (Apprentice → Junior →
  // Funded → Senior → Portfolio). The machine moves a student up on PROOF,
  // derived live from the signed challenge results — never a stored claim:
  //   Apprentice  — every trader starts here
  //   Junior      — a completed challenge with a machine score of 50+
  //   Funded      — a machine-signed PASS on any challenge
  //   Senior      — machine-signed PASSes on 2+ challenges
  //   Portfolio   — the Prop-Style institutional pass plus another PASS
  const TRACK_RUNGS = [
    { name: "Apprentice", cap: "Simulated capital", note: "Every trader starts here. Enter a challenge and let the machine read how you trade — your rung moves on proof, not promises." },
    { name: "Junior", cap: "Small allocation · performance share", note: "Complete any challenge with a machine score of 50+ and the machine recognises a funded-ready style." },
    { name: "Funded", cap: "Funded allocation · higher performance share", note: "Earn a machine-signed PASS on any challenge — that signed result is your funded seat." },
    { name: "Senior", cap: "Significant allocation · negotiated share", note: "Earn machine-signed PASSes on 2+ challenges — sustained proof, not a single lucky run." },
    { name: "Portfolio", cap: "Strategic allocation · profit participation", note: "Earn the Prop-Style institutional pass AND another PASS — the highest rung, reserved for proven, disciplined operators." }
  ];
  function trackRung() {
    const res = SIM_CHALLENGES.map(function (c) {
      const a = accountFor(c.id);
      return { id: c.id, closed: !!(a && a.closed), score: a && a.assessment ? a.assessment.score : 0, passed: !!(a && a.assessment && a.assessment.passed) };
    });
    const scored = res.filter(function (r) { return r.closed && r.score >= 50; }).length;
    const passes = res.filter(function (r) { return r.passed; });
    const nPass = passes.length;
    if (passes.some(function (r) { return r.id === "prop"; }) && nPass >= 2) return 4;
    if (nPass >= 2) return 3;
    if (nPass >= 1) return 2;
    if (scored >= 1) return 1;
    return 0;
  }
  function trackHTML() {
    const rung = trackRung();
    const r = TRACK_RUNGS[rung];
    const icons = ["book", "chart", "shield", "diamond", "institution"];
    const ladder = TRACK_RUNGS.map(function (rr, i) {
      const on = i <= rung;
      const cur = i === rung;
      const ic = window.OSIcon ? window.OSIcon(icons[i]) : "";
      return `<div class="st-step ${on ? "on" : ""} ${cur ? "cur" : ""}" title="${esc(rr.cap)}">
        <div class="st-dot">${ic}</div><b>${esc(rr.name)}</b><span>${esc(rr.cap)}</span>
      </div>`;
    }).join(`<div class="st-link"></div>`);
    return `<div class="sim-track">
      <div class="sim-track-head">
        <div>
          <h3 class="panel-title gold-serif">Your trader track</h3>
          <p class="panel-sub">The same ladder the Academy's trading roles follow — the machine moves you up on proof, not promises.</p>
        </div>
        <span class="sim-track-rung">Rung ${rung + 1} of 5 · <b>${esc(r.name)}</b></span>
      </div>
      <div class="sim-track-ladder">${ladder}</div>
      <p class="sim-track-note">${esc(r.note)}</p>
    </div>`;
  }

  /* ---------- hub ---------- */
  function paintHub(panel) {
    const myRewards = Object.keys(SIM.rewards || {}).map(function (k) { return SIM.rewards[k]; });
    panel.innerHTML = `${trackHTML()}
    <p class="sim-note">Every challenge is a demo account with machine-enforced rules. Enter free, trade the market, and let the machine measure what the scoreboard hides.</p>
      ${myRewards.length ? `<div class="sim-rewards-strip">${myRewards.map(function (r) { return `<span class="sim-reward-chip">👑 ${esc(r.badge)} · R${r.credit} RFX credit</span>`; }).join("")}</div>` : ""}
      <div class="sim-cards">` +
      SIM_CHALLENGES.map(c => {
        const acc = accountFor(c.id);
        const state = acc && acc.closed ? "closed" : acc ? "active" : "open";
        const btn = state === "closed"
          ? `<button class="btn-ghost sm" data-enter="${c.id}">View results</button>`
          : state === "active"
            ? `<button class="btn-gold sm" data-enter="${c.id}">Resume · ${money(acc.balance)}</button>`
            : `<button class="btn-gold sm" data-enter="${c.id}">Enter the challenge</button>`;
        const ic = (window.OSIcon && window.OSIcon(c.ic)) || (window.OSIcon && window.OSIcon("trophy")) || "🏆";
        return `<div class="sim-card">
          <div class="sim-card-head"><span class="sim-card-ic">${ic}</span><div><b>${esc(c.name)}</b><span class="sim-tag">${esc(c.tag)}</span></div>
          <span class="pill ${state === "closed" ? "" : state === "active" ? "ok" : "gold"}">${state === "closed" ? "completed" : state === "active" ? "in progress" : "open"}</span></div>
          <ul class="sim-rules">${c.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
          <p class="sim-prize">${esc(c.prize)}</p>
          ${btn}
        </div>`;
      }).join("") + `</div>`;
    panel.querySelectorAll("[data-enter]").forEach(b => b.addEventListener("click", () => {
      currentCh = b.dataset.enter;
      const acc = accountFor(currentCh);
      if (acc && acc.closed && acc.assessment) { currentTab = "trade"; paint(); return; }
      currentTab = "trade";
      paint();
    }));
  }

  /* ---------- trading ---------- */
  // The market chart belongs in the trading environment, not behind a button:
  // the first time the trade view opens, the TradingView frame loads. It is
  // then PRESERVED across the 5s ticks (never rebuilt — rebuilding the iframe
  // every tick was what made the page stall), and the panels around it refresh.
  let chartInjected = false;
  function injectChart(slot, ch) {
    if (!slot) return;
    chartInjected = true;
    const sym = ch.pairs[0] === "USD/ZAR" ? "FX:USDZAR" : "FX:" + ch.pairs[0].replace("/", "");
    slot.innerHTML = `<div class="sim-chart-loading"><span class="live-dot"></span>Opening the live market chart…</div>`;
    const f = document.createElement("iframe");
    f.src = "https://s.tradingview.com/widgetembed/?symbol=" + sym + "&interval=30&theme=dark&style=1&locale=en&hide_side_toolbar=0&allow_symbol_change=1";
    f.loading = "lazy";
    f.title = "Live market chart — Reality FX simulated environment";
    let loaded = false;
    f.addEventListener("load", function () {
      loaded = true;
      const s = slot.querySelector(".sim-chart-loading");
      if (s) s.remove();
    });
    slot.appendChild(f);
    // Honest fallback: if the chart provider is unreachable (offline, blocked
    // network), the box never goes dead — a clean note keeps the market strip
    // and the order panel in charge, with a one-tap retry.
    setTimeout(function () {
      if (loaded || !slot.isConnected) return;
      if (slot.querySelector("iframe")) slot.querySelector("iframe").remove();
      slot.innerHTML = `<div class="sim-chart-offline">
        <span class="sim-chart-off-ic">📡</span>
        <b>The live chart provider is unreachable right now</b>
        <span>The market feed below is still live and the order panel is unaffected — the chart is a window, not the market.</span>
        <button class="btn-ghost sm" id="simChartRetry">↻ Try the chart again</button>
      </div>`;
      const r = slot.querySelector("#simChartRetry");
      if (r) r.addEventListener("click", function () { chartInjected = false; injectChart(slot, ch); });
    }, 6000);
  }
  function paintTrade(panel) {
    const ch = challenge(currentCh);
    if (!ch) { currentTab = "hub"; paint(); return; }
    const acc = accountFor(currentCh);
    const a = acc.assessment || assess(acc, ch);
    // HEAD (full width) — safe to re-render: it never contains the chart.
    let head = panel.querySelector(".sim-trade-head");
    if (!head) { head = document.createElement("div"); head.className = "sim-trade-head"; panel.appendChild(head); }
    head.innerHTML = `<div><b class="gold-serif">${esc(ch.name)}</b> <span class="sim-tag">${esc(ch.tag)}</span></div>
      <div class="sim-feed"><span class="live-dot"></span>${esc(feedLabel())}</div>`;
    // CHART RAIL (left) — created ONCE and never re-rendered. Any re-render of
    // a region containing the TradingView iframe detaches it, and Chrome
    // reloads a detached-and-reinserted iframe — the stall and the flicker.
    // The rail therefore lives outside the re-rendered panels: one load, forever.
    let rail = panel.querySelector(".sim-chart-rail");
    if (!rail) {
      rail = document.createElement("div");
      rail.className = "sim-chart-rail";
      rail.innerHTML = `<div class="sim-chart"></div><div class="sim-prices"></div>`;
      panel.appendChild(rail);
      const slot = rail.querySelector(".sim-chart");
      if (!acc.closed && !chartInjected) injectChart(slot, ch);
      else slot.innerHTML = `<button class="btn-ghost sm sim-chart-load" id="simLoadChart" onclick="RFXSimLoadChart()">📈 Load the live market chart (TradingView)</button>`;
    }
    const priceBox = rail.querySelector(".sim-prices");
    if (priceBox) priceBox.innerHTML = ch.pairs.map(p => {
      const r = rateFor(p);
      const move = r >= SIM_PAIRS[p].seed ? "up" : "down";
      return `<span class="sim-price ${move}"><b>${esc(p)}</b> ${r.toFixed(SIM_PAIRS[p].pip < 0.01 ? 4 : 2)}</span>`;
    }).join("");
    // MAIN (right) — the panels that re-render: ended banner, account stats,
    // the order form, open positions, trade history. Never the chart.
    let main = panel.querySelector(".sim-trade-main");
    if (!main) { main = document.createElement("div"); main.className = "sim-trade-main"; panel.appendChild(main); }
    // preserve the trader's half-typed order across re-renders — a re-render
    // must never eat their stop-loss while they are typing it
    const prev = {
      pair: main.querySelector("#oPair"), dir: main.querySelector("#oDir"),
      lots: main.querySelector("#oLots"), sl: main.querySelector("#oSl"), tp: main.querySelector("#oTp")
    };
    const saved = {};
    for (const k in prev) if (prev[k] && document.activeElement !== prev[k]) saved[k] = prev[k].value;
    // The open positions + trade history row sits BELOW the desk (chart +
    // order), full width — so the rail under the chart never sits empty and
    // the two lists get breathing room. Created once, kept; the boxes inside
    // refresh in place by wireTrade / paintLive.
    let lists = panel.querySelector(".sim-lists");
    if (!lists) {
      lists = document.createElement("div");
      lists.className = "sim-lists";
      lists.innerHTML = `<div class="sim-positions"><h4>Open positions</h4><div id="simOpen"></div></div><div class="sim-history"><h4>Trade history</h4><div id="simHist"></div></div>`;
      panel.appendChild(lists);
    }
    main.innerHTML = `
      ${acc.closed ? `<div class="sim-ended"><b>${a.passed ? "PASS — the machine signed your result" : "Challenge completed — review the assessment"}</b> <span>Score ${a.score}/100 · ${pct(a.ret)} · max drawdown ${pct(a.maxDD)}</span> <button class="btn-gold sm" id="simToBoard">See the leaderboard</button></div>
      ${a.passed && SIM.rewards && SIM.rewards[currentCh] ? `<div class="sim-reward"><span class="sim-reward-ic">👑</span><div><b>Machine-signed reward earned</b><span>${esc(SIM.rewards[currentCh].badge)} · R${SIM.rewards[currentCh].credit} RFX credit paid to your wallet</span><em>What you accomplished under pressure is proof this environment works. This credit is our appreciation — and a seed for your first real trading account.</em></div></div>` : ""}` : ""}
      <div class="sim-acc">${statsHTML(acc, ch)}</div>
      ${acc.locked && !acc.closed ? `<div class="sim-locked">⚠ The drawdown red line was breached — this account is locked by the machine. Close your positions; the lesson is the prize.</div>` : ""}
      ${!acc.closed && !acc.locked ? `<form class="sim-order" id="simOrder">
        <div class="sim-order-grid">
          <label>Pair <select id="oPair">${ch.pairs.map(p => `<option ${p === ch.pairs[0] ? "selected" : ""}>${p}</option>`).join("")}</select></label>
          <label>Direction <select id="oDir"><option value="buy">Buy (long)</option><option value="sell">Sell (short)</option></select></label>
          <label>Size (lots) <input id="oLots" type="number" step="0.01" min="0.01" value="0.10"></label>
          <label>Stop-loss <input id="oSl" type="number" step="any" placeholder="price"></label>
          <label>Take-profit <input id="oTp" type="number" step="any" placeholder="price"></label>
          <label class="sim-risk-cell">Risk this trade <b class="sim-risk" id="oRisk">—</b></label>
        </div>
        <div class="sim-order-foot">
          <span class="sim-hint" id="oHint">Pick a pair, set your stop and target, and the machine checks the risk before it lets the order through.</span>
          <button class="btn-gold sm" id="oGo">Place order</button>
        </div>      </form>` : ""}`;
    for (const k in saved) {
      const f = main.querySelector("#o" + k.charAt(0).toUpperCase() + k.slice(1));
      if (f && saved[k] !== undefined && saved[k] !== null && saved[k] !== "") f.value = saved[k];
    }
    // ASSESS (full width below the two columns) — re-rendered; no chart.
    let assessRow = panel.querySelector(".sim-assess-row");
    if (!assessRow) { assessRow = document.createElement("div"); assessRow.className = "sim-assess-row"; panel.appendChild(assessRow); }
    assessRow.innerHTML = `<div class="sim-assess">
      <h4>Machine assessment — live</h4>
      ${assessmentHTML(a)}
      ${!acc.closed && !acc.locked ? `<div class="sim-end-row"><button class="btn-ghost sm" id="simEnd">End challenge — let the machine grade me</button></div>` : ""}
    </div>`;
    wireTrade(panel, ch, acc, a);
  }
  function assessmentHTML(a) {
    const rows = [
      ["Score", a.score + "/100", a.score >= 70],
      ["Profitability", pct(a.ret), a.ret >= 0],
      ["Risk-adjusted", (a.riskScore) + "/100", a.riskScore >= 60],
      ["Win rate", pct(a.winRate), null],
      ["Average win vs loss (R)", (a.avgWinR.toFixed(2) || "0") + "R vs " + (a.avgLossR.toFixed(2) || "0") + "R", null],
      ["Expectancy per trade", (a.expectancy >= 0 ? "+" : "") + a.expectancy.toFixed(2) + "R", a.expectancy >= 0],
      ["Consistency", a.consistency + "/100", a.consistency >= 60],
      ["Discipline", a.discipline + "/100", a.discipline >= 60]
    ];
    return `<div class="sim-verdict ${a.passed ? "pass" : "review"}">${a.passed ? "PASS — the machine signed your result" : "On review — the machine is honest about what it sees"}</div>
      <div class="sim-assess-rows">` + rows.map(r => `<div class="sim-a-row"><span>${r[0]}</span><b class="${r[2] === null ? "" : r[2] ? "ok" : "bad"}">${r[1]}</b></div>`).join("") + `</div>
      <p class="sim-note small">${a.violations && a.violations.length ? "Violations recorded: " + a.violations.map(v => esc(v.detail)).join(" · ") : "No violations — the machine saw clean behaviour."}</p>`;
  }
  function wireTrade(panel, ch, acc, a) {
    const openBox = panel.querySelector("#simOpen");
    const histBox = panel.querySelector("#simHist");
    const paintLists = function () {
      renderOpenBox(openBox, acc, ch, panel);
      const closed = acc.trades.filter(t => t.closed).slice().reverse().slice(0, 12);
      histBox.innerHTML = closed.length ? closed.map(t => `<div class="sim-hist ${t.pnl >= 0 ? "up" : "down"}">
        <span class="sp-pair">${esc(t.pair)} ${t.dir} · ${t.lots} lots</span>
        <span class="sp-mid">${t.entry.toFixed(4)} → ${t.closePrice.toFixed(4)} · ${t.r >= 0 ? "+" : ""}${t.r.toFixed(2)}R</span>
        <span class="sp-pnl">${t.pnl >= 0 ? "+" : ""}${money(t.pnl)}</span></div>`).join("") : `<p class="live-note">No closed trades yet.</p>`;
      // close buttons are bound inside renderOpenBox (in-place updates keep them)
    };
    paintLists();
    const form = panel.querySelector("#simOrder");
    if (form) {
      const pairSel = form.querySelector("#oPair"), sl = form.querySelector("#oSl"), tp = form.querySelector("#oTp"),
        lots = form.querySelector("#oLots"), risk = form.querySelector("#oRisk"), hint = form.querySelector("#oHint"), dir = form.querySelector("#oDir");
      const recompute = function () {
        const entry = rateFor(pairSel.value);
        const slV = parseFloat(sl.value);
        const lotsV = parseFloat(lots.value) || 0.1;
        if (slV > 0 && entry) {
          const r = openRisk(acc, ch, entry, slV, lotsV, pairSel.value);
          risk.textContent = money(r) + " (cap " + money(acc.balance * ch.maxRiskPerTrade) + ")";
          const sug = suggestLots(acc, ch, pairSel.value, entry, slV);
          hint.textContent = "Suggested size at the 1% leash: " + sug + " lots. SL and TP are hard lines — the machine fills them when hit.";
          if (sug > 0 && lotsV > sug) hint.textContent += " Heads-up: you're above the suggested size.";
        }
      };
      pairSel.addEventListener("change", recompute);
      sl.addEventListener("input", recompute);
      lots.addEventListener("input", recompute);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const res = openTrade(acc, ch, { pair: pairSel.value, dir: dir.value, lots: lots.value, sl: sl.value, tp: tp.value });
        if (res.ok) { toast("Position opened — " + esc(res.trade.pair) + " " + res.trade.dir + " " + res.trade.lots + " lots @ " + res.trade.entry.toFixed(4), "ok"); paintTrade(panel); }
        else { toast(res.reason, "warn"); hint.textContent = res.reason; }
      });
    }
    const endBtn = panel.querySelector("#simEnd");
    if (endBtn) endBtn.addEventListener("click", function () {
      const a2 = endChallenge(currentCh);
      postResult(currentCh, a2);
      toast("The machine graded you — score " + a2.score + "/100", "rank");
      paint();
    });
    const toBoard = panel.querySelector("#simToBoard");
    if (toBoard) toBoard.addEventListener("click", function () { currentTab = "board"; paint(); });
    // keep the assessment live
    const aBox = panel.querySelector(".sim-assess");
    if (aBox && !acc.closed) {
      const updater = function () {
        const fresh = assess(acc, ch);
        aBox.innerHTML = `<h4>Machine assessment — live</h4>` + assessmentHTML(fresh) + (acc.locked ? "" : `<div class="sim-end-row"><button class="btn-ghost sm" id="simEnd">End challenge — let the machine grade me</button></div>`);
        const b2 = aBox.querySelector("#simEnd");
        if (b2) b2.addEventListener("click", function () { const f = endChallenge(currentCh); postResult(currentCh, f); toast("The machine graded you — score " + f.score + "/100", "rank"); paint(); });
      };
      if (viewEl.__simAssessIv) clearInterval(viewEl.__simAssessIv);
      viewEl.__simAssessIv = setInterval(updater, 5000);
    }
  }

  // Fallback loader for the closed-challenge view (the results screen keeps
  // the market chart reachable without auto-loading it).
  window.RFXSimLoadChart = function () {
    chartInjected = false;
    if (!livePanel || !currentCh) return;
    const slot = livePanel.querySelector(".sim-chart");
    if (slot && !slot.querySelector("iframe")) injectChart(slot, challenge(currentCh));
  };

  /* ---------- leaderboard ---------- */
  function paintBoard(panel) {
    panel.innerHTML = `<div class="sim-note">The wall is machine-scored and server-signed — every entry is a real student's real assessment. Nobody sits and watches accounts; the machine reads them all.</div><div id="simBoards">Loading the wall…</div>`;
    const box = panel.querySelector("#simBoards");
    fetchBoards().then(function (data) {
      const boards = (data && data.boards) || {};
      box.innerHTML = SIM_CHALLENGES.map(c => {
        const list = (boards[c.id] || []).slice().sort((a, b) => b.score - a.score).slice(0, 10);
        return `<div class="sim-board"><h4>${esc(c.name)}</h4>` +
          (list.length
            ? list.map((r, i) => `<div class="sim-row ${i === 0 ? "gold" : ""}"><span class="sim-rank">${i + 1}</span><span class="sim-who">${esc(r.name)} <em>${esc(r.studentId)}</em></span><span class="sim-verd ${r.verdict === "PASS" ? "ok" : ""}">${esc(r.verdict)}</span><span>${r.trades} trades</span><b>${r.score}/100</b></div>`).join("")
            : `<p class="live-note">No completed assessments yet — the first name on this wall becomes the standard.</p>`) + `</div>`;
      }).join("");
    }).catch(function () { box.innerHTML = `<p class="live-note">The leaderboard rail is unreachable right now — your local result still stands and will sync when the rail returns.</p>`; });
  }

  /* ---------- the machine explains itself ---------- */
  function paintMachine(panel) {
    panel.innerHTML = `<div class="sim-note">Why ask 'who made the most money?' when you can ask 'who actually traded well?' This is exactly how the machine reads you:</div>
      <div class="sim-mach">
        ${[
          ["Profitability (28%)", "Return against the challenge's target — the outcome, honestly measured. 30% with reckless risk scores lower here than 10% done cleanly."],
          ["Risk-adjusted (25%)", "Return divided by drawdown — the machine prefers the trader who made 8% with a 4% dip over 10% with an 11% dip. The deeper layer: drawdown is the only statistic that can kill you."],
          ["Discipline (27%)", "Every violation costs: increasing risk after a loss (the martingale door), overtrading, and the drawdown red line. A clean record is a strategy in itself."],
          ["Consistency (20%)", "The steadiness of your R-multiples across trades. One lucky spike loses to a calm, repeatable edge — because the market pays what you can repeat."]
        ].map(b => `<div class="sim-m-row"><b>${b[0]}</b><p>${b[1]}</p></div>`).join("")}
      </div>
      <div class="sim-note">And the boundaries are architectural: demo accounts only, machine-enforced risk caps, no real money ever touches this floor — so the only thing a student can lose is the lesson they refuse to learn.</div>`;
  }

  window.RFXSim = { render: render, challenges: SIM_CHALLENGES };
})();
