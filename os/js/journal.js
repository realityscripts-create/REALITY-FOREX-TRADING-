/* ============================================================
   RFX TRADE JOURNAL — the trader's mirror
   ------------------------------------------------------------
   Every lesson is a trade. Every trade is a lesson.
   The journal is where a student records the trades they take
   in the market — entry, exit, risk, result, and how they felt
   while holding it — so the machine (and the student) can see
   the pattern their memory politely edits.
   Local-only by design: the journal never leaves the device.
   ============================================================ */
(function () {
  "use strict";

  const KEY = "rfx_os_journal_v1";

  /* ---------- trade pairs (pip size drives the math) ---------- */
  const PAIRS = [
    { p: "EUR/USD", pip: 0.0001 },
    { p: "GBP/USD", pip: 0.0001 },
    { p: "USD/JPY", pip: 0.01 },
    { p: "AUD/USD", pip: 0.0001 },
    { p: "USD/ZAR", pip: 0.0001 },
    { p: "XAU/USD", pip: 0.1 }
  ];
  const SETUPS = ["Breakout", "Reversal", "Pullback", "SMC structure", "News move", "Range fade", "Other"];

  /* ---------- state (multi-tab safe, same pattern as the OS store) ---------- */
  function load() {
    try { return Object.assign({ rev: 0, trades: [] }, JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return { rev: 0, trades: [] }; }
  }
  let J = load();
  function save() {
    try {
      const cur = JSON.parse(localStorage.getItem(KEY) || "{}");
      if ((cur.rev || 0) > (J.rev || 0)) { J.trades = cur.trades || J.trades || []; J.rev = cur.rev || 0; }
    } catch (e) { /* store unreadable — write through */ }
    J.rev = (J.rev || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(J));
  }

  /* ---------- tiny UI helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  let toastTimer = null;
  function toast(msg, kind) {
    let t = document.getElementById("jour-toast");
    if (!t) { t = document.createElement("div"); t.id = "jour-toast"; t.className = "toast"; document.body.appendChild(t); }
    t.className = "toast show" + (kind ? " toast-" + kind : "");
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3400);
  }
  function money(n) { return (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(n) { return (n * 100).toFixed(1) + "%"; }
  function fmtDate(ts) {
    const d = new Date(ts);
    const pad = x => String(x).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function pipOf(pair) { const f = PAIRS.find(x => x.p === pair); return f ? f.pip : 0.0001; }

  /* ---------- trade math ---------- */
  // pips = price movement in pips (signed by direction)
  // P/L  = pips × $10 per pip per standard lot (the classic FX standard-lot math)
  // R    = reward ÷ risk, when a stop is recorded
  function compute(t) {
    const pip = pipOf(t.pair);
    const dir = t.dir === "sell" ? -1 : 1;
    const pips = dir * (t.exit - t.entry) / pip;
    const pnl = pips * 10 * t.lots;
    const riskPips = t.stop ? Math.abs(t.entry - t.stop) / pip : null;
    const R = riskPips ? Math.abs(pips) / riskPips : null;
    return { pips, pnl, R, pip };
  }

  function stats() {
    const ts = J.trades || [];
    const total = ts.length;
    const wins = ts.filter(t => compute(t).pnl > 0).length;
    const losses = ts.filter(t => compute(t).pnl < 0).length;
    const be = total - wins - losses;
    const net = ts.reduce((s, t) => s + compute(t).pnl, 0);
    const pips = ts.reduce((s, t) => s + compute(t).pips, 0);
    const grossWin = ts.filter(t => compute(t).pnl > 0).reduce((s, t) => s + compute(t).pnl, 0);
    const grossLoss = Math.abs(ts.filter(t => compute(t).pnl < 0).reduce((s, t) => s + compute(t).pnl, 0));
    const rr = ts.map(t => compute(t).R).filter(r => r !== null);
    return {
      total, wins, losses, be,
      winRate: total ? wins / total : 0,
      net, pips,
      pf: grossLoss ? grossWin / grossLoss : (grossWin > 0 ? grossWin : 0),
      avgR: rr.length ? rr.reduce((a, b) => a + b, 0) / rr.length : 0
    };
  }

  /* ---------- render ---------- */
  function render(root) {
    root.innerHTML = "";
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Reality FX OS · the trader's mirror</p>
      <h1 class="page-title">The trade journal</h1>
      <p class="dash-sub">Every lesson is a trade. Every trade is a lesson.</p>
      <p class="page-sub">Record each trade you take — the setup, the entry, the exit, the risk, the result, and how you felt while holding it. The machine reads the pattern your memory politely edits.</p>`));

    root.appendChild(statsRail());
    root.appendChild(ticketForm());
    root.appendChild(entryList());

    if (!(J.trades || []).length) root.appendChild(emptyState());
    root.appendChild(el("div", "jour-foot", `<p>${esc("Local-only by design — your journal lives on this device and never leaves it. Standard-lot math: $10 per pip per 1.00 lot on FX, $10 per 0.10 on gold. Numbers here are your own record, not an assessment.")}</p>`));
    refreshStats(root);
    refreshList(root);
  }

  function statsRail() {
    return el("div", "jour-stats", `
      <div class="stat-card" data-jstat="total">
        <div class="stat-ic">${window.OSIcon ? OSIcon("note") : "📓"}</div>
        <div class="stat-v">0</div>
        <div class="stat-l">Trades logged</div>
      </div>
      <div class="stat-card" data-jstat="win">
        <div class="stat-ic">${window.OSIcon ? OSIcon("check") : "✔"}</div>
        <div class="stat-v">—</div>
        <div class="stat-l">Win rate</div>
      </div>
      <div class="stat-card" data-jstat="net">
        <div class="stat-ic">${window.OSIcon ? OSIcon("chart") : "📈"}</div>
        <div class="stat-v">$0.00</div>
        <div class="stat-l">Net P/L</div>
      </div>
      <div class="stat-card" data-jstat="pf">
        <div class="stat-ic">${window.OSIcon ? OSIcon("scale") : "⚖"}</div>
        <div class="stat-v">—</div>
        <div class="stat-l">Profit factor</div>
      </div>
      <div class="stat-card" data-jstat="pips">
        <div class="stat-ic">${window.OSIcon ? OSIcon("zap") : "⚡"}</div>
        <div class="stat-v">0</div>
        <div class="stat-l">Total pips</div>
      </div>
      <div class="stat-card" data-jstat="avgR">
        <div class="stat-ic">${window.OSIcon ? OSIcon("target") : "🎯"}</div>
        <div class="stat-v">—</div>
        <div class="stat-l">Avg R multiple</div>
      </div>`);
  }

  function ticketForm() {
    const p = el("div", "panel");
    p.innerHTML = `
      <h3 class="panel-title gold-serif">Log a trade</h3>
      <p class="panel-sub">Fill the ticket as you would on your platform. Pips, P/L and the R multiple compute as you type — the math is shown the moment it's honest.</p>
      <form class="jour-ticket" id="jourTicket">
        <div class="jour-grid">
          <label>Pair
            <select id="jPair">${PAIRS.map(x => `<option>${x.p}</option>`).join("")}</select>
          </label>
          <label>Direction
            <select id="jDir"><option value="buy">Buy (long)</option><option value="sell">Sell (short)</option></select>
          </label>
          <label>Entry price <input id="jEntry" type="number" step="any" placeholder="1.0850"></label>
          <label>Exit price <input id="jExit" type="number" step="any" placeholder="1.0890"></label>
          <label>Stop-loss (optional) <input id="jStop" type="number" step="any" placeholder="1.0830"></label>
          <label>Size (lots) <input id="jLots" type="number" step="0.01" min="0.01" value="0.10"></label>
          <label class="jour-wide">Setup
            <select id="jSetup">${SETUPS.map(s => `<option>${s}</option>`).join("")}</select>
          </label>
          <label class="jour-wide">Notes — the trade, and how you felt holding it
            <textarea id="jNotes" rows="2" placeholder="What did you see? What did you fear? What would you repeat?"></textarea>
          </label>
        </div>
        <div class="jour-preview" id="jPrev">Waiting for entry and exit…</div>
        <div class="jour-ticket-foot">
          <button class="btn-gold" type="submit">Log this trade</button>
          <span class="jour-hint">Logged locally — it never leaves this device.</span>
        </div>
      </form>`;
    const form = p.querySelector("#jourTicket");
    const recompute = () => {
      const pair = form.querySelector("#jPair").value;
      const dir = form.querySelector("#jDir").value;
      const entry = parseFloat(form.querySelector("#jEntry").value);
      const exit = parseFloat(form.querySelector("#jExit").value);
      const stop = parseFloat(form.querySelector("#jStop").value) || null;
      const lots = parseFloat(form.querySelector("#jLots").value) || 0.1;
      const prev = form.querySelector("#jPrev");
      if (!isFinite(entry) || !isFinite(exit) || entry === exit) { prev.textContent = "Waiting for entry and exit…"; return; }
      const c = compute({ pair, dir, entry, exit, stop, lots });
      const parts = [];
      parts.push(`${c.pips.toFixed(1)} pips ${c.pips >= 0 ? "up" : "down"}`);
      parts.push(`${money(c.pnl)} P/L`);
      if (c.R !== null) parts.push(`R multiple ${c.R.toFixed(2)}`);
      prev.textContent = parts.join(" · ");
      prev.classList.toggle("good", c.pnl >= 0);
      prev.classList.toggle("bad", c.pnl < 0);
    };
    ["jEntry", "jExit", "jStop", "jLots", "jPair", "jDir"].forEach(id => form.querySelector("#" + id).addEventListener("input", recompute));
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const entry = parseFloat(form.querySelector("#jEntry").value);
      const exit = parseFloat(form.querySelector("#jExit").value);
      if (!isFinite(entry) || !isFinite(exit) || entry === exit) { toast("Enter a valid entry and exit price", "warn"); return; }
      const stop = parseFloat(form.querySelector("#jStop").value);
      const t = {
        id: Date.now() + "-" + Math.floor(Math.random() * 9999),
        pair: form.querySelector("#jPair").value,
        dir: form.querySelector("#jDir").value,
        entry, exit,
        stop: isFinite(stop) ? stop : null,
        lots: parseFloat(form.querySelector("#jLots").value) || 0.1,
        setup: form.querySelector("#jSetup").value,
        notes: form.querySelector("#jNotes").value.trim(),
        at: Date.now()
      };
      J.trades.unshift(t);
      save();
      form.querySelector("#jEntry").value = ""; form.querySelector("#jExit").value = ""; form.querySelector("#jStop").value = "";
      form.querySelector("#jNotes").value = "";
      form.querySelector("#jPrev").textContent = "Waiting for entry and exit…";
      form.querySelector("#jPrev").classList.remove("good", "bad");
      refreshStats(rootEl);
      refreshList(rootEl);
      const es = rootEl && rootEl.querySelector(".jour-empty"); if (es) es.remove();
      toast("Trade logged — the journal never forgets", "ok");
    });
    return p;
  }

  /* the list lives beside the ticket; we refresh it in place */
  let listBox = null, rootEl = null;
  let filter = "all";

  function entryList() {
    const p = el("div", "panel");
    p.innerHTML = `
      <div class="jour-list-head">
        <h3 class="panel-title gold-serif">Journal entries</h3>
        <div class="jour-filters">
          <button class="jour-f on" data-f="all">All</button>
          <button class="jour-f" data-f="win">Wins</button>
          <button class="jour-f" data-f="loss">Losses</button>
          <button class="jour-f" data-f="be">Breakeven</button>
        </div>
      </div>
      <div class="jour-list" id="jourList"></div>`;
    p.querySelectorAll(".jour-f").forEach(b => b.addEventListener("click", function () {
      filter = b.dataset.f;
      p.querySelectorAll(".jour-f").forEach(x => x.classList.toggle("on", x === b));
      refreshList(p);
    }));
    listBox = p;
    return p;
  }

  function refreshList(scope) {
    const box = (scope || listBox).querySelector("#jourList");
    if (!box) return;
    const ts = (J.trades || []).slice();
    const f = filter;
    const shown = f === "all" ? ts : ts.filter(t => {
      const pnl = compute(t).pnl;
      return f === "win" ? pnl > 0 : f === "loss" ? pnl < 0 : pnl === 0;
    });
    if (!shown.length) {
      box.innerHTML = `<div class="jour-list-empty">${f === "all" ? "No trades yet — log your first one above." : "No trades match this filter."}</div>`;
      return;
    }
    box.innerHTML = shown.map(t => {
      const c = compute(t);
      const cls = c.pnl > 0 ? "up" : c.pnl < 0 ? "down" : "be";
      return `
        <div class="jour-row ${cls}">
          <div class="jr-pair"><b>${esc(t.pair)}</b> <em>${t.dir === "sell" ? "SHORT" : "LONG"}</em></div>
          <div class="jr-mid">
            <span class="jr-setup">${esc(t.setup)}</span>
            <span class="jr-prices">${fmtNum(t.entry, t.pair)} → ${fmtNum(t.exit, t.pair)}</span>
            <span class="jr-meta">${c.pips >= 0 ? "+" : ""}${c.pips.toFixed(1)} pips${c.R !== null ? " · R " + c.R.toFixed(2) : ""}${t.stop ? " · stop " + fmtNum(t.stop, t.pair) : ""}</span>
            ${t.notes ? `<span class="jr-notes">${esc(t.notes)}</span>` : ""}
          </div>
          <div class="jr-pnl">${money(c.pnl)}</div>
          <div class="jr-right">
            <span class="jr-date">${fmtDate(t.at)}</span>
            <button class="jr-del" data-id="${esc(t.id)}" title="Delete this entry">${window.OSIcon ? OSIcon("alert") : "✕"}</button>
          </div>
        </div>`;
    }).join("");
    box.querySelectorAll(".jr-del").forEach(b => b.addEventListener("click", function () {
      if (!confirm("Delete this journal entry? This cannot be undone.")) return;
      J.trades = (J.trades || []).filter(t => t.id !== b.dataset.id);
      save();
      refreshStats(rootEl);
      refreshList(rootEl);
      toast("Entry removed", "warn");
    }));
  }

  function refreshStats(scope) {
    const st = stats();
    const root = scope || rootEl;
    if (!root) return;
    const v = (sel, txt, cls) => { const e = root.querySelector(sel); if (e) { e.textContent = txt; e.style.color = cls || ""; } };
    v('[data-jstat="total"] .stat-v', st.total);
    v('[data-jstat="win"] .stat-v', st.total ? pct(st.winRate) : "—");
    v('[data-jstat="net"] .stat-v', money(st.net), st.net > 0 ? "#7ee2a4" : st.net < 0 ? "#f0a89c" : "");
    v('[data-jstat="pf"] .stat-v', st.total ? st.pf.toFixed(2) : "—");
    v('[data-jstat="pips"] .stat-v', (st.pips >= 0 ? "+" : "") + st.pips.toFixed(1), st.pips > 0 ? "#7ee2a4" : st.pips < 0 ? "#f0a89c" : "");
    v('[data-jstat="avgR"] .stat-v', st.avgR ? "+" + st.avgR.toFixed(2) : "—");
  }

  function emptyState() {
    const c = el("div", "jour-empty");
    c.innerHTML = `
      <div class="jour-empty-ic">${window.OSIcon ? OSIcon("quill") : "✍"}</div>
      <h3 class="gold-serif">Your journal is blank — that's the point</h3>
      <p class="page-sub">The market is a mirror. Log the trades you take, review them weekly, and let the pattern surface. The habit matters more than the tool — and the tool is here now.</p>`;
    return c;
  }

  function fmtNum(n, pair) {
    const pip = pipOf(pair);
    const dec = pip <= 0.0001 ? 5 : pip <= 0.01 ? 3 : 2;
    return String(Number(n).toFixed(dec));
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  window.RFXJournal = { render: function (viewEl) { rootEl = viewEl; render(viewEl); } };
})();
