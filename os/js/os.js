/* ============================================================
   REALITY FX OS — Application
   Dashboard · Journey Map · Lesson Player · Quiz Engine ·
   Ranks · XP · Local progress · Certificate
   ============================================================ */
(function () {
  "use strict";

  const KEY = "rfx_os_v1";
  const XP_SLIDE = 2, XP_CORRECT = 10, XP_CHAPTER = 40, XP_QUIZ_PASS = 25;

  /* ---------- State ---------- */
  function defaultState() {
    return { name: "", xp: 0, streak: 0, lastActive: "", traderStyle: null, chapters: {}, log: [], dwell: [], secs: 0, flags: [], reportedFlags: [], styleSeen: [], distStreak: 0, distBest: 0, lastDistCh: null, chapStats: {}, justUnlocked: null,
      timeBadges: [], studyDays: [], dayKey: "", daySecs: 0,
      profile: { name: "", email: "", phone: "", country: "", code: "", photo: "" },
      handoff: null };
  }
  /* Student profile — the single source of truth for identity. Phase 2
     registration will write the verified details here; for now it's the
     editable record that feeds the certificate and the dashboard. */
  function profile() {
    if (!S.profile || typeof S.profile !== "object") S.profile = { name: "", email: "", phone: "", country: "", code: "", photo: "" };
    return S.profile;
  }
  function profileName() {
    const p = profile();
    return (p.name && p.name.trim()) || S.name || "";
  }
  function ensureCode(p) {
    if (p.code && /^RFX-\d{6}$/.test(p.code)) return p.code;
    p.code = "RFX-" + String(Math.floor(100000 + Math.random() * 900000));
    save(); // persist the moment it's born — the code must never change between visits
    return p.code;
  }

  /* ---------- Handshake (System A bridge) ----------
     The OS never creates identities. System A's registration machine delivers
     an APPROVED student here and this OS *activates* them: the verified name,
     Student ID, email and entitlements land in the student profile (the single
     source of truth for the greeting, the passport page and the certificate).
     No handoff (or a static file:// preview) simply keeps the local demo trader. */
  function handoffRec() {
    return (S.handoff && S.handoff.studentId) ? S.handoff : null;
  }
  function loadHandshake() {
    return new Promise(function (resolve) {
      try {
        const sid = new URLSearchParams(location.search).get("sid");
        if (!sid) { resolve(false); return; }
        fetch("api/handoffs", { cache: "no-store" })
          .then(r => { if (!r.ok) throw new Error("handoff store unavailable"); return r.json(); })
          .then(function (list) {
            const rec = (list || []).find(h => h.studentId === sid);
            if (!rec) { resolve(false); return; }
            const p = profile();
            if (rec.verifiedName) { p.name = rec.verifiedName; S.name = rec.verifiedName; }
            if (rec.studentId) p.code = rec.studentId;
            if (rec.email) p.email = rec.email;
            S.handoff = { studentId: rec.studentId, studentCode: rec.studentCode || "", status: rec.status || "ACTIVE", printTrust: rec.printTrust || "standard", receivedAt: rec.receivedAt || "" };
            save();
            toast("Welcome, " + (rec.verifiedName || rec.studentId) + " — identity verified by Reality FX registration", "rank");
            resolve(true);
          })
          .catch(function () { resolve(false); });
      } catch (e) { resolve(false); }
    });
  }

  /* ---------- Fair Play flags → academy server rail ----------
     The integrity monitor raises flags locally (fast answers, suspicious
     perfect scores). For verified students those flags are REPORTED to the
     academy server (the handoff server's /os/api/flags endpoint), where the
     moderator's SRM panel turns them into Trust Bar moves. Dedup: each flag
     is reported once — the reported set remembers what the server already
     holds, so re-saves never spam the moderator queue. Demo traders (no
     handoff) never report; their flags stay device-local like everything
     else in the demo build. */
  function flagsSync() {
    const sid = handoffRec() && handoffRec().studentId;
    if (!sid) return;
    const pending = (S.flags || []).filter(f => !(S.reportedFlags || []).some(r => r.type === f.type && r.ch === f.ch && r.qi === f.qi && r.ts === f.ts));
    if (!pending.length) return;
    fetch("api/flags/report", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: sid, flags: pending.map(f => ({ type: f.type, ch: f.ch, qi: f.qi, ms: f.ms || 0, ts: f.ts, note: f.note || "" })) }),
      cache: "no-store"
    }).then(r => { if (!r.ok) throw new Error("flags rail unreachable"); return r.json(); })
      .then(function (res) {
        if (!res || !res.accepted) return;
        S.reportedFlags = (S.reportedFlags || []).concat(pending.map(f => ({ type: f.type, ch: f.ch, qi: f.qi, ts: f.ts })));
        if (S.reportedFlags.length > 400) S.reportedFlags = S.reportedFlags.slice(-400);
        save();
      })
      .catch(function () { /* server may be down — retried on next boot/save */ });
  }

  /* ---------- Single-session guard (verified students only) ----------
     One active session per student account: signing in on another device
     revokes this one everywhere (the handoff server enforces it — the
     browser is never the final gatekeeper). Same-device tabs may coexist.
     Inactivity locks the session after 15 minutes; re-entering the Student
     ID resumes it. Demo traders (no handoff) skip the guard entirely. */
  const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
  const SESSION_HEARTBEAT_MS = 30 * 1000;
  let sessGuard = null, inactivityTimer = null, lastActivity = 0;
  function deviceInfo() {
    let d = "";
    try { d = (navigator.userAgent || "") + "|" + screen.width + "x" + screen.height + "|" + (navigator.maxTouchPoints || 0); } catch (e) {}
    let h = 0;
    for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || "") || (navigator.maxTouchPoints || 0) > 1;
    return { deviceId: "dev-" + h.toString(16), deviceType: mobile ? "mobile" : "desktop" };
  }
  function sessionToken() {
    if (S.session && S.session.token) return S.session;
    const bytes = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    S.session = { token: Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(""), device: deviceInfo() };
    save();
    return S.session;
  }
  function sessFetch(path, body) {
    return fetch("api/" + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject(new Error("session server unreachable")))
      .catch(function () { return null; });
  }
  function sessClaim() {
    const sid = handoffRec() && handoffRec().studentId;
    if (!sid) return Promise.resolve(null);
    const st = sessionToken();
    return sessFetch("session/claim", { studentId: sid, token: st.token, deviceId: st.device.deviceId, deviceType: st.device.deviceType }).then(r => {
      if (r && r.kicked) toast("You replaced your session on another device — this one is now active.", "rank");
      return r;
    });
  }
  function sessPing() {
    const sid = handoffRec() && handoffRec().studentId;
    const st = S.session;
    if (!sid || !st || !st.token) return;
    sessFetch("session/heartbeat", { studentId: sid, token: st.token }).then(r => {
      if (r && r.active === false) sessLock("kicked");
    });
  }
  function sessRelease() {
    const sid = handoffRec() && handoffRec().studentId;
    const st = S.session;
    if (!sid || !st || !st.token) return;
    sessFetch("session/release", { studentId: sid, token: st.token });
  }
  function sessLock(reason) {
    if (sessGuard) return; // already locked
    const sid = handoffRec() && handoffRec().studentId;
    const overlay = el("div", "sess-lock");
    overlay.innerHTML = `
      <div class="sess-lock-card">
        <div class="sess-lock-ic">${reason === "kicked"
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11.5 11.5 14 15.5 9.5"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'}</div>
        <h3 class="gold-serif">${reason === "kicked" ? "Signed in on another device" : "Session paused for your security"}</h3>
        <p class="sess-lock-sub">${reason === "kicked"
          ? "This session was closed because your account signed in somewhere else. Only one active session is allowed at a time — that's how Reality FX protects the course material."
          : "You've been inactive for a while. Enter your Student ID to continue where you left off."}</p>
        <input class="sess-lock-input" placeholder="Student ID · e.g. RFX-10482" autocomplete="off">
        <button class="btn-gold sess-lock-btn">${reason === "kicked" ? "Sign in on this device" : "Resume session"}</button>
        <p class="sess-lock-err"></p>
      </div>`;
    document.body.appendChild(overlay);
    sessGuard = overlay;
    const inp = overlay.querySelector(".sess-lock-input");
    const btn = overlay.querySelector(".sess-lock-btn");
    const err = overlay.querySelector(".sess-lock-err");
    const tryUnlock = () => {
      const v = (inp.value || "").trim().toUpperCase();
      if (!v || v !== sid) { err.textContent = "That doesn't match your Student ID — check it on your member panel."; return; }
      sessClaim().then(() => {
        overlay.remove(); sessGuard = null;
        lastActivity = Date.now();
        toast("Session restored — welcome back", "rank");
      });
    };
    btn.addEventListener("click", tryUnlock);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") tryUnlock(); });
    setTimeout(() => { try { inp.focus(); } catch (e) {} }, 50);
  }
  function startInactivityClock() {
    if (!handoffRec()) return;
    lastActivity = Date.now();
    const bump = () => { lastActivity = Date.now(); };
    ["pointerdown", "keydown", "pointermove"].forEach(ev => document.addEventListener(ev, bump, { passive: true }));
    clearInterval(inactivityTimer);
    inactivityTimer = setInterval(() => {
      if (!document.hidden && handoffRec() && Date.now() - lastActivity > SESSION_TIMEOUT_MS) sessLock("inactive");
    }, 30000);
  }
  function initSessionGuard() {
    if (!handoffRec()) return;
    sessClaim();
    startInactivityClock();
    setInterval(sessPing, SESSION_HEARTBEAT_MS);
    window.addEventListener("beforeunload", sessRelease);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) sessPing(); });
  }
  function load() {
    try { return Object.assign(defaultState(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return defaultState(); }
  }
  let S = load();
  function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

  function chState(id) {
    if (!S.chapters[id]) S.chapters[id] = { viewed: [], quizBest: null, passed: false, done: false, poll: null, earned: [], retries: 0, failedAt: null, firstFailAt: null, badges: [] };
    const st = S.chapters[id];
    if (!Array.isArray(st.viewed)) st.viewed = [];
    if (!Array.isArray(st.earned)) st.earned = [];
    if (!Array.isArray(st.badges)) st.badges = [];
    if (typeof st.retries !== "number") st.retries = 0;   // backfill for old saved states
    if (st.failedAt === undefined) st.failedAt = null;
    if (st.firstFailAt === undefined) st.firstFailAt = null;
    if (typeof st.reflect !== "string") st.reflect = "";  // pause-point reflection notes
    // migration: chapter layouts evolve (slide renumbering) — never let stale slide
    // numbers from an older layout inflate progress or drop a student into the quiz.
    const chDef = CHAPTERS.find(x => x.id === Number(id));
    if (chDef && chDef.quiz && chDef.quizSlides && st.quizBest === null) {
      const firstQuiz = chDef.quizSlides[0];
      st.viewed = st.viewed.filter(v => v >= 1 && v < firstQuiz);
    }
    // self-heal: a passed quiz proves the whole chapter was completed, so credit
    // every slide. Fixes older saves where the pre-quiz slides were viewed but the
    // quiz slides were never recorded — the course % would otherwise stay at 0%.
    if (chDef && st.passed && st.viewed.length < chDef.slides) {
      st.viewed = Array.from({ length: chDef.slides }, (_, i) => i + 1);
      S.selfHealed = true;
    }
    if (S.selfHealed) {
      S.selfHealed = false;
      save();
      setTimeout(() => toast("Progress synced — a completed chapter's slides were credited. Your course % is now accurate.", "rank"), 600);
    }
    if (typeof st.reviewSecs !== "number") st.reviewSecs = 0;
    if (st.reviewed === undefined) st.reviewed = false;
    if (st.tipSeen === undefined) st.tipSeen = false;
    return st;
  }

  /* ---------- Session time tracking (auto-starts on open, pauses when hidden) ---------- */
  let sesStart = Date.now();
  let sesTicker = null;
  let sesSaveTimer = null;
  // Time-in-the-game badges — the trader who trains when nobody's watching.
  // Awarded from the live session clock, so every real minute counts.
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function studyStreakDays() {
    // Longest run of consecutive study days (a day counts once ≥60s active).
    const days = [...(S.studyDays || [])].sort();
    let best = 0, run = 0, prev = null;
    days.forEach(k => {
      if (prev === null) run = 1;
      else {
        const diff = Math.round((new Date(k) - new Date(prev)) / 86400000);
        run = (diff === 1) ? run + 1 : 1;
      }
      if (run > best) best = run;
      prev = k;
    });
    return best;
  }
  function awardTimeBadge(key) {
    if (!S.timeBadges) S.timeBadges = [];
    if (S.timeBadges.includes(key)) return;
    S.timeBadges.push(key);
    const b = BADGES[key];
    if (b) { toast("Badge earned: " + b.icon + " " + b.name, "rank"); addXp(40, "time-" + key); }
  }
  function checkTimeBadges() {
    TIME_BADGES.forEach(t => { if ((S.secs || 0) >= t.secs) awardTimeBadge(t.key); });
    // Study-day streak is awarded live the moment the 3rd day registers; this
    // boot-time pass makes it self-healing for any edge case that misses it.
    if (studyStreakDays() >= 3) awardTimeBadge("study3");
  }
  function sesFlush() {
    const delta = Math.round((Date.now() - sesStart) / 1000);
    sesStart = Date.now();
    if (delta <= 0) return;
    S.secs = (S.secs || 0) + delta;
    // Credit a study day once a real 60s of focus is banked — opening and
    // closing in a blink doesn't earn the Unseen Grind badge.
    const k = todayKey();
    if (k !== (S.dayKey || "")) { S.dayKey = k; S.daySecs = 0; }
    S.daySecs = (S.daySecs || 0) + delta;
    if (S.daySecs >= 60 && !(S.studyDays || []).includes(k)) {
      S.studyDays.push(k);
      if (studyStreakDays() >= 3) awardTimeBadge("study3");
    }
    checkTimeBadges();
    save();
  }
  function startSessionClock() {
    if (sesTicker) return;
    sesStart = Date.now();
    // live display every second; persist only every 30s (avoid serializing the whole state each tick)
    sesTicker = setInterval(() => {
      const t = document.getElementById("sessTimer");
      if (t) t.textContent = fmtClock((S.secs || 0) + Math.round((Date.now() - sesStart) / 1000));
    }, 1000);
    sesSaveTimer = setInterval(() => { if (!document.hidden) sesFlush(); }, 30000);
    window.addEventListener("beforeunload", () => { if (!document.hidden) sesFlush(); });
    // pause while the tab is hidden — study time should be real, focused time.
    // The 30s bank skips while hidden (background timers would otherwise farm
    // hours), and the hide transition banks only the visible time since the
    // last flush. Coming back resets the window.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) sesFlush();
      else sesStart = Date.now();
    });
  }
  function fmtClock(s) {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0");
  }
  function fmtDur(mins) {
    if (mins < 60) return mins + " min";
    return Math.floor(mins / 60) + "h " + (mins % 60 ? mins % 60 + "m" : "");
  }
  function isComplete(ch) {
    const st = chState(ch.id);
    const allViewed = st.viewed.length >= ch.slides;
    if (ch.quiz) return allViewed && st.passed;
    return allViewed; // quiz bank pending → slide completion unlocks
  }
  function isUnlocked(ch) {
    if (ch.id === 1) return true;
    const prev = CHAPTERS.find(c => c.id === ch.id - 1);
    return prev ? isComplete(prev) : true;
  }

  /* ---------- Ranks / XP ---------- */
  function rankFor(xp) { let r = RANKS[0]; for (const x of RANKS) if (xp >= x.min) r = x; return r; }
  function nextRank(xp) { return RANKS.find(r => r.min > xp) || null; }

  function addXp(n, why) {
    const before = rankFor(S.xp);
    S.xp += n;
    const after = rankFor(S.xp);
    save();
    if (after !== before) toast("Rank up! You are now " + after.icon + " " + after.name, "rank");
  }

  /* ---------- Ring gauges (mini insight circles) ---------- */
  // Same visual language as the course-progress ring, sized down for the
  // at-a-glance intel panel. Ring on the left, its label + sub-line on the
  // right — so the copy never has to squeeze inside the circle.
  function ringGauge(pct, color, label, value, sub) {
    const p = Math.max(0, Math.min(100, pct));
    // Radial glow done natively in SVG (feGaussianBlur) so it follows the
    // circle's shape — a CSS drop-shadow would halo the element's rectangular
    // bounding box instead. This is the standard for every ring on the site.
    return `<div class="mini-ring">
      <svg viewBox="0 0 84 84">
        <defs><filter id="ringGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <circle class="mini-ring-bg" cx="42" cy="42" r="34"/>
        <circle class="mini-ring-fg" cx="42" cy="42" r="34" style="stroke:${color};stroke-dasharray:213.6;stroke-dashoffset:${213.6 * (1 - p / 100)}" filter="url(#ringGlow)"/>
      </svg>
      <div class="mini-ring-label"><strong>${value}</strong></div>
    </div>
    <div class="mini-ring-text">
      <b class="mini-ring-name">${label}</b>
      ${sub ? `<p>${sub}</p>` : ""}
    </div>`;
  }

  /* ---------- Streak ---------- */
  // Discipline pays: daily attendance earns a streak bonus, growing with the
  // run. This is one of the only ways past the course-XP ceiling — the top
  // rank is a proof of persistence, not just completion.
  function touch() {
    const today = new Date().toISOString().slice(0, 10);
    if (S.lastActive !== today) {
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const streakBonus = S.streak >= 3 ? 5 : 2;
      S.streak = (S.lastActive === y) ? S.streak + 1 : 1;
      S.lastActive = today;
      addXp(streakBonus, "streak"); // addXp already saves
    }
  }

  /* ---------- Premium line icons (gold, matching the main site) ---------- */
  const ICON = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICONS = {
    trophy: ICON('<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/>'),
    book:   ICON('<path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v5h5"/>'),
    check:  ICON('<path d="M12 2l2.4 2.4 3.4-.5.5 3.4L20.7 9l-1.6 3 1.6 3-2.4 1.7-.5 3.4-3.4-.5L12 22l-2.4-2.4-3.4.5-.5-3.4L3.3 15l1.6-3-1.6-3 2.4-1.7.5-3.4 3.4.5L12 2z"/><path d="M9 12l2 2 4-4"/>'),
    flame:  ICON('<path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-1.5.5-3 1.5-4.5C9 9 12 6 12 2z"/>'),
    flask:  ICON('<path d="M9 3h6M10 3v5.5L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8.5V3"/><path d="M7 15h10"/>'),
    robot:  ICON('<path d="M12 8V4M6 8h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M9 18v2M15 18v2"/>'),
    pen:    ICON('<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'),
    sparkle: ICON('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>'),
    chart:  ICON('<path d="M4 20V4M4 20h16"/><path d="M8 16l3-4 3 2 4-6"/>'),
    lock:   ICON('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    clock:  ICON('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    alert:  ICON('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    zap:    ICON('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    note:   ICON('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
    target: ICON('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
    lockOpen: ICON('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
    diamond: ICON('<path d="M12 2l4.5 4.5L12 22 7.5 6.5 12 2z"/><path d="M2 6.5h20M7.5 6.5L12 22l4.5-15.5"/>')
  };
  const NAV_ICONS = {
    profile: "user", "": "home", map: "map", progress: "chart", mod: "shield",
    path: "compass", certificate: "grad", vault: "key", lab: "flask"
  };

  /* ---------- Helpers ---------- */
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function fmt(n) { return String(n).padStart(2, "0"); }

  let toastTimer = null;
  function toast(msg, kind) {
    let t = $("#toast");
    if (!t) { t = el("div", "toast"); t.id = "toast"; document.body.appendChild(t); }
    t.className = "toast show" + (kind ? " toast-" + kind : "");
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- Gold confetti (canvas, no libraries) ---------- */
  // A celebration layer that matches the site: gold, black and champagne flakes
  // burst upward from the bottom corners and drift down. Auto-cleans itself.
  let confettiCanvas = null;
  let confettiRaf = null;
  let confettiParts = [];
  const CONFETTI_COLORS = ["#d4af37", "#e8c96a", "#f5e3a3", "#b08d2e", "#fff6d8", "#8a6d1f"];
  const BLAST_COLORS = ["#e05252", "#f0a69e", "#ffd2bd", "#8a1f1f", "#d4af37", "#ffb08a"]; // margin-call explosions
  window.addEventListener("resize", () => { if (confettiCanvas) { confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; } });
  function ensureConfetti() {
    if (!confettiCanvas) {
      confettiCanvas = el("canvas", "confetti-layer");
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
      document.body.appendChild(confettiCanvas);
    }
    return confettiCanvas;
  }
  function confettiTick() {
    const cv = ensureConfetti(), cx = cv.getContext("2d");
    cx.clearRect(0, 0, cv.width, cv.height);
    confettiParts = confettiParts.filter(p => p.y < cv.height + 24);
    for (const p of confettiParts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr;
      cx.save();
      cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.fillStyle = p.color;
      if (p.shape === "circle") { cx.beginPath(); cx.arc(0, 0, p.size / 2, 0, Math.PI * 2); cx.fill(); }
      else if (p.shape === "ribbon") { cx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3); }
      else { cx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); }
      cx.restore();
    }
    if (confettiParts.length) confettiRaf = requestAnimationFrame(confettiTick);
    else { confettiRaf = null; if (confettiCanvas) { confettiCanvas.remove(); confettiCanvas = null; } }
  }
  function spawnConfetti(p) { confettiParts.push(p); if (confettiParts.length > 900) confettiParts = confettiParts.slice(-900); if (!confettiRaf) confettiTick(); }
  function burstConfetti(intensity) {
    const n = Math.round((intensity || 120) * Math.min(1.5, window.innerWidth / 1200));
    ensureConfetti().getContext("2d").clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    const w = confettiCanvas.width, h = confettiCanvas.height;
    for (let i = 0; i < n; i++) {
      const fromLeft = Math.random() < 0.5;
      spawnConfetti({
        x: fromLeft ? -10 : w + 10,
        y: h * (0.55 + Math.random() * 0.45),
        vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 4.5),
        vy: -(6 + Math.random() * 9),
        g: 0.22 + Math.random() * 0.14,
        size: 5 + Math.random() * 6,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.24,
        shape: Math.random() < 0.3 ? "circle" : (Math.random() < 0.5 ? "rect" : "ribbon")
      });
    }
  }
  // A violent red burst from a specific element — the Laboratory's margin-call
  // explosion, or any 'things just blew up' teaching moment. Shakes the source.
  function burstFrom(elOrigin) {
    const n = 110;
    ensureConfetti().getContext("2d").clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    const r = elOrigin ? elOrigin.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    const ox = r.left + r.width / 2, oy = r.top + r.height / 3;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 9;
      spawnConfetti({
        x: ox, y: oy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 2,
        g: 0.18 + Math.random() * 0.12,
        size: 3 + Math.random() * 7,
        color: BLAST_COLORS[(Math.random() * BLAST_COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        shape: Math.random() < 0.4 ? "circle" : (Math.random() < 0.5 ? "rect" : "ribbon")
      });
    }
    if (elOrigin) { elOrigin.classList.add("shake"); setTimeout(() => elOrigin.classList.remove("shake"), 700); }
  }

  /* ---------- Trader style (adaptive learning) ---------- */
  function styleKey() {
    if (!S.traderStyle) return null;
    const k = S.traderStyle.toLowerCase().trim().replace(/\s*trader$/, "");
    return STYLES[k] ? k : "general";
  }
  function styleProfile() {
    if (!S.traderStyle) return null;
    return STYLES[styleKey()] || STYLES.general;
  }

  function nextLesson() {
    for (const ch of CHAPTERS) {
      if (!isUnlocked(ch) || isComplete(ch)) continue;
      if (retryLocked(ch) > 0) continue;          // reflection window — not the next lesson
      const st = chState(ch.id);
      if (ch.quiz && st.lastScore != null && st.lastScore < PASS_PCT && retriesLeft(ch) <= 0) continue; // tokens exhausted
      return ch;
    }
    return null;
  }

  /* ---------- Smart chapter recommender (post-course) ----------
     After every chapter is complete, the Continue button stops pushing
     forward and starts pointing back: at the chapters where the student's
     quiz data says they struggled — wrong answers, slow responses, or a
     best score under the excellence line. Signals come from the
     per-chapter aggregate (chapStats), which survives the log's 500-entry
     cap, and automated fast-answer flags are excluded so suspicious
     speed never reads as mastery. */
  function recommendChapters() {
    return CHAPTERS.map(ch => {
      const agg = (S.chapStats || {})[ch.id];
      const st = chState(ch.id);
      const best = st.quizBest != null ? st.quizBest : 0;
      let score = 0, reason = "";
      if (ch.quiz) {
        if (best < 85) {
          score = Math.max(score, 100 - best);
          reason = best < PASS_PCT
            ? `This one took real work — best score ${best}%. Retakes exist for this reason.`
            : `Passed at ${best}% — strong, but the excellence line is 85%. One clean run closes the gap.`;
        }
        if (agg && agg.n >= 4 && agg.wrong / agg.n >= 0.25) {
          const w = Math.round(agg.wrong / agg.n * 100);
          score = Math.max(score, 25 + w);
          reason = `${w}% of your logged answers here were misses. Review, then prove the fix.`;
        }
        // Slow but CORRECT study — only praised when the score actually earned it,
        // so 'did well here' is never said to a struggling student.
        if (best >= 85 && agg && agg.n >= 2) {
          const avg = agg.msSum / agg.n;
          if (avg > 60000) {
            score = Math.max(score, 50);
            reason = `We acknowledge you did well here — but you averaged ${Math.round(avg / 1000)}s per question. That patience shows genuine study, and practice will speed it up.`;
          }
        }
      }
      return { ch, score, reason, best };
    }).filter(r => r.score > 0 && isComplete(r.ch)).sort((a, b) => b.score - a.score);
  }
  function progressPct() {
    return Math.round(CHAPTERS.filter(isComplete).length / CHAPTERS.length * 100);
  }
  function slidesSeen() {
    return CHAPTERS.reduce((a, c) => a + chState(c.id).viewed.length, 0);
  }
  function quizzesPassed() {
    return CHAPTERS.filter(c => c.quiz && chState(c.id).passed).length;
  }

  /* ---------- Retake policy (Fair Play) ---------- */
  const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h reflection period after a fail
  const MAX_RETRIES = 3;                        // retake tokens per chapter
  const BADGES = {
    lion:       { name: "Heart of a Lion",    icon: "🦁", desc: "Failed a chapter, came back, and passed it. That's persistence — the trader's hidden edge." },
    distinction:{ name: "Distinction Hunter", icon: "🏆", desc: "Retook a chapter and pushed past 90% when a pass wasn't enough. Excellence is a habit." },
    honours:    { name: "Honours",            icon: "🎖️", desc: "Scored 80% or higher on a chapter quiz. Consistency compounds — this is how institutions are built." },
    first:      { name: "First Blood",        icon: "⚔️", desc: "Passed your very first chapter quiz. Every master started here." },
    perfect:    { name: "Flawless",           icon: "💎", desc: "Scored 100% on a chapter quiz. Clean execution, clean thinking." },
    // Time-in-the-game achievements — the trader who trains when nobody's
    // watching. Tracked from the live session clock.
    hour1:      { name: "First Hour",         icon: "⏱️", desc: "Logged your first hour inside the Academy. The path begins with showing up." },
    hour3:      { name: "Deep Session",       icon: "🔥", desc: "Stayed focused for 3 hours of study. That's a training block, not a visit." },
    hour10:     { name: "Ten Hours of Focus", icon: "💫", desc: "10 hours invested. Compound interest on your own brain." },
    hour50:     { name: "Fifty-Hour Grind",   icon: "🏔️", desc: "50 hours in the game. Most traders never get this far — you're built different." },
    hour100:    { name: "Century of Study",   icon: "🌌", desc: "100 hours of study. The market can't give this back — only you could." },
    study3:     { name: "The Unseen Grind",   icon: "🌙", desc: "3 consecutive days of study — the habit that quietly makes professionals." }
  };
  // Milestones (in seconds) for the time-in-the-game badges
  const TIME_BADGES = [
    { key: "hour1",   secs: 3600 },
    { key: "hour3",   secs: 3 * 3600 },
    { key: "hour10",  secs: 10 * 3600 },
    { key: "hour50",  secs: 50 * 3600 },
    { key: "hour100", secs: 100 * 3600 }
  ];
  function retryLocked(ch) {
    const st = chState(ch.id);
    if (!ch.quiz || !st.failedAt || st.passed) return 0;
    return Math.max(0, RETRY_WINDOW_MS - (Date.now() - st.failedAt));
  }
  // Tokens: 3 retakes per chapter, one regenerates per week since the first fail,
  // so a committed student is never locked out forever — only until the week turns.
  function retriesLeft(ch) {
    const st = chState(ch.id);
    const regen = st.firstFailAt ? Math.floor((Date.now() - st.firstFailAt) / (7 * 24 * 3600 * 1000)) : 0;
    return Math.min(MAX_RETRIES, Math.max(0, MAX_RETRIES - (st.retries || 0) + regen));
  }
  function fmtLock(ms) {
    const m = Math.ceil(ms / 60000);
    if (m < 60) return m + " min";
    return Math.floor(m / 60) + "h" + (m % 60 ? " " + m % 60 + "m" : "");
  }

  /* ---------- Estimated time ----------
     mins = reading time only. Quiz time is added on top — a serious student
     doesn't read 58 slides, answer 23 questions, and review the misses in the
     same 95 minutes. Each question carries ~1.5 min of read/answer/review,
     and every REAL retake attempt re-pays that cost (it's on the log). */
  const Q_MIN = 1.5; // minutes per quiz question (read + answer + review explanation)
  function quizMins(ch) { return ch.quiz ? Math.round((ch.quiz.length || 0) * Q_MIN) : 0; }
  function chapterTotalMins(ch) { return (ch.mins || 0) + quizMins(ch); }
  function retakeMins() {
    // retakes are real time too — each retry re-pays the quiz's question minutes.
    // Only unfinished chapters count: once a chapter is fully done, its quiz time
    // is already inside doneMins (via chapterTotalMins), so adding it again would inflate.
    let m = 0;
    CHAPTERS.forEach(c => {
      if (!c.quiz || isComplete(c)) return;
      const st = chState(c.id);
      if ((st.retries || 0) > 0) m += quizMins(c);
    });
    return m;
  }
  function courseMins() { return CHAPTERS.reduce((a, c) => a + chapterTotalMins(c), 0); }
  function doneMins() {
    return CHAPTERS.reduce((a, c) => {
      const st = chState(c.id);
      const total = chapterTotalMins(c);
      if (!total) return a;
      // slides viewed → their share; a passed quiz marks the chapter fully done
      if (c.quiz && st.passed) return a + total;
      if (!c.quiz && st.viewed.length >= c.slides) return a + total;
      const frac = Math.min(st.viewed.length / c.slides, 1);
      return a + Math.round(total * frac);
    }, 0);
  }
  function hoursLeft() {
    return Math.max(0, Math.round((courseMins() + retakeMins() - doneMins()) / 6) / 10);
  }

  /* ---------- Sidebar rank ---------- */
  function updateSidebar() {
    const rank = rankFor(S.xp);
    const ic = document.getElementById("sideRankIc");
    const nm = document.getElementById("sideRankName");
    const xp = document.getElementById("sideRankXp");
    if (ic) ic.innerHTML = window.OSIcon ? OSIcon("diamond") : rank.icon; // stroke diamond, not emoji
    if (nm) nm.textContent = rank.name;
    if (xp) xp.textContent = S.xp + " XP · " + progressPct() + "% course";
  }

  /* ---------- Router ---------- */
  function updateCertNav() {
    const ready = CHAPTERS.every(isComplete);
    const certNav = document.querySelector('.nav-item[data-route="certificate"]');
    if (!certNav) return;
    certNav.classList.toggle("nav-ready", ready);
    if (ready && !certNav.querySelector(".ni-ready")) {
      const chip = el("span", "ni-ready", "READY");
      certNav.appendChild(chip);
    }
  }

  function route() {
    document.onkeydown = null; // keyboard nav only lives inside the lesson player
    clearInterval(session.revTicker); // stop revision countdown when leaving the lesson
    updateSidebar();
    updateCertNav();
    const h = location.hash || "#/";
    const parts = h.replace(/^#\//, "").split("/");
    const view = parts[0] || "";
    const viewEl = $("#view");
    viewEl.innerHTML = "";
    document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", (n.dataset.route || "") === view));

    if (view === "map") renderMap(viewEl);
    else if (view === "path") renderPath(viewEl);
    else if (view === "progress") renderProgress(viewEl);
    else if (view === "profile") renderProfile(viewEl);
    else if (view === "lab") renderLab(viewEl);
    else if (view === "mod") renderMod(viewEl);
    else if (view === "lesson") renderLesson(viewEl, parseInt(parts[1], 10), parts[2] && !isNaN(parseInt(parts[2], 10)) ? parseInt(parts[2], 10) : null, parts[2] === "r");
    else if (view === "review") renderLesson(viewEl, parseInt(parts[1], 10), null, true); // read-only revision mode
    else if (view === "certificate") renderCertificate(viewEl);
    else if (view === "vault") renderVault(viewEl);
    else renderDashboard(viewEl);
    window.scrollTo(0, 0);
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function renderDashboard(root) {
    const ch = CHAPTERS.find(c => c.id === 1);
    const name = profileName() || "Trader";
    const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const pct = progressPct();
    const rank = rankFor(S.xp);
    const nr = nextRank(S.xp);
    const cont = nextLesson();
    const recs = cont ? [] : recommendChapters();
    const rec = recs[0] || null;
    const cta = cont
      ? `<button class="btn-gold" data-go="${cont.id}">Continue — ${esc(cont.title)}</button>`
      : rec
        ? `<button class="btn-gold" data-go="${rec.ch.id}">Practice — ${esc(rec.ch.title)}</button>
           <p class="dash-cta-sub">${esc(rec.reason)}</p>`
        : `<div class="dash-cta-row">
             <button class="btn-gold" data-go="cert">Claim your certificate</button>
             <button class="btn-ghost" data-go="progress">Insights</button>
           </div>
           <p class="dash-cta-sub">Every chapter complete. Collect what you earned — and keep sharpening while you're here.</p>`;

    const hoff = handoffRec();
    root.appendChild(el("div", "dash-hero", `
      <div class="sess-chip" title="Live session timer — auto-starts when you open the academy, stops when you leave">
        <span class="sess-dot"></span>
        <div><p class="sess-lbl">Live session</p><p class="sess-time" id="sessTimer">${fmtClock(S.secs || 0)}</p></div>
      </div>
      <div class="dash-hero-inner">
        <div>
          <p class="eyebrow">Reality FX OS · ${esc(today)}</p>
          <h1>Welcome back, <span class="gold-serif">${esc(name)}</span></h1>
          ${hoff ? `<p class="verified-pill">${esc(hoff.studentId)} · ${esc(hoff.status || "ACTIVE")} · identity verified by Reality FX registration</p>` : ""}
          <p class="dash-sub">“${esc(QUOTE)}”</p>
          <div class="dash-cta">
            ${cta}
          </div>
        </div>
        <div class="ring-side">
          <div class="ring-wrap">
            <svg class="ring" viewBox="0 0 120 120">
              <defs><filter id="courseRingGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
              <circle class="ring-bg" cx="60" cy="60" r="52"/>
              <circle class="ring-fg" cx="60" cy="60" r="52" style="stroke-dashoffset:${326.7 * (1 - pct / 100)}" filter="url(#courseRingGlow)"/>
            </svg>
            <div class="ring-label"><strong>${pct}%</strong><span>course</span></div>
          </div>
          <div class="hours-chip" title="Estimated study time remaining — slides read and quizzes passed reduce it">
            <span class="hc-ic">${ICONS.clock}</span>
            <div><p class="hc-v">≈ ${hoursLeft()}h</p><p class="hc-l">left in course</p></div>
          </div>
        </div>
      </div>
    `));
    root.querySelectorAll(".dash-cta [data-go]").forEach(go => go.addEventListener("click", () => {
      const t = go.dataset.go;
      location.hash = t === "cert" ? "#/certificate" : t === "progress" ? "#/progress" : "#/lesson/" + t;
    }));

    // Trader identity card (adaptive learning)
    root.appendChild(styleCard());

    // Stats
    const stats = [
      { v: CHAPTERS.filter(isComplete).length + "/13", l: "Chapters completed", i: ICONS.trophy },
      { v: slidesSeen() + "/" + CHAPTERS.reduce((a, c) => a + c.slides, 0), l: "Slides explored", i: ICONS.book },
      { v: quizzesPassed(), l: "Quizzes passed", i: ICONS.check },
      { v: S.streak + " day" + (S.streak === 1 ? "" : "s"), l: "Discipline streak", i: ICONS.flame },
      { v: S.distStreak + (S.distStreak === 1 ? " chapter" : " chapters") + " at 80%+", l: "Distinction streak", i: ICONS.diamond }
    ];
    const grid = el("div", "stat-grid");
    stats.forEach(s => grid.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${s.i}</div><div class="stat-v">${s.v}</div><div class="stat-l">${s.l}</div>`)));
    root.appendChild(grid);

    // Your intel at a glance — ring gauges with the course-progression look.
    // A glimpse for every student, graduate or still climbing: the full
    // breakdown lives in the Insights page.
    const gradedChs = CHAPTERS.filter(c => c.quiz && chState(c.id).lastScore != null);
    const avgGrade = gradedChs.length
      ? Math.round(gradedChs.reduce((a, c) => a + chState(c.id).lastScore, 0) / gradedChs.length)
      : null;
    let accN = 0, accW = 0;
    Object.values(S.chapStats || {}).forEach(a => { accN += a.n || 0; accW += a.wrong || 0; });
    const accuracy = accN ? Math.round((accN - accW) / accN * 100) : null;
    const logMs = (S.log || []).filter(l => l.ms > 1400); // exclude automated-speed flags
    const avgResp = logMs.length ? Math.round(logMs.reduce((a, r) => a + r.ms, 0) / logMs.length) : null;
    // Pace ring fills by the SHARE of answers under a healthy 30s — higher fill
    // always means better, consistent with the grade and accuracy rings.
    const paceShare = logMs.length ? Math.round(logMs.filter(r => r.ms <= 30000).length / logMs.length * 100) : null;
    // The intel rings follow the site's gold theme — the value inside the ring
    // tells the story, the gold keeps the Academy's identity consistent.
    const ringGold = "#d4af37";
    const ringEmpty = "#8a8a8a";
    const intel = el("div", "panel intel-panel");
    intel.innerHTML = `
      <div class="intel-head">
        <div>
          <h3 class="panel-title gold-serif">Your intel at a glance</h3>
          <p class="panel-sub">A glimpse of what your answers say about you — the full breakdown lives in Insights.</p>
        </div>
        <button class="btn-ghost" data-go="progress">Open Insights</button>
      </div>
      <div class="intel-rings">
        <div class="intel-ring-cell">${ringGauge(avgGrade != null ? avgGrade : 0, avgGrade != null ? ringGold : ringEmpty, "avg grade", avgGrade != null ? avgGrade + "%" : "—", gradedChs.length ? gradedChs.length + " quizzes graded" : "Pass a quiz to light this up")}</div>
        <div class="intel-ring-cell">${ringGauge(accuracy != null ? accuracy : 0, accuracy != null ? ringGold : ringEmpty, "accuracy", accuracy != null ? accuracy + "%" : "—", accN ? accN + " answers logged" : "Answers appear as you quiz")}</div>
        <div class="intel-ring-cell">${ringGauge(paceShare != null ? paceShare : 0, paceShare != null ? ringGold : ringEmpty, "quick answers", paceShare != null ? paceShare + "%" : "—", paceShare != null ? (paceShare >= 70 ? "Most answers in under 30s" : paceShare >= 40 ? "A steady, careful pace" : "Deeply deliberate — the review matters") : "Timed from your first quiz")}</div>
      </div>`;
    const intelGo = intel.querySelector("[data-go='progress']");
    if (intelGo) intelGo.addEventListener("click", () => location.hash = "#/progress");
    root.appendChild(intel);

    // Badges & Recognition — the full track, earned and locked, so students
    // know what the badges are and how to earn them before they even start.
    const earnedBadges = [];
    CHAPTERS.forEach(c => (chState(c.id).badges || []).forEach(b => { if (BADGES[b]) earnedBadges.push({ ch: c.id, kind: "quiz", ...BADGES[b] }); }));
    (S.timeBadges || []).forEach(b => { if (BADGES[b]) earnedBadges.push({ ch: null, kind: "time", ...BADGES[b] }); });
    const earnedNames = new Set(earnedBadges.map(b => b.name));
    const badgeTrack = Object.values(BADGES).map(b => {
      const owned = earnedNames.has(b.name);
      const got = earnedBadges.find(x => x.name === b.name);
      const ch = got ? got.ch : null;
      return `<div class="badge-tile ${owned ? "" : "locked"}" title="${esc(b.desc)}">
        <div class="badge-tile-ic">${owned ? b.icon : ICONS.lock}</div>
        <div><b>${b.name}</b><p>${owned ? "Earned" + (ch ? " · Chapter " + ch : (got && got.kind === "time") ? " · Study time" : "") : b.desc.split(".")[0]}</p></div>
      </div>`;
    }).join("");
    root.appendChild(el("div", "panel badge-panel", `
      <h3 class="panel-title gold-serif">Badges &amp; Recognition</h3>
      <p class="panel-sub">Quiz badges, earned not given — 80%+ for 🎖️ Honours, 100% for 💎 Flawless, a 90%+ retake for 🏆 Distinction Hunter, passing after a fail for 🦁 Heart of a Lion, and your first pass for ⚔️ First Blood. Time badges honour the unseen grind — the hours logged ⏱️ and the consecutive days you show up 🌙. The rarest prove the most.</p>
      <div class="badge-shelf">${badgeTrack}</div>
      ${S.distStreak >= 2 ? `<div class="dist-banner fire"><span>🔥</span><div><b>You're on fire — ${S.distStreak} chapters in a row at 80%+</b><p>Best streak: ${S.distBest}. This is how institutions are built.</p></div></div>` : S.distStreak === 1 ? `<div class="dist-banner"><span>🔥</span><div><b>1 chapter at 80%+ — keep the distinction streak alive</b><p>Two in a row and you're officially on fire.</p></div></div>` : ""}`));

    // Rank + journey quick links
    const rankCard = el("div", "rank-card", `
      <div class="rank-ic">${rank.icon}</div>
      <div class="rank-mid">
        <div class="rank-name">${rank.name}</div>
        <div class="rank-xpbar"><span style="width:${rankPct()}%"></span></div>
        <div class="rank-xplbl">${S.xp} XP · ${nr ? "next: " + nr.icon + " " + nr.name + " at " + nr.min + " XP" : "max rank reached"}</div>
      </div>
      <div class="rank-go">
        <button class="btn-ghost" data-go="map">Journey</button>
        <button class="btn-ghost" data-go="progress">Insights</button>
      </div>
      ${nr ? `<p class="rank-note">${nr.icon} ${nr.name} awaits at ${nr.min} XP — the crown is earned through retakes, streaks and mastery, not just completion.</p>` : `<p class="rank-note">👑 You hold the rarest rank in the Academy. Few ever reach it — fewer keep it. The market has no higher honour.</p>`}`);
    function rankPct() {
      if (!nr) return 100;
      const prevMin = rank.min;
      return Math.min(100, Math.round((S.xp - prevMin) / (nr.min - prevMin) * 100));
    }
    const rankGo = rankCard.querySelector("[data-go='map']");
    if (rankGo) rankGo.addEventListener("click", () => location.hash = "#/map");
    const rankPr = rankCard.querySelector("[data-go='progress']");
    if (rankPr) rankPr.addEventListener("click", () => location.hash = "#/progress");
    root.appendChild(rankCard);

    // Practice shelf — after the course is complete, the dashboard keeps
    // working for the student instead of going quiet: the chapters their
    // own quiz data says deserve another pass, with the honest reason.
    if (!cont && recs.length) {
      const shelf = el("div", "panel rec-shelf");
      shelf.innerHTML = `
        <h3 class="panel-title gold-serif">Recommended practice</h3>
        <p class="panel-sub">The certificate isn't the end of the road — the Laboratory is where strategies get sharper. Your answer data picked these chapters for another pass.</p>
        <div class="rec-grid">
          ${recs.slice(0, 3).map(r => `
            <div class="rec-card">
              <span class="rec-chip">Chapter ${fmt(r.ch.id)}</span>
              <h4 class="gold-serif">${esc(r.ch.title)}</h4>
              <p>${esc(r.reason)}</p>
              <button class="btn-ghost" data-rec="${r.ch.id}">Practice this chapter</button>
            </div>`).join("")}
        </div>`;
      shelf.querySelectorAll("[data-rec]").forEach(b => b.addEventListener("click", () => location.hash = "#/lesson/" + b.dataset.rec));
      root.appendChild(shelf);
    }

    // Cert teaser
    root.appendChild(el("div", "cert-teaser", `
      ${pct === 100
        ? `<p class="eyebrow">Certification unlocked</p><h3 class="gold-serif">You are a Reality FX graduate.</h3><button class="btn-gold" data-go="cert">Receive your certificate</button>`
        : `<p class="eyebrow">Certification</p><h3 class="gold-serif">Complete all 13 chapters to earn your Reality FX certificate.</h3><div class="cert-progress"><span style="width:${pct}%"></span></div>`}`));
    const ct = root.querySelector(".cert-teaser [data-go]");
    if (ct) ct.addEventListener("click", () => location.hash = "#/certificate");

    // Coming soon strip
    root.appendChild(el("div", "soon-strip", `
      <div class="soon-chip">${ICONS.flask} Trading Laboratory — soon</div>
      <div class="soon-chip">${ICONS.robot} AI Mentor — soon</div>
      <div class="soon-chip">${ICONS.pen} Trade Journal — soon</div>`));

    // Academy FAQ + Fair Usage Policy
    root.appendChild(academyBlock());

    // Name edit — writes straight into the student profile (single source of truth)
    const p = profile();
    const nameInput = el("input", "name-input");
    nameInput.placeholder = "Enter your name";
    nameInput.value = profileName();
    nameInput.addEventListener("change", () => {
      const v = nameInput.value.trim();
      if (!v) { toast("Add your name — it prints on the certificate", "warn"); return; }
      p.name = v; S.name = v; save();
      toast("Name saved to your profile", "rank");
    });
    root.appendChild(el("div", "name-box", `<label>Your name (shown on your certificate)</label><a class="name-edit-link" href="#/profile">Edit full profile →</a>`));
    root.querySelector(".name-box").appendChild(nameInput);
  }

  /* ---------- Academy FAQ + Fair Usage Policy ---------- */
  function academyBlock() {
    const faqs = [
      { q: "How many retake attempts do I get per chapter?", a: "Three retake tokens per chapter. After a failed attempt, a 2-hour reflection period unlocks before your next try — the time is meant for reviewing the lesson, not for blind repetition. Once your three tokens are used, the chapter locks and you can request a review from academy support." },
      { q: "Can I take a screenshot of my results and share them?", a: "You may screenshot your own results for personal motivation. Sharing them publicly is fine as long as you don't misrepresent the academy, its claims, or its certificate. Any result you share must include your real student identity." },
      { q: "Can I share my account or login with a friend?", a: "No. Your account is personal and non-transferable. Sharing your login is a violation of the Academy Fair Usage Policy and will result in suspension of your account and email. Repeated violations lead to a permanent ban and IP block." },
      { q: "How does the academy detect cheating?", a: "Our Fair Play system monitors quiz response times, retake patterns, session behaviour and unusual answer patterns — the same kind of signal analysis used by competitive platforms like chess.com. Flags are reviewed by a human moderator before any action is taken." },
      { q: "What happens if I'm flagged?", a: "A flag is a review trigger, not a verdict. The moderator examines your quiz timeline; if the evidence is clear you'll be given a warning and one chance to re-sit the quiz under monitored conditions. Attempts to cheat again result in an account ban." },
      { q: "How do I get my Student Code?", a: "Your Student Code is generated after your verified registration is approved (valid photo ID, email, phone and address). It is your passport in the academy and appears on your certificate. This goes live with Phase 2 accounts." },
      { q: "What are the requirements for registration?", a: "A clear photo of your face (selfie), a valid email address, a valid phone number, and your address. These are verified before your account is activated — this is what keeps the academy a trusted, real community." }
    ];
    const block = el("div", "panel academy-block");
    block.innerHTML = `
      <h3 class="panel-title gold-serif">Academy · FAQ & Fair Usage</h3>
      <p class="panel-sub">Everything a serious student should know. The bot assistant will answer these live soon.</p>
      <div class="faq-list">
        ${faqs.map(f => `<details class="faq-item"><summary>${esc(f.q)}</summary><div class="faq-a">${esc(f.a)}</div></details>`).join("")}
      </div>
      <div class="policy-card">
        <div class="policy-head"><span class="tool-ic">${ICONS.lock}</span><div><h3>Academy Fair Usage Policy</h3><p class="tool-sub">The rules that keep Reality FX fair for everyone</p></div></div>
        <ol class="policy-list">
          <li><b>One student, one account.</b> Accounts, login credentials and course access are personal. Sharing them violates the policy.</li>
          <li><b>Verified identity.</b> Registration requires a valid selfie, email, phone and address. Your Student Code is bound to that identity.</li>
          <li><b>Fair assessment.</b> Quizzes measure your understanding. Automated responses, AI answering, and proxy test-taking are prohibited.</li>
          <li><b>Reflection, not repetition.</b> Failed chapters carry a 2-hour reflection period and a limited number of retake tokens — this protects the value of every certificate we issue.</li>
          <li><b>Consequences of violation.</b> First violation: written warning + flagged review. Second: account suspension and email block. Third: permanent ban, including an IP block and revocation of any certificates issued under the account.</li>
        </ol>
      </div>`;
    return block;
  }

  /* ---------- Trader identity card (dashboard) ---------- */
  function styleCard() {
    const prof = styleProfile();
    const card = el("div", "style-card");
    if (!prof) {
      card.innerHTML = `
        <div class="style-card-ic">${ICON(STYLES.general.icon)}</div>
        <div class="style-card-body">
          <p class="quiz-tag">Your trader identity</p>
          <h3 class="gold-serif">What kind of trader are you becoming?</h3>
          <p>Answer the identity question inside Chapter 1 — the OS will tailor lessons, insights and focus areas to your style. You can change it any time.</p>
          <div class="style-card-actions"><button class="btn-ghost" data-style-go="1/8">Find my style</button></div>
        </div>`;
    } else {
      card.innerHTML = `
        <div class="style-card-ic">${ICON(prof.icon)}</div>
        <div class="style-card-body">
          <p class="quiz-tag">Your trader identity · adaptive learning</p>
          <h3 class="gold-serif">${esc(prof.name)}</h3>
          <p class="style-tagline">“${esc(prof.tagline)}”</p>
          <div class="style-card-actions">
            <button class="btn-ghost" data-style-go="path">Shape your path</button>
          </div>
        </div>`;
    }
    const btn = card.querySelector("[data-style-go]");
    if (btn) btn.addEventListener("click", () => {
      const t = btn.dataset.styleGo;
      location.hash = t === "path" ? "#/path" : "#/lesson/" + t;
    });
    return card;
  }

  /* ============================================================
     STUDENT PROFILE
     ============================================================ */
  function renderProfile(root) {
    const p = profile();
    ensureCode(p);
    const hoff = handoffRec();
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Student access</p>
      <h2>Your profile</h2>
      <p class="page-sub">${hoff
        ? "Your identity record — verified by Reality FX registration. The name here is exactly what prints on your certificate."
        : "Your identity record — the name here is exactly what prints on your certificate. Phase 2 registration will verify and lock these details; for now they're yours to keep accurate."}</p>`));

    const card = el("div", "panel profile-card");
    card.innerHTML = `
      <div class="profile-hero">
        <div class="profile-ava ${p.photo ? "has-photo" : ""}" id="pf-ava">${p.photo ? `<img src="${esc(p.photo)}" alt="Your profile photo">` : esc(profileName().charAt(0).toUpperCase() || "T")}</div>
        <div class="profile-hero-txt">
          <p class="quiz-tag">Student passport</p>
          <h3 class="gold-serif">${esc(profileName() || "Welcome, Trader")}</h3>
          ${hoff
            ? `<p class="profile-code">Student ID <b>${esc(hoff.studentId)}</b><span>verified by Reality FX registration · your passport in the Academy</span></p>`
            : `<p class="profile-code">Student Code <b>${esc(p.code)}</b><span>your passport in the Academy · appears on your certificate</span></p>`}
          <div class="pf-photo-ctl">
            <button class="btn-ghost sm" id="pf-photo-btn">${p.photo ? "Change photo" : "📷 Add photo"}</button>
            ${p.photo ? `<button class="btn-ghost sm danger" id="pf-photo-rm">Remove</button>` : ""}
            <input type="file" id="pf-photo-file" accept="image/*" hidden>
            <p class="pf-photo-hint">Clear face, good light. This is your academy identity — Phase 2 registration verifies it.</p>
          </div>
        </div>
      </div>
      <div class="profile-fields">
        <label>Full name <span>shown on your certificate</span><input id="pf-name" value="${esc(p.name)}" placeholder="Your full legal name"></label>
        <label>Email address <input id="pf-email" type="email" value="${esc(p.email)}" placeholder="you@example.com"></label>
        <label>Phone number <input id="pf-phone" type="tel" value="${esc(p.phone)}" placeholder="+27 ..."></label>
        <label>Country <input id="pf-country" value="${esc(p.country)}" placeholder="South Africa"></label>
      </div>
      <div class="profile-actions">
        <button class="btn-gold" id="pf-save">Save profile</button>
        <p class="profile-note">Your name and photo flow automatically into your certificate — no re-typing at graduation.</p>
      </div>`;
    root.appendChild(card);

    // Photo upload — resize on a canvas (240px JPEG) so the portrait stays
    // light in local storage, then render it straight into the avatar.
    function readPhoto(file) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const size = 240, cv = document.createElement("canvas");
        cv.width = size; cv.height = size;
        const ctx = cv.getContext("2d");
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        p.photo = cv.toDataURL("image/jpeg", 0.82);
        URL.revokeObjectURL(url);
        const ava = document.getElementById("pf-ava");
        if (ava) { ava.classList.add("has-photo"); ava.innerHTML = `<img src="${p.photo}" alt="Your profile photo">`; }
        const ctl = document.querySelector(".pf-photo-ctl");
        if (ctl && !document.getElementById("pf-photo-rm")) ctl.insertAdjacentHTML("afterbegin", `<button class="btn-ghost sm danger" id="pf-photo-rm">Remove</button>`);
        toast("Photo added — saved when you hit Save profile", "ok");
      };
      img.onerror = () => { URL.revokeObjectURL(url); toast("Couldn't read that image — try another", "warn"); };
      img.src = url;
    }
    const fileIn = card.querySelector("#pf-photo-file");
    card.querySelector("#pf-photo-btn").addEventListener("click", () => fileIn.click());
    fileIn.addEventListener("change", () => { const f = fileIn.files && fileIn.files[0]; if (f) readPhoto(f); fileIn.value = ""; });
    // Delegated so the Remove button works whether it came from the initial
    // render or was inserted later by readPhoto after an upload.
    card.addEventListener("click", e => {
      if (!e.target.closest("#pf-photo-rm")) return;
      p.photo = "";
      const ava = document.getElementById("pf-ava");
      if (ava) { ava.classList.remove("has-photo"); ava.textContent = (profileName().charAt(0) || "T").toUpperCase(); }
      const rm = document.getElementById("pf-photo-rm");
      if (rm) rm.remove();
      const btn = document.getElementById("pf-photo-btn");
      if (btn) btn.textContent = "📷 Add photo";
      toast("Photo removed — saved when you hit Save profile", "ok");
    });

    // Save: keep the profile in sync with the dashboard greeting + certificate
    card.querySelector("#pf-save").addEventListener("click", () => {
      const name = card.querySelector("#pf-name").value.trim();
      if (!name) { toast("Add your name — it prints on the certificate", "warn"); return; }
      p.name = name;
      p.email = card.querySelector("#pf-email").value.trim();
      p.phone = card.querySelector("#pf-phone").value.trim();
      p.country = card.querySelector("#pf-country").value.trim();
      S.name = name; // legacy alias so every read of S.name still works
      save();
      toast("Profile saved — certificate name updated", "rank");
      location.hash = "#/";
    });
  }

  /* ============================================================
     JOURNEY MAP
     ============================================================ */
  function renderMap(root) {
    const unlockId = S.justUnlocked; // one-shot golden unlock animation
    if (unlockId !== null) { S.justUnlocked = null; save(); }
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">The Journey</p>
      <h2>Thirteen chapters. One transformation.</h2>
      <p class="page-sub">Complete a chapter's slides and pass its quiz to unlock the next. ${progressPct()}% complete.</p>`));

    const path = el("div", "journey");
    CHAPTERS.forEach(ch => {
      const st = chState(ch.id);
      const unlocked = isUnlocked(ch);
      const done = isComplete(ch);
      const lock = retryLocked(ch);
      const badges = (st.badges || []).map(b => BADGES[b] ? BADGES[b].icon : "").join(" ");
      const label = !unlocked ? "Locked" : done ? "Complete" : lock > 0 ? "Reflection" : "In progress";
      const btn = !unlocked
        ? `<button class="btn-lock" disabled>Complete previous chapter</button>`
        : lock > 0
          ? `<button class="btn-ghost j-go" data-go="rev">Reflection · read-only review</button>`
          : `<button class="btn-ghost j-go" data-go="${ch.id}">${done ? "Review" : "Begin"}</button>`;
      const justOpened = unlocked && ch.id === unlockId && !done;
      const lockSvg = `<span class="lock-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g class="lock-body"><rect x="5" y="11" width="14" height="9" rx="2"/></g><g class="lock-shackle"><path d="M8 11V7a4 4 0 0 1 8 0v4"/></g></svg></span>`;
      const node = el("div", "j-node" + (done ? " done" : "") + (unlocked ? " open" : " locked") + (justOpened ? " just-unlocked" : ""), `
        <div class="j-dot">${done ? "✓" : unlocked ? `${lockSvg}<span class="j-num-bg">${ch.id}</span>` : `<span class="lock-ic dim" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>`}</div>
        <div class="j-card ${unlocked ? "" : "j-dim"}">
          <div class="j-top"><span class="j-num">Chapter ${fmt(ch.id)}</span><span class="j-status">${label}</span></div>
          <h3 class="gold-serif">${esc(ch.title)}</h3>
          <p class="j-focus">${esc(ch.focus)}</p>
          <div class="j-meta">
            <span>${ch.slides} slides</span>
            <span>${ch.quiz ? ch.quiz.length + " quiz Qs" : "quiz bank pending"}</span>
            <span class="j-time" title="Reading + quiz time">≈ ${fmtDur(chapterTotalMins(ch))}${ch.quiz ? ` <small>· +${fmtDur(quizMins(ch))} quiz</small>` : ""}</span>
            ${diffChip(ch)}
            ${st.quizBest !== null ? `<span class="j-best">best ${st.quizBest}%</span>` : ""}
            ${badges ? `<span class="j-best" title="Badges earned">${badges}</span>` : ""}
          </div>
          ${btn}
        </div>`);
      if (unlocked) node.querySelector(".j-go").addEventListener("click", () => location.hash = lock > 0 ? "#/review/" + ch.id : "#/lesson/" + ch.id);
      path.appendChild(node);
    });
    root.appendChild(path);
  }

  /* ============================================================
     LESSON PLAYER + QUIZ ENGINE
     ============================================================ */
  const session = { ch: null, idx: 0, quizIdx: 0, firstCorrect: 0, answered: {}, answeredCount: { n: 0, msSum: 0 }, prevSlide: null, slideShownAt: 0, qShownAt: 0, revision: false };

  function renderLesson(root, chId, startSlide, revision) {
    const ch = CHAPTERS.find(c => c.id === chId);
    if (!ch) { location.hash = "#/map"; return; }
    if (!isUnlocked(ch)) { toast("Finish the previous chapter to unlock " + ch.title, "warn"); location.hash = "#/map"; return; }
    const lock = retryLocked(ch);
    // Revision mode = read-only browsing during the reflection window (or any time)
    if (!revision) {
      // Fair Play: reflection lockout after a fail — no instant retakes
      if (lock > 0) {
        toast("Reflection period — review the chapter, retake unlocks in " + fmtLock(lock), "warn");
        location.hash = "#/map";
        return;
      }
      const st0 = chState(ch.id);
      if (ch.quiz && st0.lastScore != null && st0.lastScore < PASS_PCT && retriesLeft(ch) <= 0) {
        toast("Retake tokens exhausted — reach out to support for a review", "warn");
        location.hash = "#/map";
        return;
      }
    }

    session.revision = !!revision;
    session.ch = ch;
    const st = chState(ch.id);
    // revision always starts at slide 1 (read the material from the top)
    let idx = startSlide && !revision ? startSlide - 1 : 0;
    if (!startSlide && !revision) {
      if (st.viewed.length >= ch.slides && ch.quiz && !st.passed) {
        idx = ch.quizSlides[0] - 1; // slides done but quiz pending → resume at the quiz
      } else {
        for (let i = 0; i < ch.slides; i++) if (!st.viewed.includes(i + 1)) { idx = i; break; }
      }
    }
    session.idx = Math.min(idx, ch.slides - 1);
    session.quizIdx = 0;
    session.firstCorrect = 0;
    session.answered = {};
    session.answeredCount = { n: 0, msSum: 0 };

    // Fair Play: record that the student actually reviewed during reflection
    if (session.revision && ch.quiz && lock > 0) {
      st.reviewed = true;
      save();
    }

    root.appendChild(el("div", "lesson-top", `
      <button class="btn-ghost back" data-go="map">← Journey</button>
      <div class="lesson-title"><span class="j-num">Chapter ${fmt(ch.id)}</span><h3 class="gold-serif">${esc(ch.title)}</h3></div>
      <div class="lesson-progress"><div class="lesson-progress-fill"></div></div>
    `));
    root.querySelector(".back").addEventListener("click", () => location.hash = "#/map");

    const stage = el("div", "stage");
    root.appendChild(stage);
    drawSlide(stage);

    // live countdown + review-seconds tracking while in revision mode
    if (session.revision) {
      const st2 = chState(ch.id);
      clearInterval(session.revTicker);
      session.revTicker = setInterval(() => {
        st2.reviewSecs = (st2.reviewSecs || 0) + 1;
        save();
        const c = document.querySelector(".rev-count");
        if (c) {
          const left = Math.max(0, +c.dataset.end - Date.now());
          c.textContent = left > 0 ? fmtLock(left) : "unlocked";
          const banner = c.closest(".rev-banner");
          if (left <= 0 && banner) banner.classList.add("rev-unlocked");
          // the moment it unlocks, offer the retake right here
          const retakeBtn = banner && banner.querySelector(".rev-retake");
          if (left <= 0 && banner && !retakeBtn) {
            const b = el("button", "btn-gold rev-retake", "Take the quiz now");
            b.addEventListener("click", () => location.hash = "#/lesson/" + ch.id);
            banner.appendChild(b);
          }
        }
      }, 1000);
    }
  }

  function drawSlide(stage) {
    const ch = session.ch, st = chState(ch.id);
    const n = session.idx + 1;
    const rev = session.revision;
    if (!rev) {
      touch();
      // dwell tracking: record time spent on the previous slide
      if (session.prevSlide !== null && session.prevSlide !== n) {
        const ms = Date.now() - (session.slideShownAt || Date.now());
        if (ms > 400) { S.dwell.push({ ch: ch.id, n: session.prevSlide, ms: Math.min(ms, 600000) }); save(); }
      }
      session.prevSlide = n;
      session.slideShownAt = Date.now();
      if (!st.viewed.includes(n)) {
        st.viewed.push(n);
        addXp(XP_SLIDE);
        save();
      }
    }
    const pct = Math.round(n / ch.slides * 100);
    const fill = document.querySelector(".lesson-progress-fill");
    if (fill) fill.style.width = pct + "%";
    document.querySelector(".lesson-top .j-num").textContent = "Chapter " + fmt(ch.id);
    const titleEl = document.querySelector(".lesson-title h3");
    if (titleEl) titleEl.textContent = ch.title;

    const isQuizSlide = ch.quiz && ch.quizSlides.includes(n);
    const quizQ = isQuizSlide ? ch.quiz[ch.quizSlides.indexOf(n)] : null;
    if (quizQ && !rev) session.qShownAt = Date.now(); // start the response-time clock for this question
    const native = ch.native ? ch.native[n - 1] : null;
    const isPollSlide = native && native.kind === "poll";

    // track style engagement: a native card with a lens for the current style was read
    if (!rev && native && native.styles) {
      const k = styleKey();
      if (k && native.styles[k] && !S.styleSeen.includes(ch.id + ":" + n)) {
        S.styleSeen.push(ch.id + ":" + n);
        save();
      }
    }

    // Quiz slides show ONLY our quiz card — no Nearpod slide image on top.
    // In revision mode, quiz slides show a locked notice instead of the question.
    const frameHtml = native
      ? nativeCard(native)
      : isQuizSlide
        ? `<div class="stage-frame stage-quiz-blank"><div class="stage-count">${fmt(n)} / ${ch.slides}</div></div>`
        : `<div class="stage-frame">
          <div class="stage-shade"></div>
          <img src="${slidePath(ch.id, n)}" alt="Chapter ${ch.id} slide ${n}" class="slide-img" draggable="false" oncontextmenu="return false;">
          <div class="stage-wm">REALITY FX OS</div>
          <div class="stage-count">${fmt(n)} / ${ch.slides}</div>
        </div>`;

    const revisionNotice = rev && isQuizSlide
      ? `<div class="rev-locked"><span class="rev-locked-ic">${ICONS.lock}</span><div><b>Quiz locked during reflection</b><p>You're reviewing the material — the questions come after the window closes. Read slowly; this is where the pass is actually earned.</p></div></div>`
      : "";

    // gentle note-taking tip on slide 1 (once per chapter, dismissible — never a blocking popup)
    const noteTip = (!rev && n === 1 && !st.tipSeen)
      ? `<div class="note-tip">
          <span class="note-tip-ic">${ICONS.note}</span>
          <p><b>Trader's habit:</b> write one line per slide as you read. When reflection time comes, your notes are the fastest way back to the material — and the reflection window gives you read-only access to re-read everything anyway.</p>
          <button class="note-tip-x" title="Dismiss">✕</button>
        </div>`
      : "";

    stage.innerHTML = `
      ${rev ? revisionBanner(ch) : ""}
      ${noteTip}
      ${frameHtml}
      ${revisionNotice}
      ${quizQ && !rev ? quizCard(quizQ) : ""}
      <div class="stage-nav">
        <button class="btn-ghost" id="prev" ${n === 1 ? "disabled" : ""}>← Back</button>
        <button class="btn-gold" id="next">${rev ? (n >= ch.slides ? "Return to Journey" : "Next slide →") : (n >= ch.slides ? "Finish chapter" : "Next slide →")}</button>
      </div>`;
    if (noteTip) {
      const tip = stage.querySelector(".note-tip");
      tip.querySelector(".note-tip-x").addEventListener("click", () => {
        chState(ch.id).tipSeen = true;
        save();
        tip.remove();
      });
    }

    // allow prev even if quiz present
    document.getElementById("prev").addEventListener("click", () => { session.idx = Math.max(0, session.idx - 1); drawSlide(stage); });
    document.getElementById("next").addEventListener("click", () => {
      if (rev) { if (n >= ch.slides) location.hash = "#/map"; else { session.idx++; drawSlide(stage); } return; }
      if ((isQuizSlide && ch.quiz) || isPollSlide) {
        // must answer before moving on
        if (session.answered[n] === undefined) { toast("Answer to continue", "warn"); return; }
      }
      if (n >= ch.slides) finishChapter(stage);
      else { session.idx++; drawSlide(stage); }
    });
    // keyboard
    document.onkeydown = e => {
      if (e.key === "ArrowRight") document.getElementById("next") && document.getElementById("next").click();
      if (e.key === "ArrowLeft") document.getElementById("prev") && document.getElementById("prev").click();
    };
  }

  // read-only revision banner with a live countdown to retake unlock
  function revisionBanner(ch) {
    const lock = retryLocked(ch);
    const tokens = retriesLeft(ch);
    return `<div class="rev-banner">
      <span class="rev-banner-ic">${ICONS.book}</span>
      <div class="rev-banner-body">
        <p class="rev-banner-t">Reflection period · read-only review</p>
        <p class="rev-banner-sub">Quiz locked until the window closes — this is where the pass is earned. Retake unlocks in <b class="rev-count" data-end="${Date.now() + lock}">${fmtLock(lock)}</b> · ${tokens}/${MAX_RETRIES} tokens left.</p>
      </div>
      <button class="btn-ghost" id="revExit">← Journey</button>
    </div>`;
  }

  function nativeCard(native) {
    const n = session.idx + 1;
    const chosen = session.answered[n];
    let extra = "";
    if (native.kind === "poll" && !session.revision) {
      extra = `<div class="native-poll">
        ${native.options.map((o, i) =>
          `<button class="native-poll-opt ${chosen === i ? "sel" : ""}" data-i="${i}" ${chosen !== undefined ? "disabled" : ""}>${esc(o)}</button>`
        ).join("")}
        ${chosen !== undefined ? `<div class="quiz-fb good">Saved — this identity now shows on your dashboard and tailors your lessons.</div>` : ""}
      </div>`;
    } else if (native.kind === "pause") {
      // rendered in revision mode too — the study hall is exactly when notes matter most
      const pst = chState(session.ch.id);
      extra = `<div class="native-pause">
        <div class="pause-breathe">
          <div class="pause-ring"></div>
          <p class="pause-cue">Breathe in <b>4</b> · hold <b>4</b> · out <b>4</b></p>
        </div>
        <label class="pause-label" for="pause-note">Jot a thought from this chapter — optional</label>
        <textarea class="pause-note" id="pause-note" rows="3" placeholder="What stood out to you? What do you want to remember?">${esc(pst.reflect || "")}</textarea>
        <p class="pause-hint">Reflection is optional — continue whenever you're ready.</p>
      </div>`;
    }
    const isClose = native.kind === "close";
    return `
      <div class="native-card ${isClose ? "native-close" : ""}">
        ${isClose ? `<div class="native-close-ic">${ICONS.trophy}</div>` : ""}
        ${native.eyebrow ? `<p class="quiz-tag">${esc(native.eyebrow)}</p>` : ""}
        ${native.title ? `<h2 class="native-title gold-serif">${esc(native.title)}</h2>` : ""}
        ${native.lead ? `<p class="native-lead">${esc(native.lead)}</p>` : ""}
        ${native.sub ? `<p class="native-sub">${esc(native.sub)}</p>` : ""}
        ${(native.body || []).map(p => `<p class="native-body">${esc(p)}</p>`).join("")}
        ${native.fig ? `<div class="native-fig">${native.fig}</div>` : ""}
        ${(native.bullets || []).map(b => `<div class="native-bullet"><span class="nb-dot"></span><p>${esc(b)}</p></div>`).join("")}
        ${native.example ? `<div class="native-example">${esc(native.example)}</div>` : ""}
        ${native.callout ? `<div class="native-callout">“${esc(native.callout)}”</div>` : ""}
        ${native.insight ? `<div class="native-insight"><span class="ni-gem">${ICONS.sparkle}</span><p>${esc(native.insight)}</p></div>` : ""}
        ${styleNoteHtml(native)}
        ${extra}
      </div>`;
  }

  // adaptive learning: if the student chose a style and this card carries its lens, render it
  function styleNoteHtml(native) {
    const prof = styleProfile();
    const k = styleKey();
    if (!prof || !native.styles || !k || !native.styles[k]) return "";
    return `<div class="native-style">
      <span class="ns-badge">${ICONS.sparkle} Tailored for ${esc(prof.name)}s</span>
      <p>${esc(native.styles[k])}</p>
    </div>`;
  }

  function quizCard(q) {
    const n = session.idx + 1;
    const chosen = session.answered[n];
    let opts = q.options.map((o, i) => {
      let cls = "q-opt";
      let mark = "";
      if (chosen !== undefined) {
        if (i === q.answer) { cls += " right"; mark = "✓"; }
        else if (i === chosen) { cls += " wrong"; mark = "✗"; }
        else cls += " dim";
      }
      return `<button class="${cls}" data-i="${i}" ${chosen !== undefined ? "disabled" : ""}>${mark}<span>${esc(o)}</span></button>`;
    }).join("");
    return `
      <div class="quiz-card">
        <div class="quiz-tag">Checkpoint · slide ${n}</div>
        <p class="quiz-q">${esc(q.q)}</p>
        <div class="quiz-opts">${opts}</div>
        ${chosen !== undefined ? `<div class="quiz-fb ${chosen === q.answer ? "good" : "bad"}">${chosen === q.answer ? "Correct." : "Not quite."} ${esc(q.explain)}</div>` : ""}
      </div>`;
  }

  // delegate revision-mode exit button
  document.addEventListener("click", e => {
    if (e.target.closest("#revExit")) location.hash = "#/map";
  });

  // delegate native poll option clicks (trader identity)
  document.addEventListener("click", e => {
    const opt = e.target.closest(".native-poll-opt");
    if (!opt || opt.disabled || !session.ch || !session.ch.native) return;
    const n = session.idx + 1;
    if (session.answered[n] !== undefined) return;
    session.answered[n] = parseInt(opt.dataset.i, 10);
    S.traderStyle = session.ch.native[n - 1].options[session.answered[n]];
    touch(); save();
    toast("Identity saved — this can evolve", "rank");
    drawSlide(document.querySelector(".stage"));
  });

  // save optional reflection notes as the student types (pause points, debounced)
  let pauseSaveTimer = null;
  document.addEventListener("input", e => {
    const ta = e.target.closest(".pause-note");
    if (!ta || !session.ch) return;
    chState(session.ch.id).reflect = ta.value; // memory is always current; the clock + unload persist it too
    clearTimeout(pauseSaveTimer);
    pauseSaveTimer = setTimeout(save, 300);
  });

  // delegate quiz option clicks (stage is re-rendered each slide, so bind here)
  document.addEventListener("click", e => {
    const opt = e.target.closest(".q-opt");
    if (!opt || opt.disabled || !session.ch || !session.ch.quiz) return;
    const n = session.idx + 1;
    const ch = session.ch;
    const qi = ch.quizSlides.indexOf(n);
    if (qi < 0) return;
    const q = ch.quiz[qi];
    const pick = parseInt(opt.dataset.i, 10);
    if (session.answered[n] !== undefined) return;
    session.answered[n] = pick;
    const correct = pick === q.answer;
    // analytics: log the answer (topic, correctness, response time)
    const ms = Math.min(Math.max(Date.now() - (session.qShownAt || Date.now()), 300), 600000);
    session.answeredCount.n++;
    session.answeredCount.msSum += ms;
    if (correct) {
      session.firstCorrect++;
      const st = chState(ch.id);
      if (!st.earned.includes(qi)) { st.earned.push(qi); addXp(XP_CORRECT); } // XP once per question, ever
    }
    else { toast("Review the explanation — this is the lesson", "warn"); }
    const tag = (QUIZ_TAGS[ch.id] || {})[qi] || "General";
    S.log.push({ ch: ch.id, qi, tag, correct, ms, ts: Date.now() });
    if (S.log.length > 500) S.log = S.log.slice(-500);
    if (S.dwell.length > 500) S.dwell = S.dwell.slice(-500);
    // Per-chapter aggregate — survives the log's 500-entry cap so the
    // recommender can always see every chapter's true signal, even the first one.
    if (!S.chapStats) S.chapStats = {};
    const agg = S.chapStats[ch.id] || (S.chapStats[ch.id] = { n: 0, wrong: 0, slow: 0, msSum: 0 });
    agg.n++; agg.msSum += ms;
    if (!correct) agg.wrong++;
    if (ms > 60000) agg.slow++;

    // Fair Play heuristic: a correct answer in under 1.4s (below human reading speed).
    // Only the FIRST fast answer on a given question is flagged — no spam.
    if (correct && ms < 1400 && !S.flags.some(f => f.type === "fast" && f.ch === ch.id && f.qi === qi)) {
      S.flags.push({ type: "fast", ch: ch.id, qi, ms, ts: Date.now(), note: "Correct answer faster than reading speed — possible automated response." });
      if (S.flags.length > 200) S.flags = S.flags.slice(-200);
      flagsSync(); // report to the academy server for moderator review
    }
    touch(); save();
    drawSlide(document.querySelector(".stage"));
  });

  function finishChapter(stage) {
    const ch = session.ch, st = chState(ch.id);

    if (!ch.quiz) {
      // non-quiz chapters: slides explored + poll + continue
      stage.innerHTML = `
        <div class="finish-card">
          <div class="finish-ic">${ICONS.trophy}</div>
          <h2 class="gold-serif">${esc(ch.title)} — complete</h2>
          <p class="finish-score">Slides explored. The interactive quiz arrives with the answer-key pass.</p>
          ${pollBlock(st)}
          <button class="btn-gold" id="fin" data-n="1">Continue</button>
        </div>`;
      document.getElementById("fin").addEventListener("click", () => {
        st.done = true;
        addXp(XP_CHAPTER);
        save();
        const nxt = CHAPTERS.find(c => c.id === ch.id + 1);
        if (nxt && isUnlocked(nxt) && !isComplete(nxt)) S.justUnlocked = nxt.id;
        toast("Chapter complete! +" + XP_CHAPTER + " XP", "rank");
        location.hash = "#/map";
      });
      return;
    }

    // quiz chapters: compute + store the score, but keep it HIDDEN until self-assessment
    const total = ch.quiz.length;
    const score = Math.round(session.firstCorrect / total * 100);
    const passed = score >= PASS_PCT;
    const wasFailed = !st.passed && st.lastScore != null && st.lastScore < PASS_PCT;
    const hadPassed = st.passed;
    const prevBest = st.quizBest || null;
    st.lastScore = score;
    st.quizBest = Math.max(prevBest || 0, score);

    // Fair Play heuristic: a suspiciously perfect first attempt on a long quiz
    if (passed && score === 100 && total >= 5 && session.answeredCount && session.answeredCount.msSum < 5000) {
      S.flags.push({ type: "perfect-fast", ch: ch.id, score, msSum: session.answeredCount.msSum, n: session.answeredCount.n, ts: Date.now(), note: "100% in under 5s total — extremely unlikely for a human." });
      if (S.flags.length > 200) S.flags = S.flags.slice(-200);
      flagsSync(); // report to the academy server for moderator review
    }

    // Badges + retake bookkeeping
    const passedCount = CHAPTERS.filter(c => c.quiz && chState(c.id).passed).length;
    session.nudge = ""; // every attempt starts clean — never carry a nudge into a fail reveal
    session.fire = null; // ...and never a stale fire streak card either
    if (passed) {
      st.passed = true;
      // a pass proves the whole chapter — credit every slide so isComplete()
      // flips true and the next chapter unlocks (the layout-migration trim
      // otherwise leaves quiz slides out of `viewed` for first-time passers)
      st.viewed = Array.from({ length: ch.slides }, (_, i) => i + 1);
      addXp(XP_QUIZ_PASS);
      if (score === 100) { awardBadge(ch, "perfect"); addXp(50, "perfect-quiz"); }
      if (score >= 80) awardBadge(ch, "honours");
      if (hadPassed && prevBest !== null && prevBest < 90 && score >= 90) awardBadge(ch, "distinction");
      if (wasFailed || st.retries > 0) awardBadge(ch, "lion");
      if (passedCount === 0) awardBadge(ch, "first"); // first chapter ever passed
      st.failedAt = null; // reflection window clears on a pass
      // Flag the chapter this pass just opened so the Journey map can play
      // the golden unlock animation for it (consumed once, in renderMap).
      const nxt = CHAPTERS.find(c => c.id === ch.id + 1);
      if (nxt && isUnlocked(nxt) && !isComplete(nxt)) S.justUnlocked = nxt.id;
      // Recognition tier + near-miss: 80%+ is a distinction and gets celebrated,
      // not pushed — retake pressure is reserved for scores below the line.
      if (score >= 90 && score < 100) {
        session.nudge = `<div class="nudge-card"><span>💎</span><div><p class="nudge-t"><b>Outstanding — ${score}%!</b> We're proud of you.</p><p class="nudge-s">At 100% the <b>Flawless</b> badge — the rarest in the Academy — is yours. No pressure: this chapter is already a win.</p></div></div>`;
      } else if (score >= 80 && score < 90) {
        session.nudge = `<div class="nudge-card"><span>🎖️</span><div><p class="nudge-t"><b>Excellent — ${score}%!</b> Honours-level work, and we're proud of you.</p><p class="nudge-s">A 90%+ retake unlocks the <b>Distinction Hunter</b> badge and top-tier privileges — it's there if you ever want it.</p></div></div>`;
      } else if (score < 80) {
        const owned = st.badges || [];
        const cands = [];
        if (!owned.includes("honours")) cands.push({ icon: "🎖️", name: "Honours", need: 80 });
        if (!owned.includes("perfect")) cands.push({ icon: "💎", name: "Flawless", need: 100 });
        if (!owned.includes("distinction") && (hadPassed || st.retries > 0 || wasFailed)) cands.push({ icon: "🏆", name: "Distinction Hunter", need: 90 });
        if (cands.length) {
          const best = cands.reduce((a, b) => (b.need - score < a.need - score ? b : a));
          const gap = best.need - score;
          session.nudge = `<div class="nudge-card"><span>${best.icon}</span><div><p class="nudge-t">Just <b>${gap}% more</b> would earn you the <b>${best.name}</b> badge</p><p class="nudge-s">${gap <= 10 ? "You're one clean run away — the retake is free." : "Re-read the chapter and retake — fair play rewards the review."}</p></div></div>`;
        }
      }
    } else {
      st.failedAt = Date.now(); // each fail restarts the 2h reflection window
      // only a RETRY consumes a token — the first attempt is free
      if (wasFailed || (st.retries || 0) > 0) st.retries = (st.retries || 0) + 1;
      if (!st.firstFailAt) st.firstFailAt = Date.now();
    }

    // Fair Play heuristic: a RETRY taken with negligible review. The 2h
    // reflection window exists so a student actually studies the material
    // before re-sitting — a retake with <60s of review (or none at all)
    // is the classic brute-force pattern (memorise answers, never learn).
    // Only the first offence per chapter is flagged — no spam. A first
    // attempt is never a retake (firstFailAt unset → no flag).
    if (st.firstFailAt && (wasFailed || (st.retries || 0) > 0) && (st.reviewSecs || 0) < 60 && !S.flags.some(f => f.type === "retake-abuse" && f.ch === ch.id)) {
      S.flags.push({ type: "retake-abuse", ch: ch.id, qi: 0, ms: st.reviewSecs || 0, ts: Date.now(), note: "Retake with " + (st.reviewSecs || 0) + "s of review — the reflection window exists to study the material, not to brute-force the quiz." });
      if (S.flags.length > 200) S.flags = S.flags.slice(-200);
      flagsSync(); // report to the academy server for moderator review
    }

    // Distinction streak: consecutive chapters scored at 80%+ (counted once per chapter)
    if (score >= 80) {
      if (S.lastDistCh !== ch.id) { S.distStreak = (S.distStreak || 0) + 1; S.lastDistCh = ch.id; }
      if (S.distStreak > (S.distBest || 0)) S.distBest = S.distStreak;
      if (S.distStreak >= 2) session.fire = S.distStreak;
    } else {
      S.distStreak = 0;
      S.lastDistCh = null;
    }
    save();

    stage.innerHTML = `
      <div class="finish-card">
        <div class="finish-ic">${ICONS.trophy}</div>
        <h2 class="gold-serif">${esc(ch.title)} — slides complete</h2>
        <p class="finish-sub">One question before your score… rate yourself honestly, then we reveal reality.</p>
        ${pollBlock(st)}
        <div class="score-reveal" id="scoreReveal" hidden></div>
      </div>`;
  }

  function awardBadge(ch, key) {
    const st = chState(ch.id);
    if (st.badges.includes(key)) return;
    st.badges.push(key);
    save();
    const b = BADGES[key];
    toast(b ? "Badge earned: " + b.icon + " " + b.name : "Badge earned!", "rank");
  }

  function revealScore() {
    const ch = session.ch, st = chState(ch.id);
    const box = document.getElementById("scoreReveal");
    if (!box || !box.hidden) return; // already revealed (or no box)
    const score = st.lastScore;
    const passed = st.passed;
    const calib = calibrationText(st.poll, score);
    const newBadges = (st.badges || []).filter(b => BADGES[b]).slice(-2);
    const lock = retryLocked(ch);
    const tokens = retriesLeft(ch);
    const badgeRow = newBadges.length
      ? `<div class="reveal-badges">${newBadges.map(b => `<div class="badge-pill"><span>${BADGES[b].icon}</span><div><b>${BADGES[b].name}</b><p>${esc(BADGES[b].desc)}</p></div></div>`).join("")}</div>`
      : "";
    box.innerHTML = `
      <p class="quiz-tag">Your real score</p>
      <div class="reveal-score ${passed ? "pass" : "fail"}"><span id="scoreNum">0</span><small>%</small></div>
      <p class="finish-score ${passed ? "pass" : "fail"}">${passed ? "Passed — the next chapter is unlocked." : `Not yet — ${PASS_PCT}% to pass. Reflection time begins now.`}</p>
      ${badgeRow}
      ${session.nudge || ""}
      ${session.fire ? `<div class="fire-card"><span>🔥</span><div><p class="fire-t">You're on fire — ${session.fire} chapters in a row at 80%+</p><p class="fire-s">Consistency like this is how institutions are built. Keep the streak alive.</p></div></div>` : ""}
      ${!passed ? `<div class="reflect-card">
        <p><b>Reflection period</b> — your next attempt unlocks in <b>${fmtLock(lock)}</b>.</p>
        <p>Retake tokens left: <b>${tokens}/${MAX_RETRIES}</b>. Use the time to re-read the lesson and think about what the questions were really asking — then come back sharper. Honest review beats a rushed retake.</p>
      </div>` : ""}
      <div class="calib-card ${calib.cls}">${ICONS.sparkle}<p>${esc(calib.txt)}</p></div>
      <div class="reveal-actions">
        ${passed ? `<button class="btn-gold" id="fin" data-n="1">Claim XP & continue</button>` : `
        <button class="btn-gold" id="finRev">Review the chapter now</button>
        <button class="btn-ghost" id="finMap">Back to the Journey</button>`}
      </div>`;
    box.hidden = false;
    // Gold confetti celebration: any pass bursts, the FINAL chapter gets the
    // graduation-scale burst — and the certificate nav begins to glow.
    if (passed) {
      const isFinal = ch.id === CHAPTERS[CHAPTERS.length - 1].id;
      burstConfetti(isFinal ? 260 : 120);
      if (isFinal) updateCertNav();
    }
    animateCount(box.querySelector("#scoreNum"), score);
    const fin = box.querySelector("#fin");
    const finRev = box.querySelector("#finRev");
    const finMap = box.querySelector("#finMap");
    if (fin) fin.addEventListener("click", () => {
      st.done = true; addXp(XP_CHAPTER); save();
      toast("Chapter complete! +" + XP_CHAPTER + " XP", "rank");
      location.hash = "#/map";
    });
    if (finRev) finRev.addEventListener("click", () => {
      toast("Reflection review — read the material, the quiz waits", "rank");
      location.hash = "#/review/" + ch.id;
    });
    if (finMap) finMap.addEventListener("click", () => { location.hash = "#/map"; });
  }

  function calibrationText(pollIdx, score) {
    const ranges = [[80, 100], [60, 79], [40, 59], [20, 39], [0, 19]];
    const [lo, hi] = ranges[pollIdx] || [0, 100];
    if (score >= lo && score <= hi)
      return { cls: "aligned", txt: `Your self-assessment (${lo}–${hi}%) matches your real score (${score}%). That calibration is a trader's superpower — keep it.` };
    if (score > hi)
      return { cls: "humble", txt: `You scored ${score}% — higher than you rated yourself (${lo}–${hi}%). You're harder on yourself than reality. Confidence earned through data is the best kind.` };
    return { cls: "reality", txt: `Reality check: you rated yourself ${lo}–${hi}% but scored ${score}%. The gap between perception and results is where honesty pays. Review the explanations, then retake — sharper.` };
  }

  function animateCount(el, target) {
    let cur = 0;
    const step = Math.max(1, Math.round(target / 30));
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = cur;
    }, 26);
  }

  function pollBlock(st) {
    const opts = POLL_OPTIONS.map((o, i) =>
      `<button class="poll-opt" data-i="${i}"><span class="poll-pct">${o.pct}</span><span>${esc(o.label)}</span></button>`).join("");
    return `<div class="poll-card">
      <div class="quiz-tag">Reflect · self-assessment</div>
      <p class="quiz-q">How do you feel you performed in this chapter?</p>
      <div class="quiz-opts">${opts}</div>
    </div>`;
  }
  document.addEventListener("click", e => {
    const p = e.target.closest(".poll-opt");
    if (!p || !session.ch) return;
    const st = chState(session.ch.id);
    st.poll = parseInt(p.dataset.i, 10);
    save();
    toast("Honest self-assessment — that's how traders grow", "rank");
    p.parentElement.querySelectorAll(".poll-opt").forEach(b => b.classList.remove("sel"));
    p.classList.add("sel");
    // score-surprise: reveal the real score once the student rates themselves
    if (p.closest(".finish-card") && session.ch.quiz) revealScore();
  });

  /* ============================================================
     YOUR PATH — adaptive learning hub
     ============================================================ */
  function renderPath(root) {
    const prof = styleProfile() || STYLES.general;
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Your Path · adaptive learning</p>
      <h2>Your identity shapes what you read</h2>
      <p class="page-sub">Every style trades the same market differently. The OS weaves your style's lens into the lessons you open — so you learn each concept through the eyes of the trader you're becoming.</p>`));

    // Identity profile
    const profileCard = el("div", "tool-card path-profile");
    profileCard.innerHTML = `
      <div class="path-identity">
        <div class="style-card-ic big">${ICON(prof.icon)}</div>
        <div>
          <p class="quiz-tag">${S.traderStyle ? "Your current identity" : "Identity not chosen yet — showing Explorer"}</p>
          <h3 class="gold-serif">${esc(prof.name)}</h3>
          <p class="style-tagline">“${esc(prof.tagline)}”</p>
        </div>
      </div>
      <p class="path-profile-text">${esc(prof.profile)}</p>
      <div class="path-timeframe"><span>${ICON('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}</span><b>Timeframe:</b> ${esc(prof.timeframe)}</div>`;
    root.appendChild(profileCard);

    // Edge & traps
    const duo = el("div", "lab-grid");
    duo.appendChild(el("div", "tool-card", `
      <div class="tool-head"><span class="tool-ic">${ICONS.trophy}</span><div><h3>Your edge</h3><p class="tool-sub">What makes this style win</p></div></div>
      ${prof.edge.map(t => `<div class="out-row"><span>${esc(t)}</span></div>`).join("")}`));
    duo.appendChild(el("div", "tool-card", `
      <div class="tool-head"><span class="tool-ic">${ICONS.sparkle}</span><div><h3>Watch these</h3><p class="tool-sub">The traps that take this style down</p></div></div>
      ${prof.watch.map(t => `<div class="out-row"><span>${esc(t)}</span></div>`).join("")}`));
    root.appendChild(duo);

    // Personalized chapter guide
    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Chapters weighted for your path</h3>`));
    const guide = el("div", "grade-list");
    prof.chapters.forEach(c => {
      const ch = CHAPTERS.find(x => x.id === c.id);
      guide.appendChild(el("div", "grade-row guide-row", `
        <span class="grade-ch">${fmt(c.id)} · ${esc(ch ? ch.title : "")}</span>
        <span class="grade-why">${esc(c.why)}</span>
        <button class="btn-ghost guide-go" data-id="${c.id}">Open</button>`));
    });
    root.appendChild(guide);
    guide.querySelectorAll(".guide-go").forEach(b => b.addEventListener("click", () => {
      const id = +b.dataset.id;
      const ch = CHAPTERS.find(x => x.id === id);
      if (ch && isUnlocked(ch)) location.hash = "#/lesson/" + id;
      else toast("Complete the previous chapters to unlock this one", "warn");
    }));

    // Style engagement — proof of practice in the chosen style
    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Style engagement — practise your path</h3>
      <p class="panel-sub">Every “Tailored for you” card you read counts toward your ${esc(prof.name)} practice. Progress in a style is built in reps, not intentions.</p>`));
    const engCard = el("div", "eng-card");
    const k = styleKey();
    let avail = 0;
    CHAPTERS.forEach(c => (c.native || []).forEach(nv => { if (nv && nv.styles && k && nv.styles[k]) avail++; }));
    const seenCount = S.styleSeen.length;
    const engPct = avail ? Math.min(100, Math.round(seenCount / avail * 100)) : 0;
    engCard.innerHTML = `
      <div class="eng-top">
        <div class="eng-num"><strong>${seenCount}</strong><span>of ${avail} tailored cards read</span></div>
        <div class="eng-ring" style="--eng:${engPct * 3.6}deg"><span>${engPct}%</span></div>
      </div>
      <div class="eng-bar"><span style="width:${engPct}%"></span></div>
      <div class="eng-miles">
        ${[1, 3, 5, 7].map(m => {
          const got = seenCount >= m;
          const lbl = m === 1 ? "First Lens" : m === 3 ? "Style Student" : m === 5 ? "Style Practitioner" : "Style Master";
          return `<div class="eng-mile ${got ? "got" : ""}"><span class="eng-mile-ic">${got ? "✓" : "○"}</span><div><b>${lbl}</b><p>${m} tailored ${m === 1 ? "card" : "cards"}</p></div></div>`;
        }).join("")}
      </div>`;
    root.appendChild(engCard);

    // Change identity
    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Change your identity</h3>`));
    const pick = el("div", "style-pick");
    Object.keys(STYLES).filter(k => k !== "general").forEach(k => {
      const p = STYLES[k];
      const b = el("button", "style-pick-opt" + (styleKey() === k ? " sel" : ""), `
        <span class="sp-ic">${ICON(p.icon)}</span>
        <span class="sp-name">${esc(p.name)}</span>
        <span class="sp-tag">${esc(p.tagline)}</span>`);
      b.addEventListener("click", () => {
        S.traderStyle = p.name;
        save();
        toast("Identity updated — lessons now carry the " + p.name + " lens", "rank");
        root.innerHTML = "";
        renderPath(root);
      });
      pick.appendChild(b);
    });
    root.appendChild(pick);
    root.appendChild(el("div", "path-note", `${ICONS.sparkle}<span>Lessons you've already read stay as they are — every card marked “Tailored for you” carries the ${esc(prof.name)} lens from now on. Your analytics also speak your style's language.</span>`));
  }

  /* ============================================================
     PERFORMANCE / ANALYTICS
     ============================================================ */
  function renderProgress(root) {
    const graded = CHAPTERS.filter(c => c.quiz && chState(c.id).lastScore != null);
    const avgGrade = graded.length ? Math.round(graded.reduce((a, c) => a + (chState(c.id).lastScore || 0), 0) / graded.length) : null;
    const log = S.log || [];
    const dwell = S.dwell || [];
    const avgResp = log.length ? Math.round(log.reduce((a, r) => a + r.ms, 0) / log.length) : null;
    const avgDwell = dwell.length ? Math.round(dwell.reduce((a, r) => a + r.ms, 0) / dwell.length) : null;

    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Performance</p>
      <h2>Your Trading Analytics</h2>
      <p class="page-sub">Every answer you give is data. This is that data — turned into insight, so you improve on purpose, not by accident.</p>`));

    const statRow = el("div", "stat-grid");
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.trophy}</div>
      <div class="stat-v">${avgGrade !== null ? avgGrade + "%" : "—"}</div>
      <div class="stat-l">Average grade</div>`));
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.flame}</div>
      <div class="stat-v">${avgResp !== null ? fmtTime(avgResp) : "—"}</div>
      <div class="stat-l">Avg response / question</div>`));
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.book}</div>
      <div class="stat-v">${avgDwell !== null ? fmtTime(avgDwell) : "—"}</div>
      <div class="stat-l">Avg time / slide</div>`));
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.check}</div>
      <div class="stat-v">${log.length}</div>
      <div class="stat-l">Questions answered</div>`));
    root.appendChild(statRow);

    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Chapter grades</h3>`));
    const grades = el("div", "grade-list");
    CHAPTERS.forEach(c => {
      const st = chState(c.id);
      const has = c.quiz && st.lastScore != null;
      const pct = has ? st.lastScore : 0;
      grades.appendChild(el("div", "grade-row", `
        <span class="grade-ch">${fmt(c.id)} · ${esc(c.title)}</span>
        ${diffChip(c)}
        <div class="grade-track"><span class="grade-fill ${has && st.lastScore < PASS_PCT ? "low" : ""}" style="width:${has ? pct : 0}%"></span></div>
        <span class="grade-val">${has ? pct + "%" : "—"}</span>`));
    });
    root.appendChild(grades);

    // first-attempt-per-question only — retakes must not pollute the topic picture
    const firsts = new Map();
    log.forEach(r => { const k = r.ch + ":" + r.qi; if (!firsts.has(k)) firsts.set(k, r); });
    const wrong = {}, right = {};
    firsts.forEach(r => { (r.correct ? right : wrong)[r.tag] = ((r.correct ? right : wrong)[r.tag] || 0) + 1; });
    const weak = Object.entries(wrong).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const strong = Object.entries(right).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const topicRow = el("div", "lab-grid");
    topicRow.appendChild(el("div", "tool-card", `
      <div class="tool-head"><span class="tool-ic">${ICONS.sparkle}</span><div><h3>Areas to sharpen</h3><p class="tool-sub">Where your misses live</p></div></div>
      ${weak.length ? weak.map(([t, n]) => `<div class="out-row"><span>${esc(t)}</span><b>${n} missed</b></div>`).join("") : `<p class="dim">Answer some quiz questions and your weak spots will appear here.</p>`}`));
    topicRow.appendChild(el("div", "tool-card", `
      <div class="tool-head"><span class="tool-ic">${ICONS.trophy}</span><div><h3>Your strengths</h3><p class="tool-sub">Where you're consistently sharp</p></div></div>
      ${strong.length ? strong.map(([t, n]) => `<div class="out-row"><span>${esc(t)}</span><b>${n} correct</b></div>`).join("") : `<p class="dim">Your strong areas will appear here as you answer.</p>`}`));
    root.appendChild(topicRow);

    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Insight gems</h3>`));
    const gems = el("div", "insight-list");
    buildInsights({ avgGrade, avgResp, graded }).forEach(g => {
      gems.appendChild(el("div", "insight-item " + g.cls, `<span class="ins-ic">${ICONS.sparkle}</span><div><b>${esc(g.title)}</b><p>${esc(g.body)}</p></div>`));
    });
    root.appendChild(gems);
  }

  function fmtTime(ms) {
    if (ms >= 60000) return Math.round(ms / 6000) / 10 + " min";
    return Math.round(ms / 100) / 10 + "s";
  }

  /* ---------- Chapter difficulty (1 foundation → 3 brutal) ---------- */
  function diffOf(ch) { return ch.diff || 2; }
  function diffStars(ch) {
    const d = diffOf(ch);
    return "◆".repeat(d) + "◇".repeat(3 - d);
  }
  function diffLabel(ch) {
    return ["", "Foundation", "Demanding", "Brutal"][diffOf(ch)] || "Demanding";
  }
  function diffChip(ch) {
    return `<span class="diff-chip d${diffOf(ch)}" title="Difficulty: ${diffLabel(ch)}">${diffStars(ch)} ${diffLabel(ch)}</span>`;
  }

  function buildInsights({ avgGrade, avgResp, graded }) {
    const gems = [];
    if (graded.length === 0) {
      gems.push({ cls: "gold", title: "Your journey begins with data", body: "Complete Chapter 1 and answer its quiz — then your personal analytics light up. Every answer sharpens the picture." });
      return gems;
    }
    const prof = styleProfile();
    if (prof) {
      const next = prof.chapters[0];
      const nch = next ? CHAPTERS.find(c => c.id === next.id) : null;
      gems.push({ cls: "gold", title: "Your path: " + prof.name,
        body: `Lessons tagged “Tailored for you” now carry the ${prof.name} lens. Next on your path: ${nch ? nch.title : "keep exploring the journey"} — then the Laboratory to practise it.` });
    }
    if (avgGrade >= 85) gems.push({ cls: "gold", title: "Operating at institution level", body: `Your average grade is ${avgGrade}%. Consistency at this level is rare — protect it: same risk, same process, every day.` });
    else if (avgGrade >= PASS_PCT) gems.push({ cls: "gold", title: "You're passing — now push higher", body: `${avgGrade}% average. The fastest upgrade: revisit the explanations of every answer you missed. 85%+ is where the real edge lives.` });
    else gems.push({ cls: "warn", title: "Building phase — normal, and valuable", body: `${avgGrade}% average tells you exactly where to focus. Re-read the weak chapters below, then retake. Every retake is reps the market can't take from you.` });

    graded.filter(c => chState(c.id).lastScore < PASS_PCT).slice(0, 2).forEach(c => gems.push({
      cls: "warn", title: `Chapter ${c.id} — ${diffLabel(c)} (${diffStars(c)}) needs a second look`,
      body: diffSecondLook(c)
    }));
    graded.filter(c => chState(c.id).lastScore >= 85).slice(0, 2).forEach(c => gems.push({
      cls: "gold", title: `${c.title} — ${diffLabel(c)} mastered (${diffStars(c)})`,
      body: diffMastery(c)
    }));

    if (avgResp !== null && avgGrade !== null) {
      if (avgResp < 4000 && avgGrade < PASS_PCT)
        gems.push({ cls: "warn", title: "Slow down — speed is costing you", body: `Average response time ${fmtTime(avgResp)} with accuracy below the pass mark. Read each question twice; in the market, the fastest answer isn't the best one.` });
      else if (avgResp > 12000 && avgGrade >= PASS_PCT)
        gems.push({ cls: "gold", title: "Deliberate and accurate", body: `You take ${fmtTime(avgResp)} per question and it shows in your grades. As you grow, speed will come naturally — don't rush the process.` });
      else if (avgResp < 5000 && avgGrade >= 85)
        gems.push({ cls: "gold", title: "Fast and precise — the elite combo", body: `${fmtTime(avgResp)} average at ${avgGrade}% accuracy. That's how institutional traders think: quick, but never careless.` });
    }
    return gems;
  }

  // Difficulty-aware copy for the per-chapter insight gems.
  // Hard chapters never get false-hope lines — the gem must respect
  // how much genuine effort a real human needs to master them.
  function diffSecondLook(ch) {
    const d = diffOf(ch);
    const score = chState(ch.id).lastScore;
    if (d >= 3) {
      return `You scored ${score}% in ${ch.title} — and this is one of the hardest chapters in the course, so be honest about what that means. No quick retake will fix it: re-read the full lesson, practise it where the Laboratory offers a tool (like the Risk calculators), and let it settle before you try again. Master this one and every chapter after it feels lighter.`;
    }
    if (d === 1) {
      return `You scored ${score}% in ${ch.title}. This is a foundation chapter — the easiest material in the course — so a low score here usually means the lesson was skimmed rather than studied. Re-read it in full; every later chapter quietly builds on these words.`;
    }
    return `You scored ${score}% in ${ch.title}. This is a demanding chapter, but not the hardest — it rewards re-reading and practice, not luck. Go back through the lesson, then retake; the jump usually comes on the second honest pass.`;
  }
  function diffMastery(ch) {
    const d = diffOf(ch);
    const score = chState(ch.id).lastScore;
    if (d >= 3) {
      return `${score}% in ${ch.title} — one of the hardest chapters in the course. This is a genuine milestone, not a checkbox. Most traders never get here; keep the exact process you used, because this is what institution-level discipline looks like.`;
    }
    if (d === 1) {
      return `${score}% in ${ch.title} — a clean pass on a foundation chapter. Well done, but be honest: the real tests are still ahead. Keep the process tight and it will carry you through.`;
    }
    return `${score}% in ${ch.title} — a strong result on a demanding chapter. Keep the exact process you used there and apply it to the next one.`;
  }

  /* ============================================================
     FAIR PLAY — Moderator Console
     ============================================================ */
  function renderMod(root) {
    const flags = S.flags || [];
    const log = S.log || [];
    const retakes = CHAPTERS.filter(c => c.quiz && (chState(c.id).retries > 0 || chState(c.id).reviewed)).map(c => ({ id: c.id, title: c.title, retries: chState(c.id).retries, lastScore: chState(c.id).lastScore, passed: chState(c.id).passed, failedAt: chState(c.id).failedAt, badges: chState(c.id).badges, reviewed: chState(c.id).reviewed, reviewSecs: chState(c.id).reviewSecs || 0 }));
    const fastFlags = flags.filter(f => f.type === "fast").length;
    const pfFlags = flags.filter(f => f.type === "perfect-fast").length;

    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Fair Play · moderator console</p>
      <h2>Integrity Monitoring</h2>
      <p class="page-sub">Reality FX takes fair assessment seriously. The system records response times and retake behaviour and flags patterns a human would find suspicious — then a moderator (you) decides. Flags are review triggers, never verdicts.</p>`));

    const statRow = el("div", "stat-grid");
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.sparkle}</div>
      <div class="stat-v">${flags.length}</div>
      <div class="stat-l">Total flags</div>`));
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.flame}</div>
      <div class="stat-v">${fastFlags}</div>
      <div class="stat-l">Fast answers (<1.4s)</div>`));
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.check}</div>
      <div class="stat-v">${pfFlags}</div>
      <div class="stat-l">Suspicious perfect scores</div>`));
    statRow.appendChild(el("div", "stat-card", `
      <div class="stat-ic">${ICONS.robot}</div>
      <div class="stat-v">${retakes.length}</div>
      <div class="stat-l">Chapters with retakes</div>`));
    root.appendChild(statRow);

    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Flags needing review</h3>`));
    const flagList = el("div", "grade-list");
    if (!flags.length) flagList.appendChild(el("p", "dim mod-empty", "No flags recorded on this device. In Phase 2, flags from all enrolled students sync here automatically."));
    flags.slice().reverse().slice(0, 15).forEach(f => {
      flagList.appendChild(el("div", "grade-row", `
        <span class="grade-ch">${fmt(f.ts ? new Date(f.ts).getHours() : 0)}:${String(f.ts ? new Date(f.ts).getMinutes() : 0).padStart(2, "0")} · ${f.type}</span>
        <span class="grade-why">${esc(f.note)}${f.ch ? ` (Chapter ${f.ch}${f.ms ? ", " + f.ms + "ms" : ""})` : ""}</span>`));
    });
    root.appendChild(flagList);

    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Retake history</h3>`));
    const rt = el("div", "grade-list");
    if (!retakes.length) rt.appendChild(el("p", "dim mod-empty", "No retakes yet — clean first attempts."));
    retakes.forEach(r => rt.appendChild(el("div", "grade-row", `
      <span class="grade-ch">${fmt(r.id)} · ${esc(r.title)}</span>
      <span class="grade-why">${r.retries} retake${r.retries > 1 ? "s" : ""} · last score ${r.lastScore}%${r.passed ? " · passed" : " · failed"} · review: ${r.reviewed ? "✓ " + fmtTime(r.reviewSecs * 1000) : "✗ none"} · badges: ${(r.badges || []).map(b => BADGES[b] ? BADGES[b].icon : b).join(" ") || "none"}</span>`)));
    root.appendChild(rt);

    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Recent quiz activity (response-time audit)</h3>`));
    const tl = el("div", "grade-list");
    if (!log.length) tl.appendChild(el("p", "dim mod-empty", "Answer the quiz to populate the audit trail."));
    log.slice().reverse().slice(0, 20).forEach(r => tl.appendChild(el("div", "grade-row", `
      <span class="grade-ch">${fmt(r.ch)} · ${esc(r.tag)}</span>
      <span class="grade-why">${r.correct ? "correct" : "wrong"} in ${r.ms}ms</span>`)));
    root.appendChild(tl);

    // Export for the moderator
    const exportBtn = el("button", "btn-gold", "Export full report (JSON)");
    exportBtn.addEventListener("click", () => {
      const payload = { exported: new Date().toISOString(), secs: S.secs, flags, log, dwell: S.dwell, retakes, chapters: CHAPTERS.filter(c => c.quiz).map(c => ({ id: c.id, title: c.title, state: chState(c.id) })) };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "rfx-fairplay-report.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Report exported", "rank");
    });
    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">For the moderator</h3><p class="panel-sub">Download the full audit trail — flags, quiz timelines, dwell times and retake history — for review or archiving. On this build the data is device-local; Phase 2 accounts sync every student's record to the academy server.</p>`));
    root.querySelector(".panel:last-of-type").appendChild(exportBtn);
  }

  /* ============================================================
     LABORATORY — Risk Calculator
     ============================================================ */
  function renderLab(root) {
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Laboratory</p>
      <h2>The Risk Laboratory</h2>
      <p class="page-sub">Practise the exact formulas from Chapter 7 — position sizing, R-multiples, and drawdown recovery. No real money required. This is where theory becomes instinct.</p>`));
    const grid = el("div", "lab-grid");
    grid.appendChild(labPositionSizer());
    grid.appendChild(labRRPlanner());
    grid.appendChild(labOutcomeR());
    grid.appendChild(labDrawdown());
    grid.appendChild(labCircuitBreaker());
    root.appendChild(grid);
    root.appendChild(el("p", "lab-note", "Pip values vary by pair — EUR/USD ≈ $10 per standard lot, USD/JPY and others differ. Always confirm with your broker."));
  }

  function labPositionSizer() {
    const c = el("div", "tool-card");
    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">⚖️</span><div><h3>Position Sizer</h3><p class="tool-sub">Net Liquidation × %Risk ÷ (Stop × $/pip)</p></div></div>
      <div class="tool-in">
        <label>Account balance ($)<input type="number" id="ps-bal" value="1000" min="0" step="50"></label>
        <label>Risk per trade (%)<input type="number" id="ps-risk" value="1" min="0" max="100" step="0.1"></label>
        <label>Stop loss (pips)<input type="number" id="ps-stop" value="20" min="0" step="1"></label>
        <label>Pip value / std lot ($)<input type="number" id="ps-pip" value="10" min="0" step="0.1"><span class="tool-hint">EUR/USD ≈ $10 · $0.10/micro lot = $10/std lot</span></label>
      </div>
      <div class="tool-result" id="ps-result"><span class="dim">Enter your numbers — the answer updates live</span></div>`;
    const upd = () => {
      const b = Math.max(0, +c.querySelector("#ps-bal").value || 0);
      const r = Math.min(100, Math.max(0, +c.querySelector("#ps-risk").value || 0));
      const s = Math.max(0, +c.querySelector("#ps-stop").value || 0);
      const p = Math.max(0, +c.querySelector("#ps-pip").value || 0);
      const risk$ = b * r / 100;
      const lots = (s > 0 && p > 0) ? risk$ / (s * p) : 0;
      const res = c.querySelector("#ps-result");
      if (!risk$ || !lots) { res.innerHTML = "<span class='dim'>Enter your numbers above</span>"; return; }
      res.innerHTML = `
        <div class="out-big">$${risk$.toFixed(2)} <small>USD at risk</small></div>
        <div class="out-row"><span>Standard lots</span><b>${lots.toFixed(2)}</b></div>
        <div class="out-row"><span>Mini lots</span><b>${(lots * 10).toFixed(1)}</b></div>
        <div class="out-row"><span>Micro lots (contracts)</span><b>${Math.round(lots * 100)}</b></div>`;
    };
    c.querySelectorAll("input").forEach(i => i.addEventListener("input", upd));
    upd();
    return c;
  }

  function labRRPlanner() {
    const c = el("div", "tool-card");
    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.target}</span><div><h3>R:R Planner</h3><p class="tool-sub">How many R is your target worth?</p></div></div>
      <div class="tool-in">
        <label>Entry price<input type="number" id="rr-entry" value="1.1000" step="0.0001"></label>
        <label>Stop loss<input type="number" id="rr-stop" value="1.0900" step="0.0001"></label>
        <label>Take profit<input type="number" id="rr-target" value="1.1300" step="0.0001"></label>
        <label>Direction<select id="rr-side"><option value="long">Long (buy)</option><option value="short">Short (sell)</option></select></label>
      </div>
      <div class="tool-result" id="rr-result"><span class="dim">Enter your prices — the answer updates live</span></div>`;
    const upd = () => {
      const e = Math.max(0, +c.querySelector("#rr-entry").value || 0);
      const s = Math.max(0, +c.querySelector("#rr-stop").value || 0);
      const t = Math.max(0, +c.querySelector("#rr-target").value || 0);
      const side = c.querySelector("#rr-side").value;
      const R = Math.abs(e - s);
      const rr = R > 0 ? Math.abs(t - e) / R : 0;
      const res = c.querySelector("#rr-result");
      if (!R || !e || !t) { res.innerHTML = "<span class='dim'>Enter your prices above</span>"; return; }
      const good = side === "long" ? t > e : t < e;
      res.innerHTML = `
        <div class="out-big ${good ? "" : "warn"}">1 : ${rr.toFixed(2)} <small>reward to risk</small></div>
        <div class="out-row"><span>1R distance</span><b>${R.toFixed(4)}</b></div>
        ${good ? "" : "<div class='warn-note'>Target sits on the wrong side of entry — flip direction or move the target.</div>"}`;
    };
    c.querySelectorAll("input").forEach(i => i.addEventListener("input", upd));
    c.querySelector("#rr-side").addEventListener("change", upd);
    upd();
    return c;
  }

  function labOutcomeR() {
    const c = el("div", "tool-card");
    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.chart}</span><div><h3>Trade Outcome → R</h3><p class="tool-sub">Measure the trade in R, not money</p></div></div>
      <div class="tool-in">
        <label>Entry price<input type="number" id="ro-entry" value="1.1000" step="0.0001"></label>
        <label>Exit price<input type="number" id="ro-exit" value="1.1200" step="0.0001"></label>
        <label>Stop loss<input type="number" id="ro-stop" value="1.0900" step="0.0001"></label>
        <label>Direction<select id="ro-side"><option value="long">Long (buy)</option><option value="short">Short (sell)</option></select></label>
      </div>
      <div class="tool-result" id="ro-result"><span class="dim">Enter your prices — the answer updates live</span></div>`;
    const upd = () => {
      const e = Math.max(0, +c.querySelector("#ro-entry").value || 0);
      const x = Math.max(0, +c.querySelector("#ro-exit").value || 0);
      const s = Math.max(0, +c.querySelector("#ro-stop").value || 0);
      const side = c.querySelector("#ro-side").value;
      const R = Math.abs(e - s);
      const res = c.querySelector("#ro-result");
      if (!R || !e || !x) { res.innerHTML = "<span class='dim'>Enter your prices above</span>"; return; }
      const move = side === "long" ? x - e : e - x;
      const r = move / R;
      const cls = r > 0 ? "good" : r < 0 ? "warn" : "";
      const tag = r >= 1 ? "excellent" : r > 0 ? "profit" : "loss";
      res.innerHTML = `
        <div class="out-big ${cls}">${r >= 0 ? "+" : ""}${r.toFixed(2)}R <small>${tag}</small></div>
        <div class="out-row"><span>1R distance</span><b>${R.toFixed(4)}</b></div>
        ${r < 0 ? "<div class='warn-note'>In plan, inside rules — a loss of ≤1R is a perfectly managed trade.</div>" : ""}`;
    };
    c.querySelectorAll("input").forEach(i => i.addEventListener("input", upd));
    c.querySelector("#ro-side").addEventListener("change", upd);
    upd();
    return c;
  }

  // The Drawdown Journey — Chapter 7's recovery math, felt instead of read.
  // You start at $10,000 and the market turns. Every trade is a hold-or-cut
  // decision; the deeper you go, the louder the inner voice gets, and if you
  // ride it past 50% the broker liquidates you — with fireworks. The aftermath
  // shows the asymmetric ladder (a 30% loss needs +43% back) on a slider you
  // can drag to see what early cuts would have cost.
  const DD_START = 10000; // demo account
  const DD_TRADES = [
    { r: 1,   note: "Long EUR/USD. The pair turns against you — a clean -1R." },
    { r: 1.5, note: "You hold. It breaks the support level you trusted. -1.5R." },
    { r: 2,   note: "You average down to 'fix your average'. -2R." },
    { r: 2.5, note: "A rate decision lands against you. -2.5R." },
    { r: 5,   note: "Down 10% now. You double the size to win it back. -5R." },
    { r: 6,   note: "The market keeps sliding. You keep holding. -6R." },
    { r: 8,   note: "Margin call territory. You wire in more money. -8R." },
    { r: 12,  note: "Forced liquidation looms. You're frozen at the screen. -12R." },
    { r: 14,  note: "They liquidate the losing positions at the worst prices. -14R." }
  ];
  const DD_VOICES = [
    { d: 0.05, v: "It'll come back. It always comes back." },
    { d: 0.10, v: "Okay. Okay. This is fine. The trend will resume." },
    { d: 0.15, v: "I can't cut now — I'd have to explain this to my partner." },
    { d: 0.20, v: "One big trade. One big trade fixes everything." },
    { d: 0.30, v: "The broker's notice: margin call at $7,000. I'm at $6,900." },
    { d: 0.40, v: "I'm not looking at the account anymore. I can't." },
    { d: 0.50, v: "I need +100% just to break even. This can't be real." },
    { d: 0.51, v: "💥 THEY'RE LIQUIDATING. EVERYTHING IS GOING." } // fires on the last trade (depth 0.52) before the blow-up banner
  ];
  function ddDepthLabel(d) {
    const pct = Math.round(d * 100);
    return pct <= 10 ? "a bump" : pct <= 20 ? "a real drawdown" : pct <= 35 ? "deep trouble" : "the abyss";
  }
  function labDrawdown() {
    const c = el("div", "tool-card span2");
    let bal = DD_START, depth = 0, idx = 0, dead = false, voicesShown = 0;
    const hist = [DD_START];

    const draw = () => {
      const pts = hist.map((b, i) => (i / Math.max(1, hist.length - 1)) * 100 + "," + (40 - (b / DD_START) * 38).toFixed(1)).join(" ");
      c.querySelector("#dd-eq").setAttribute("points", pts);
    };
    const balEl = () => c.querySelector("#dd-bal");
    const deepEl = () => c.querySelector("#dd-deep");
    const flash = () => { const b = balEl(); b.classList.remove("flash"); void b.offsetWidth; b.classList.add("flash"); };
    const pushVoice = () => {
      while (voicesShown < DD_VOICES.length && depth >= DD_VOICES[voicesShown].d) {
        c.querySelector("#dd-log").insertAdjacentHTML("beforeend",
          `<div class="dd-voice">💭 “${esc(DD_VOICES[voicesShown].v)}”</div>`);
        voicesShown++;
      }
    };
    const updBal = () => {
      balEl().textContent = "$" + bal.toLocaleString("en-US", { minimumFractionDigits: 0 });
      deepEl().textContent = "-" + Math.round(depth * 100) + "%";
      deepEl().classList.toggle("warn", depth >= 0.3);
    };

    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">🕳️</span><div><h3>Drawdown Journey</h3><p class="tool-sub">Hold, cut, or get liquidated — feel what drawdown actually does</p></div></div>
      <div class="dd-board">
        <div class="dd-bals">
          <div class="dd-bal-cell"><p class="dd-lbl">Account balance</p><p class="dd-bal" id="dd-bal">$10,000</p></div>
          <div class="dd-bal-cell"><p class="dd-lbl">Drawdown</p><p class="dd-deep" id="dd-deep">-0%</p></div>
          <div class="dd-bal-cell"><p class="dd-lbl">To recover</p><p class="dd-rec" id="dd-rec">+0%</p></div>
        </div>
        <svg class="dd-eq" id="dd-eq" viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points="0,2 100,2"/></svg>
      </div>
      <div class="cb-stage" id="dd-stage">
        <p class="cb-prompt">You're sitting on a green streak — the account just crossed <b>$10,000</b>. Then the market turns. You take a long that starts bleeding, and with it comes the oldest question in trading: <b>do you hold, or do you cut?</b> Every trade below is a real decision. The deeper you go, the harder it gets to leave.</p>
        <div class="cb-btns"><button class="btn-gold sm" id="dd-start">Take the first trade</button></div>
      </div>
      <div class="cb-log" id="dd-log"></div>`;

    const $ = id => c.querySelector(id);
    const R = DD_START / 100; // 1R = 1% of the account = $100

    function takeTrade() {
      const t = DD_TRADES[idx];
      idx++;
      const lost = t.r * R;
      bal -= lost;
      depth = (DD_START - bal) / DD_START;
      hist.push(bal);
      c.querySelector("#dd-log").insertAdjacentHTML("beforeend",
        `<div class="cb-row cb-loss"><b>-${t.r}R</b><p>${esc(t.note)}</p></div>`);
      updBal(); flash(); draw(); pushVoice();
      c.querySelector("#dd-rec").textContent = "+" + (depth / (1 - depth) * 100).toFixed(1) + "%";
      if (depth >= 0.5) { blowUp(); return; } // crossed the line — the broker acts
      if (idx >= DD_TRADES.length) { endSession(false); return; }
      stageButtons(t);
    }

    function stageButtons(t) {
      const stage = $("#dd-stage");
      stage.innerHTML = `
        <div class="dd-trade"><b>TRADE ${idx} · ${ddDepthLabel(depth)}</b><p>${esc(t.note)}</p></div>
        <div class="cb-btns">
          <button class="btn-gold sm" id="dd-hold">Hold the position</button>
          <button class="btn-ghost sm" id="dd-cut">Cut now — take the loss</button>
        </div>`;
      stage.querySelector("#dd-hold").addEventListener("click", takeTrade);
      stage.querySelector("#dd-cut").addEventListener("click", () => endSession(true));
    }

    function blowUp() {
      dead = true;
      const stage = $("#dd-stage");
      const banner = `<div class="dd-blow"><b>💥 MARGIN CALL — FORCED LIQUIDATION</b><p>The broker closes your positions at the worst possible prices. The account you built over months is gone in an afternoon — this is what holding past -50% looks like.</p></div>`;
      c.querySelector("#dd-log").insertAdjacentHTML("beforeend", `<div class="dd-voice danger">💀 The account has been liquidated. From here, recovery is measured in years, not weeks.</div>`);
      burstFrom(c); // red explosion + shake from the tool card itself
      aftermath(stage, banner); // keep the explosion banner above the ladder
    }

    function endSession(cut) {
      if (dead) return;
      const stage = $("#dd-stage");
      if (cut) {
        stage.innerHTML = `<div class="dd-good"><b>${ICONS.shield} YOU CUT — the loss is accepted</b><p>It stings — every cut does. But the account is still yours, and the climb back is a plan, not a miracle.</p></div>`;
        c.querySelector("#dd-log").insertAdjacentHTML("beforeend", `<div class="dd-voice ok">You stopped the bleed. This is the moment most blown accounts never reached.</div>`);
      } else {
        stage.innerHTML = `<div class="dd-good"><b>🏁 THE DESCENT ENDS</b><p>You took every trade the market offered. The account is bruised but alive — barely.</p></div>`;
      }
      aftermath(stage);
    }

    function aftermath(stage, banner) {
      const need = depth / (1 - depth) * 100;
      const verdict = dead
        ? "From -" + Math.round(depth * 100) + "%, the account needed +" + need.toFixed(0) + "% just to break even. Most accounts that see this number never see their old balance again. The cut was always the cheaper trade — you just couldn't see it from inside the position."
        : depth <= 0.1
          ? "An early cut: -" + Math.round(depth * 100) + "% needs +" + need.toFixed(1) + "% back. Painful but humanly possible — this is the professional's exit."
          : depth <= 0.2
            ? "-" + Math.round(depth * 100) + "% needs +" + need.toFixed(1) + "%. Notice how the required gain is already outpacing the loss — the asymmetry is starting to bite."
            : depth <= 0.35
              ? "-" + Math.round(depth * 100) + "% needs +" + need.toFixed(1) + "%. This is where recovery gets cruel — and why cutting at -10% is a discipline, not a luxury."
              : "-" + Math.round(depth * 100) + "% needs +" + need.toFixed(1) + "%. From this depth, most accounts never come back. The only way out was the door you walked past earlier.";
      stage.innerHTML = (banner || "") + `
        <div class="dd-after ${dead ? "bad" : ""}">
          <b>${dead ? "💀 The account didn't survive" : "🧮 The recovery ladder"}</b>
          <div class="dd-ladder">
            <div class="dd-lrung"><span>You're at</span><b>$${bal.toLocaleString()}</b></div>
            <div class="dd-lrung"><span>Back to $10,000</span><b class="gold">+${need.toFixed(1)}%</b></div>
          </div>
          <p class="dd-verdict">${esc(verdict)}</p>
          <div class="dd-slider">
            <label>What if you'd cut at <b id="dd-sv">-${Math.round(depth * 100)}%</b>?<input type="range" id="dd-sl" min="5" max="75" step="5" value="${Math.max(5, Math.min(75, Math.round(depth * 100)))}"></label>
            <p id="dd-so"></p>
          </div>
          <button class="btn-gold sm" id="dd-again">Run the drawdown again</button>
        </div>`;
      const sl = stage.querySelector("#dd-sl");
      const so = stage.querySelector("#dd-so");
      const sv = stage.querySelector("#dd-sv");
      const upd = () => {
        const d = +sl.value / 100;
        sv.textContent = "-" + sl.value + "%";
        so.innerHTML = `A ${sl.value}% cut needs <b>+${(d / (1 - d) * 100).toFixed(1)}%</b> to recover — ${d <= 0.2 ? "a hard week, not a miracle." : d <= 0.35 ? "a long grind, and that's if nothing else goes wrong." : "a mountain. This is why the cut is the trade."}`;
      };
      sl.addEventListener("input", upd);
      upd();
      stage.querySelector("#dd-again").addEventListener("click", () => {
        bal = DD_START; depth = 0; idx = 0; dead = false; voicesShown = 0; hist.length = 0; hist.push(DD_START);
        c.querySelector("#dd-log").innerHTML = "";
        updBal(); draw();
        c.querySelector("#dd-rec").textContent = "+0%";
        stage.innerHTML = `<p class="cb-prompt">Same market, same $10,000, same turning tide. Last time you learned what drawdown costs. This time, hold or cut — the choice is fully yours.</p><div class="cb-btns"><button class="btn-gold sm" id="dd-start">Take the first trade</button></div>`;
        stage.querySelector("#dd-start").addEventListener("click", () => { takeTrade(); });
      });
    }

    $("#dd-start").addEventListener("click", takeTrade);
    draw();
    return c;
  }

  // The 3-Loss Circuit Breaker — Chapter 6's rule, felt inside the Laboratory.
  // Now a full experiment rig: the student sets their risk % (which sets 1R in
  // dollars) and their breaker threshold (2/3/4 losses), watches the equity
  // curve draw itself trade by trade, and reads their own tilt meter as it
  // climbs. Every session tallies into a persisted discipline record.
  let CB_ACCOUNT = 1000; // demo account size — the student picks it, risk % scales with it
  const CB_DECK = [
    { r: -1,   note: "Price swept your stop — a clean, normal -1R loss." },
    { r: -1,   note: "Second loss. The same level failed twice." },
    { r: 1.5,  note: "Winner. The plan worked exactly — +1.5R." },
    { r: -1,   note: "Third loss. This is where the breaker trips." },
    { r: -2,   tilt: true, note: "Revenge trade — doubled size to win it back. -2R." },
    { r: 1,    tilt: true, note: "You clawed one back. The temptation feels validated…" },
    { r: -1.5, tilt: true, note: "Revenge again — late entry, wider stop. -1.5R." },
    { r: -2,   tilt: true, note: "Chasing a session that's already gone. -2R." },
    { r: 0.5,  tilt: true, note: "A scraped win. The account is still bleeding." },
    { r: -2.5, tilt: true, note: "The killer trade. It's now late, and you're deep. -2.5R." },
    { r: -1,   tilt: true, note: "One more for 'closure'… -1R. The day is wrecked." }
  ];
  function labCircuitBreaker() {
    const c = el("div", "tool-card");
    CB_ACCOUNT = 1000; // fresh render — the select always defaults to $1,000; readControls() resyncs below
    let risk = 1, T = 3, R = 10;
    let idx = 0, losses = 0, total = 0, tilt = false, over = false, started = false, tripped = false, tripTotal = 0;
    const equity = [CB_ACCOUNT]; // balance after each trade — drawn as the curve
    if (!S.labCB) S.labCB = { runs: 0, held: 0, chased: 0 }; // persisted discipline record
    const tally = S.labCB;

    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.zap}</span><div><h3>Circuit Breaker Experiment</h3><p class="tool-sub">Set your risk and your breaker — then feel what breaking it costs</p></div></div>
      <div class="cb-ctl">
        <label>Risk per trade
          <select id="cb-risk">${["0.5", "1", "2", "3"].map(v => `<option value="${v}" ${v === "1" ? "selected" : ""}>${v}%</option>`).join("")}</select>
          <span class="tool-hint">1R on $1,000 = $${(1000 * 0.01).toFixed(0)}</span>
        </label>
        <label>Breaker at
          <select id="cb-t">${[2, 3, 4].map(v => `<option value="${v}" ${v === 3 ? "selected" : ""}>${v} losses</option>`).join("")}</select>
          <span class="tool-hint">Professionals stop here — no exceptions</span>
        </label>
        <label>Account
          <select id="cb-acc"><option value="1000" selected>$1,000</option><option value="5000">$5,000</option><option value="10000">$10,000</option></select>
          <span class="tool-hint">Demo size — risk % scales with it</span>
        </label>
      </div>
      <div class="cb-status">
        <span>Trade <b id="cb-idx">0</b> / ${CB_DECK.length}</span>
        <span>Losses <b id="cb-losses">0 / ${T}</b></span>
        <span>Session <b id="cb-total">+$0.00</b></span>
      </div>
      <div class="cb-equity">
        <p class="cb-eq-lbl">Your account, trade by trade</p>
        <svg class="cb-eq" id="cb-eq" viewBox="0 0 100 44" preserveAspectRatio="none"><polyline points="0,44 100,44"/></svg>
      </div>
      <div class="cb-meter">
        <div class="cb-meter-head"><span>Tilt meter — your emotional state, measured in R</span><b id="cb-tilt-v">Composed</b></div>
        <div class="cb-meter-bar"><span id="cb-tilt-fill" style="width:0%"></span></div>
      </div>
      <div class="cb-stage" id="cb-stage">
        <p class="cb-prompt">A fresh session opens on a <b>$${CB_ACCOUNT.toLocaleString()}</b> demo account. You've marked your setup and your 1R stop is placed — risk set at <b>${risk}%</b>, breaker at <b>${T} losses</b>. Take the trade.</p>
        <div class="cb-btns">
          <button class="btn-gold sm" id="cb-take">Take the trade</button>
          <button class="btn-ghost sm" id="cb-stop" disabled>Stop for the day</button>
        </div>
      </div>
      <div class="cb-log" id="cb-log"></div>
      <div class="cb-tally" id="cb-tally"></div>`;

    const $ = id => c.querySelector(id);
    const fmt = r => (r >= 0 ? "+" : "") + r.toFixed(1) + "R";
    const updTally = () => { $("#cb-tally").textContent = `Sessions run: ${tally.runs} · Discipline held: ${tally.held} · Chased: ${tally.chased}`; };
    const drawEq = () => {
      const pts = equity.map((b, i) => {
        const x = (i / Math.max(1, equity.length - 1)) * 100;
        const y = 2 + (1 - b / CB_ACCOUNT) * 40;
        return x.toFixed(1) + "," + y.toFixed(1);
      }).join(" ");
      $("#cb-eq").setAttribute("points", pts);
      $("#cb-eq").classList.toggle("eq-red", total < 0);
    };
    const upd = () => {
      $("#cb-idx").textContent = Math.min(idx + 1, CB_DECK.length);
      $("#cb-losses").textContent = losses + " / " + T;
      $("#cb-losses").classList.toggle("cb-hot", losses >= T);
      $("#cb-total").textContent = (total >= 0 ? "+" : "") + "$" + (total * R).toFixed(2);
      $("#cb-total").className = total < 0 ? "cb-red" : "";
      // tilt meter — emotional state, measured in R
      const fill = tilt ? 100 : Math.min(100, losses / T * 100);
      $("#cb-tilt-fill").style.width = fill + "%";
      $("#cb-tilt-v").textContent = tilt ? "TILTED — REVENGE MODE" : fill >= 70 ? "Shaken" : fill >= 35 ? "Nervous" : "Composed";
      c.querySelector(".cb-meter").classList.toggle("cb-meter-hot", tilt);
    };

    function lockControls(locked) {
      c.querySelectorAll(".cb-ctl select").forEach(s => s.disabled = locked);
    }
    function readControls() {
      risk = +c.querySelector("#cb-risk").value;
      T = +c.querySelector("#cb-t").value;
      CB_ACCOUNT = +c.querySelector("#cb-acc").value;
      R = CB_ACCOUNT * risk / 100;
    }
    function reset() {
      idx = 0; losses = 0; total = 0; tilt = false; over = false; started = false; tripped = false; tripTotal = 0;
      equity.length = 0; equity.push(CB_ACCOUNT);
      lockControls(false);
      $("#cb-log").innerHTML = "";
      $("#cb-stage").innerHTML = `
        <p class="cb-prompt">A fresh session opens on a <b>$${CB_ACCOUNT.toLocaleString()}</b> demo account — risk <b>${risk}%</b> (1R = $${R.toFixed(0)}), breaker at <b>${T} losses</b>. Take the trade.</p>
        <div class="cb-btns">
          <button class="btn-gold sm" id="cb-take">Take the trade</button>
          <button class="btn-ghost sm" id="cb-stop" disabled>Stop for the day</button>
        </div>`;
      $("#cb-take").addEventListener("click", take);
      $("#cb-stop").addEventListener("click", stop);
      drawEq(); upd(); updTally();
    }

    function verdict() {
      const chasedR = total;
      const disciplined = over && !tilt;
      const stage = $("#cb-stage");
      tally.runs++;
      if (disciplined) tally.held++; else tally.chased++;
      save();
      // The honest comparison: what stopping at the trip would have cost (tripTotal,
      // captured the moment the breaker fired — for the scripted deck that's -1.5R
      // after the +1.5R winner, NOT T×1R). The multiple is chased ÷ that real cost.
      const ref = tripped && tripTotal !== 0 ? Math.abs(tripTotal) : Math.max(1, T);
      const mult = Math.abs(chasedR) / Math.max(0.01, ref);
      stage.innerHTML = `
        <div class="cb-verdict ${disciplined ? "cb-good" : "cb-bad"}">
          <b>${disciplined ? ICONS.lock + " Discipline held" : ICONS.alert + " You chased"}</b>
          <p>Day result: <b>${fmt(chasedR)}</b> <span>(${chasedR >= 0 ? "+" : ""}$${(chasedR * R).toFixed(2)})</span></p>
          ${disciplined
            ? `<p class="cb-compare">You walked away at ${fmt(chasedR)} — ${losses} loss${losses === 1 ? "" : "es"}, session closed. The market will be open tomorrow; your account is still whole.</p>
               <p class="cb-moral">That is the breaker doing its job. ${losses < T ? "You didn't even need it — you stopped before the rule became necessary. Professionals call that wisdom." : "You stopped exactly when the plan said to. Professionals call that discipline."}</p>`
            : `<p class="cb-compare">Stopping at the trip would have cost ${fmt(tripTotal)} (${(tripTotal * R) < 0 ? "−" : "+"}$${Math.abs(tripTotal * R).toFixed(0)}). Chasing cost you <b>${fmt(chasedR)}</b> — ${mult.toFixed(0)}× the disciplined damage. That one overridden breaker multiplied your pain.</p>
               <p class="cb-moral">That is tilt, measured in R. The losses didn't hurt you — the trades after them did. Run it again and respect the breaker this time.</p>`}
          <button class="btn-gold sm" id="cb-again">Run the session again</button>
        </div>`;
      stage.querySelector("#cb-again").addEventListener("click", () => reset());
      updTally();
    }

    function take() {
      if (!started) { started = true; lockControls(true); }
      const card = CB_DECK[idx];
      idx++;
      total += card.r;
      if (card.r < 0) losses++;
      const wasTilt = tilt;
      tilt = tilt || !!card.tilt;
      equity.push(CB_ACCOUNT + total * R);
      const log = $("#cb-log");
      log.insertAdjacentHTML("beforeend", `
        <div class="cb-row ${card.r >= 0 ? "cb-win" : "cb-loss"}">
          <b>${fmt(card.r)}</b><p>${esc(card.note)}</p>
        </div>`);
      upd(); drawEq();
      const stage = $("#cb-stage");
      if (idx >= CB_DECK.length) { over = true; verdict(); return; }
      if (!tilt && losses >= T) {
        // breaker tripped — the student chooses discipline or the revenge deck
        tripTotal = total; // capture the REAL cost of stopping here (not T×1R)
        tripped = true;
        stage.innerHTML = `
          <div class="cb-trip"><b>${ICONS.zap} CIRCUIT BREAKER TRIPPED</b><p>${T} losses. Professionals stop here — Chapter 6 taught you the rule. What now?</p></div>
          <div class="cb-btns">
            <button class="btn-gold sm" id="cb-stop">Respect the breaker — stop for the day</button>
            <button class="btn-ghost sm danger" id="cb-chase">One more trade to win it back…</button>
          </div>`;
        stage.querySelector("#cb-stop").addEventListener("click", stop);
        stage.querySelector("#cb-chase").addEventListener("click", () => {
          tilt = true;
          const st = stage;
          st.innerHTML = `<div class="cb-tilt"><b>🧨 Revenge mode</b><p>You overrode the breaker. From here the deck is tilted against you — this is what chasing feels like in real R terms. You can still stop after any trade.</p></div><div class="cb-btns"><button class="btn-gold sm" id="cb-take">Take the next trade</button><button class="btn-ghost sm" id="cb-stop">Stop — it's enough</button></div>`;
          st.querySelector("#cb-take").addEventListener("click", take);
          st.querySelector("#cb-stop").addEventListener("click", stop);
          upd();
        });
        return;
      }
      if (!wasTilt && tilt && !tripped) {
        // A breaker set too loose never fires — the market went violent first.
        // This is the T=4 lesson: by the time you'd have hit 4 losses, you were
        // already trading the tilt deck. The breaker only works if it's set
        // tight enough to trip BEFORE the storm.
        tripTotal = total;
        tripped = true;
        stage.innerHTML = `
          <div class="cb-trip"><b>${ICONS.alert} THE STORM BEAT YOUR BREAKER</b><p>You set your breaker at ${T} losses — but the market turned violent first, and you were already in revenge territory before your rule could protect you. A breaker that's set too loose never gets to trip. What now?</p></div>
          <div class="cb-btns">
            <button class="btn-gold sm" id="cb-stop">Stop the bleeding now</button>
            <button class="btn-ghost sm danger" id="cb-chase">One more trade to win it back…</button>
          </div>`;
        stage.querySelector("#cb-stop").addEventListener("click", stop);
        stage.querySelector("#cb-chase").addEventListener("click", () => {
          tilt = true;
          const st = stage;
          st.innerHTML = `<div class="cb-tilt"><b>🧨 Revenge mode</b><p>You overrode the breaker. From here the deck is tilted against you — this is what chasing feels like in real R terms. You can still stop after any trade.</p></div><div class="cb-btns"><button class="btn-gold sm" id="cb-take">Take the next trade</button><button class="btn-ghost sm" id="cb-stop">Stop — it's enough</button></div>`;
          st.querySelector("#cb-take").addEventListener("click", take);
          st.querySelector("#cb-stop").addEventListener("click", stop);
          upd();
        });
        return;
      }
      if (wasTilt && tilt) {
        stage.innerHTML = `
          <div class="cb-tilt"><b>🧨 Revenge mode</b><p>You overrode the breaker. From here the deck is tilted against you — this is what chasing feels like in real R terms. You can still stop after any trade.</p></div>
          <div class="cb-btns">
            <button class="btn-gold sm" id="cb-take">Take the next trade</button>
            <button class="btn-ghost sm" id="cb-stop">Stop — it's enough</button>
          </div>`;
        stage.querySelector("#cb-take").addEventListener("click", take);
        stage.querySelector("#cb-stop").addEventListener("click", stop);
        return;
      }
      stage.innerHTML = `
        <div class="cb-btns">
          <button class="btn-gold sm" id="cb-take">Take the next trade</button>
          <button class="btn-ghost sm" id="cb-stop">Stop for the day</button>
        </div>`;
      stage.querySelector("#cb-take").addEventListener("click", take);
      stage.querySelector("#cb-stop").addEventListener("click", stop);
    }

    function stop() {
      over = true;
      verdict();
    }

    // controls re-read on change, then reset the board so the new rules apply
    c.querySelectorAll(".cb-ctl select").forEach(s => s.addEventListener("change", () => { readControls(); reset(false); }));
    readControls();
    c.querySelector("#cb-take").addEventListener("click", take);
    c.querySelector("#cb-stop").addEventListener("click", stop);
    drawEq(); upd(); updTally();
    return c;
  }

  /* ============================================================
     CERTIFICATE
     ============================================================ */
  /* ============================================================
     THE ACADEMY VAULT — badge-gated bonus content + recognition tier
     ============================================================ */
  const VAULT_BADGES_NEEDED = 2;

  function earnedBadgeKeys() {
    const keys = new Set();
    CHAPTERS.forEach(c => (chState(c.id).badges || []).forEach(b => { if (BADGES[b]) keys.add(b); }));
    return keys;
  }

  function renderVault(root) {
    const keys = earnedBadgeKeys();
    const count = keys.size;
    const unlocked = count >= VAULT_BADGES_NEEDED;
    const missing = VAULT_BADGES_NEEDED - count;
    const lock = unlocked ? "" : `<div class="vault-lock"><span>${ICONS.lock}</span><p>Earn <b>${missing}</b> more badge${missing === 1 ? "" : "s"} to enter. Badges are earned, not given: 80%+ for 🎖️ Honours, 100% for 💎 Flawless, a 90%+ retake for 🏆 Distinction Hunter, a fail-turned-pass for 🦁 Heart of a Lion, and your first pass for ⚔️ First Blood.</p><div class="vault-progress"><span style="width:${Math.min(100, count / VAULT_BADGES_NEEDED * 100)}%"></span></div><p class="vault-prog-t">${count}/${VAULT_BADGES_NEEDED} badges earned</p></div>`;

    root.appendChild(el("div", "vault", `
      <div class="vault-hero">
        <div class="vault-ic">${unlocked ? ICONS.lockOpen : ICONS.lock}</div>
        <h2 class="gold-serif">The Academy Vault</h2>
        <p class="vault-sub">${unlocked ? "Unlocked — reserved for the students who proved they want it more." : "The Vault holds what ordinary students never see: founder-level lessons and a network reserved for top performers."}</p>
      </div>
      ${lock}
      <div class="vault-sec ${unlocked ? "" : "dim"}">
        <div class="vault-sec-head"><span class="vault-sec-ic">${ICONS.grad}</span><div><h3>Advanced Lessons</h3><p>Founder-level material, deeper than the course itself.</p></div>${unlocked ? "" : '<span class="ni-soon">LOCKED</span>'}</div>
        <div class="vault-grid">
          <div class="vault-slot"><span class="vault-slot-ic">📼</span><div><b>Replay the Market</b><p>Replay real market moves and dissect the decision-making in real time.</p></div><span class="ni-soon">SOON</span></div>
          <div class="vault-slot"><span class="vault-slot-ic">${ICONS.book}</span><div><b>The Institutional Playbook</b><p>How institutions build, manage and defend positions — the layer above retail.</p></div><span class="ni-soon">SOON</span></div>
          <div class="vault-slot"><span class="vault-slot-ic">🎙️</span><div><b>Live Trade Breakdowns</b><p>Recorded analyses of real setups — coming when the studio is ready.</p></div><span class="ni-soon">SOON</span></div>
        </div>
      </div>
      <div class="vault-sec ${unlocked ? "" : "dim"}">
        <div class="vault-sec-head"><span class="vault-sec-ic">🤝</span><div><h3>The Recognition Circle</h3><p>Where top performers belong.</p></div>${unlocked ? '<span class="vault-tag">OPEN</span>' : '<span class="ni-soon">LOCKED</span>'}</div>
        <div class="vault-body">
          <p>Students who perform at badge level earn their place in the Recognition Circle — a private group of the Academy's highest-achieving traders, where you network with the peers who take this as seriously as you do.</p>
          <p><b>And the door doesn't stop at the network.</b> Circle members who pursue employment after graduating hold an express pass: direct recognition from the Reality FX board and genuine consideration for roles inside the company. It is rare — the course proves you are the one for the job; the interview confirms you fit our system. But it is real, and it is yours to reach for.</p>
        </div>
      </div>
      <div class="vault-foot"><p>"Every lesson is a trade. Every trade is a lesson."</p></div>
    `));
  }

  function renderCertificate(root) {
    const pct = progressPct();
    if (pct < 100) {
      root.appendChild(el("div", "cert-locked", `
        <div class="finish-ic">${ICONS.lockOpen}</div>
        <h2 class="gold-serif">Your certificate awaits</h2>
        <p>Complete all 13 chapters — ${13 - CHAPTERS.filter(isComplete).length} remaining — to unlock your Reality FX Academy certificate.</p>
        <div class="cert-progress big"><span style="width:${pct}%"></span></div>
        <button class="btn-gold" data-go="map">Back to the journey</button>`));
      root.querySelector("[data-go]").addEventListener("click", () => location.hash = "#/map");
      return;
    }
    const name = profileName() || "Reality FX Student";
    const today = new Date();
    const dateLong = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const dateShort = today.getFullYear() + " - " + String(today.getMonth() + 1).padStart(2, "0") + " - " + String(today.getDate()).padStart(2, "0");
    const p = profile(); ensureCode(p);
    const code = p.code || certCode(name);
    const xp = S.xp, rank = rankFor(S.xp);
    const certKeys = [...earnedBadgeKeys()];
    const certBadges = certKeys.length
      ? `<div class="cert-badge-row"><p class="cert-label">Earned badges</p><div>${certKeys.map(k => `<span class="cert-badge" title="${esc(BADGES[k].name)}">${BADGES[k].icon}</span>`).join("")}</div></div>`
      : "";
    root.appendChild(el("div", "cert-wrap", `
      <div class="cert">
        <div class="cert-border"></div>
        <span class="cert-corner tl">◆</span><span class="cert-corner tr">◆</span><span class="cert-corner bl">◆</span><span class="cert-corner br">◆</span>
        <p class="cert-eyebrow">The Reality FX Academy</p>
        <h1 class="cert-brand gold-serif">REALITY FOREX<br>TRADING ACADEMY</h1>
        <div class="cert-divider"><span></span></div>
        <p class="cert-sub cursive">This certificate is proud to certify that</p>
        <h2 class="cert-name gold-serif">${esc(name)}</h2>
        <div class="cert-underline"></div>
        <p class="cert-sub cursive">has successfully completed the</p>
        <h3 class="cert-course">Reality Forex Trading Course</h3>
        <p class="cert-course-sub">The RFX Full Course — 13 Chapters · ${xp} XP · Rank: ${rank.name}</p>
        ${certBadges}
        <p class="cert-line">“${esc(QUOTE)}”</p>
        <div class="cert-foot">
          <div class="cert-col">
            <p class="cert-label">Date</p>
            <p class="cert-val">${esc(dateShort)}</p>
            <p class="cert-val-sub">${esc(dateLong)}</p>
          </div>
          <div class="cert-seal"><span>RFX</span></div>
          <div class="cert-col right">
            <p class="cert-label">Certificate ID</p>
            <p class="cert-val">${code}</p>
            <p class="cert-val-sub">${handoffRec() ? "Verified Student ID" : "Student Code · Phase 2"}</p>
          </div>
        </div>
        <div class="cert-sig">
          <p class="cert-sig-name">Leeroy Chirwa</p>
          <div class="cert-sig-line"></div>
          <p class="cert-label">Founder · Reality FX</p>
        </div>
      </div>
      <button class="btn-gold" onclick="window.print()">Print certificate</button>`));
  }
  function certCode(name) {
    let h = 0;
    const s = (name || "student").toUpperCase() + "-RFX13";
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return "RFX-" + h.toString(16).toUpperCase().slice(0, 8);
  }

  /* ---------- Boot ---------- */
  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", () => {
    // sidebar nav (items without data-route are 'coming soon' placeholders)
    document.querySelectorAll(".nav-item").forEach(n => n.addEventListener("click", () => { if (n.dataset.route !== undefined) location.hash = n.dataset.route ? "#/" + n.dataset.route : "#/"; }));
    // mobile menu toggle
    const burger = document.getElementById("burger");
    if (burger) burger.addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
    startSessionClock(); // live session timer begins the moment the academy opens
    checkTimeBadges();    // credit any time-in-the-game badges already banked from earlier sessions
    // Handshake with System A: greet a verified student by identity (from
    // ?sid=) when the handoff store is reachable; otherwise stay a local demo.
    loadHandshake().then(function () {
      save();
      route();
      initSessionGuard(); // single-session guard — only acts when verified
      flagsSync();        // push any integrity flags raised since the last report
    });
  });
})();
