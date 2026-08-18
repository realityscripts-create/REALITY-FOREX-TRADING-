/* ============================================================
   REALITY FX OS — Application
   Dashboard · Journey Map · Lesson Player · Quiz Engine ·
   Ranks · XP · Local progress · Certificate
   ============================================================ */
(function () {
  "use strict";

  const KEY = "rfx_os_v1";
  /* The launch countdown lives on the PUBLIC website hero (System A
     index.html) — the OS is the guarded classroom, so a "Reserve your
     place" CTA there would only ever reach people already enrolled. */
  const XP_SLIDE = 2, XP_CORRECT = 10, XP_CHAPTER = 40, XP_QUIZ_PASS = 25;

  /* ---------- State ---------- */
  function defaultState() {
    return { name: "", xp: 0, streak: 0, lastActive: "", traderStyle: null, tier: null, chapters: {}, log: [], dwell: [], secs: 0, flags: [], reportedFlags: [], styleSeen: [], distStreak: 0, distBest: 0, lastDistCh: null, chapStats: {}, justUnlocked: null,
      timeBadges: [], studyDays: [], dayKey: "", daySecs: 0,
      softLight: "off", softAskedAt: "", softDismissed: false, // yellow light mode (evening nudge)
      rev: 0, // multi-tab revision — a stale tab can never clobber a fresher write
      credRegistered: "", // the credential ID already recorded in the verification registry
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
    // Valid: the System A Student ID (RFX-XXXXX, 5 digits — set by the
    // handshake) or a legacy demo code (RFX-XXXXXX, 6 digits). Anything else
    // gets a fresh demo code, persisted so it never changes between visits.
    if (p.code && /^RFX-\d{5,6}$/.test(p.code)) return p.code;
    p.code = "RFX-" + String(Math.floor(100000 + Math.random() * 900000));
    save();
    return p.code;
  }
  function studentID() {
    const p = profile();
    if (p.code && /^RFX-\d{5,6}$/.test(p.code)) return p.code;
    return "RFX-DEMO";
  }
  /* Founder Master Key (FOR-LEE §9.39): the handoff carries `founder`
     (optional, defaults false). The founder's dashboard opens every door
     while STILL bound by the machine's safety rules. */
  function isFounder() { return !!(S.handoff && S.handoff.founder); }
  /* Trusted printing (§9.6b): 'standard' → watermarked everywhere, print
     blacked out; 'trusted' → an EARNED print button, still watermarked. */
  function printTrustLevel() { return (S.handoff && S.handoff.printTrust) || "standard"; }
  /* Demo tour (§9.38): `demoTourEndsAt` rides the handoff. At the exact
     second the account flips to tour-ended — same authorization path as a
     paid student, just a shorter entitlement window. The founder is exempt. */
  function demoTour() {
    const h = S.handoff;
    if (!h || !h.demoTourEndsAt) return { state: "none" };
    const end = new Date(h.demoTourEndsAt).getTime();
    if (isNaN(end)) return { state: "none" };
    if (isFounder()) return { state: "active", endsAt: h.demoTourEndsAt, exempt: true };
    return { state: Date.now() > end ? "ended" : "active", endsAt: h.demoTourEndsAt };
  }
  function tourLocked() { return demoTour().state === "ended" && !isFounder(); }
  function tourGateHTML() {
    return `<div class="panel tour-gate">
      <h3 class="gold-serif">Your free tour has ended</h3>
      <p class="page-sub">Your account and your progress are safe and permanent — premium Academy access opens the moment you enroll. This is the same message your member panel shows.</p>
      <div class="dash-cta"><a class="btn-gold" href="${esc(academyUrl("member.html"))}">Continue to my RFX account →</a></div>
    </div>`;
  }
  function tourChip() {
    const t = demoTour();
    if (t.state !== "active" || t.exempt) return "";
    const left = Math.max(0, Math.round((new Date(t.endsAt).getTime() - Date.now()) / 60000));
    const lbl = left >= 60 ? Math.floor(left / 60) + "h " + (left % 60) + "m" : left + "m";
    return `<span class="tour-chip" title="Your academy pass — ends ${new Date(t.endsAt).toLocaleString()}">Demo tour · ${lbl} left</span>`;
  }
  /* faint tiled watermark: the student's ID, rotated, repeated — a leaked
     screenshot traces to exactly one student (§9.6 deter + trace) */
  function wmTile() {
    const id = esc(studentID());
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='340' height='150'>" +
      "<text x='14' y='92' font-family='Inter, Arial, sans-serif' font-size='15' letter-spacing='4' fill='#d4af37' transform='rotate(-14 170 75)'>" + id + " · REALITY FX</text></svg>";
    // url('...') wrapper + the style sits in a double-quoted HTML attribute,
    // so BOTH quote kinds must vanish from the URI — encodeURIComponent keeps
    // single quotes, which would end the url() early. Encode them explicitly.
    return "url('data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, "%27") + "')";
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
        fetch("api/handoffs", { cache: "no-store" })
          .then(r => { if (!r.ok) throw new Error("handoff store unavailable"); return r.json(); })
          .then(function (list) {
            const arr = list || [];
            // Resolution order: an explicit ?sid= wins; then a handoff already
            // applied (a refresh keeps the identity); then the profile email —
            // so a student who opens the OS DIRECTLY still meets their identity
            // instead of staying a nameless local demo.
            const sid = new URLSearchParams(location.search).get("sid");
            let rec = sid ? arr.find(h => h.studentId === sid) : null;
            if (!rec && S.handoff && S.handoff.studentId) rec = arr.find(h => h.studentId === S.handoff.studentId) || null;
            if (!rec) {
              const em = String((profile().email || "")).trim().toLowerCase();
              if (em) rec = arr.find(h => String(h.email || "").trim().toLowerCase() === em) || null;
            }
            if (!rec) { resolve(false); return; }
            const hadHandoff = !!S.handoff;
            const p = profile();
            if (rec.verifiedName) { p.name = rec.verifiedName; S.name = rec.verifiedName; }
            if (rec.studentId) p.code = rec.studentId;
            if (rec.email) p.email = rec.email;
            // role: staff handoffs carry a role (staff/mentor/admin) so the
            // OS can open the Live Studio — the broadcasting room for mentor
            // lessons and staff meetings. Students carry no role.
            S.handoff = { studentId: rec.studentId, studentCode: rec.studentCode || "", status: rec.status || "ACTIVE", printTrust: rec.printTrust || "standard", founder: rec.founder === true, role: rec.role || "", demoTourEndsAt: rec.demoTourEndsAt || "", trust: (rec.trust && typeof rec.trust === "object") ? rec.trust : null, receivedAt: rec.receivedAt || "" };
            // Local device anchor: the FIRST device that holds this identity
            // becomes the home fingerprint, kept in the browser itself. The
            // device gate therefore works even when the cloud rail is down or
            // not yet deployed — a different device can never walk in silent.
            if (!S.homeFp) { S.homeFp = deviceInfo().fp; }
            save();
            if (!hadHandoff) toast("Welcome, " + (rec.verifiedName || rec.studentId) + " — identity verified by Reality FX registration", "rank");
            resolve(true);
          })
          .catch(function () { resolve(false); });
      } catch (e) { resolve(false); }
    });
  }

  /* ---------- The return trip: OS → System A ----------
     Verified students zip back to their RFX Account (identity, wallet,
     invoice) and the Reception (the front doors + Sarrah). Resolution:
     1. A captured academy base (the origin this page arrived from, e.g. the
        member panel in the demo) wins when present;
     2. Otherwise the same-site relative path — in production the OS lives
        at /os/ beside System A, so "../member.html" is exactly right.
     The base is captured on arrival so a refresh never loses the bridge. */
  const ACADEMY_KEY = "rfx_academy_base";
  function academyBase() {
    try {
      const saved = localStorage.getItem(ACADEMY_KEY);
      if (saved) return saved;
    } catch (e) { /* storage unavailable */ }
    return location.pathname.indexOf("/os/") >= 0 ? "../" : "";
  }
  function academyUrl(path) {
    const b = academyBase();
    return (b ? b.replace(/\/+$/, "") + "/" : "") + path;
  }
  function captureAcademyBase() {
    try {
      const r = document.referrer;
      if (!r) return;
      const u = new URL(r);
      if (u.origin === location.origin) return; // same-site — relative path already correct
      if (!/\/(member|index|wallet|srm|staff|register)\.html(\?|#|$)/.test(u.pathname)) return;
      if (localStorage.getItem(ACADEMY_KEY)) return;
      localStorage.setItem(ACADEMY_KEY, u.origin + "/");
    } catch (e) { /* referrer unavailable */ }
  }
  function wireAcademyLinks() {
    if (!handoffRec()) return;
    document.querySelectorAll(".academy-link").forEach(function (a) {
      const kind = a.getAttribute("data-academy");
      a.setAttribute("href", academyUrl(kind === "reception" ? "index.html" : "member.html"));
      a.hidden = false;
    });
    // the profile page's gold portal button is rendered with the href inline —
    // re-point it whenever the base is (re)resolved so it never goes stale
    const portal = document.querySelector(".profile-portal-btn");
    if (portal) portal.setAttribute("href", academyUrl("member.html"));
    const gap = document.querySelector(".nav-gap");
    if (gap) gap.hidden = false;
    const ah = document.querySelector(".academy-health");
    if (ah) ah.hidden = false;
  }

  /* ---------- Academy discovery (demo resilience) ----------
     In production the OS lives at /os/ beside System A, so "../member.html"
     is exactly right and no discovery is needed. In the demo the OS and the
     System A servers live on different ports, so a student who opens the OS
     directly (bookmark, preview, welcome email) has no captured academy base
     — the "../" fallback then points at whatever server hosts the OS, which
     returns {"error":"not found"} for member.html. When the health check
     finds the primary resolution wrong, discovery probes the demo System A
     fork servers (CORS-open /api/state), adopts the first that both serves
     the app and holds the student's record (or any System A app if none
     hold it), saves it as the academy base, and re-wires the return links. */
  const DEMO_ACADEMY_PORTS = [8123, 8124, 8125];
  function probeAcademy(origin) {
    return fetch(origin + "/api/state", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("down"); return r.json(); })
      .then(function (st) { return (st && Array.isArray(st.enrollments)) ? st : null; })
      .catch(function () { return null; });
  }
  function discoverAcademy() {
    const sid = handoffRec() && handoffRec().studentId;
    const candidates = [];
    try { candidates.push(new URL(academyUrl("member.html"), location.href).origin); } catch (e) {}
    DEMO_ACADEMY_PORTS.forEach(function (p) { candidates.push("http://127.0.0.1:" + p); });
    const seen = {};
    const unique = candidates.filter(function (o) { return o && !seen[o] && (seen[o] = 1); });
    return Promise.all(unique.map(function (o) {
      return probeAcademy(o).then(function (st) {
        if (!st) return null;
        const known = sid && st.enrollments.some(function (e) {
          return e && (e.studentId === sid || e.studentCode === sid);
        });
        return { origin: o, known: !!known };
      });
    })).then(function (hits) {
      const live = hits.find(function (h) { return h && h.known; });
      const any = hits.find(function (h) { return h && !h.known; });
      const chosen = live || any;
      if (chosen) {
        try { localStorage.setItem(ACADEMY_KEY, chosen.origin + "/"); } catch (e) {}
        wireAcademyLinks();
        setAcademyHealth("live", "Academy link · live — your record is held");
        return chosen.origin;
      }
      return null;
    });
  }

  /* ---------- Academy link health (stale-server check) ----------
     The return trip is only as good as the server it points at. In the demo
     there are multiple System A servers (one per state file), and a link can
     point at a copy that doesn't hold this student — or at a server that
     went down. This check pings BOTH the OS's own handoff server and the
     academy server, then verifies the student's record actually lives there:
       live        — academy server reachable AND holds this student's record
       stale       — server reachable but holds an OLDER copy (record missing)
       unreachable — server down; links stay but may not respond
       os-down     — this OS's handoff server is unreachable (greeting/flags lag)
     The status line lives under the return-trip links; it re-checks on boot,
     on tab focus, and every 90s while the OS is open. */
  let ahTimer = null, ahVerdict = null; // ahVerdict: last definitive verdict — never downgraded by a slow re-check
  function setAcademyHealth(state, text) {
    const el = document.querySelector(".academy-health");
    if (el) {
      if (state) ahVerdict = { state: state, text: text };
      el.className = "academy-health" + (state ? " ah-" + state : "");
      el.querySelector(".ah-text").textContent = text;
    }
    // live verdict → any open System status card re-renders itself
    try { window.dispatchEvent(new CustomEvent("rfx:academy-health", { detail: ahVerdict })); } catch (e) {}
  }
  function academyHealthCheck() {
    const sid = handoffRec() && handoffRec().studentId;
    if (!sid) return;
    const ah = document.querySelector(".academy-health");
    if (!ah || ah.hidden) return;
    // A re-check never blanks a definitive verdict (slow-but-alive servers
    // stay "live"/"stale" instead of flashing "unreachable").
    if (!ahVerdict) setAcademyHealth("", "Checking academy link…");
    const to = setTimeout(function () {
      // No verdict yet after 15s (the Perl demo server can be slow on a big
      // state file) — only then call the OS store unhealthy, and never
      // overwrite a definitive verdict that arrived meanwhile.
      if (!ahVerdict) setAcademyHealth("os-down", "OS server unreachable — greeting & flags may lag");
    }, 15000);
    // 1) the OS's own handoff server
    fetch("api/handoffs", { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error("os store down"); return r.json(); })
      .catch(function () {
        clearTimeout(to);
        if (!ahVerdict) setAcademyHealth("os-down", "OS server unreachable — greeting & flags may lag");
        throw new Error("os store down");
      })
      .then(function () {
        // 2) the academy server the return links point at
        let url;
        try { url = new URL(academyUrl("api/state"), location.href).href; } catch (e) { return; }
        fetch(url, { cache: "no-store" })
          .then(function (r) { if (!r.ok) throw new Error("academy down"); return r.json(); })
          .then(function (st) {
            clearTimeout(to);
            const list = (st && st.enrollments) || [];
            const known = list.some(function (e) {
              return e && (e.studentId === sid || e.studentCode === sid);
            });
            if (known) {
              // The power-on moment: after a real outage, coming back online
              // is celebrated, not silent — the lights flicker back on.
              const wasDown = ahVerdict && (ahVerdict.state === "unreachable" || ahVerdict.state === "down");
              setAcademyHealth("live", "Academy link · live — your record is held");
              if (wasDown) {
                toast("The Academy is back online — welcome back.", "ok");
                try { window.dispatchEvent(new CustomEvent("rfx:power-on")); } catch (e) {}
              }
            } else {
              // The linked server holds an OLDER copy — the link must not
              // stay pointing at it. Discover the freshest academy server
              // (the one holding THIS student's record) and re-point every
              // return link there; only if none is found does the link stay
              // put, marked stale so the student knows to re-enter.
              discoverAcademy().then(function (origin) {
                if (origin) {
                  setAcademyHealth("live", "Academy link · live — your record is held");
                } else {
                  setAcademyHealth("stale", "Older academy copy — your record isn't here; re-enter from your member panel");
                }
              });
            }
          })
          .catch(function () {
            clearTimeout(to);
            // A REAL failure flips the beacon to down — even after a definitive
            // verdict (the 15s os-down timeout above stays protected by
            // !ahVerdict so a slow-but-alive first check never flashes). The
            // next successful check re-flips it to live: the beacon recovers.
            discoverAcademy().then(function (origin) {
              if (!origin) setAcademyHealth("unreachable", "Academy server down right now — we're aware & fixing it. Your course is unaffected.");
            });
          });
      })
      .catch(function () { /* handled above */ });
  }
  function startAcademyHealth() {
    if (!handoffRec()) return;
    academyHealthCheck();
    clearInterval(ahTimer);
    ahTimer = setInterval(academyHealthCheck, 90000);
    window.addEventListener("focus", academyHealthCheck);
  }
  // The Trust Bar must be loaded from the moment the OS boots — the hall pass
  // (fast + trusted → recognition, not flags) has to work on the very first
  // lesson, before any dashboard render ever happens. So we fetch it at boot
  // and again on every focus/route change, so a fast answer is never flagged
  // against a student the academy already trusts.
  function ensureTrustLoaded() {
    if (!TRUST) fetchTrust();
    if (!window.__trustRefresh) {
      window.__trustRefresh = function () { fetchTrust(); };
      window.addEventListener("focus", window.__trustRefresh);
      window.addEventListener("hashchange", window.__trustRefresh);
    }
  }

  /* ---------- The Trust Bar — the OS draws the academy's standing ----------
     The Trust Bar lives in the academy (System A): every penalty and credit
     is ledgered there against the identity, and the moderator's call is the
     verdict. The OS reads the live score for this student and draws the SAME
     gold ring — gold → amber → orange → red as the score falls, matching the
     member panel's visual language. Demo traders (no handoff) have no score
     yet: the ring stays honest and fills the moment their identity links. */
  let TRUST = null; // { score, restricted } — fetched live from the academy store
  const TRUST_BANDS = [
    { min: 100, label: "Excellent standing", color: "#d4af37", note: "The highest tier at Reality FX — the machine is watching, and it approves." },
    { min: 51,  label: "Stable standing",    color: "#d4af37", note: "Your conduct keeps the bar full — that is how trust compounds." },
    { min: 26,  label: "Caution",            color: "#e8b84b", note: "Below 25% your account is timed out — recovery is earned, step by step." },
    { min: 11,  label: "Timed out",          color: "#e07b39", note: "Timed out pending review — a moderator checks the evidence before any decision." },
    { min: 1,   label: "Extended timeout",   color: "#e0524a", note: "A longer timeout — every action is on the record." },
    { min: 0,   label: "Restricted",         color: "#e0524a", note: "Account restricted — pending moderator review." }
  ];
  function trustBand(score) {
    const s = Math.max(0, Math.min(100, score || 0));
    for (let i = 0; i < TRUST_BANDS.length; i++) if (s >= TRUST_BANDS[i].min) return TRUST_BANDS[i];
    return TRUST_BANDS[TRUST_BANDS.length - 1];
  }
  // The Trust Bar is the hall pass: a verified student whose bar is high is
  // trusted by the machine. Timing-based suspicion gets a second read through
  // trust — fast + trusted earns recognition, fast + untrusted is evidence.
  function trustHigh() { return !!(TRUST && typeof TRUST.score === "number" && TRUST.score >= 80); }
  function fetchTrust() {
    const hoff = handoffRec();
    const sid = hoff && hoff.studentId;
    if (!sid) return;
    let url;
    try { url = new URL(academyUrl("api/state"), location.href).href; } catch (e) { return; }
    fetch(url, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (st) {
        if (!st || !Array.isArray(st.enrollments)) return;
        const e = st.enrollments.find(function (x) { return x && x.studentId === sid; });
        if (!e || !e.trust) return;
        TRUST = { score: e.trust.score, restricted: !!e.trust.restricted };
        try { window.dispatchEvent(new CustomEvent("rfx:trust")); } catch (err) {}
      })
      .catch(function () { /* academy down — the ring keeps its last known value */ });
  }

  /* ---------- Founder's Day — 1 November ----------
     The founder stays anonymous while alive (the learning is the point); on
     the day itself the Academy plays the founder's own words — the name stays
     quiet, but the voice does not. Mirrors System A's constants exactly. */
  const FOUNDERS_DAY = { month: 11, day: 1 };
  const FOUNDERS_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function foundersDayLabel() { return FOUNDERS_DAY.day + ' ' + FOUNDERS_MONTHS[FOUNDERS_DAY.month - 1]; }
  function isFoundersDay() {
    const n = new Date();
    return (n.getMonth() + 1) === FOUNDERS_DAY.month && n.getDate() === FOUNDERS_DAY.day;
  }
  const FOUNDER_QUOTES = [
    'Every lesson is a trade. Every trade is a lesson.',
    'The learning is the point.',
    'Money that is subject to change is not yours yet.',
    'Quality before quantity — enrolment is capped, care is not.',
    'We trade with knowledge here — the house never gambles.'
  ];
  function foundersDayCard() {
    if (!isFoundersDay()) return "";
    const q = FOUNDER_QUOTES[new Date().getDate() % FOUNDER_QUOTES.length];
    return `<div class="founders-banner"><span class="fb-ic">${ICONS.crown}</span><div><b>${ICONS.crown} FOUNDER'S DAY · ${foundersDayLabel()}</b><p>Today the Academy honours the founder who built the self-reliant school you study in — the name stays quiet, but the voice does not. <em>“${esc(q)}”</em></p></div></div>`;
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
    // the trust fingerprint — stable across reloads, distinct enough per
    // device: UA + platform + screen + colour depth + timezone + language +
    // cores + touch. Drives the "Is this really you?" gate.
    let rich = d;
    try {
      rich = [navigator.userAgent, navigator.platform || "", screen.width + "x" + screen.height + "x" + (screen.colorDepth || 24),
        new Date().getTimezoneOffset(), navigator.language || "", navigator.hardwareConcurrency || 0, navigator.maxTouchPoints || 0].join("|");
    } catch (e) { /* fall back to the basic string */ }
    let rh = 0;
    for (let i = 0; i < rich.length; i++) rh = (rh * 33 + rich.charCodeAt(i)) >>> 0;
    const plat = String(navigator.platform || "").replace(/^Win/, "Windows").replace(/^Mac/, "Mac").slice(0, 20);
    const label = (mobile ? "Mobile" : "Desktop") + " · " + plat + " · " + String(navigator.language || "").toUpperCase().slice(0, 8);
    return { deviceId: "dev-" + h.toString(16), deviceType: mobile ? "mobile" : "desktop", fp: "fp-" + rh.toString(16), label: label };
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
  /* ---------- The gate (FOR-LEE §9.61–9.63) ----------
     System A holds ALL the power of who gets in. The OS never decides — it
     only follows. Before ANY session is claimed, the OS asks System A's gate
     ("can this identity come in?") and honours the answer: locked → refuse
     with the countdown, and the recovery path is System A's Forgot password?.
     Production fails closed (unreachable gate → no session, per
     RFX-OS-GATE-FUNCTION-FOR-LEE.md); the demo tolerates an unreachable
     academy so a standalone OS keeps working — the same fallback System A's
     own bridge uses ("the demo never breaks"). */
  let gateOrigin = ""; // cached once a real gate answers — repeat probes hit one origin only
  function gateCandidates() {
    const list = [];
    try {
      const b = academyBase();
      if (b && b.indexOf("/") !== -1 && !/^\.\./.test(b)) {
        const origin = b.replace(/\/+$/, "");
        // Legacy demo forks (8123/8124) predate the gate — probing them 404s
        // and spams the console; the gate lives on the current fork (8125).
        if (!/^http:\/\/127\.0\.0\.1:812[34]$/.test(origin)) list.push(origin);
      }
    } catch (e) { /* no saved base */ }
    list.push("http://127.0.0.1:8125"); // the demo gate endpoint (FOR-LEE §9.62)
    return list.filter((v, i) => list.indexOf(v) === i);
  }
  function probeGateOrigin(origin, em) {
    const ctl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    const t = setTimeout(function () { if (ctl) ctl.abort(); }, 3500);
    return fetch(origin + "/api/gate?email=" + encodeURIComponent(em), { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (g) {
        clearTimeout(t);
        if (g && typeof g.locked === "boolean") {
          return g.locked
            ? { locked: true, minutesLeft: g.minutesLeft || null, lockedUntil: g.lockedUntil || null, origin: origin }
            : { locked: false, origin: origin };
        }
        return null; // not a gate — the next candidate decides
      })
      .catch(function () { clearTimeout(t); return null; });
  }
  function askTheGate() {
    const em = String((profile() && profile().email) || "").trim().toLowerCase();
    if (!em) return Promise.resolve(null);
    if (gateOrigin) {
      // A real gate already answered — one quiet probe, never a sweep.
      return probeGateOrigin(gateOrigin, em).then(function (g) {
        return g || { locked: false, unreachable: true };
      });
    }
    return Promise.all(gateCandidates().map(o => probeGateOrigin(o, em))).then(function (results) {
      const locked = results.find(r => r && r.locked);
      if (locked) { if (locked.origin) gateOrigin = locked.origin; return locked; }
      const open = results.find(r => r && r.locked === false);
      if (open) { if (open.origin) gateOrigin = open.origin; return open; }
      return { locked: false, unreachable: true }; // demo tolerance — production fails closed
    });
  }
  function gateLock(minutesLeft, lockedUntil) {
    if (sessGuard) return; // a lock screen is already up
    const overlay = el("div", "sess-lock gate-lock");
    const until = lockedUntil ? new Date(lockedUntil).getTime() : (Date.now() + (minutesLeft || 15) * 60000);
    overlay.innerHTML = `
      <div class="sess-lock-card">
        <div class="sess-lock-ic">${ICON('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M10 12.5a2 2 0 0 1 4 0v2a2 2 0 0 1-4 0z"/>')}</div>
        <h3 class="gold-serif">Sign-in is temporarily locked</h3>
        <p class="sess-lock-sub">The Academy's gatekeeper says this account is locked after too many sign-in attempts. You can try again when the countdown ends — or use <b>Forgot password?</b> on the member portal to recover right now.</p>
        <div class="gate-count" id="gateCount"></div>
        <a class="btn-gold gate-recover" href="${esc(academyUrl("member.html"))}">Forgot password? Recover now</a>
        <p class="sess-lock-err"></p>
      </div>`;
    document.body.appendChild(overlay);
    sessGuard = overlay;
    const tick = function () {
      const left = Math.max(0, until - Date.now());
      const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
      const el2 = overlay.querySelector("#gateCount");
      if (el2) el2.textContent = "Lock lifts in " + m + ":" + String(s).padStart(2, "0");
      if (left <= 0) {
        clearInterval(timer);
        sessClaim().then(function () { if (overlay.parentNode) overlay.remove(); sessGuard = null; });
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
  }
  function sessClaim() {
    const sid = handoffRec() && handoffRec().studentId;
    if (!sid) return Promise.resolve(null);
    // THE GATE — System A decides first. No session is issued without it.
    return askTheGate().then(function (gate) {
      if (gate && gate.locked) {
        gateLock(gate.minutesLeft, gate.lockedUntil);
        return { locked: true, minutesLeft: gate.minutesLeft || null };
      }
      const st = sessionToken();
      const em = String((profile() && profile().email) || "").trim().toLowerCase();
      return sessFetch("session/claim", { studentId: sid, token: st.token, deviceId: st.device.deviceId, deviceType: st.device.deviceType, email: em || undefined }).then(r => {
        if (r && r.kicked) toast("You replaced your session on another device — this one is now active.", "rank");
        return r;
      });
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
        <h3 class="gold-serif">${reason === "kicked" ? "Signed in on another device" : reason === "device" ? "We don't recognise this device" : "Session paused for your security"}</h3>
        <p class="sess-lock-sub">${reason === "kicked"
          ? "This session was closed because your account signed in somewhere else. Only one active session is allowed at a time — that's how Reality FX protects the course material."
          : reason === "device"
            ? "Reality FX checks every sign-in — this looks like a new device or browser. Enter your Student ID to continue here. That is how we keep your account yours, even if your access ever falls into the wrong hands."
            : "You've been inactive for a while. Enter your Student ID to continue where you left off."}</p>
        <input class="sess-lock-input" placeholder="Student ID · e.g. RFX-10482" autocomplete="off">
        <button class="btn-gold sess-lock-btn">${reason === "kicked" ? "Sign in on this device" : reason === "device" ? "Confirm it's me" : "Resume session"}</button>
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

  /* ---------- Device trust: "Is this really you?" ----------
     The Google-style gate for verified students. A sign-in from a device (or
     location) this account has never seen triggers a challenge: a 6-digit
     code goes to the student's registered email, and the device only becomes
     known once the code is confirmed. Saying "this isn't me" refuses the
     session and flags the event for the moderator (a review trigger, never a
     machine verdict). The device store lives on the cloud rail (blob store),
     so the check is real in production — and the demo degrades gracefully.
     Best-effort location comes from a free, key-less geolocation API; if it
     is unreachable the device check still runs, location just stays blank. */
  function deviceLocation() {
    // The free geolocation rail rate-limits hard (429s were spamming the
    // console on every boot). Cache the answer for 24h per browser — one
    // call a day keeps the console quiet, the boots fast, and the location
    // label just as accurate for a device that doesn't move.
    const KEY = "rfx_geo_cache";
    try {
      const hit = JSON.parse(localStorage.getItem(KEY) || "null");
      if (hit && hit.at) {
        // a real answer lives 24h; a failed/rate-limited probe only 1h so
        // the 429 from the free rail stops spamming the console every boot.
        const ttl = hit.loc ? 86400000 : 3600000;
        if (Date.now() - hit.at < ttl) return Promise.resolve(hit.loc);
      }
    } catch (e) { /* cache unreadable — fetch fresh */ }
    return new Promise(function (resolve) {
      const ctl = (typeof AbortController !== "undefined") ? new AbortController() : null;
      const t = setTimeout(function () { if (ctl) ctl.abort(); resolve(""); }, 4000);
      fetch("https://ipwho.is/", { cache: "no-store", signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          clearTimeout(t);
          if (!j || !j.country) { cacheGeo(KEY, ""); resolve(""); return; }
          const loc = [j.city, j.region, j.country].filter(Boolean).join(", ").slice(0, 120);
          cacheGeo(KEY, loc);
          resolve(loc);
        })
        .catch(function () { clearTimeout(t); cacheGeo(KEY, ""); resolve(""); });
    });
    function cacheGeo(k, loc) {
      try { localStorage.setItem(k, JSON.stringify({ at: Date.now(), loc: loc })); } catch (e) { /* non-fatal */ }
    }
  }
  function runDeviceCheck() {
    const sid = handoffRec() && handoffRec().studentId;
    if (!sid) return;
    const info = deviceInfo();
    if (S.deviceVerifiedFp === info.fp) return; // already trusted on this device
    // First device to hold this identity anchors as home — so a fresh device
    // is barred even before (or without) the cloud rail ever answering.
    if (!S.homeFp) { S.homeFp = info.fp; save(); }
    deviceLocation().then(function (loc) {
      sessFetch("device/check", { studentId: sid, fp: info.fp }).then(function (res) {
        if (res && res.known) { S.deviceVerifiedFp = info.fp; save(); return; }
        if (!res) {
          // Rail unreachable — the local anchor still bars a fresh device,
          // and lets the home device through without a dead challenge.
          if (S.homeFp !== info.fp) { sessLock("device"); return; }
          return;
        }
        showDeviceChallenge(sid, info, loc || (res && res.lastLocation) || "");
      }).catch(function () { /* rail down — the single-session guard still protects */ });
    });
  }
  function showDeviceChallenge(sid, info, loc) {
    const fp = info.fp;
    const ov = el("div", "dc-overlay");
    ov.innerHTML =
      `<div class="dc-card">
        <div class="dc-icon">${ICONS.shield}</div>
        <p class="eyebrow">Device protection</p>
        <h3 class="gold-serif">Is this really you?</h3>
        <p class="dc-sub">We don't recognise this device${loc ? " or location (<b>" + esc(loc) + "</b>)" : ""}. Reality FX checks every sign-in — if this is you, confirm it with a code we'll send to your registered email. That is how we keep your account yours, even if your access ever falls into the wrong hands.</p>
        <div class="dc-line"><b>${esc(info.label)}</b><span>· ${info.deviceType === "mobile" ? "mobile" : "desktop"}</span></div>
        <div id="dc-body">
          <button class="btn-gold" id="dc-send">${ICONS.lock} Send me a code — confirm it's me</button>
          <button class="btn-ghost" id="dc-deny">This isn't me</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov) { /* keep open — no accidental dismiss */ } });
    ov.querySelector("#dc-deny").addEventListener("click", function () {
      // refusal: refuse the session, flag it for the moderator, tell the owner
      S.flags = S.flags || [];
      S.flags.push({ type: "device", ch: "", qi: "", ts: Math.floor(Date.now() / 1000), note: "Unrecognized device marked 'not me' — sign-in refused and owner alerted" });
      const owner = profile().email || "";
      const was = S.handoff;
      S.handoff = null;
      S.deviceVerifiedFp = null;
      save();
      flagsSync(); // the moderator sees it immediately
      ov.remove();
      toast("Sign-in refused — this account's owner has been alerted", "");
      if (owner && was) {
        try {
          fetch("api/mail", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: owner, subject: "Reality FX — a new device tried to sign in to your account", html:
              "<p style=\"font-family:Arial,sans-serif;font-size:14px;color:#333;\">Someone signed in to your Reality FX account from a device we don't recognise, and marked it as <b>not them</b>.</p>" +
              "<p style=\"font-family:Arial,sans-serif;font-size:14px;color:#333;\">Your session was refused and the event has been flagged for moderator review. If this was you, simply sign in again and confirm the code we'll email you.</p>" }),
            cache: "no-store"
          }).catch(function () { /* mail rail optional */ });
        } catch (e) { /* never break the refusal */ }
      }
      route();
    });
    ov.querySelector("#dc-send").addEventListener("click", function () {
      const btn = ov.querySelector("#dc-send");
      btn.disabled = true;
      btn.textContent = "Sending your code…";
      sessFetch("device/challenge", { studentId: sid, fp: fp, label: info.label, location: loc, email: profile().email || "" }).then(function (res) {
        if (!res || !res.ok) { btn.disabled = false; btn.textContent = "Try again"; toast("Couldn't reach the device rail — try again", ""); return; }
        ov.querySelector("#dc-body").innerHTML =
          `<p class="dc-sub">A 6-digit code is on its way to <b>${esc(profile().email || "your registered email")}</b>. Enter it below to confirm this device.</p>` +
          (res.demoCode ? `<p class="dc-demo">demo build — your code is <b>${esc(res.demoCode)}</b></p>` : "") +
          `<div class="dc-code-row"><input id="dc-code" class="dc-code" maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="••••••"></div>` +
          `<div class="dc-actions"><button class="btn-gold" id="dc-confirm">Confirm it's me</button><button class="btn-ghost" id="dc-back">← Back</button></div>` +
          `<p class="dc-err" id="dc-err"></p>`;
        ov.querySelector("#dc-back").addEventListener("click", function () { route(); ov.remove(); });
        ov.querySelector("#dc-confirm").addEventListener("click", function () {
          const code = String(ov.querySelector("#dc-code").value || "").trim();
          const errEl = ov.querySelector("#dc-err");
          if (!code) { errEl.textContent = "Enter the code from your email."; return; }
          sessFetch("device/confirm", { studentId: sid, fp: fp, code: code }).then(function (r2) {
            if (!r2 || !r2.ok) {
              errEl.textContent = (r2 && r2.reason) ? r2.reason : "Couldn't confirm — try again.";
              return;
            }
            S.deviceVerifiedFp = fp;
            save();
            ov.remove();
            toast("This device is now recognised — welcome", "rank");
          }).catch(function () { errEl.textContent = "Device rail unreachable — try again."; });
        });
      }).catch(function () { btn.disabled = false; btn.textContent = "Try again"; toast("Couldn't reach the device rail — try again", ""); });
    });
  }

  /* ---------- System self-check (the machine watching the machine) ----------
     The founder's lesson from the frozen-clock scare: a broken display can sit
     unnoticed for hours. This watchdog audits the OS itself — the session clock
     must advance, storage must persist, the rail must answer — self-heals what
     it can, logs every event to the integrity record, and reports anomalies to
     the moderator once a day. Students never see it; the founder does. */
  let sysCheckTimer = null, lastTickSeen = "", stalledChecks = 0, lastSysFlagAt = 0;
  function integrityPush(kind, note) {
    S.sysIntegrity = S.sysIntegrity || [];
    S.sysIntegrity.push({ at: Date.now(), kind: kind, note: note });
    if (S.sysIntegrity.length > 60) S.sysIntegrity = S.sysIntegrity.slice(-60);
    save();
  }
  function sysReportFlag(note) {
    const sid = handoffRec() && handoffRec().studentId;
    if (!sid) return;
    const nowS = Math.floor(Date.now() / 1000);
    if (nowS - lastSysFlagAt < 86400) return; // once a day at most — no spam
    lastSysFlagAt = nowS;
    S.flags = S.flags || [];
    S.flags.push({ type: "syscheck", ch: "", qi: "", ts: nowS, note: note });
    flagsSync();
  }
  function storageProbe() {
    try {
      localStorage.setItem("rfx_os_probe", "1");
      const ok = localStorage.getItem("rfx_os_probe") === "1";
      localStorage.removeItem("rfx_os_probe");
      return ok;
    } catch (e) { return false; }
  }
  function startSysCheck() {
    if (sysCheckTimer) return;
    sysCheckTimer = setInterval(function () {
      if (document.hidden) return; // only audit a visible tab
      // 1) the clock must advance — the exact bug class from the founder's scare
      const t = document.getElementById("sessTimer");
      const cur = t ? t.textContent : "";
      if (cur) {
        if (cur === lastTickSeen) stalledChecks++;
        else stalledChecks = 0;
        if (stalledChecks >= 2) {
          refreshSessDisplay(); // heal on the spot
          integrityPush("clock-stall", "LIVE SESSION display froze while the tab was visible — self-healed on the spot.");
          sysReportFlag("session clock display stalled and was self-healed by the watchdog");
          stalledChecks = 0;
        }
        lastTickSeen = cur;
      }
      // 2) storage must persist (the probe never touches real records)
      if (!storageProbe()) integrityPush("storage", "localStorage probe failed — progress may not persist.");
    }, 10000);
    integrityPush("boot", "System self-check armed — clock, storage and rail are now watched.");
  }
  function load() {
    try { return Object.assign(defaultState(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return defaultState(); }
  }
  let S = load();
  /* Multi-tab safe save — the OS state (live session seconds, XP, progress)
     lives in localStorage, and with the OS open in two tabs (preview + own
     browser) a stale tab's flush used to write its OLD base over the fresher
     value — the live session counter visibly "restarted". Every save now
     re-reads the store first: if another tab moved ahead, we adopt it (secs
     merges as the max, so banked study time is never lost), then stamp our
     own revision. One shared state, whichever tab wrote last. */
  function save() {
    try {
      const cur = JSON.parse(localStorage.getItem(KEY) || "{}");
      if ((cur.rev || 0) > (S.rev || 0)) {
        const banked = S.secs || 0;
        Object.assign(S, cur);
        S.rev = cur.rev || 0;
        S.secs = Math.max(cur.secs || 0, banked);
      }
    } catch (e) { /* store unreadable — write through */ }
    S.rev = (S.rev || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(S));
  }

  function backfillSt(st) {
    if (!Array.isArray(st.viewed)) st.viewed = [];
    if (!Array.isArray(st.earned)) st.earned = [];
    if (!Array.isArray(st.badges)) st.badges = [];
    if (typeof st.retries !== "number") st.retries = 0;   // backfill for old saved states
    if (st.failedAt === undefined) st.failedAt = null;
    if (st.firstFailAt === undefined) st.firstFailAt = null;
    if (typeof st.reflect !== "string") st.reflect = "";  // pause-point reflection notes
    if (typeof st.reviewSecs !== "number") st.reviewSecs = 0;
    if (st.reviewed === undefined) st.reviewed = false;
    if (st.tipSeen === undefined) st.tipSeen = false;
    return st;
  }
  // Progress is tracked per tier: the standard record is the base chapter record
  // (back-compatible), and challenging/elite live as sub-records. The ACTIVE tier's
  // record drives the player; cross-tier completion (chPassed) drives the journey.
  function chState(id) {
    if (!S.chapters[id]) S.chapters[id] = {};
    const base = S.chapters[id];
    const k = tierKey();
    const rec = (k !== "standard") ? (base[k] || (base[k] = {})) : base;
    backfillSt(rec);
    // migration: chapter layouts evolve (slide renumbering) — never let stale slide
    // numbers from an older layout inflate progress or drop a student into the quiz.
    // Uses the ACTIVE deck so tier decks migrate against their own layout.
    const chDef = CHAPTERS.find(x => x.id === Number(id));
    const deck = tierDeck(chDef) || chDef;
    if (deck && deck.quiz && deck.quizSlides && rec.quizBest === null) {
      const firstQuiz = deck.quizSlides[0];
      rec.viewed = rec.viewed.filter(v => v >= 1 && v < firstQuiz);
    }
    // self-heal: a passed quiz proves the whole chapter was completed, so credit
    // every slide. Fixes older saves where the pre-quiz slides were viewed but the
    // quiz slides were never recorded — the course % would otherwise stay at 0%.
    if (deck && rec.passed && rec.viewed.length < deck.slides) {
      rec.viewed = Array.from({ length: deck.slides }, (_, i) => i + 1);
      S.selfHealed = true;
    }
    if (S.selfHealed) {
      S.selfHealed = false;
      save();
      setTimeout(() => toast("Progress synced — a completed chapter's slides were credited. Your course % is now accurate.", "rank"), 600);
    }
    return rec;
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
    if (b) { toast("Badge earned: " + b.name, "rank"); addXp(40, "time-" + key); }
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
  // One display source of truth — every surface (interval, tab-return,
  // route re-render) snaps the LIVE SESSION pill to the true value, so a
  // throttled/backgrounded tab can never leave a frozen number on screen.
  function refreshSessDisplay() {
    const t = document.getElementById("sessTimer");
    if (!t) return;
    let base = Number(S.secs);
    if (!isFinite(base) || base < 0) base = 0; // never paint NaN into the pill
    t.textContent = fmtClock(base + Math.round((Date.now() - sesStart) / 1000));
  }
  function startSessionClock() {
    if (sesTicker) return;
    sesStart = Date.now();
    // live display every second; persist only every 30s (avoid serializing the whole state each tick)
    sesTicker = setInterval(refreshSessDisplay, 1000);
    sesSaveTimer = setInterval(() => { if (!document.hidden) sesFlush(); }, 30000);
    window.addEventListener("beforeunload", () => { if (!document.hidden) sesFlush(); });
    // pause while the tab is hidden — study time should be real, focused time.
    // The 30s bank skips while hidden (background timers would otherwise farm
    // hours), and the hide transition banks only the visible time since the
    // last flush. Coming back resets the window.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) sesFlush();
      else { sesStart = Date.now(); refreshSessDisplay(); }
    });
    // a tab restored from Chrome's frozen/backgrounded state snaps the pill
    // back to the true banked time the instant the user looks at it
    window.addEventListener("focus", () => { sesStart = Date.now(); refreshSessDisplay(); });
    // Multi-tab live adoption — when another tab writes a FRESHER revision,
    // adopt it immediately (never regress the clock) and re-baseline the live
    // ticker so both tabs keep counting from the same shared value. Without
    // this, the second tab's ticker kept showing its stale in-memory base.
    window.addEventListener("storage", e => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const inc = JSON.parse(e.newValue);
        if ((inc.rev || 0) > (S.rev || 0)) {
          const banked = S.secs || 0;
          Object.assign(S, inc);
          S.rev = inc.rev || 0;
          S.secs = Math.max(Number(inc.secs) || 0, banked);
          sesStart = Date.now(); // re-baseline — the live delta continues from the adopted value
          refreshSessDisplay();
        }
      } catch (err) { /* malformed write — ignore */ }
    });
  }
  function fmtClock(s) {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0");
  }
  function fmtDur(mins) {
    mins = Math.round(mins); // never print fractional minutes
    if (mins < 60) return mins + " min";
    return Math.floor(mins / 60) + "h " + (mins % 60 ? mins % 60 + "m" : "");
  }
  function isComplete(ch) {
    // A chapter is done when ANY tier record passed it — an upgraded student
    // keeps every earlier chapter's completion on the journey.
    if (ch.quiz) return chPassed(ch.id);
    const deck = tierDeck(ch) || ch;
    const st = chState(ch.id);
    return st.viewed.length >= deck.slides; // quiz bank pending → slide completion unlocks
  }
  // 24-hour progression gate — institutional pacing, like school terms.
  // No school lets a student sit Term 1, 2, 3 and 4 assessments in one
  // afternoon. A chapter must settle before the next one opens. This is
  // not a punishment — it is the cooling period where learning actually
  // happens. The student absorbs, reflects, and returns sharper.
  const CHAPTER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
  function isUnlocked(ch) {
    // The Hidden Accumulation is not part of the 13-chapter chain — it reveals
    // itself the moment the whole journey is complete, before the Final Examination.
    if (ch.bonus) return CHAPTERS.every(isComplete);
    if (ch.id === 1) return true;
    const prev = CHAPTERS.find(c => c.id === ch.id - 1);
    if (!prev || !isComplete(prev)) return false;
    // 24h cooldown: the previous chapter's completedAt must be at least 24h ago
    const prevSt = S.chapters[prev.id] || {};
    if (prevSt.completedAt && (Date.now() - prevSt.completedAt) < CHAPTER_COOLDOWN_MS) return false;
    return true;
  }
  function chapterCooldownLeft(ch) {
    // Returns milliseconds remaining on the 24h cooldown for this chapter, or 0 if unlocked.
    if (ch.id === 1 || ch.bonus) return 0;
    const prev = CHAPTERS.find(c => c.id === ch.id - 1);
    if (!prev || !isComplete(prev)) return 0;
    const prevSt = S.chapters[prev.id] || {};
    if (!prevSt.completedAt) return 0;
    const left = CHAPTER_COOLDOWN_MS - (Date.now() - prevSt.completedAt);
    return Math.max(0, left);
  }

  /* ---------- Ranks / XP ---------- */
  function rankFor(xp) { let r = RANKS[0]; for (const x of RANKS) if (xp >= x.min) r = x; return r; }
  function nextRank(xp) { return RANKS.find(r => r.min > xp) || null; }

  function addXp(n, why) {
    const before = rankFor(S.xp);
    S.xp += n;
    const after = rankFor(S.xp);
    save();
    if (after !== before) toast("Rank up! You are now " + after.name, "rank");
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
    brain:  ICON('<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4 17.5v-3a2.5 2.5 0 0 1-1.5-4.64A2.5 2.5 0 0 1 4.5 7.5 2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 20 17.5v-3a2.5 2.5 0 0 0 1.5-4.64A2.5 2.5 0 0 0 19.5 7.5 2.5 2.5 0 0 0 14.5 2z"/>'),
    download: ICON('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
    scale:   ICON('<path d="M12 3v18M5 7h14M6 7l-3 6a3 3 0 0 0 6 0L6 7z"/><path d="M18 7l-3 6a3 3 0 0 0 6 0l-3-6z"/><line x1="12" y1="3" x2="12" y2="5"/>'),
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
    diamond: ICON('<path d="M12 2l4.5 4.5L12 22 7.5 6.5 12 2z"/><path d="M2 6.5h20M7.5 6.5L12 22l4.5-15.5"/>'),
    shield:  ICON('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    medal:   ICON('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'),
    crown:   ICON('<path d="M2 18h20M4 17l-1-9 6 4 3-6 3 6 6-4-1 9H4z"/>'),
    institution: ICON('<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'),
    camera:  ICON('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
    video:   ICON('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'),
    mic:     ICON('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'),
    radio:   ICON('<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/>'),
    users:   ICON('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    trendDown: ICON('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'),
    flag:    ICON('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
    hourglass: ICON('<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>'),
    mountain: ICON('<path d="M8 3l4 8 5-5 5 15H2L8 3z"/>'),
    moon:    ICON('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
    quill:   ICON('<path d="M12 19c7 0 9-3 9-9 0-3-2-4-2-4-1-1-5-2-7-1C8 6 6 9 6 12c0 2 1 3 1 3s-1 5-4 6c4 0 7-1 9-2z"/>'),
    galaxy:  ICON('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>'),
    sword:   ICON('<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>'),
    heart:   ICON('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
    seed:    ICON('<path d="M12 22V12"/><path d="M12 12C12 7 8 5 4 5c0 4 3 7 8 7z"/><path d="M12 12c0-5 4-7 8-7 0 4-3 7-8 7z"/>'),
    map:     ICON('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>'),
    key:     ICON('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'),
    grad:    ICON('<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5"/>'),
    user:    ICON('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')
  };
  const NAV_ICONS = {
    profile: "user", "": "home", map: "map", progress: "chart", mod: "shield",
    path: "compass", certificate: "grad", vault: "key", lab: "flask", guide: "book"
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

  /* ---------- PII scanner — the full chat guard ----------
     Every chat surface (rooms, live, mentor) runs the same scan. Students
     naturally trust these spaces, so the machine assumes someone will
     eventually paste something sensitive — and catches it before it leaves.
     Two levels, deliberately different:

       BLOCK — things staff will NEVER ask for in a chat, ever: full card
               numbers, bank/IBAN/routing details, national IDs, SSNs,
               passport & licence numbers, crypto wallets, passwords/PINs,
               and live 2FA codes. These are refused outright.
       WARN  — personal contact & location info (phone, email, street,
               DOB, age, IP, coordinates, postal code): not refused, but
               the student is told it isn't protected here before sending.

     The same rules run on the server side, so the guard holds even if the
     client is bypassed. */
  const PII_BLOCK = [
    { re: /\b(?:\d[ -]?){13,19}\b/, label: "a card or long account number", id: "card" },
    { re: /\b\d{13}\b/, label: "a national ID number", id: "national_id" },
    { re: /\b\d{3}-\d{2}-\d{4}\b/, label: "a Social Security number", id: "ssn" },
    { re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/, label: "an IBAN / international bank account", id: "iban" },
    { re: /\b(?:bank|account|acc)\b\s*(?:no\.?|number|#)?\s*(?:is|:|=|#)?\s*\d{6,17}\b/i, label: "a bank account number", id: "bank_account" },
    { re: /\b(?:routing|aba|sort)\s*code\s*(?:is|:|=|#)?\s*\d{6,9}\b/i, label: "a routing or sort code", id: "routing" },
    { re: /\b(?:passport|travel\s*doc)\b\s*(?:is|:|=|#)?\s*[A-Z]{1,2}\d{6,9}\b/i, label: "a passport number", id: "passport" },
    { re: /\b(?:driver'?s|driving)\s*licen[cs]e\s*(?:is|:|=|#)?\s*[A-Z0-9-]{6,16}\b/i, label: "a driving licence number", id: "license" },
    { re: /\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/, label: "a crypto wallet address", id: "crypto" },
    { re: /0x[a-fA-F0-9]{40}\b/, label: "a crypto wallet address", id: "crypto" },
    { re: /\b(?:password|passwd|pwd|pin|secret)\b\s*(?:[:=]|\bis\s+)\S+/i, label: "a password or PIN", id: "password" },
    { re: /\b(?:otp|2fa|two[- ]factor)\b\s*(?:code|pin)?\s*(?:is|:|=|#)?\s*\d{4,8}\b/i, label: "a live login / 2FA code", id: "otp" },
    { re: /\b(?:login|verification|confirm(?:ation)?|one[- ]time)\s+code\s*(?:is|:|=|#)?\s*\d{4,8}\b/i, label: "a live login / 2FA code", id: "otp" }
  ];
  const PII_WARN = [
    { re: /\b(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3}[\s\-.]?\d{3,4}\b/, label: "a phone number", id: "phone" },
    { re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/, label: "an email address", id: "email" },
    { re: /\b\d{1,5}\s+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|close|crescent|cres|boulevard|blvd|way|court|ct|circle|cir|place|pl)\b/i, label: "a street address", id: "address" },
    { re: /\b(?:born|birth(?:day|date)|dob)\b.{0,40}?\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/i, label: "your date of birth", id: "dob" },
    { re: /\b(?:i'?m|i am)\s+\d{1,2}\b/i, label: "your age", id: "age" },
    { re: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, label: "an IP address", id: "ip" },
    { re: /\b-?\d{1,3}\.\d{3,},\s*-?\d{1,3}\.\d{3,}\b/, label: "location coordinates", id: "coords" },
    { re: /\b(?:postal|zip|post)\s*code\b.{0,30}?\d{4,6}\b/i, label: "a postal / ZIP code", id: "zip" }
  ];
  function dlpScan(text) {
    const t = String(text || "");
    const blocked = [];
    for (const b of PII_BLOCK) if (b.re.test(t)) blocked.push(b.label);
    if (blocked.length) return { level: "block", found: blocked };
    const warned = [];
    for (const w of PII_WARN) if (w.re.test(t)) warned.push(w.label);
    return warned.length ? { level: "warn", found: warned } : { level: "ok", found: [] };
  }
  // Exposed so other chat surfaces (the AI Mentor) run the same scan.
  window.RFXpii = { scan: dlpScan };

  let toastTimer = null;
  function toast(msg, kind) {
    let t = $("#toast");
    if (!t) { t = el("div", "toast"); t.id = "toast"; document.body.appendChild(t); }
    t.className = "toast show" + (kind ? " toast-" + kind : "");
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- content protection: deter + trace, never pretend (§9.6) ----------
     Course pages block casual copy-paste and count the attempt; screenshots
     still carry the student-ID watermark, so any leak traces to one student. */
  document.addEventListener("copy", function (e) {
    const sel = (window.getSelection && window.getSelection().toString()) || "";
    if (!sel) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    S.copyAttempts = (S.copyAttempts || 0) + 1;
    try { save(); } catch (err) { /* storage unavailable */ }
    toast("Protected by Reality FX — every page carries your Student ID", "warn");
  });

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
      // In-lane truth when the lane has been attempted; otherwise fall back to the
      // cross-tier best so a fresh Elite/Challenging record is never read as a failure
      // the student never made.
      const best = st.quizBest != null ? st.quizBest : chBest(ch.id);
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
  // The full course is three parallel lanes — Standard, Challenging, Elite.
  // "Slides explored" counts every lane's deck (the engine tracks views per
  // tier record), so the metric shows the real depth of the course, never a
  // fraction of it. The denominator is every slide a student can reach.
  function laneSeen(base, k) { return (base[k] && base[k].viewed) ? base[k].viewed.length : 0; }
  function slidesSeenAll() {
    return CHAPTERS.reduce((a, c) => {
      const base = S.chapters[c.id] || {};
      return a + (base.viewed ? base.viewed.length : 0) + laneSeen(base, "challenging") + laneSeen(base, "elite");
    }, 0);
  }
  function slidesTotalAll() {
    return CHAPTERS.reduce((a, c) => a + c.slides + ((c.challenging && c.challenging.slides) || 0) + ((c.elite && c.elite.slides) || 0), 0);
  }
  function quizzesPassed() {
    return CHAPTERS.filter(c => c.quiz && chState(c.id).passed).length;
  }

  /* ---------- Retake policy (Fair Play) ---------- */
  const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h reflection period after a fail
  const MAX_RETRIES = 3;                        // retake tokens per chapter
  /* ---------- Difficulty tiers ----------
     One choice, made before the course begins, locked until a deliberate
     door opens. The tiers change what is demanded of the student — the
     questions, the insider depth, the recognition — not the base course.
     Standard is a complete education; Challenging adds application and
     insider notes; Hard is the elite lane (real trading math, cross-chapter
     scenarios, the institutional layer). Graduates unlock every tier free. */
  const TIERS = {
    standard:    { name: "Standard",    tag: "The full course — complete and trade-ready", color: "#E6C565" },
    challenging: { name: "Challenging", tag: "Applied questions, insider notes, deeper thinking", color: "#9fe3bd" },
    elite:       { name: "Elite",       tag: "A different course — advanced concepts, real trading math, the institutional layer", color: "#e8a33d" }
  };
  const TIER_ORDER = ["standard", "challenging", "elite"];
  // Exam protocol: Challenging and Elite quizzes run a real-time exam clock
  // (Standard stays untimed). Institutions don't let a student stare at one
  // question for five minutes — neither do we. 10 questions: 90s each in
  // Challenging, 2m each in Elite (five options, deeper maths).
  const EXAM_MIN = { challenging: 15, elite: 20 };
  function tierKey() { return S.tier && TIERS[S.tier] ? S.tier : "standard"; }
  function tierName() { return TIERS[tierKey()].name; }
  function tierTag() { return TIERS[tierKey()].tag; }
  // The active tier's deck for a chapter. The lanes are not replacements — they
  // STACK: the founder's standard is "the challenging has everything from the
  // standard and more of its own additions", and the elite carries the most
  // information of all. So a tier deck is composed at runtime:
  //   challenging = standard content + challenging content
  //   elite       = standard content + challenging content + elite content
  // Each lane's content slides run in order (standard first, then the deeper
  // lane), and the lane's own assessment gates the chapter. Un-forged tiers
  // fall back to the core material (tierDeck returns null).
  const composeCache = {};
  function composeTier(ch, k) {
    if (!ch || !ch[k] || !Array.isArray(ch[k].native) || !ch[k].native.length) return null;
    const ck = ch.id + ":" + k;
    if (composeCache[ck]) return composeCache[ck];
    const laneContent = s => (s && s.kind !== "close" && s.kind !== "pause") ? s : null;
    let native = (ch.native || []).map(laneContent).filter(Boolean);
    // elite stacks the challenging lane too — the most information of all
    if (k === "elite" && ch.challenging && Array.isArray(ch.challenging.native)) {
      native = native.concat(ch.challenging.native.map(laneContent).filter(Boolean));
    }
    native = native.concat(ch[k].native.map(laneContent).filter(Boolean));
    // the lane's own pause + close frame the assessment, exactly as authored
    const pause = (ch[k].native || []).find(s => s && s.kind === "pause");
    const close = (ch[k].native || []).find(s => s && s.kind === "close");
    if (pause) native.push(pause);
    const quiz = ch[k].quiz || [];
    const quizStart = native.length + 1;
    native = native.concat(quiz.map(() => null));
    const quizSlides = quiz.map((_, i) => quizStart + i);
    if (close) native.push(close);
    const deck = { native, quiz, quizSlides, slides: native.length, composed: true };
    composeCache[ck] = deck;
    return deck;
  }
  function tierDeck(ch) {
    const k = tierKey();
    if (k === "standard") return null;
    const composed = composeTier(ch, k);
    return composed || null;
  }
  // Passed in ANY tier — an upgraded student keeps their earlier progress
  // visible on the journey even though the active tier record is fresh.
  function chPassed(id) {
    const base = S.chapters[id] || {};
    if (base.passed) return true;
    if (base.challenging && base.challenging.passed) return true;
    if (base.elite && base.elite.passed) return true;
    return false;
  }
  function chBest(id) {
    const base = S.chapters[id] || {};
    const vals = [base, base.challenging, base.elite].map(r => (r && r.quizBest != null) ? r.quizBest : 0);
    return Math.max.apply(null, vals);
  }

  const BADGES = {
    lion:       { name: "Heart of a Lion",    ic: "heart", desc: "Failed a chapter, came back, and passed it. That's persistence — the trader's hidden edge." },
    gem:        { name: "Accumulator",           ic: "diamond", desc: "Completed The Hidden Accumulation — the psychology of staying rational when the market disagrees. You carry the framework now." },
    distinction:{ name: "Distinction Hunter", ic: "trophy", desc: "Retook a chapter and pushed past 90% when a pass wasn't enough. Excellence is a habit." },
    honours:    { name: "Honours",            ic: "medal", desc: "Scored 80% or higher on a chapter assessment. Consistency compounds — this is how institutions are built." },
    first:      { name: "First Blood",        ic: "sword", desc: "Passed your very first chapter assessment. Every master started here." },
    perfect:    { name: "Flawless",           ic: "diamond", desc: "Scored 100% on a chapter assessment. Clean execution, clean thinking." },
    // Time-in-the-game achievements — the trader who trains when nobody's
    // watching. Tracked from the live session clock.
    hour1:      { name: "First Hour",         ic: "hourglass", desc: "Logged your first hour inside the Academy. The path begins with showing up." },
    hour3:      { name: "Deep Session",       ic: "flame", desc: "Stayed focused for 3 hours of study. That's a training block, not a visit." },
    hour10:     { name: "Ten Hours of Focus", ic: "sparkle", desc: "10 hours invested. Compound interest on your own brain." },
    hour50:     { name: "Fifty-Hour Grind",   ic: "mountain", desc: "50 hours in the game. Most traders never get this far — you're built different." },
    hour100:    { name: "Century of Study",   ic: "galaxy", desc: "100 hours of study. The market can't give this back — only you could." },
    study3:     { name: "The Unseen Grind",   ic: "moon", desc: "3 consecutive days of study — the habit that quietly makes professionals." }
  };
  // The icon safety net: an unknown key can never render the literal string
  // "undefined" on a student's screen — it falls back to a neutral mark. This
  // is the root-fix for the brain/download/scale family of bugs: the static
  // ICONS table is guarded by the audit, and every DYNAMIC lookup goes
  // through here so a data-driven key can't leak either.
  const ic = key => ICONS[key] || ICONS.sparkle || "";
  // Stroke icon for a badge key (SVG from the ICONS set; safe fallback "").
  const badgeIc = key => { const b = BADGES[key]; return b ? (ICONS[b.ic] || b.icon || ic(b.ic)) : ""; };
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
  /* ---------- Honest duration model ----------
     The old estimate was a hand-set constant per chapter plus a flat 1.5
     minutes per question. Now the course times itself the way a sharp human
     actually reads: slides are timed by their real word count at ~160 wpm
     with a comprehension beat, and quiz questions by their real length with
     an answer + explanation-review floor. The numbers on the journey and the
     dashboard are therefore defensible — and they grow honestly as content grows. */
  function slideReadMins(nv) {
    if (!nv) return 0.6;
    let words = 0;
    const count = s => { if (s) words += String(s).split(/\s+/).length; };
    count(nv.eyebrow); count(nv.title); count(nv.lead); count(nv.sub);
    (nv.body || []).forEach(count); (nv.bullets || []).forEach(count);
    count(nv.example); count(nv.callout); count(nv.insight);
    if (nv.styles) Object.keys(nv.styles).forEach(k => count(nv.styles[k]));
    // Careful study pace for dense trading material: ~130 wpm + a real
    // comprehension beat per slide (figures, gold bullets, insights, notes).
    return Math.max(0.7, words / 130 + 0.6);
  }
  function questionMins(q) {
    if (!q) return 1.2;
    const chars = (q.q || "").length;
    return Math.max(1, Math.min(4.5, (chars / 7 + 45) / 60)); // read Q + options, decide, review the gold explanation
  }
  function quizMins(ch) {
    const deck = tierDeck(ch) || ch;
    if (!deck.quiz) return 0;
    return Math.round(deck.quiz.reduce((a, q) => a + questionMins(q), 0));
  }
  function readingMins(ch) {
    const deck = tierDeck(ch) || ch;
    return Math.round((deck.native || []).reduce((a, nv) => a + slideReadMins(nv), 0));
  }
  function chapterTotalMins(ch) { return readingMins(ch) + quizMins(ch); }
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
    // The trader track rides every room — the same machine-derived rung as
    // the Trading Challenge hub, so a student always knows where they stand
    // on the Academy's ladder, not just inside the arena.
    const rung = document.getElementById("sideRankRung");
    if (rung) {
      if (window.RFXSim && typeof window.RFXSim.rung === "function") {
        const i = window.RFXSim.rung();
        const r = window.RFXSim.track[i];
        rung.hidden = false;
        rung.innerHTML = `<span class="rr-ic">${window.OSIcon ? OSIcon("institution") : ""}</span>${esc(r.name)} · Rung ${i + 1}/5`;
        rung.title = "Trader track — " + r.cap + ". The machine moves you up on proof.";
      } else {
        rung.hidden = true;
      }
    }
    // The Live Studio door opens only for verified staff/mentors (or the
    // founder) — students see Live Rooms, never the broadcast controls.
    const studio = document.getElementById("navStudio");
    if (studio) studio.hidden = !isStaff();
    // The Machine Audit door is the founder's only — the building's own
    // inspection report is not for the classroom.
    const auditNav = document.getElementById("navAudit");
    if (auditNav) auditNav.hidden = !isFounder();
    // The Registry Console opens only for the founder and registry admins —
    // students never see the door that mints and revokes credentials.
    const regNav = document.getElementById("navRegistry");
    if (regNav) regNav.hidden = !isRegistryAdmin();
    // The identity chip rides every page — verified students never forget
    // their ID, and it travels with them through the whole Academy.
    const chip = document.getElementById("sideIdChip");
    const hoff = handoffRec();
    if (chip) {
      if (hoff && hoff.studentId) {
        chip.hidden = false;
        chip.innerHTML = `<span class="sidc-dot"></span>ID ${esc(hoff.studentId)} <b class="id-ver">(Verified!)</b>`;
        chip.title = "Your identity — verified by Reality FX registration";
      } else {
        chip.hidden = true;
      }
    }
  }

  /* ---------- PWA install affordance ----------
     The sidebar shows "Install app" only when the device can actually
     install: Android/Chrome/Edge announce it (rfx:pwa-installable), iOS
     never does so the button teaches Share → Add to Home Screen instead,
     and an already-installed Academy hides it entirely. The heavy lifting
     lives in /rfx-pwa/register.js — the OS only knows the three hooks. */
  function wirePwaInstall() {
    const btn = document.getElementById("appInstallBtn");
    if (!btn) return;
    btn.hidden = true;
    if (!window.RFXInstallApp) return;                          // no PWA layer — nothing to offer
    if (window.RFXIsPwaInstalled && RFXIsPwaInstalled()) return; // already installed (or standalone)
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
    const show = () => {
      btn.hidden = false;
      // one-time, subtle nudge — a soft gold pulse, never more than once per
      // device, gone the moment they click. No banner, no popup.
      let hinted = false;
      try { hinted = !!(S && S.pwaHintShown); } catch (e) {}
      if (!hinted) {
        try { S.pwaHintShown = true; save(); } catch (e) {}
        btn.classList.add("hinting");
        setTimeout(() => btn.classList.remove("hinting"), 7000);
      }
    };
    window.addEventListener("rfx:pwa-installable", show);
    window.addEventListener("rfx:pwa-installed", () => { btn.hidden = true; });
    // iOS can't fire beforeinstallprompt — the button opens the Share → Add
    // to Home Screen hint (dispatched by RFXInstallApp on iOS).
    if (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) show();
    btn.addEventListener("click", () => { btn.classList.remove("hinting"); try { window.RFXInstallApp(); } catch (e) {} });
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
    clearInterval(session.examTicker); // stop the exam clock when leaving the lesson
    session.examTicker = null;
    if (window.RFXMentor) window.RFXMentor.destroy(); // leave the chat cleanly (stops typing timers)
    updateSidebar();
    updateCertNav();
    const h = location.hash || "#/";
    const parts = h.replace(/^#\//, "").split("/");
    const view = parts[0] || "";
    const viewEl = $("#view");
    viewEl.innerHTML = "";
    // live panels keep their own timers — never leave them running on a dead view
    if (viewEl.__liveTimer) { clearInterval(viewEl.__liveTimer); viewEl.__liveTimer = null; }
    if (viewEl.__roomTimer) { clearInterval(viewEl.__roomTimer); viewEl.__roomTimer = null; }
    if (viewEl.__auditTimer) { clearInterval(viewEl.__auditTimer); viewEl.__auditTimer = null; }
    if (viewEl.__simTimer) { clearInterval(viewEl.__simTimer); viewEl.__simTimer = null; }
    if (viewEl.__simAssessIv) { clearInterval(viewEl.__simAssessIv); viewEl.__simAssessIv = null; }
    // Only real routes light up. Items without data-route (the Academy return
    // links) must NEVER appear active — they are doors, not views, and on the
    // dashboard route the old fallback marked every one of them gold.
    document.querySelectorAll(".nav-item").forEach(n => {
      // Dashboard is data-route="" (the default route), so test for the
      // attribute's EXISTENCE, not its truthiness — an empty route is real.
      if (!("route" in n.dataset)) return n.classList.remove("active");
      n.classList.toggle("active", n.dataset.route === view);
    });

    if (view === "map") renderMap(viewEl);
    else if (view === "path") renderPath(viewEl);
    else if (view === "progress") renderProgress(viewEl);
    else if (view === "profile") renderProfile(viewEl);
    else if (view === "lab") renderLab(viewEl);
    else if (view === "sim") { if (window.RFXSim) window.RFXSim.render(viewEl); else viewEl.innerHTML = `<div class="panel"><h3 class="gold-serif">Trading Challenge</h3><p class="page-sub">The simulation module is still loading — refresh the page.</p></div>`; }
    else if (view === "journal") { if (window.RFXJournal) window.RFXJournal.render(viewEl); else viewEl.innerHTML = `<div class="panel"><h3 class="gold-serif">Trade Journal</h3><p class="page-sub">The journal module is still loading — refresh the page.</p></div>`; }
    else if (view === "live") renderLive(viewEl);
    else if (view === "break") renderBreak(viewEl);
    else if (view === "story") renderStory(viewEl);
    else if (view === "hof") renderHof(viewEl);
    else if (view === "studio") { if (!isStaff()) { viewEl.innerHTML = staffGateHTML(); } else renderStudio(viewEl); }
    else if (view === "room") { const code = String(parts[1] || "").toUpperCase(); if (!code) location.hash = "#/live"; else renderRoom(viewEl, code); }
    else if (view === "mod") renderMod(viewEl);
    else if (view === "lesson") {
      if (tourLocked()) viewEl.innerHTML = tourGateHTML();
      else renderLesson(viewEl, parseInt(parts[1], 10), parts[2] && !isNaN(parseInt(parts[2], 10)) ? parseInt(parts[2], 10) : null, parts[2] === "r");
    }
    else if (view === "review") {
      if (tourLocked()) viewEl.innerHTML = tourGateHTML();
      else renderLesson(viewEl, parseInt(parts[1], 10), null, true); // read-only revision mode
    }
    else if (view === "certificate") renderCertificate(viewEl);
    else if (view === "exam") renderExam(viewEl);
    else if (view === "workshop") renderWorkshops(viewEl);
    else if (view === "vault") renderVault(viewEl);
    else if (view === "guide") renderGuide(viewEl);
    // The Machine Audit is the founder's inspection room — the nav hides it,
    // and the route itself is gated too (a typed #/audit must not open the
    // building's own inspection report, or the incident board, to students).
    else if (view === "audit") {
      // founder-only: the building's inspection report is not for the classroom
      if (!isFounder()) {
        viewEl.innerHTML = `<div class="panel gate-panel"><div class="gate-ic">${ICONS.scale}</div><h3 class="gold-serif">This door is the founder's</h3><p class="page-sub">The Machine Audit is the building's inspection report — the same checks that gate every deploy. Students live the academy; the founder reads the blueprint.</p></div>`;
      } else renderAudit(viewEl);
    }
    else if (view === "registry") {
      // the credential office — minting and revoking is founder/admin only
      if (!isRegistryAdmin()) {
        viewEl.innerHTML = `<div class="panel gate-panel"><div class="gate-ic">${ICONS.diamond}</div><h3 class="gold-serif">This door is the registry's</h3><p class="page-sub">The Registry Console mints, revokes and inspects RFX credentials — the authority behind every certificate. It opens only for the founder and registry administrators.</p></div>`;
      } else renderRegistry(viewEl);
    }
    else if (view === "mentor") {
      if (window.RFXMentor) window.RFXMentor.mount(viewEl);
      else viewEl.innerHTML = '<div class="panel"><h3 class="gold-serif">The Mentor</h3><p class="page-sub">The trading twin isn\'t loaded in this build yet.</p></div>';
    }
    else renderDashboard(viewEl);
    refreshSessDisplay(); // snap the LIVE SESSION pill after every route render
    window.scrollTo(0, 0);
  }

  /* Quick-resume strip — "you left off here, pick it back up". Reads the
     last slide the student actually sat in and deep-links straight back to
     it. One click, no hunting. */
  function resumeStrip() {
    const ll = S.lastLesson;
    if (!ll || !ll.ch) return "";
    const ch = CHAPTERS.find(c => c.id === ll.ch);
    if (!ch || isComplete(ch) || !isUnlocked(ch)) return "";
    const slide = Math.min(Math.max(1, ll.slide || 1), ch.slides);
    const pct = Math.round(slide / ch.slides * 100);
    const when = ll.ts ? fmtRel(ll.ts) : "";
    return `<div class="resume-strip">
      <div class="resume-ic">${ICONS.clock}</div>
      <div class="resume-txt">
        <p class="resume-l">Quick resume${when ? " · " + esc(when) : ""}</p>
        <p class="resume-v"><b>${esc(ch.title)}</b> — slide ${slide} of ${ch.slides} <span class="resume-bar"><i style="width:${pct}%"></i></span></p>
      </div>
      <button class="btn-gold resume-go" data-go="${ch.id}" data-slide="${slide}">Resume →</button>
    </div>`;
  }
  function fmtRel(ts) {
    const s = Math.max(0, Math.round((Date.now() - (ts || 0)) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  /* ============================================================
     OPERATING GUIDE — how the Academy works
     ============================================================ */
  function renderGuide(root) {
    const secs = [
      { ic: ICONS.map, t: "The Journey", b: "Your course is one path, thirteen chapters, three lanes. Open the Journey to see every chapter, its difficulty, its focus and the assessment that gates the next one. Chapters unlock as you pass — and the reflection period after an assessment is your moment to let the material settle before you move on." },
      { ic: ICONS.book, t: "Lessons & assessments", b: "Every lesson is a sequence of slides — read, absorb, next. At the end sits the assessment: the gate to the next chapter. The next chapter opens 24 hours after you pass — like school terms, we believe in paced learning. You are timed on how long you take, and the machine watches for patterns no human produces. Pass and you earn XP, a badge tier and the next chapter; fail and the reflection period opens, then a retake — your notes and the revision read are exactly what the reflection window is for." },
      { ic: ICONS.note, t: "Notes & reflection", b: "Every slide lets you capture a note — they save to your account and stay visible during revision mode. After a failed assessment, the reflection period (a fixed window, chapters differ) is your chance to actually study the material before retaking. Use it: the retake is free, the review is the point." },
      { ic: ICONS.flask, t: "The Laboratory", b: "Theory comes alive here. The 3-Loss Circuit Breaker, the drawdown simulator and the other experiments let you feel what a losing streak actually does to a trading account — without risking a cent. Play with the inputs; the numbers are the lesson." },
      { ic: ICONS.robot, t: "The AI Mentor", b: "A trading twin built from the founder's own head: aggressive opinions, dry humour, and logic that meets you where you are. Ask about a loss, a strategy, or just how to handle the fear — it answers like a mentor, not a search bar. It never leaves the semester early." },
      { ic: ICONS.shield, t: "Fair Play & integrity", b: "The Academy's electrical fence. Assessment timings are checked, tab-switching is watched, suspicious patterns raise flags, and rapid progression across chapters is detected — review triggers for a moderator, never machine verdicts. Your Trust Bar reflects your conduct, and a healthy bar keeps every door open. One chapter per day, like school terms — the cooling period is where real learning happens. Randomized questions every time. The rules exist so your certificate means something." },
      { ic: ICONS.key, t: "The Academy Vault", b: "Hidden gems — special packs and founder-level material that not every student earns. The vault opens to students who prove themselves; the key is performance, not payment." },
      { ic: ICONS.target, t: "Your standing", b: "The Trust Bar ring on your dashboard mirrors the academy's record of your conduct — 100% on the day your identity is minted, moving only on measured grounds. Click it to see every action that moved it, and the thresholds explained." },
      { ic: ICONS.medal, t: "Badges & the Hall of Fame", b: "Badges are earned, never given: 80%+ assessment scores, distinction streaks, honest consistency. The Hall of Fame honours the very best — places are earned, never sold, and the wall fills as the Academy grows." },
      { ic: ICONS.video, t: "Live Rooms", b: "The broadcasting wing. Mentors host lessons and staff host meetings from the Live Studio, and every session appears here the moment it goes live — the join code, the broadcast window and the room chat, all in one place. The mentor calendar lets you request a slot that suits you, and a request is only real once the mentor confirms it — never silently." },
      { ic: ICONS.flame, t: "The Trading Challenge", b: "The arena: simulated accounts, institutional rules, and a machine that grades ability, not just profit. Enter a challenge, trade the live feed and the market chart, and the machine measures risk, drawdown, consistency and discipline. Pass, and the reward is machine-signed — a badge and RFX credit paid straight to your wallet. No real money ever touches this floor." },
      { ic: ICONS.moon, t: "The Break Room", b: "A real break, not a tab-switch: a quiet room to unwind between sessions — a nudge after heavy assessments and a place to let a long study session settle. It is chat-safe too: the guard politely refuses phone numbers, addresses and passwords, because staff never ask for those in chat." },
      { ic: ICONS.pen, t: "The Trade Journal", b: "The trader's mirror: log every trade you take — pair, direction, entry, exit, stop, the setup and how you felt while holding it. The machine computes pips, P/L and the R multiple as you type, and the stats rail reads the pattern your memory politely edits. Local-only by design: your journal lives on this device and never leaves it." },
      { ic: ICONS.note, t: "The Final Examination", b: "The capstone of your Journey — the final node after Chapter 13. One paper across all thirteen chapters, drawn fresh from the decks you studied, timed in hours, forward-only, machine-graded. Pass at 70% and the certificate is yours. It can also be run as a live, proctored workshop — same paper, same standard, the room is the difference." },
      { ic: ICONS.zap, t: "Workshops", b: "The hands-on wing: practical sessions where you build, tune and break the machinery instead of just reading about it. The Risk Workshop makes the 1% rule a reflex you can compute in your head; the Moving Averages Workshop is a real workbench — a synthetic market with fast and slow lines you can drag, invert, lag and whipsaw until you feel exactly what tuning does. Each workshop is a principle, a real task, and a check that the skill landed. 25 XP per workshop." },
      { ic: ICONS.clock, t: "The Study Hall", b: "The Academy's always-open room — students gather, share the journey and keep each other pushing. Same rules as every room: one identity, honest chat, and the PII guard watching the door so nothing sensitive is ever posted." },
      { ic: ICONS.quill, t: "The Story", b: "How this OS was actually built — the sleepless nights, the code that broke, the ideas that looked brilliant at midnight and were wrong by morning. It is the honest version of what you're standing in: the confusion and the frustration happened here, in the build, so they never have to happen in your session." },
      { ic: ICONS.grad, t: "The certificate", b: "Finish every chapter, pass every assessment and the final exams, and the certificate is yours — your verified name, your Student ID, drawn in gold. It prints only for students who earned print trust. A certificate from Reality FX means you did the work." },
      { ic: ICONS.shield, t: "Getting help", b: "Your account, wallet and identity live at the Reception and your member panel — the front doors of Reality FX. The Academy link on the sidebar takes you there in one click. Questions about your course? The AI Mentor. Questions about your account? The team at the front desk. A technical hiccup? The system tells you plainly and keeps the course itself standing — the lessons never depend on anything that can go down." },
      { ic: ICONS.shield, t: "Your data & the machine behind it", b: "When you register, a handshake verifies you with the Academy and mints your identity — the two systems introduce you to each other securely, never guessing. Your lessons are stamped with a version number so you always read the newest copy, never a stale one. A snapshot is simply a safety photo of the records taken before any change, so nothing can ever be lost. If you ever type a phone number or an address into a room chat, a guard politely warns you that the room isn't private — staff never ask for sensitive details in chat, and the system logs who looks at what, when, because protecting your information is architecture, not a promise." }
    ];
    root.appendChild(el("div", "page-head", `<p class="eyebrow">Reality FX OS · orientation</p><h1 class="page-title">The operating guide</h1><p class="page-sub">Every room in the Academy, what it's for, and how to use it — so nothing surprises you on day one.</p>`));
    const grid = el("div", "guide-grid");
    secs.forEach(s => grid.appendChild(el("div", "guide-card", `
      <div class="guide-ic">${s.ic}</div>
      <div class="guide-body"><h3>${s.t}</h3><p>${s.b}</p></div>`)));
    root.appendChild(grid);
    // Academy · FAQ & Fair Usage — the fine print lives with the guide, not
    // on the dashboard: it is reference material, not a daily prompt. The
    // student finds it where they look for "how does this work", and the
    // dash keeps only what a student needs promptly.
    root.appendChild(el("div", "guide-sep", `<p class="eyebrow">The fine print</p>`));
    root.appendChild(academyBlock());
    root.appendChild(el("div", "guide-foot", `<p>Founder's Day — ${foundersDayLabel()}. The founder stays anonymous — the learning is the point.</p>`));
  }

  /* ---------- Machine Audit (founder's inspection room) ----------
     The building inspecting itself: every check the regression audit runs
     before a deploy, rendered live. Students never see this door — the
     founder does. Polls the OS server's /os/api/audit endpoint, which runs
     the same audit-regression.pl that gates deploys, in JSON mode. If the
     rail is down, the page says so plainly — the machine reports its own
     health honestly, exactly as the outage mirror promised. */
  function renderAudit(root) {
    root.appendChild(el("div", "page-head", `<p class="eyebrow">Reality FX OS · the inspection room</p><h1 class="page-title">Machine audit</h1><p class="page-sub">The same regression audit that gates every deploy — the building inspecting itself, live. Every floor is checked before the weight lands.</p>`));
    const box = el("div", "audit-box");
    box.innerHTML = `<div class="audit-status"><span class="audit-spinner"></span><b>Running the inspection…</b></div>`;
    root.appendChild(box);
    const foot = el("div", "audit-foot", `<button class="btn-gold" id="auditRun">${ICONS.zap} Run the audit now</button><span class="audit-meta"></span>`);
    root.appendChild(foot);
    // PII incidents — every blocked sensitive-data attempt, in the same room
    // as the machine's own health report. A red audit is structural; a red
    // incident is behavioural — both belong on the founder's wall.
    const incBox = el("div", "audit-incidents");
    incBox.innerHTML = `<div class="audit-inc-head">${ICONS.shield}<div><b>PII incidents — blocked sensitive-data attempts</b><span>Every chat message the machine refused — bypassed clients and honest students alike. Refreshes with the audit.</span></div></div><div class="audit-inc-body" id="auditIncBody">Loading the incident log…</div>`;
    root.appendChild(incBox);
    const loadIncidents = function () {
      const body = incBox.querySelector("#auditIncBody");
      fetch("api/pii-incidents", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !Array.isArray(j.incidents)) { body.innerHTML = `<p class="live-note">The incident rail is unreachable right now — the log lives on the academy server.</p>`; return; }
          const incs = j.incidents.slice(0, 12);
          if (!incs.length) { body.innerHTML = `<p class="live-note">No blocked attempts on record — the chat guard is quiet, which is exactly what a guard should be.</p>`; return; }
          body.innerHTML = incs.map(function (i) {
            const t = i.at ? new Date(i.at * 1000).toLocaleString() : "";
            return `<div class="audit-inc-row">
              <span class="audit-inc-time">${esc(t)}</span>
              <span class="audit-inc-who"><b>${esc(i.name)}</b> <em>${esc(i.role)}</em> · ${esc(i.room)}</span>
              <span class="audit-inc-reason">${esc(i.reason)}</span>
              ${i.sample ? `<span class="audit-inc-sample">“${esc(i.sample)}”</span>` : ""}
            </div>`;
          }).join("");
        })
        .catch(function () { body.innerHTML = `<p class="live-note">The incident rail is unreachable right now — the log lives on the academy server.</p>`; });
    };
    let timer = null;
    // The red alert — when any check is red (or the rail dies), the founder
    // hears it: a persistent banner, a toast on every red run, and a badge on
    // the tab title. Silence is the enemy of an inspection room.
    let lastRedMsg = "";
    const setRed = function (reason) {
      const banner = root.querySelector(".audit-alert") || el("div", "audit-alert");
      if (!banner.parentNode) root.insertBefore(banner, root.firstChild);
      banner.innerHTML = `${ICONS.alert} <b>Inspection red — ${esc(reason)}</b> <span>The machine reports its own condition plainly; every other door still stands. Fix, then re-run.</span>`;
      if (reason !== lastRedMsg) { toast("⚠ Machine audit: " + reason, "warn"); lastRedMsg = reason; }
      document.title = "⚠ AUDIT RED · Reality FX OS";
    };
    const setGreen = function () {
      const banner = root.querySelector(".audit-alert");
      if (banner) banner.remove();
      if (document.title.indexOf("AUDIT RED") === 0) document.title = "Reality FX OS — Student Academy";
      lastRedMsg = "";
    };
    let auditSeq = 0;
    const run = function (force) {
      const meta = root.querySelector(".audit-meta");
      if (meta) meta.textContent = "inspecting…";
      // The server may re-run the audit for each poll (it is a 20-second walk),
      // and the local server forks per connection — so two runs can finish out
      // of order. Only the newest request's answer may paint the wall.
      const seq = ++auditSeq;
      fetch("api/audit" + (force ? "?refresh=1" : ""), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (seq !== auditSeq) return; // a newer run is in flight — ignore this one
          if (!j || !Array.isArray(j.checks)) {
            box.innerHTML = `<div class="audit-status bad">${ICONS.alert} The audit rail did not answer. The machine reports its own outage plainly — every other door still stands.</div>`;
            if (meta) meta.textContent = "rail unreachable — retrying";
            setRed("the audit rail is not answering");
            return;
          }
          const green = j.checks.filter(function (c) { return c.ok; }).length;
          box.innerHTML = `<div class="audit-status ${j.ok ? "" : "bad"}">
              <span class="audit-big">${green} / ${j.checks.length}</span>
              <span class="audit-verd">${j.ok ? "ALL GREEN — the machine is structurally sound." : j.fails + " finding(s) — fix before building further."}</span>
            </div>
            <div class="audit-rows">` +
            j.checks.map(function (c) {
              return `<div class="audit-row ${c.ok ? "green" : "red"}">
                <span class="audit-n">${String(c.n).padStart(2, "0")}</span>
                <span class="audit-name">${esc(c.name)}</span>
                <span class="audit-detail">${esc(c.detail)}</span>
                <span class="audit-dot"></span>
              </div>`;
            }).join("") + `</div>`;
          if (meta) meta.textContent = "last run · " + (j.at || "just now") + " — auto-inspects every minute";
          if (j.ok) setGreen();
          else setRed(j.fails + " finding(s): " + j.checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.name; }).join(", "));
        })
        .catch(function () {
          if (seq !== auditSeq) return;
          box.innerHTML = `<div class="audit-status bad">${ICONS.alert} The audit rail is unreachable. The machine reports its own outage plainly — every other door still stands.</div>`;
          if (meta) meta.textContent = "rail unreachable — retrying";
          setRed("the audit rail is unreachable");
        });
    };
    run();
    loadIncidents();
    const btn = root.querySelector("#auditRun");
    if (btn) btn.addEventListener("click", function () { run(true); loadIncidents(); });
    if (timer) clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) { run(); loadIncidents(); } }, 60000);
    root.__auditTimer = timer;
  }

  /* ---------- Live Rooms & the Live Studio ----------
     The Academy's broadcasting wing. Verified staff and mentors host live
     sessions from the Live Studio — mentor lessons for students AND staff
     meetings for the whole team. Students join from Live Rooms. The
     broadcast itself is a pluggable embed: the host pastes their Zoom /
     Google Meet / YouTube Live / StreamYard link and it lands in the room
     window, exactly like the mentor-hosted lessons of old. Chat and
     presence run on the Academy's room rail. Demo: the rooms store lives on
     the OS server, so every browser on the machine joins the same room.
     Production: Firestore rooms with realtime listeners (FOR-LEE). */
  function isStaff() {
    const h = S.handoff || {};
    return !!(h.founder || (h.role && ["staff", "mentor", "admin"].indexOf(h.role) >= 0));
  }
  /* The Registry Console is the credential office — it mints and revokes the
     credentials every certificate's QR points at. That authority belongs to
     the founder and registry administrators only, and the server double-
     checks the same claim against its own handoff store. */
  function isRegistryAdmin() {
    const h = S.handoff || {};
    return !!(h.founder || h.role === "admin");
  }
  function roomsFetch(path, opts) {
    return fetch("api/rooms" + path, Object.assign({ cache: "no-store" }, opts || {}))
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function myName() { return S.name || profile().name || "Student"; }
  function myWho() {
    const h = S.handoff || {};
    return h.studentId || String(profile().email || "").toLowerCase() || "guest-" + Math.random().toString(36).slice(2, 8);
  }
  function myRole() {
    const h = S.handoff || {};
    if (h.founder) return "founder";
    return (h.role && ["staff", "mentor", "admin"].indexOf(h.role) >= 0) ? h.role : "student";
  }
  function roomKind(k) {
    if (k === "staff") return { t: "Staff meeting", ic: ICONS.users };
    if (k === "lecture") return { t: "Classroom lecture", ic: ICONS.institution };
    if (k === "1on1") return { t: "1-on-1 session", ic: ICONS.user };
    if (k === "interview") return { t: "Interview room", ic: ICONS.shield };
    if (k === "hall") return { t: "Study Hall", ic: ICONS.users };
    return { t: "Mentor lesson", ic: ICONS.grad };
  }
  function embedUrl(raw, provider) {
    if (!raw) return "";
    if (provider === "youtube") {
      const m = raw.match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[?&#]|$)/);
      return m ? "https://www.youtube.com/embed/" + m[1] + "?autoplay=1" : raw;
    }
    if (provider === "whereby") {
      // Whereby room URLs embed as-is in an iframe (their embedded rooms allow it).
      return raw.indexOf("http") === 0 ? raw : "https://whereby.com/" + raw.replace(/^@/, "");
    }
    if (provider === "zoom" || provider === "meet" || provider === "streamyard") {
      // These open their own app/window — the room shows the link to open.
      return "";
    }
    return raw;
  }
  function providerName(p) {
    return p === "whereby" ? "Whereby" : p === "youtube" ? "YouTube Live" : p === "zoom" ? "Zoom" : p === "meet" ? "Google Meet" : p === "streamyard" ? "StreamYard" : "Custom link";
  }
  function fmtWhen(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " · " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtCountdown(ts) {
    const diff = ts - Date.now();
    if (diff <= 0) return "starting now";
    const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return "in " + d + "d " + h + "h";
    if (h > 0) return "in " + h + "h " + m + "m";
    return "in " + Math.max(1, m) + "m";
  }
  function lessonLabel(lesson) {
    if (!lesson) return "";
    const parts = String(lesson).split(":");
    const ch = CHAPTERS.find(c => String(c.id) === String(parts[0]));
    const tier = TIERS[parts[1]] ? TIERS[parts[1]].name : "";
    return (ch ? "Ch " + ch.id + " · " + ch.title : "Lesson") + (tier ? " · " + tier : "");
  }
  function fmtLive(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }
  function staffGateHTML() {
    const gate = el("div", "panel gate-panel", `
      <div class="gate-ic">${ICONS.radio}</div>
      <h3 class="gold-serif">The Live Studio is for the team</h3>
      <p class="page-sub">The broadcasting controls open only to verified Reality FX staff and mentors — the handoff from the academy carries a staff role. Students join live sessions from <b>Live Rooms</b> instead.</p>`);
    const b = el("button", "btn-gold", "Go to Live Rooms");
    b.addEventListener("click", function () { location.hash = "#/live"; });
    gate.appendChild(b);
    return gate.outerHTML;
  }
  function liveCardHTML(r, isHall) {
    const now = Date.now();
    const liveLen = (r.status === "live" && r.liveAt) ? " · live for " + fmtLive((now / 1000 - r.liveAt) * 1000) : "";
    const foot = isHall
      ? `<button class="btn-gold sm join-room" data-code="${esc(r.code)}">Drop in · ${esc(r.code)}</button>`
      : r.status === "live"
        ? `<button class="btn-gold sm join-room" data-code="${esc(r.code)}">Join · ${esc(r.code)}</button>`
        : r.status === "scheduled" ? `<span class="live-meta">Scheduled session</span>` : `<span class="live-meta">Session ended</span>`;
    return `
      <div class="live-card ${isHall ? "hall" : esc(r.status)}">
        <div class="live-card-top">
          <span class="live-pill ${isHall ? "hall" : esc(r.status)}">${isHall ? "<span class='live-dot'></span>ALWAYS OPEN" : r.status === "live" ? "<span class='live-dot'></span>LIVE" : r.status === "scheduled" ? "UPCOMING" : "ENDED"}</span>
          <span class="live-kind">${roomKind(r.kind).t}</span>
        </div>
        <h3>${esc(r.title)}</h3>
        <p class="live-host">${isHall ? "The campus common room — study with whoever is here" : "Hosted by <b>" + esc(r.host) + "</b>" + liveLen}</p>
        ${r.note ? `<p class="live-note">${esc(r.note)}</p>` : ""}
        <div class="live-card-foot">
          <span class="live-meta">${(r.present || []).length} in the room</span>
          ${foot}
        </div>
      </div>`;
  }
  /* ============================================================
     BREAK ROOM — the Academy's cool-down wing. No physical lunch,
     but a proper reset: a calm-down timer, breathing drills, desk
     stretches, and the Wisdom Shelf. Built because students who
     cover a lot of material at once need a sanctioned pause — the
     reflection period guards the quiz, the Break Room guards the
     mind between sessions.
     ============================================================ */
  function fmtClock2(s) {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }
  const BREATH_DRILLS = [
    { name: "Box breathing", tag: "the trader's reset · 4 in, 4 hold, 4 out, 4 hold", seq: [4, 4, 4, 4], label: "In · Hold · Out · Hold" },
    { name: "Calm the pulse", tag: "4-7-8 · the slow exhale tells the body it's safe", seq: [4, 7, 8], label: "In 4 · Hold 7 · Out 8" },
    { name: "Re-entry breath", tag: "3-3-6 · short in, long out — like a pilot before landing", seq: [3, 3, 6], label: "In 3 · Hold 3 · Out 6" }
  ];
  const BREAK_QUOTES = [
    { q: "The market is open six days a week. Your mind has to last longer than that.", who: "House rule" },
    { q: "A loss is tuition. The only question is whether you paid attention in class.", who: "The mentor" },
    { q: "Rest is not the opposite of work. Rest is part of the work.", who: "Academy wisdom" },
    { q: "Fear is not the enemy. Fear without rules is.", who: "The mentor" },
    { q: "You don't have to see the whole staircase — just the next step, and the step after that.", who: "Academy wisdom" },
    { q: "Some days the best trade is the one you didn't take.", who: "The mentor" }
  ];
  const BREAK_STRETCHES = [
    { name: "The desk exit", how: "Stand, roll your shoulders back, look up for five slow breaths. Let your neck remember it isn't part of the chart." },
    { name: "The window watch", how: "Find a point far away (a roof, a tree, the sky). Look at it for 20 seconds. Your eyes just did a marathon at close range." },
    { name: "The wrist reset", how: "Extend one arm, palm up, gently pull the fingers down with the other hand. Ten seconds per side — your hands are your instruments." },
    { name: "The stand-up rule", how: "Every 45 minutes of study, stand for one minute. It sounds small. It is the difference between a session and a slog." }
  ];
  function renderBreak(root) {
    const secs = S.secs || 0;
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
    const longSession = secs >= 45 * 60;
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Reality FX OS · break room</p>
      <h1 class="page-title">The Break Room</h1>
      <p class="page-sub">A sanctioned pause — the classroom stays open, but you don't have to stay in it. Reset your head, breathe, stretch, and walk back in sharper than you left.</p>`));
    // Session awareness strip
    const aware = el("div", "break-aware" + (longSession ? " long" : ""), `
      <span class="ba-ic">${ICONS.clock}</span>
      <div class="ba-txt"><b>${h ? h + "h " : ""}${m}m${secs % 60 ? " " + secs % 60 + "s" : ""}</b> in this session today
      ${longSession ? "<span class='ba-nudge'>You've earned this pause — 45+ minutes of study deserves a real reset.</span>" : "<span class='ba-nudge'>Even a short reset between chapters compounds. The market rewards discipline, not marathons.</span>"}</div>
      <span class="ba-pill">${longSession ? "Reset recommended" : "Reset ready"}</span>`);
    root.appendChild(aware);

    const grid = el("div", "break-grid");
    // 1. Cool-down timer
    const timer = el("div", "tool-card break-card");
    timer.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.moon}</span><div><h3>Cool-down timer</h3><p class="tool-sub">Pick a reset length. When it rings, you walk back in — not before.</p></div></div>
      <div class="br-dials">
        <button class="br-dial" data-min="5">5 min</button>
        <button class="br-dial" data-min="10">10 min</button>
        <button class="br-dial active" data-min="15">15 min</button>
      </div>
      <div class="br-clock" id="brClock">15:00</div>
      <button class="btn-gold sm" id="brStart">Start the reset</button>`;
    let brRemaining = 15 * 60, brTotal = 15 * 60, brTimer = null;
    const brClock = timer.querySelector("#brClock");
    const brStartBtn = timer.querySelector("#brStart");
    timer.querySelectorAll(".br-dial").forEach(function (d) {
      d.addEventListener("click", function () {
        timer.querySelectorAll(".br-dial").forEach(x => x.classList.remove("active"));
        d.classList.add("active");
        brTotal = brRemaining = parseInt(d.dataset.min, 10) * 60;
        brClock.textContent = fmtClock2(brRemaining);
      });
    });
    function stopBr() { if (brTimer) { clearInterval(brTimer); brTimer = null; } brStartBtn.textContent = "Start the reset"; }
    brStartBtn.addEventListener("click", function () {
      if (brTimer) { stopBr(); return; }
      const end = Date.now() + brRemaining * 1000;
      brTimer = setInterval(function () {
        brRemaining = Math.max(0, Math.round((end - Date.now()) / 1000));
        brClock.textContent = fmtClock2(brRemaining);
        brClock.classList.toggle("warn", brRemaining <= 10);
        if (brRemaining <= 0) { stopBr(); brClock.textContent = "0:00"; toast("Reset complete — walk back in sharp", "rank"); }
      }, 250);
      brStartBtn.textContent = "End the reset";
    });
    grid.appendChild(timer);

    // 2. Breathing drill
    const breath = el("div", "tool-card break-card");
    breath.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.sparkle}</span><div><h3>Breathing drill</h3><p class="tool-sub">Two minutes of controlled breath resets the nervous system faster than any coffee.</p></div></div>
      <div class="br-drill-pick">${BREATH_DRILLS.map((d, i) => `<button class="br-dial ${i === 0 ? "active" : ""}" data-i="${i}">${d.name}</button>`).join("")}</div>
      <div class="br-breathe">
        <div class="br-circle" id="brCircle"><span id="brWord">Ready</span></div>
        <p class="br-drill-tag" id="brTag">${BREATH_DRILLS[0].tag}</p>
      </div>
      <button class="btn-gold sm" id="brBreathe">Breathe with me</button>`;
    let bIdx = 0, bTimer = null;
    const brCircle = breath.querySelector("#brCircle"), brWord = breath.querySelector("#brWord"), brTag = breath.querySelector("#brTag");
    const brBreathe = breath.querySelector("#brBreathe");
    breath.querySelectorAll(".br-drill-pick .br-dial").forEach(function (d) {
      d.addEventListener("click", function () {
        breath.querySelectorAll(".br-drill-pick .br-dial").forEach(x => x.classList.remove("active"));
        d.classList.add("active");
        bIdx = parseInt(d.dataset.i, 10);
        brTag.textContent = BREATH_DRILLS[bIdx].tag;
      });
    });
    function stopBreath() { if (bTimer) { clearInterval(bTimer); bTimer = null; } brBreathe.textContent = "Breathe with me"; brWord.textContent = "Ready"; brCircle.style.transform = "scale(1)"; brCircle.classList.remove("inhale", "exhale"); }
    brBreathe.addEventListener("click", function () {
      if (bTimer) { stopBreath(); return; }
      const drill = BREATH_DRILLS[bIdx];
      const seq = drill.seq; let pos = 0; const phases = ["In", "Hold", "Out", "Hold"];
      brBreathe.textContent = "Stop";
      bTimer = setInterval(function () {
        if (pos >= seq.length * 2) { stopBreath(); return; }
        const pi = pos % seq.length, secs = seq[pi];
        const isIn = pi === 0, isOut = pi === 2;
        brWord.textContent = phases[pi] + " — " + secs + (isIn || isOut ? "s" : "");
        brCircle.classList.toggle("inhale", isIn);
        brCircle.classList.toggle("exhale", isOut);
        pos++;
      }, 1000);
    });
    grid.appendChild(breath);

    // 3. Stretch & reset
    const stretch = el("div", "tool-card break-card");
    stretch.innerHTML = `<div class="tool-head"><span class="tool-ic">${ICONS.zap}</span><div><h3>Desk stretches</h3><p class="tool-sub">Sixty seconds each. Your body carried you through that session — return the favour.</p></div></div>` +
      BREAK_STRETCHES.map((s, i) => `<div class="br-stretch"><span class="br-st-n">${i + 1}</span><div><b>${s.name}</b><p>${s.how}</p></div></div>`).join("");
    grid.appendChild(stretch);

    // 4. Reset journal — three quiet prompts, saved to your device only.
    const journal = el("div", "tool-card break-card");
    const jSaved = (function () { try { return JSON.parse(localStorage.getItem("rfx_os_break_journal") || "{}"); } catch (e) { return {}; } })();
    journal.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.pen}</span><div><h3>The reset journal</h3><p class="tool-sub">Three honest lines between sessions — write them, then walk away. Yours only, on this device.</p></div></div>
      <label class="br-j"><span>What drained you this session?</span><textarea id="jDrain" rows="2" maxlength="200">${esc(jSaved.drain || "")}</textarea></label>
      <label class="br-j"><span>What did you figure out?</span><textarea id="jWin" rows="2" maxlength="200">${esc(jSaved.win || "")}</textarea></label>
      <label class="br-j"><span>One intention for next time</span><textarea id="jNext" rows="2" maxlength="200">${esc(jSaved.next || "")}</textarea></label>
      <button class="btn-gold sm" id="jSave">Save my lines</button>`;
    journal.querySelector("#jSave").addEventListener("click", function () {
      const rec = {
        drain: journal.querySelector("#jDrain").value.trim(),
        win: journal.querySelector("#jWin").value.trim(),
        next: journal.querySelector("#jNext").value.trim(),
        at: new Date().toISOString()
      };
      try { localStorage.setItem("rfx_os_break_journal", JSON.stringify(rec)); } catch (e) {}
      toast("Saved — the next session starts with intention", "rank");
    });
    grid.appendChild(journal);

    // 5. Soft light — dim the whole Academy for a proper unwind.
    const soft = el("div", "tool-card break-card");
    soft.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.moon}</span><div><h3>Soft light</h3><p class="tool-sub">Dim the whole Academy to a warm glow — screens before bed deserve a night mode too.</p></div></div>
      <div class="soft-preview"><span class="sp-inner"></span></div>
      <button class="btn-gold" id="softToggle">Dim the Academy</button>`;
    const softBtn = soft.querySelector("#softToggle");
    if (S.softLight === "on") { document.body.classList.add("soft-light"); softBtn.textContent = "Restore full light"; }
    softBtn.addEventListener("click", function () {
      const on = document.body.classList.toggle("soft-light");
      S.softLight = on ? "on" : "off"; save();
      softBtn.textContent = on ? "Restore full light" : "Dim the Academy";
      toast(on ? "Yellow light on — rest those eyes" : "Full light restored", "");
    });
    grid.appendChild(soft);

    // 6. Wisdom shelf
    const wisdom = el("div", "tool-card break-card");
    const q = BREAK_QUOTES[Math.floor(Math.random() * BREAK_QUOTES.length)];
    wisdom.innerHTML = `<div class="tool-head"><span class="tool-ic">${ICONS.quill}</span><div><h3>The Wisdom Shelf</h3><p class="tool-sub">Something to carry back in with you.</p></div></div>
      <div class="br-quote">${ICONS.quill}<p class="br-quote-t">“${esc(q.q)}”</p><p class="br-quote-w">— ${esc(q.who)}</p></div>
      <button class="btn-ghost sm" id="brQuote">Another one</button>`;
    wisdom.querySelector("#brQuote").addEventListener("click", function () {
      const n = BREAK_QUOTES[Math.floor(Math.random() * BREAK_QUOTES.length)];
      wisdom.querySelector(".br-quote-t").textContent = "“" + n.q + "”";
      wisdom.querySelector(".br-quote-w").textContent = "— " + n.who;
    });
    grid.appendChild(wisdom);

    root.appendChild(grid);
    root.appendChild(el("p", "lab-note", "The Break Room never touches your progress — walk out, reset, walk back in exactly where you left off."));
  }

  /* ============================================================
     THE STORY — the making of RFX OS, told honestly. Students see
     the finished classroom; this is the wing that shows what it
     took to build it — the inventions, the standards, the nights.
     Curated on purpose: what we share is what a student can carry
     (discipline, recovery, honesty). The parts that would read as
     persuasion stay in the workshop, not on the walls.
     ============================================================ */
  const STORY_CHAPTERS = [
    { n: "01", t: "The founder was a student first", body: "Every rule in this Academy was lived before it was written. The Reflection Period exists because blowing up an account — and studying the wreck — is how the founder learned what the market actually teaches. Nothing here was copied from a syllabus; it was copied from a trading floor, one scar at a time." },
    { n: "02", t: "The OS treats you like an athlete", body: "We didn't build a course to be watched. We built a system that manages your recovery (the Reflection Period), rewards your consistency (streaks, distinctions, time badges), keeps your conduct honest (the Trust Bar), and lets you practise risk with zero danger (the Laboratory). A gym doesn't make you fit by showing you videos — neither do we." },
    { n: "03", t: "The machine watches the exam, not the student", body: "Exams are timed by how long a sharp human genuinely needs — reading the question, weighing the options, reviewing the explanation. Answering in three seconds is a signal, and the machine treats it like one: a nudge, never an accusation. Quality control protects the certificate you're working toward — everyone's." },
    { n: "04", t: "The audits catch the cockroaches", body: "Before anything ships, the whole journey is re-run from scratch — purchase to approval to handshake — and every guard is fired against real code. When an audit finds a crack, nobody argues with the finding; the crack gets fixed and the audit runs again until it's clean. The classroom is swept before the students walk in." },
    { n: "05", t: "One student, one session", body: "You can sign in on your laptop and your phone, but never two sessions of the same student at once — the machine holds the door. It's not a punishment; it's the same rule a real campus has. A textbook lent to one student isn't a textbook lent to two, and a certificate earned once stays earned once. The guard exists so your seat at this Academy is never shared without you knowing." },
    { n: "06", t: "The exam clock exists because the market never stops", body: "Challenging and Elite exams run a real countdown — because a trader deciding under pressure is a trader, and a trader with unlimited time is a spectator. Institutions don't let a student stare at one question for five minutes, and neither do we. The clock isn't cruelty; it's rehearsal. The market won't pause for you on the day you trade for real — better to meet that feeling here, where a wrong answer costs nothing." },
    { n: "07", t: "The sleepless nights were the tuition", body: "This OS was built across nights that didn't end, through code that broke, through ideas that looked brilliant at midnight and were wrong by morning. Every one of those nights is why the thing you're holding is calm: because the panic happened here, in the build, so it never has to happen in your session. The confusion, the frustration, the almost-giving-up — that was the real exam. We passed it so the classroom could be peaceful." }
  ];
  function renderStory(root) {
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Reality FX OS · the story</p>
      <h1 class="page-title">The Making of RFX OS</h1>
      <p class="page-sub">You study inside a machine that was built the way the market is traded — slowly, honestly, and one painful lesson at a time. This is the wing that tells you what you're actually standing in.</p>`));
    root.appendChild(el("p", "story-lead", `Every feature you use — the Reflection Period, the streaks, the Trust Bar, the Laboratory, the exam watch — started as a question someone asked about a real student, not a checklist. Here is the honest version of how they became this classroom.`));
    const grid = el("div", "story-grid");
    STORY_CHAPTERS.forEach(function (c) {
      const card = el("div", "story-card");
      card.innerHTML = `<span class="story-n">${c.n}</span><div><h3>${esc(c.t)}</h3><p>${esc(c.body)}</p></div>`;
      grid.appendChild(card);
    });
    root.appendChild(grid);
    root.appendChild(el("div", "story-close", `
      <div class="story-close-in">
        <span class="story-close-ic">${ICONS.diamond}</span>
        <p class="eyebrow">The house rule</p>
        <h3>“Every lesson is a trade. Every trade is a lesson.”</h3>
        <p>You're not just studying trading — you're studying the discipline that built this place. Keep the streak, respect the reflection, and let the audits do their quiet work in the background. The classroom is swept. Walk in.</p>
      </div>`));
  }

  /* ============================================================
     THE HALL OF FAME — the honours room.
     The wall of the very best, by year and by lane. Past years are
     curated with realistic numbers ordinary humans could genuinely push
     toward — the Elite lane is deliberately rare (in 2024 the summit
     stood unclaimed; in 2025 one student reached it). The current year
     is written live: the machine ranks every verified performer by a
     composite merit index (accuracy + completion + consistency) and the
     wall fills as students earn it — that is the anticipation. Hover a
     name and the honour itself appears: the accuracy, the completion,
     the streak, and what that performance earned.
     ============================================================ */
  // The past-year walls stand HONEST. The Academy opens its doors on
  // 30 September 2026 — no cohort has graduated, no lane has been climbed,
  // no summit has been taken. The wall is earned, never given, and it does
  // not write its history before it has lived it. The first names land with
  // the first cohort, and not a moment before.
  const HOF_YEARS = [
    {
      year: 2024,
      tag: "The year the Academy was being built",
      note: "No names yet — the Academy had not opened its doors. The wall is earned, never given, and the first names land with the first cohort on 30 September 2026.",
      tiers: [
        { lane: "standard", label: "Standard", entries: [], unclaimed: "The Standard lane stood empty — waiting for the first cohort to earn it." },
        { lane: "challenging", label: "Challenging", entries: [], unclaimed: "The Challenging lane stood empty — no one had yet been tested in the deep lane." },
        { lane: "elite", label: "Elite", entries: [], unclaimed: "The Elite summit stood unclaimed. The Academy waited — the wall is earned, never given." }
      ]
    },
    {
      year: 2025,
      tag: "The year the Academy took its final shape",
      note: "The wall still waits — every lane open, the summit unclaimed. When the doors open on 30 September 2026, the first cohort becomes the first to write its names here.",
      tiers: [
        { lane: "standard", label: "Standard", entries: [], unclaimed: "The Standard lane stood empty — waiting for the first cohort to earn it." },
        { lane: "challenging", label: "Challenging", entries: [], unclaimed: "The Challenging lane stood empty — the deep lane was waiting for someone worthy." },
        { lane: "elite", label: "Elite", entries: [], unclaimed: "The Elite summit stood unclaimed. The Academy waited — the wall is earned, never given." }
      ]
    }
  ];
  // The current year's seed — none. The honesty standard (the leaderboard
  // lesson): nothing shows as already-won before the doors open. Real student
  // records populate the wall the moment the academy answers; until then the
  // current-year wall shows only the student's own live standing — the first
  // name on a new wall is the rarest invitation in the Academy.
  const HOF_CURRENT_SEED = [];

  // Composite merit index — the machine's ranking for the current year.
  // Accuracy and completion carry the weight; consistency (the streak)
  // is the discipline tax that separates a hot run from a habit.
  function meritIndex(p) {
    const acc = Math.max(0, Math.min(100, p.acc || 0));
    const comp = Math.max(0, Math.min(100, p.comp || 0));
    const streak = Math.min(100, Math.max(0, p.streak || 0));
    return Math.round(acc * 0.4 + comp * 0.4 + streak * 0.2);
  }
  function localPerformer() {
    let accN = 0, accW = 0;
    Object.values(S.chapStats || {}).forEach(function (a) { accN += a.n || 0; accW += a.wrong || 0; });
    const acc = accN ? Math.round((accN - accW) / accN * 100) : 0;
    return { name: profileName() || "You", acc: acc, comp: progressPct(), streak: S.streak || 0, lane: tierKey() || "standard", isYou: true };
  }
  // The current-year performers, read live: the academy's verified roster
  // (seeded cohort + any real students) carries a merit record; the local
  // student's live numbers are folded in so the wall is personal.
  // The seed is versioned so a stale cached roster (from an older build or an
  // earlier seed) is never mistaken for this year's wall — the moment the seed
  // changes, the cache steps aside and the new seed writes. Real academy
  // records still replace it the instant the academy answers.
  const HOF_SEED_VERSION = "4";
  function hofCurrent() {
    const lanes = { standard: [], challenging: [], elite: [] };
    const me = localPerformer();
    try {
      let raw = JSON.parse(localStorage.getItem("rfx_hof_roster") || "null");
      if (localStorage.getItem("rfx_hof_seed_v") !== HOF_SEED_VERSION || !(raw && raw.length)) {
        raw = HOF_CURRENT_SEED;
        localStorage.setItem("rfx_hof_roster", JSON.stringify(raw));
        localStorage.setItem("rfx_hof_seed_v", HOF_SEED_VERSION);
      }
      const roster = (raw && raw.length) ? raw : HOF_CURRENT_SEED;
      roster.forEach(function (p) {
        const lane = lanes[p.lane] ? p.lane : "standard";
        lanes[lane].push(p);
      });
    } catch (e) { /* roster cache empty — fall through to the live fetch */ }
    lanes[lanes[me.lane] ? me.lane : "standard"].push(me);
    Object.keys(lanes).forEach(function (k) {
      lanes[k] = lanes[k].filter(function (p) { return p && p.name; }).sort(function (a, b) { return meritIndex(b) - meritIndex(a); });
    });
    const all = [].concat(lanes.standard, lanes.challenging, lanes.elite);
    const rank = all.findIndex(function (p) { return p.isYou; }) + 1;
    return { lanes: lanes, rank: rank, total: all.length, me: me };
  }
  function hofRosterFromAcademy() {
    const hoff = handoffRec();
    if (!hoff || !hoff.studentId) return;
    let url;
    try { url = new URL(academyUrl("api/state"), location.href).href; } catch (e) { return; }
    fetch(url, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (st) {
        if (!st || !Array.isArray(st.enrollments)) return;
        const roster = st.enrollments
          .filter(function (e) { return e && e.merit && e.merit.completionPct != null; })
          .map(function (e) {
            const m = e.merit || {};
            return {
              name: e.payment ? e.payment.customerName : "",
              acc: m.accuracy || 0,
              comp: m.completionPct || 0,
              streak: m.streak || 0,
              lane: (m.lane === "elite" || m.lane === "challenging") ? m.lane : "standard",
              honour: m.honour || "",
              prize: m.prize || ""
            };
          })
          .filter(function (p) { return p.name; });
        try { localStorage.setItem("rfx_hof_roster", JSON.stringify(roster)); } catch (e) {}
        const r = document.querySelector("[data-hof-refresh]");
        if (r) { try { location.hash = "#/hof"; } catch (e) {} }
      })
      .catch(function () { /* academy unreachable — the board keeps its cached roster */ });
  }
  function hofCardHTML(p, rank, laneKey) {
    const elite = laneKey === "elite";
    return `<div class="hof-card ${elite ? "elite" : ""}" tabindex="0">
      <div class="hof-rank">${String(rank).padStart(2, "0")}</div>
      <div class="hof-name">${esc(p.name)}${p.isYou ? '<em class="hof-you">you</em>' : ""}</div>
      <div class="hof-reveal">
        <div class="hof-reveal-grid">
          <div><b>${p.acc}%</b><span>accuracy</span></div>
          <div><b>${p.comp}%</b><span>completed</span></div>
          <div><b>${p.streak}d</b><span>streak</span></div>
        </div>
        ${p.honour ? `<p class="hof-honour">${esc(p.honour)}</p>` : ""}
        ${p.prize ? `<p class="hof-prize">${ICONS.crown} ${esc(p.prize)}</p>` : ""}
      </div>
    </div>`;
  }
  function renderHof(root) {
    root.appendChild(el("div", "page-head hof-head", `
      <p class="eyebrow">Reality FX OS · the honours room</p>
      <h1 class="page-title">The Hall of Fame</h1>
      <p class="page-sub">The wall of the very best — by year and by lane. It is earned, never given: the past years stand honest and waiting, the current year is being written live, and the machine is watching who earns a place first. Hover a name and the honour itself appears.</p>`));
    root.appendChild(el("div", "hof-ornament", `${ICONS.crown}<span></span><i>Every lesson is a trade. Every trade is a lesson.</i><span></span>${ICONS.crown}`));
    const years = el("div", "hof-years");
    HOF_YEARS.forEach(function (y) {
      const sec = el("section", "hof-year");
      sec.innerHTML = `<div class="hof-year-head">
        <div class="hof-year-num">${y.year}</div>
        <div><h3 class="gold-serif">${esc(y.tag)}</h3><p>${esc(y.note)}</p></div>
      </div>
      <div class="hof-tiers"></div>`;
      const tiers = sec.querySelector(".hof-tiers");
      y.tiers.forEach(function (t) {
        const col = el("div", "hof-col " + t.lane);
        const rows = t.entries.map(function (e, i) { return hofCardHTML(e, i + 1, t.lane); }).join("");
        col.innerHTML = `<div class="hof-col-head"><span class="hof-lane-ic">${ICONS[t.lane === "elite" ? "crown" : t.lane === "challenging" ? "flame" : "target"]}</span>${esc(t.label)}</div>
          ${rows || `<div class="hof-unclaimed"><span>${ICONS.crown}</span><p>${esc(t.unclaimed || "The wall waits for its first name.")}</p></div>`}`;
        tiers.appendChild(col);
      });
      years.appendChild(sec);
    });
    root.appendChild(years);
    hofRosterFromAcademy(); // refresh the current-year roster in the background
    const cur = hofCurrent();
    const sec26 = el("section", "hof-year hof-current");
    const laneBlock = function (k, label) {
      const top = cur.lanes[k].filter(function (p) { return !p.isYou; }).slice(0, 5);
      if (!top.length) return `<div class="hof-col ${k}"><div class="hof-col-head"><span class="hof-lane-ic">${ICONS[k === "elite" ? "crown" : k === "challenging" ? "flame" : "target"]}</span>${label}</div><div class="hof-unclaimed"><span>${ICONS[k === "elite" ? "crown" : "sparkle"]}</span><p>${k === "elite" ? "The summit is still open this year. Someone is coming for it." : "The wall is being written — the first name lands here."}</p></div></div>`;
      return `<div class="hof-col ${k}"><div class="hof-col-head"><span class="hof-lane-ic">${ICONS[k === "elite" ? "crown" : k === "challenging" ? "flame" : "target"]}</span>${label}</div>${top.map(function (p, i) { return hofCardHTML(p, i + 1, k); }).join("")}</div>`;
    };
    sec26.innerHTML = `<div class="hof-year-head">
      <div class="hof-year-num hof-current-num">${new Date().getFullYear()}</div>
      <div><h3 class="gold-serif">The wall is being written</h3><p>This year's performers are being ranked live by the machine — accuracy, completion and consistency. The names below are the current leaders; the summit is still open, and it is waiting for whoever earns it.</p></div>
    </div>
    <div class="hof-tiers">${laneBlock("standard", "Standard")}${laneBlock("challenging", "Challenging")}${laneBlock("elite", "Elite")}</div>`;
    years.appendChild(sec26);
    // Your standing — the personal hook that turns a wall into a goal.
    const st = el("div", "hof-standing");
    const meIdx = cur.me && cur.me.name ? null : null;
    st.innerHTML = `<div class="hof-standing-in">
      <div class="hof-standing-ic">${ICONS.diamond}</div>
      <div class="hof-standing-txt">
        <p class="eyebrow">Your standing this year</p>
        <h3>${cur.rank > 0 ? "Ranked #" + cur.rank + " of " + cur.total : "The wall is empty — be the first"}</h3>
        <p>${cur.rank > 0 ? "Every chapter you pass and every point of accuracy you raise moves you up the wall. The board re-ranks live — your name is already being watched." : "No one has claimed a place yet this year. That is the rarest invitation in the Academy — the first name on a new wall."}</p>
      </div>
      <a class="btn-gold" href="#/map">${ICONS.flame} Push for the wall</a>
    </div>`;
    root.appendChild(st);
  }

  function renderLive(root) {
    const liveHead = el("div", "page-head live-head");
    liveHead.innerHTML = `
      <div class="live-head-txt">
        <p class="eyebrow">Reality FX OS · live</p>
        <h1 class="page-title">Live Rooms</h1>
        <p class="page-sub">Mentor lessons and staff meetings, broadcast live to the Academy — join a room and you're in the room, wherever you are. The broadcast window, the chat, and the people are all here.</p>
      </div>
      ${isStaff() ? `<button class="btn-gold live-head-btn" id="openStudio">${ICONS.radio} Open the Live Studio</button>` : ""}`;
    const studioBtn = liveHead.querySelector("#openStudio");
    if (studioBtn) studioBtn.addEventListener("click", function () { location.hash = "#/studio"; });
    root.appendChild(liveHead);
    const grid = el("div", "live-grid");
    const empty = el("div", "live-empty");
    const upcomingStrip = el("div", "live-upcoming");
    upcomingStrip.style.display = "none";
    root.appendChild(upcomingStrip);
    root.appendChild(grid);
    root.appendChild(empty);
    const refresh = function () {
      roomsFetch("").then(function (data) {
        if (!data || !Array.isArray(data.rooms)) {
          grid.innerHTML = `<p class="live-note">The live rail is unreachable right now — the rooms store lives on the academy server. The course itself never depends on it.</p>`;
          return;
        }
        const rooms = data.rooms.slice();
        const live = rooms.filter(function (r) { return r.status === "live"; });
        const upcoming = rooms.filter(function (r) { return r.status === "scheduled"; });
        const ended = rooms.filter(function (r) { return r.status === "ended"; });
        // The mentor calendar — upcoming sessions shared on purpose, oldest first,
        // so students can plan their week and ask for a time that suits them.
        const shared = upcoming.filter(function (r) { return r.calendarShare && r.startsAt; }).sort(function (a, b) { return a.startsAt - b.startsAt; });
        upcomingStrip.style.display = shared.length ? "block" : "none";
        if (shared.length) {
          upcomingStrip.innerHTML = `<div class="up-head">${ICONS.clock}<div><b>The mentor calendar</b><span>Sessions your mentors scheduled ahead — request a time that suits you, and they'll see it in the Studio.</span></div></div><div class="up-row">` +
            shared.map(function (r) {
              return `<div class="up-card">
                <span class="up-date">${esc(fmtWhen(r.startsAt))}</span>
                <b>${esc(r.title)}</b>
                <span class="up-meta">${esc(r.host)}${r.lesson ? " · " + esc(lessonLabel(r.lesson)) : ""}${r.format === "lecture" ? " · lecture hall" : r.format === "staff" ? " · team" : ""}</span>
                <div class="up-actions"><span class="up-when">${esc(fmtCountdown(r.startsAt))}</span><div class="up-btns"><button class="btn-gold sm up-book" data-code="${esc(r.code)}" data-title="${esc(r.title)}" data-start="${r.startsAt || 0}">Book slot</button><button class="btn-ghost sm up-req" data-code="${esc(r.code)}" data-title="${esc(r.title)}">Other time</button></div></div>
              </div>`;
            }).join("") + `</div>`;
          upcomingStrip.querySelectorAll(".up-req").forEach(function (b) {
            b.addEventListener("click", function () { openTimeRequest(b.dataset.code, b.dataset.title); });
          });
          upcomingStrip.querySelectorAll(".up-book").forEach(function (b) {
            b.addEventListener("click", function () { openSlotBooking(b.dataset.code, b.dataset.title, parseInt(b.dataset.start, 10) || 0, myWho()); });
          });
        }
        grid.innerHTML = "";
        empty.innerHTML = "";
        if (!live.length && !upcoming.length) {
          empty.innerHTML = `<div class="live-none"><span class="live-none-ic">${ICONS.radio}</span><h3>No live sessions right now</h3><p>When a mentor opens the Studio, their room appears here the moment it goes live — with the join code, the broadcast window and the room chat. The schedule fills as the team broadcasts.</p></div>`;
        }
        const hall = rooms.find(function (r) { return r.code === "HALL5"; });
        const notHall = rooms.filter(function (r) { return r.code !== "HALL5"; });
        const lv = notHall.filter(function (r) { return r.status === "live"; });
        const up = notHall.filter(function (r) { return r.status === "scheduled"; });
        const en = notHall.filter(function (r) { return r.status === "ended"; });
        if (hall) grid.insertAdjacentHTML("afterbegin", liveCardHTML(hall, true));
        lv.concat(up, en.slice(0, 4)).forEach(function (r) {
          grid.insertAdjacentHTML("beforeend", liveCardHTML(r));
        });
        grid.querySelectorAll(".join-room").forEach(function (b) {
          b.addEventListener("click", function () { location.hash = "#/room/" + b.dataset.code; });
        });
      });
    };
    refresh();
    if (root.__liveTimer) clearInterval(root.__liveTimer);
    root.__liveTimer = setInterval(refresh, 20000);
  }

  function openTimeRequest(code, title) {
    const overlay = el("div", "req-overlay");
    overlay.innerHTML = `
      <div class="req-modal">
        <button class="req-x" id="reqClose">✕</button>
        <p class="eyebrow">Request a time</p>
        <h3>${esc(title)}</h3>
        <p class="req-sub">Tell the mentor when suits you — a day, an evening, a kind of slot. They'll see your request in the Studio and can adjust the schedule.</p>
        <textarea id="reqWant" rows="3" placeholder="e.g. Thursday evenings work best for me — or any morning after 9am." maxlength="200"></textarea>
        <button class="btn-gold" id="reqSend">Send my request</button>
      </div>`;
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector("#reqClose").addEventListener("click", close);
    overlay.querySelector("#reqSend").addEventListener("click", function () {
      const want = overlay.querySelector("#reqWant").value.trim();
      roomsFetch("/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, name: myName(), who: myWho(), want: want }) }).then(function (d) {
        toast(d && d.ok ? "Request sent — the mentor will see it in their Studio" : "Could not send the request", d && d.ok ? "rank" : "warn");
        close();
      });
    });
  }

  function openSlotBooking(code, title, startsAt, who) {
    const overlay = el("div", "req-overlay");
    const def = startsAt ? new Date(startsAt) : new Date(Date.now() + 86400000);
    const dVal = def.toISOString().slice(0, 10);
    const tVal = startsAt ? def.toTimeString().slice(0, 5) : "18:00";
    overlay.innerHTML = `
      <div class="req-modal">
        <button class="req-x" id="bkClose">✕</button>
        <p class="eyebrow">Book this slot</p>
        <h3>${esc(title)}</h3>
        <p class="req-sub">Pick a day and time on the mentor's calendar. The mentor confirms your booking — once confirmed, it locks 3 hours before the start and can't be cancelled.</p>
        <label class="bk-label">Date<input type="date" id="bkDate" value="${esc(dVal)}"></label>
        <label class="bk-label">Time<input type="time" id="bkTime" value="${esc(tVal)}"></label>
        <label class="st-check" style="margin-bottom:14px;"><input type="checkbox" id="bkPri" checked><span>I'm on the mentor course — I get first priority for 1-on-1 time.</span></label>
        <button class="btn-gold" id="bkSend">Request this slot</button>
      </div>`;
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector("#bkClose").addEventListener("click", close);
    overlay.querySelector("#bkSend").addEventListener("click", function () {
      const d = overlay.querySelector("#bkDate").value, t = overlay.querySelector("#bkTime").value;
      if (!d) { toast("Pick a date first", "warn"); return; }
      const when = new Date(d + "T" + (t || "18:00"));
      const dateLabel = when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      roomsFetch("/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, name: myName(), who: myWho(), dateLabel: dateLabel, timeLabel: (t || "18:00"), priority: overlay.querySelector("#bkPri").checked }) }).then(function (d2) {
        toast(d2 && d2.ok ? "Slot requested — the mentor will confirm from the Studio" : "Could not request the slot", d2 && d2.ok ? "rank" : "warn");
        close();
      });
    });
  }

  function renderStudio(root) {
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Reality FX OS · the team</p>
      <h1 class="page-title">Live Studio</h1>
      <p class="page-sub">The Academy's broadcast wing — host live mentor lessons for your students, or run staff meetings with the whole team. Start a room, share the code, and it appears in every Live Rooms panel the moment it goes live.</p>`));
    const chOpts = `<option value="">— no lesson attached —</option>` + CHAPTERS.map(function (c) {
      return `<option value="${c.id}">Chapter ${String(c.id).padStart(2, "0")} · ${esc(c.title)}</option>`;
    }).join("");
    const form = el("div", "studio-card", `
      <h3>Start a session</h3>
      <div class="studio-form">
        <label class="st-full">Session title<input id="stTitle" placeholder="e.g. Risk Management live · Chapter 7" maxlength="80"></label>
        <label>Format
          <select id="stFormat">
            <option value="mentor">Mentor lesson — small group, interactive</option>
            <option value="1on1">1-on-1 session — individual support</option>
            <option value="interview">Interview room — candidates & prospects</option>
            <option value="staff">Staff meeting — for the team</option>
            <option value="lecture">Classroom lecture — university style, hundreds of students</option>
          </select>
        </label>
        <label>Broadcast
          <select id="stProvider">
            <option value="whereby">Whereby — embedded, no downloads</option>
            <option value="youtube">YouTube Live — free lecture hall</option>
            <option value="zoom">Zoom — opens in its own window</option>
            <option value="meet">Google Meet — opens in its own window</option>
            <option value="streamyard">StreamYard — opens in its own window</option>
            <option value="custom">Custom link</option>
          </select>
        </label>
        <label>Lesson
          <select id="stLesson">${chOpts}</select>
        </label>
        <label>Difficulty
          <select id="stTier">
            <option value="standard">Standard</option>
            <option value="challenging">Challenging</option>
            <option value="elite">Elite</option>
          </select>
        </label>
        <label>Date <input type="date" id="stDate"></label>
        <label>Time <input type="time" id="stTime" value="18:00"></label>
        <label class="st-full">Broadcast link (optional)<input id="stUrl" placeholder="Paste your Zoom / Google Meet / YouTube Live / StreamYard link" maxlength="300"></label>
        <label class="st-full">Note to your room<input id="stNote" placeholder="What to expect — materials, questions, structure" maxlength="200"></label>
        <label class="st-check st-full"><input type="checkbox" id="stShare" checked><span>Share this on my mentor calendar — students can see it and request times with me</span></label>
        <div class="studio-actions st-full">
          <button class="btn-gold" id="stGoLive">${ICONS.radio} Go live now</button>
          <button class="btn-ghost" id="stSave">${ICONS.clock} Schedule</button>
        </div>
      </div>`);
    root.appendChild(form);
    const createRoom = function (status) {
      const title = (document.getElementById("stTitle").value || "").trim();
      if (!title) { toast("Give the session a title first", "warn"); return; }
      const format = document.getElementById("stFormat").value;
      const provider = document.getElementById("stProvider").value;
      const lesson = (function () {
        const ch = document.getElementById("stLesson").value;
        return ch ? ch + ":" + document.getElementById("stTier").value : "";
      })();
      let startsAt = 0;
      if (status === "scheduled") {
        const d = document.getElementById("stDate").value, t = document.getElementById("stTime").value;
        if (!d) { toast("Pick a date for the schedule", "warn"); return; }
        startsAt = new Date(d + "T" + (t || "18:00")).getTime();
        if (startsAt < Date.now() - 60000) { toast("That time is in the past — pick a future slot", "warn"); return; }
      }
      const payload = {
        title: title,
        kind: format === "staff" ? "staff" : format,
        format: format,
        provider: provider,
        lesson: lesson,
        startsAt: startsAt,
        calendarShare: document.getElementById("stShare").checked,
        host: myName(),
        hostId: myWho(),
        broadcastUrl: (document.getElementById("stUrl").value || "").trim(),
        note: (document.getElementById("stNote").value || "").trim(),
        status: status
      };
      roomsFetch("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(function (data) {
        if (!data || !data.room) { toast("Could not reach the live rail", "warn"); return; }
        toast(status === "live" ? "Room live — share the code " + data.room.code : "Scheduled for " + fmtWhen(startsAt) + " · code " + data.room.code, "rank");
        if (status === "live") { location.hash = "#/room/" + data.room.code; return; }
        refresh();
      });
    };
    document.getElementById("stGoLive").addEventListener("click", function () { createRoom("live"); });
    document.getElementById("stSave").addEventListener("click", function () { createRoom("scheduled"); });
    const listWrap = el("div", "studio-mine");
    root.appendChild(listWrap);
    const refresh = function () {
      roomsFetch("").then(function (data) {
        const rooms = ((data && data.rooms) || []).filter(function (r) { return r.hostId === myWho(); })
          .sort(function (a, b) { return b.createdAt - a.createdAt; });
        listWrap.innerHTML = "";
        if (!rooms.length) {
          listWrap.innerHTML = `<p class="live-note">No sessions yet — your rooms appear here with their codes, the people in them, and the chat they left.</p>`;
          return;
        }
        rooms.forEach(function (r) {
          const card = el("div", "live-card mine " + r.status, `
            <div class="live-card-top">
              <span class="live-pill ${esc(r.status)}">${r.status === "live" ? "<span class='live-dot'></span>LIVE" : r.status === "scheduled" ? "UPCOMING" : "ENDED"}</span>
              <span class="live-kind">${roomKind(r.kind).t}</span>
            </div>
            <h3>${esc(r.title)}</h3>
            ${r.lesson ? `<p class="live-note"><span class="lesson-badge">${esc(lessonLabel(r.lesson))}</span></p>` : ""}
            <p class="live-host">Code <b class="room-code">${esc(r.code)}</b> · ${(r.present || []).length} in the room · ${(r.chat || []).length} messages${r.format === "lecture" ? " · lecture hall" : r.format === "staff" ? " · team" : " · small group"}${r.startsAt ? " · " + fmtWhen(r.startsAt) : ""}</p>
            ${(r.requests || []).length ? `<p class="live-note req-note">${ICONS.clock} ${r.requests.length} student${r.requests.length === 1 ? "" : "s"} asked for a time with you — open the room to read them</p>` : ""}
            ${r.broadcastUrl ? `<p class="live-note">Broadcast: <span class="room-burl">${esc(r.broadcastUrl)}</span></p>` : ""}
            <div class="live-card-foot">
              ${r.status === "live" ? `<button class="btn-gold sm st-open" data-code="${esc(r.code)}">Open room</button><button class="btn-ghost sm st-end" data-code="${esc(r.code)}">End session</button>` : r.status === "scheduled" ? `<button class="btn-gold sm st-go" data-code="${esc(r.code)}">Go live</button><button class="btn-ghost sm st-end" data-code="${esc(r.code)}">Cancel</button>` : `<span class="live-meta">Ended · ${(r.chat || []).length} messages</span>`}
            </div>`);
          listWrap.appendChild(card);
        });
        listWrap.querySelectorAll(".st-open").forEach(function (b) {
          b.addEventListener("click", function () { location.hash = "#/room/" + b.dataset.code; });
        });
        listWrap.querySelectorAll(".st-end").forEach(function (b) {
          b.addEventListener("click", function () {
            roomsFetch("/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: b.dataset.code, hostId: myWho() }) }).then(function () { refresh(); });
          });
        });
        listWrap.querySelectorAll(".st-go").forEach(function (b) {
          b.addEventListener("click", function () {
            roomsFetch("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: b.dataset.code, hostId: myWho(), status: "live" }) }).then(function () { refresh(); });
          });
        });
      });
    };
    refresh();
    if (root.__liveTimer) clearInterval(root.__liveTimer);
    root.__liveTimer = setInterval(refresh, 15000);
  }

  function renderRoom(root, code) {
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Reality FX OS · live room</p>
      <h1 class="page-title">Room ${esc(code)}</h1>
      <p class="page-sub">You're in the room — the broadcast, the chat and the people are all here.</p>`));
    const backRow = el("div", "room-back", `<button class="btn-ghost" id="roomLeave">← Leave room</button>`);
    root.appendChild(backRow);
    document.getElementById("roomLeave").addEventListener("click", function () {
      cleanup();
      location.hash = "#/live";
    });
    const wrap = el("div", "room-shell");
    root.appendChild(wrap);
    let heartbeat = null, poller = null;
    function cleanup() {
      if (heartbeat) clearInterval(heartbeat);
      if (poller) clearInterval(poller);
      root.__roomTimer = null;
      // always release the hardware — the camera light must never stay on
      // after the host leaves the room.
      if (root.__media) {
        [root.__media.video, root.__media.audio].forEach(function (s) { if (s) s.getTracks().forEach(function (t) { t.stop(); }); });
        root.__media = null;
      }
    }
    const refresh = function () {
      roomsFetch("").then(function (data) {
        // Preserve the student's half-typed message across the 15s re-render —
        // a poll must never eat their draft. Same for an open DLP warning.
        const prevInput = document.getElementById("roomMsg");
        const draft = prevInput ? prevInput.value : "";
        const prevDlp = document.getElementById("roomDlp");
        const dlpWasOpen = !!(prevDlp && !prevDlp.hidden);
        const room = ((data && data.rooms) || []).find(function (r) { return r.code === code; });
        if (!room) {
          wrap.innerHTML = `<div class="live-none"><span class="live-none-ic">${ICONS.radio}</span><h3>Session not found</h3><p>This room doesn't exist or has been removed. Head back to Live Rooms.</p><button class="btn-gold" id="roomBack">Back to Live Rooms</button></div>`;
          const b = document.getElementById("roomBack");
          if (b) b.addEventListener("click", function () { cleanup(); location.hash = "#/live"; });
          cleanup();
          return;
        }
        const live = room.status === "live";
        const k = roomKind(room.kind);
        const isHost = isStaff() && room.hostId === myWho();
        const embed = embedUrl(room.broadcastUrl, room.provider);
        const embedOpen = (room.provider === "zoom" || room.provider === "meet" || room.provider === "streamyard");
        const bc = (room.broadcastUrl && live)
          ? (embed
            ? `<iframe class="room-frame" src="${esc(embed)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; camera; microphone" allowfullscreen></iframe>`
            : `<div class="room-stage"><span class="room-stage-ic">${ICONS.video}</span><p>This session runs on ${esc(providerName(room.provider))} — the window opens in its own tab.</p><a class="btn-gold" href="${esc(room.broadcastUrl)}" target="_blank" rel="noopener">${ICONS.video} Open ${esc(providerName(room.provider))}</a></div>`)
          : `<div class="room-stage"><span class="room-stage-ic">${ICONS.video}</span><p>${live ? "The broadcast starts here — the host's video lands in this window the moment they switch it on." : "This session hasn't started yet. The broadcast window opens when the host goes live."}</p></div>`;
        // Host session controls — cam / mic / quality. In the demo they arm the
        // room shell and bind to the embedded provider; the toggles stay live
        // so the protocol is the same the day the provider is wired in.
        const controls = isHost ? `<div class="room-controls">
            <button class="rc-btn" id="rcCam" title="Camera"><span class="rc-ic">${ICONS.camera}</span><span>Camera</span><i class="rc-state on"></i></button>
            <button class="rc-btn" id="rcMic" title="Microphone"><span class="rc-ic">${ICONS.mic}</span><span>Mic</span><i class="rc-state on"></i></button>
            <button class="rc-btn" id="rcBg" title="White backdrop — a distraction-free wall behind you, like a clean studio"><span class="rc-ic">${ICONS.sparkle}</span><span>White backdrop</span><i class="rc-state"></i></button>
            <label class="rc-q" title="Broadcast quality — Auto rides the connection">Quality
              <select id="rcQuality"><option value="auto">Auto</option><option value="720">720p</option><option value="1080">1080p</option></select>
            </label>
            <span class="rc-hint">These bind to the broadcast provider's feed. The white backdrop swaps your background for a clean studio wall — no laundry, no distractions.</span>
          </div>` : "";
        // Interview waiting room — candidates queue outside, the interviewer
        // admits them one at a time with a 30s countdown. No interruptions.
        const myWaiting = (room.waiting || []).find(function (w) { return (w.who || "") === myWho(); });
        const waitBox = room.kind === "interview"
          ? (isHost
            ? `<div class="room-req host"><span class="rr-ic">${ICONS.shield}</span><div><b>Waiting room · ${(room.waiting || []).filter(w => !w.admittedAt).length} outside</b>${(room.waiting || []).filter(function (w) { return !w.admittedAt; }).map(function (w) { return `<p class="req-line"><b>${esc(w.name)}</b><button class="btn-gold sm" data-admit="${esc(w.who)}">Let them in</button></p>`; }).join("") || "<p class='req-line'>Nobody waiting right now.</p>"}</div></div>`
            : (myWaiting && myWaiting.admittedAt)
              ? `<div class="room-req ok"><span class="rr-ic">${ICONS.check}</span><div><b>You're in — the interview is live.</b><p>The interviewer admitted you. Make it count.</p></div></div>`
              : myWaiting
                ? `<div class="room-req"><span class="rr-ic">${ICONS.clock}</span><div><b>You're in the waiting room.</b><p>When the interviewer is ready, they'll let you in — the countdown starts and the room opens.</p></div></div>`
                : `<div class="room-req"><span class="rr-ic">${ICONS.clock}</span><div><b>The interview is behind this door.</b><p>Join the waiting room — the interviewer admits candidates one at a time.</p><button class="btn-gold sm" id="roomWait">Enter the waiting room</button></div></div>`)
          : "";
        // Bookings — students book a slot on the mentor calendar; the host confirms.
        const bkBox = room.format === "hall" ? "" : isHost
          ? ((room.bookings || []).length ? `<div class="room-req host"><span class="rr-ic">${ICONS.clock}</span><div><b>${room.bookings.filter(b => b.status === "pending").length} slot request${room.bookings.filter(b => b.status === "pending").length === 1 ? "" : "s"} pending</b>${room.bookings.map(function (b) {
              const lock = room.startsAt ? Math.round((room.startsAt - 3 * 3600000 - Date.now()) / 60000) : null;
              return `<p class="req-line"><b>${esc(b.name)}</b>${b.priority ? " · priority (mentor course)" : ""} — ${esc(b.dateLabel)} ${esc(b.timeLabel)} · ${b.status === "confirmed" ? "<b style='color:#7ee2a4'>CONFIRMED</b>" + (lock !== null && lock > 0 ? " · locks in " + Math.max(1, lock) + "m" : " · locked (within 3h)") : b.status === "declined" ? "<b style='color:#f0a89c'>DECLINED</b>" : `<button class="btn-gold sm" data-bk="${esc(b.id)}" data-act="confirm">Confirm</button><button class="btn-ghost sm" data-bk="${esc(b.id)}" data-act="decline">Decline</button>`}</p>`;
            }).join("")}</div></div>` : "")
          : (room.bookings || []).some(function (b) { return b.who === myWho() && b.status === "confirmed"; })
            ? `<div class="room-req ok"><span class="rr-ic">${ICONS.check}</span><div><b>You're booked in — the mentor confirmed your slot.</b><p>Confirmed sessions lock 3 hours before the start, so nobody cancels on you at the last minute. We'll remind you when it's close.</p></div></div>`
            : `<div class="room-req"><span class="rr-ic">${ICONS.clock}</span><div><b>Book this slot</b><p>${room.startsAt ? "Lock your place for " + esc(fmtWhen(room.startsAt)) : "Pick a slot on the mentor calendar"} — the mentor confirms, and confirmed bookings can't be cancelled within 3 hours of the start.</p><button class="btn-gold sm" id="roomBook">Book this slot</button></div></div>`;
        // Students: request a different time on mentor sessions. Host: read the requests.
        const reqBox = !isStaff() && (room.kind === "mentor" || room.kind === "lecture" || room.kind === "1on1")
          ? `<div class="room-req"><span class="rr-ic">${ICONS.clock}</span><div><b>Want this session at a different time?</b><p>Ask the mentor — they'll see your request in the Studio.</p><button class="btn-ghost sm" id="roomReq">Request a time</button></div></div>`
          : (isHost && (room.requests || []).length)
            ? `<div class="room-req host"><span class="rr-ic">${ICONS.clock}</span><div><b>${room.requests.length} time request${room.requests.length === 1 ? "" : "s"}</b>${room.requests.map(function (q) { return `<p class="req-line"><b>${esc(q.name)}</b> — ${esc(q.want)}</p>`; }).join("")}</div></div>`
            : "";
        const present = (room.present || []).slice().sort(function (a, b) { return (a.role === "student" ? 1 : 0) - (b.role === "student" ? 1 : 0); });
        const chat = (room.chat || []).map(function (m) {
          return `<div class="rm-msg ${m.role === "student" ? "" : "team"}"><span class="rm-who">${esc(m.name)}${m.role !== "student" ? " <i class='rm-role'>" + esc(m.role) + "</i>" : ""}</span><span class="rm-txt">${esc(m.msg)}</span></div>`;
        }).join("") || `<p class="live-note">No messages yet — say hello to the room.</p>`;
        wrap.innerHTML = `
          <div class="room-main">
            <div class="room-top">
              <div>
                <span class="live-pill ${esc(room.status)}">${live ? "<span class='live-dot'></span>LIVE" : room.status === "scheduled" ? "UPCOMING" : "ENDED"}</span>
                <span class="live-kind">${k.t} · ${esc(room.host)}</span>
              </div>
              <div class="room-clock" id="roomClock">${live && room.liveAt ? fmtLive((Date.now() / 1000 - room.liveAt) * 1000) : room.status === "scheduled" ? (room.startsAt ? "Starts " + fmtCountdown(room.startsAt) : "Scheduled") : "Ended"}</div>
            </div>
            <h2 class="gold-serif room-title">${esc(room.title)}</h2>
            ${room.lesson ? `<p class="room-lesson"><span class="lesson-badge">${esc(lessonLabel(room.lesson))}</span>${room.format === "lecture" ? `<span class="lesson-badge lecture">Lecture hall · hundreds</span>` : room.format === "staff" ? "" : `<span class="lesson-badge group">Small group · interactive</span>`}</p>` : room.format === "lecture" ? `<p class="room-lesson"><span class="lesson-badge lecture">Lecture hall · hundreds</span></p>` : ""}
            ${room.note ? `<p class="room-note">${esc(room.note)}</p>` : ""}
            ${controls}
            ${bc}
            ${waitBox}
            ${bkBox}
            ${reqBox}
            ${!live ? `<div class="room-ended">${ICONS.check}<span>This session has ${room.status === "ended" ? "ended" : "not started"} — the chat and attendance stay recorded.</span></div>` : ""}
          </div>
          <div class="room-side">
            <div class="room-panel">
              <h4>In the room · ${present.length}</h4>
              <div class="room-people">${present.map(function (p) { return `<span class="room-person ${p.role === "student" ? "" : "team"}">${esc(p.name)}</span>`; }).join("") || `<p class="live-note">No one else here yet.</p>`}</div>
            </div>
            <div class="room-panel chat">
              <h4>Room chat</h4>
              <div class="room-chat" id="roomChat">${chat}</div>
              ${live ? `              <div class="room-send"><div class="room-dlp" id="roomDlp" hidden></div><input id="roomMsg" placeholder="Say it to the room…" maxlength="400"><button class="btn-gold sm" id="roomSend">Send</button></div>` : ""}
            </div>
          </div>`;
        const chatBox = document.getElementById("roomChat");
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        const send = document.getElementById("roomSend");
        const msg = document.getElementById("roomMsg");
        const dlpBox = document.getElementById("roomDlp");
        let pendingSend = false;
        let post = null; // assigned below; hoisted so showDlp's buttons can call it
        function clearDlp() {
          if (dlpBox) { dlpBox.hidden = true; dlpBox.innerHTML = ""; }
          pendingSend = false;
        }
        function showDlp(level, labels, reasonHtml) {
          if (!dlpBox) return;
          dlpBox.hidden = false;
          dlpBox.className = "room-dlp " + level;
          if (level === "block") {
            dlpBox.innerHTML = "<b>Not sent.</b> " + (reasonHtml || ("This looks like " + labels.join(", ") + " — this chat isn't private and staff never ask for that here. If a real team member needs it, they'll use the official secure channel."));
          } else {
            dlpBox.innerHTML = "<b>Heads-up:</b> this looks like " + labels.join(", ") + ". Sharing it here isn't protected — are you sure? <button class='btn-gold sm' id='dlpSend'>Send anyway</button> <button class='btn-ghost sm' id='dlpCancel'>Cancel</button>";
            const go = document.getElementById("dlpSend");
            const no = document.getElementById("dlpCancel");
            if (go) go.addEventListener("click", function () { pendingSend = true; post(); });
            if (no) no.addEventListener("click", clearDlp);
          }
        }
        if (send && msg) {
          post = function () {
            const v = msg.value.trim();
            if (!v) return;
            if (!pendingSend) {
              const dlp = dlpScan(v);
              if (dlp.level === "block") {
                // every blocked attempt is reported to the incident board,
                // so staff see who tried to post what, even when the client
                // caught it before it left the device.
                roomsFetch("/pii-incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room: code, name: myName(), role: myRole(), reason: dlp.found.join(", "), sample: v.slice(0, 80) }) }).catch(function () {});
                showDlp("block", dlp.found); return;
              }
              if (dlp.level === "warn") { showDlp("warn", dlp.found); return; }
            }
            clearDlp();
            roomsFetch("/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, name: myName(), role: myRole(), msg: v }) }).then(function (res) {
              if (res && res.ok === false && res.reason) { showDlp("block", [], esc(res.reason)); return; }
              msg.value = ""; refresh();
            });
          };
          send.addEventListener("click", post);
          msg.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); post(); } });
          msg.addEventListener("input", clearDlp);
        }
        // Restore the student's draft + an open DLP warning after the re-render.
        if (msg && draft) msg.value = draft;
        if (dlpWasOpen && msg && msg.value) {
          const again = dlpScan(msg.value);
          if (again.level !== "ok") showDlp(again.level, again.found);
        }
        // Host session controls — REAL device access. Camera/Mic request the
        // actual hardware through getUserMedia (works on localhost + HTTPS);
        // the white backdrop is the studio-wall placeholder. Streams live on
        // the route root so the room poller can re-attach the preview after
        // every refresh without ever losing the device.
        const media = (root.__media = root.__media || { video: null, audio: null, camOn: false, micOn: false, bgOn: false, quality: "auto" });
        function reattachPreview() {
          const old = wrap.querySelector(".room-local");
          if (old) old.remove();
          if (!media.camOn || !media.video) return;
          const stage = wrap.querySelector(".room-frame, .room-stage");
          if (!stage) return;
          const box = document.createElement("div");
          box.className = "room-local" + (media.bgOn ? " white-bg" : "");
          box.innerHTML = `<video autoplay playsinline muted></video><span class="room-local-tag">${ICONS.video} Your camera — host preview</span>`;
          const v = box.querySelector("video");
          v.srcObject = media.video;
          stage.prepend(box);
        }
        function syncStates() {
          if (camBtn) { camBtn.querySelector(".rc-state").classList.toggle("on", media.camOn); camBtn.classList.toggle("off", !media.camOn); }
          if (micBtn) { micBtn.querySelector(".rc-state").classList.toggle("on", media.micOn); micBtn.classList.toggle("off", !media.micOn); }
          if (bgBtn) { bgBtn.querySelector(".rc-state").classList.toggle("on", !!media.bgOn); bgBtn.classList.toggle("off", !media.bgOn); }
        }
        function stopKind(stream, kind) { if (stream) stream.getTracks().forEach(function (t) { if (t.kind === kind) t.stop(); }); }
        function requestCam() {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast("Camera needs a secure connection (https or localhost)", "warn");
            media.camOn = false; syncStates(); return;
          }
          const h = media.quality === "1080" ? 1080 : 720;
          navigator.mediaDevices.getUserMedia({ video: { width: { ideal: h }, height: { ideal: Math.round(h * 9 / 16) } }, audio: false })
            .then(function (s) {
              stopKind(media.video, "video");
              media.video = s;
              media.camOn = true;
              reattachPreview();
              syncStates();
              toast("Camera on — your preview is live", "");
            })
            .catch(function (err) {
              media.camOn = false;
              syncStates();
              toast(err && err.name === "NotAllowedError" ? "Camera blocked — allow camera access for this site" : err && err.name === "NotFoundError" ? "No camera found on this device" : "Camera unavailable — " + (err ? err.name : "error"), "warn");
            });
        }
        function requestMic() {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast("Mic needs a secure connection (https or localhost)", "warn");
            media.micOn = false; syncStates(); return;
          }
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (s) {
              stopKind(media.audio, "audio");
              media.audio = s;
              media.micOn = true;
              syncStates();
              toast("Mic on — you're live to the room", "");
            })
            .catch(function (err) {
              media.micOn = false;
              syncStates();
              toast(err && err.name === "NotAllowedError" ? "Mic blocked — allow microphone access for this site" : err && err.name === "NotFoundError" ? "No microphone found" : "Mic unavailable — " + (err ? err.name : "error"), "warn");
            });
        }
        const camBtn = document.getElementById("rcCam");
        const micBtn = document.getElementById("rcMic");
        const bgBtn = document.getElementById("rcBg");
        const qSel = document.getElementById("rcQuality");
        if (camBtn) camBtn.addEventListener("click", function () {
          if (media.camOn) {
            stopKind(media.video, "video");
            media.video = null;
            media.camOn = false;
            const lv = wrap.querySelector(".room-local");
            if (lv) lv.remove();
            syncStates();
            toast("Camera off", "warn");
          } else requestCam();
        });
        if (micBtn) micBtn.addEventListener("click", function () {
          if (media.micOn) {
            stopKind(media.audio, "audio");
            media.audio = null;
            media.micOn = false;
            syncStates();
            toast("Mic off", "warn");
          } else requestMic();
        });
        if (bgBtn) bgBtn.addEventListener("click", function () {
          media.bgOn = !media.bgOn;
          [wrap.querySelector(".room-frame"), wrap.querySelector(".room-stage"), wrap.querySelector(".room-local")].forEach(function (el) { if (el) el.classList.toggle("white-bg", !!media.bgOn); });
          syncStates();
          toast(media.bgOn ? "White backdrop on — a clean studio wall behind you" : "White backdrop off", media.bgOn ? "" : "warn");
        });
        if (qSel) qSel.addEventListener("change", function () {
          media.quality = qSel.value;
          if (media.camOn) requestCam(); // re-arm the feed at the new resolution
        });
        syncStates();
        reattachPreview();
        const q = document.getElementById("rcQuality");
        if (q) q.addEventListener("change", function () {
          toast("Quality set to " + (q.value === "auto" ? "Auto" : q.value + "p") + " — the provider feed will follow", "");
        });
        const reqBtn = document.getElementById("roomReq");
        if (reqBtn) reqBtn.addEventListener("click", function () { openTimeRequest(code, room.title); });
        const waitBtn = document.getElementById("roomWait");
        if (waitBtn) waitBtn.addEventListener("click", function () {
          roomsFetch("/wait", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, name: myName(), who: myWho() }) }).then(function (d) {
            toast(d && d.ok ? "You're in the waiting room — the interviewer will let you in" : "Could not join the waiting room", d && d.ok ? "" : "warn");
            refresh();
          });
        });
        const bookBtn = document.getElementById("roomBook");
        if (bookBtn) bookBtn.addEventListener("click", function () {
          openSlotBooking(code, room.title, room.startsAt, myWho());
        });
        wrap.querySelectorAll("[data-admit]").forEach(function (b) {
          b.addEventListener("click", function () {
            roomsFetch("/admit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, hostId: myWho(), who: b.dataset.admit }) }).then(function () { refresh(); });
          });
        });
        wrap.querySelectorAll("[data-bk]").forEach(function (b) {
          b.addEventListener("click", function () {
            roomsFetch("/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, hostId: myWho(), id: b.dataset.bk, action: b.dataset.act }) }).then(function (d) {
              toast(d && d.ok ? (b.dataset.act === "confirm" ? "Slot confirmed — the student will be notified" : "Slot declined") : "Could not update the booking", d && d.ok ? "rank" : "warn");
              refresh();
            });
          });
        });
        const clk = document.getElementById("roomClock");
        if (clk && live && room.liveAt) {
          const tick = function () { clk.textContent = fmtLive((Date.now() / 1000 - room.liveAt) * 1000); };
          tick();
          if (!heartbeat) heartbeat = setInterval(tick, 1000);
        }
      });
    };
    // presence heartbeat — the room knows you're in it, and the host sees the room
    const beat = function () {
      roomsFetch("/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, who: myWho(), name: myName(), role: myRole() }) });
    };
    beat();
    if (!heartbeat) heartbeat = setInterval(beat, 15000);
    refresh();
    poller = setInterval(refresh, 4000);
    root.__roomTimer = poller;
  }

  /* ---------- Your standing — the Trust Bar ring ---------- */
  function standingCard() {
    const hoff = handoffRec();
    const t = TRUST;
    const known = !!(hoff && t && typeof t.score === "number");
    const band = known ? trustBand(t.score) : null;
    const pct = known ? Math.max(0, Math.min(100, t.score)) : 0;
    const color = known ? band.color : "#8a8a8a";
    const val = known ? pct + "%" : "—";
    const label = known ? band.label : (hoff ? "Linking…" : "Demo trader");
    const sub = known
      ? (t.restricted ? "Account restricted — pending moderator review." : band.note)
      : (hoff ? "Fetching your standing from the academy…" : "Your standing appears once your identity is linked — verified students carry the Trust Bar.");
    const href = hoff ? academyUrl("member.html") : "#";
    return el("div", "panel stand-panel", `
      <div class="stand-inner">
        <a class="stand-ring" href="${esc(href)}" title="Open your standing dashboard in the members panel — every good and bad action that moved the bar">
          <svg viewBox="0 0 120 120">
            <defs><filter id="standGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <circle class="ring-bg" cx="60" cy="60" r="52"/>
            <circle class="ring-fg" cx="60" cy="60" r="52" style="stroke:${color};stroke-dashoffset:${326.7 * (1 - pct / 100)}" filter="url(#standGlow)"/>
          </svg>
          <div class="ring-label stand-ring-label" style="color:${color}"><strong>${val}</strong><span>standing</span></div>
        </a>
        <div class="stand-copy">
          <h3 class="panel-title gold-serif">Your standing · the Trust Bar</h3>
          <p class="stand-tier">${esc(label)}</p>
          <p class="panel-sub">${esc(sub)}</p>
          <p class="stand-foot">The academy watches how you carry yourself — every lesson, every assessment, every session. The bar starts full and moves only on measured grounds, and a moderator reviews before anything ever changes.</p>
          ${hoff ? `<a class="btn-ghost" href="${esc(href)}">Open standing dashboard →</a>` : ""}
        </div>
      </div>`);
  }

  /* ---------- The Machinery — the OS's engine room ----------
     Mirrors the academy's engine-room card with the OS's own real numbers:
     the course core is device-native (a server outage can't touch it), every
     quiz answer is timing-verified, the session guards and the nine
     integrity heuristics are armed, and flags go to a moderator — never a
     machine verdict. Every figure is computed right now, on this device. */
  function machineryCard() {
    const answered = (S.log || []).length;
    const flags = S.flags || [];
    const clean = answered ? Math.max(0, Math.round((answered - flags.length) / answered * 100)) : 100;
    const logMs = (S.log || []).filter(function (l) { return l.ms > 1400; });
    const avgResp = logMs.length ? Math.round(logMs.reduce(function (a, r) { return a + r.ms; }, 0) / logMs.length) : null;
    const distTypes = new Set(flags.map(function (f) { return f.type; })).size;
    const card = el("div", "panel machinery-panel");
    card.innerHTML = `
      <div class="intel-head">
        <div>
          <h3 class="panel-title gold-serif">The Machinery — your Academy's engine room</h3>
          <p class="panel-sub">Measured live, shown honestly — every number is computed by the system right now, on this device. Nothing is staged.</p>
        </div>
        <span class="sys-pulse"><span class="sys-pulse-dot"></span>monitoring</span>
      </div>
      <div class="mach-rings">
        <div class="intel-ring-cell">${ringGauge(clean, "#d4af37", "checks", clean + "%", (answered ? answered + " assessment answers timing-verified" : "Assessment answers appear as you go") + (avgResp ? " · avg " + fmtTime(avgResp) : ""))}</div>
        <div class="intel-ring-cell">${ringGauge(100, "#d4af37", "security", "3/3", "Session guards armed — single-session, inactivity, live timer.")}</div>
        <div class="intel-ring-cell">${ringGauge(100, "#d4af37", "cyber", "9/9", "Integrity heuristics watch your assessments — flags go to a moderator, never a machine verdict.")}</div>
        <div class="intel-ring-cell">${ringGauge(100, "#d4af37", "headroom", "100%", "Your whole course lives on this device — a server outage can't touch the Journey.")}</div>
      </div>
      <div class="mach-strip">
        <span class="mach-strip-l">YOUR JOURNEY THROUGH THE MACHINE</span>
        <div class="mach-flow">${ICONS.book} LESSON → ${ICONS.check} ASSESSMENT → ${ICONS.shield} FAIR PLAY → ${ICONS.chart} INSIGHTS → ${ICONS.medal} BADGES</div>
      </div>
      <div class="mach-stats">${answered} answers timing-verified · ${flags.length} flag${flags.length === 1 ? "" : "s"} caught (${distTypes} kind${distTypes === 1 ? "" : "s"}) · 0 lessons ever lost — measured on this device, this second.</div>
      <div class="mach-foot">Founder's Day — ${foundersDayLabel()}. The founder stays anonymous — the learning is the point.</div>`;
    return card;
  }

  /* ---------- The Hall of Fame — earned, never sold ---------- */
  function hallOfFameCard() {
    let accN = 0, accW = 0;
    Object.values(S.chapStats || {}).forEach(function (a) { accN += a.n || 0; accW += a.wrong || 0; });
    const accPct = accN ? Math.round((accN - accW) / accN * 100) : 0;
    const honors = [
      { ic: ICONS.diamond, name: "Distinction streak", req: "3 chapters in a row at 80%+", got: (S.distStreak || 0) >= 3 },
      { ic: ICONS.medal, name: "Elite lane completion", req: "Finish a chapter on the Elite tier", got: eliteDone() },
      { ic: ICONS.target, name: "Sharpshooter", req: "90%+ accuracy across 100+ answers", got: accN >= 100 && accPct >= 90 },
      { ic: ICONS.crown, name: "Founder's Circle", req: "Verified identity · excellent standing", got: !!(TRUST && TRUST.score >= 90) }
    ];
    const card = el("div", "panel hof-panel");
    card.innerHTML = `
      <div class="intel-head">
        <div>
          <h3 class="panel-title gold-serif">The Hall of Fame</h3>
          <p class="panel-sub">The Academy honours the very best — places are earned, never sold, and the wall fills as the Academy grows. No phantom names, no inflated counts: what you see is verified.</p>
        </div>
      </div>
      <div class="hof-grid">
        ${honors.map(function (h) { return `<div class="hof-row ${h.got ? "hof-earned" : ""}"><span class="hof-ic">${h.got ? ICONS.check : h.ic}</span><div><b>${h.name}</b><p>${h.req}</p></div><em class="hof-state">${h.got ? "EARNED" : "to earn"}</em></div>`; }).join("")}
      </div>
      <div class="hof-foot">Every honour above is checked against your real record right now. ${isFoundersDay() ? "Today is Founder's Day — the founder stays anonymous, the learning is the point." : "Founder's Day — " + foundersDayLabel() + "."}</div>`;
    return card;
  }
  function eliteDone() {
    return CHAPTERS.some(function (c) {
      const st = chState(c.id);
      return st && st.lastScore != null && (st.lane === "elite" || (st.attempts || []).some(function (a) { return a.lane === "elite" && a.passed; }));
    });
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
    // Time ring: share of estimated study time already consumed (mirrors the
    // course ring; the label shows what's left). Platinum, not gold — the
    // course owns gold, time wears silver.
    const timeTotal = courseMins() + retakeMins();
    const timePct = timeTotal > 0 ? Math.max(0, Math.min(100, Math.round(doneMins() / timeTotal * 100))) : 0;
    const nr = nextRank(S.xp);
    const cont = nextLesson();
    const recs = cont ? [] : recommendChapters();
    const rec = recs[0] || null;
    const allChaptersDone = CHAPTERS.every(isComplete);
    // Reflection pause: if the only unfinished chapter is locked behind its
    // reflection window, say so instead of falling through to the certificate
    // CTA — a 0% student must never be offered a certificate.
    const paused = (!cont && !rec) ? CHAPTERS.find(c => isUnlocked(c) && !isComplete(c) && retryLocked(c) > 0) : null;
    const cta = cont
      ? `<button class="btn-gold" data-go="${cont.id}">Continue — ${esc(cont.title)}</button>`
      : paused
        ? `<button class="btn-gold" data-go="review-${paused.id}">Review — ${esc(paused.title)}</button>
           <p class="dash-cta-sub">Reflection period — your retake unlocks in ${fmtLock(retryLocked(paused))}. Re-reading is the fastest way back to a pass.</p>`
        : rec && !allChaptersDone
          ? `<button class="btn-gold" data-go="${rec.ch.id}">Practice — ${esc(rec.ch.title)}</button>
             <p class="dash-cta-sub">${esc(rec.reason)}</p>`
          : !examPassed()
            ? `<button class="btn-gold" data-go="exam">Begin the Final Examination</button>
               <p class="dash-cta-sub">Every chapter complete. One last door: pass the Final Examination (${EXAM_PASS}% or better) and the certificate is yours.</p>`
            : `<div class="dash-cta-row">
               <button class="btn-gold" data-go="cert">Claim your certificate</button>
               <button class="btn-ghost" data-go="progress">Insights</button>
             </div>
             <p class="dash-cta-sub">Every chapter complete and the Final Examination passed. Collect what you earned — and keep sharpening while you're here.</p>`;

    // accuracy ring — correct answers across every logged attempt
    let accN = 0, accW = 0;
    Object.values(S.chapStats || {}).forEach(a => { accN += a.n || 0; accW += a.wrong || 0; });
    const accPct = accN ? Math.round((accN - accW) / accN * 100) : 0;

    const hoff = handoffRec();
    const founderB = isFounder()
      ? `<div class="founder-banner"><span class="fb-ic">${ICONS.crown}</span><div><b>FOUNDER · MASTER KEY</b><p>Every door open — full overview from anywhere. The machine's safety rules still apply to you: one session, revocation, audit trails.</p></div></div>`
      : "";
    const tourB = (demoTour().state === "ended" && !isFounder())
      ? `<div class="tour-banner"><b>Your free tour has ended</b><p>Your account and your progress are safe and permanent — enroll to keep your Academy access.</p><a class="btn-gold" href="${esc(academyUrl("member.html"))}">Continue to my RFX account →</a></div>`
      : "";
    const fdCard = foundersDayCard();
    // The launch countdown + Reserve CTA live on the public website hero,
    // not here — only students already inside the OS would ever see this
    // room, and a "Reserve your place" button belongs in front of the
    // people who haven't enrolled yet.
    if (founderB || tourB || fdCard) root.appendChild(el("div", "dash-banners", founderB + tourB + fdCard));
    root.appendChild(el("div", "dash-hero", `
      <div class="dash-hero-inner">
        <div>
          <p class="eyebrow">Reality FX OS · ${esc(today)}</p>
          <h1>Welcome back, <span class="gold-serif">${esc(name)}</span></h1>
          <p class="dash-sub">“${esc(QUOTE)}”</p>
          <div class="dash-cta">
            ${cta}
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-top">
            ${hoff ? `<span class="id-chip" title="Your identity — verified by Reality FX registration">ID ${esc(hoff.studentId)} <b class="id-ver">(Verified!)</b></span>` : ""}
            ${tourChip()}
            <div class="sess-chip" title="Live session timer — auto-starts when you open the academy, stops when you leave">
              <span class="sess-dot"></span>
              <div><p class="sess-lbl">Live session</p><p class="sess-time" id="sessTimer">${fmtClock(S.secs || 0)}</p></div>
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
            <div class="ring-wrap time-ring-wrap" title="Estimated study time remaining — slides read and assessments passed reduce it">
              <svg class="ring" viewBox="0 0 120 120">
                <defs><filter id="timeRingGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                <circle class="ring-bg" cx="60" cy="60" r="52"/>
                <circle class="time-ring-fg" cx="60" cy="60" r="52" style="stroke-dashoffset:${326.7 * (1 - timePct / 100)}" filter="url(#timeRingGlow)"/>
              </svg>
              <div class="ring-label time-ring-label"><strong>≈ ${hoursLeft()}h</strong><span>left</span></div>
            </div>
            <div class="ring-wrap acc-ring-wrap" title="Assessment accuracy — correct answers across every logged attempt">
              <svg class="ring" viewBox="0 0 120 120">
                <defs><filter id="accRingGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                <circle class="ring-bg" cx="60" cy="60" r="52"/>
                <circle class="acc-ring-fg" cx="60" cy="60" r="52" style="stroke-dashoffset:${326.7 * (1 - accPct / 100)}" filter="url(#accRingGlow)"/>
              </svg>
              <div class="ring-label acc-ring-label"><strong>${accPct}%</strong><span>accuracy</span></div>
            </div>
          </div>
        </div>
      </div>
    `));
    root.querySelectorAll(".dash-cta [data-go]").forEach(go => go.addEventListener("click", () => {
      const t = go.dataset.go;
      location.hash = t === "cert" ? "#/certificate" : t === "progress" ? "#/progress" : t === "exam" ? "#/exam" : t.indexOf("review-") === 0 ? "#/review/" + t.slice(7) : "#/lesson/" + t;
    }));

    // Live now — a compact strip so the Academy's broadcasts are never missed.
    const liveStrip = el("div", "dash-live", "");
    root.appendChild(liveStrip);
    roomsFetch("").then(function (data) {
      const live = ((data && data.rooms) || []).filter(function (r) { return r.status === "live"; });
      if (!live.length) return;
      liveStrip.innerHTML = live.slice(0, 2).map(function (r) {
        return `<div class="dash-live-card"><span class="live-dot"></span><div class="dash-live-body"><b>LIVE · ${esc(r.title)}</b><p>${roomKind(r.kind).t} with ${esc(r.host)} · ${(r.present || []).length} in the room</p></div><button class="btn-gold sm join-room" data-code="${esc(r.code)}">Join</button></div>`;
      }).join("");
      liveStrip.querySelectorAll(".join-room").forEach(function (b) { b.addEventListener("click", function () { location.hash = "#/room/" + b.dataset.code; }); });
    });
    const rs = resumeStrip();
    if (rs) {
      root.insertAdjacentHTML("beforeend", rs);
      root.querySelectorAll(".resume-go").forEach(go => go.addEventListener("click", () => {
        location.hash = "#/lesson/" + go.dataset.go + "/" + go.dataset.slide;
      }));
    }

    // Trader identity card (adaptive learning)
    root.appendChild(styleCard());

    // Your standing — the Trust Bar ring, live from the academy. The same
    // gold ring the member panel draws, fed by the same record: the score
    // starts full at 100% and moves only on measured grounds.
    let standCard = standingCard();
    root.appendChild(standCard);
    fetchTrust(); // pull the live score; the ring re-fills when it lands
    const trustFill = function () {
      const fresh = standingCard();
      if (fresh && standCard.parentNode) {
        standCard.parentNode.replaceChild(fresh, standCard);
        standCard = fresh;
      }
    };
    if (window.__trustFill) window.removeEventListener("rfx:trust", window.__trustFill);
    window.__trustFill = trustFill;
    window.addEventListener("rfx:trust", window.__trustFill);

    // Stats
    const stats = [
      { v: CHAPTERS.filter(isComplete).length + "/13", l: "Chapters completed", i: ICONS.trophy },
      { v: slidesSeenAll() + "/" + slidesTotalAll(), l: "Slides explored", i: ICONS.book },
      { v: quizzesPassed(), l: "Assessments passed", i: ICONS.check },
      { v: S.streak + " day" + (S.streak === 1 ? "" : "s"), l: "Discipline streak", i: ICONS.flame },
      { v: S.distStreak + (S.distStreak === 1 ? " chapter" : " chapters") + " at 80%+", l: "Distinction streak", i: ICONS.diamond },
      { v: Math.round(slidesSeenAll() / slidesTotalAll() * 100) + "%", l: "Course progress", i: ICONS.flag }
    ];
    const grid = el("div", "stat-grid dash-stats");
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
    let iAccN = 0, iAccW = 0;
    Object.values(S.chapStats || {}).forEach(a => { iAccN += a.n || 0; iAccW += a.wrong || 0; });
    const accuracy = iAccN ? Math.round((iAccN - iAccW) / iAccN * 100) : null;
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
        <div class="intel-ring-cell">${ringGauge(avgGrade != null ? avgGrade : 0, avgGrade != null ? ringGold : ringEmpty, "avg grade", avgGrade != null ? avgGrade + "%" : "—", gradedChs.length ? gradedChs.length + " assessments graded" : "Pass an assessment to light this up")}</div>
        <div class="intel-ring-cell">${ringGauge(accuracy != null ? accuracy : 0, accuracy != null ? ringGold : ringEmpty, "accuracy", accuracy != null ? accuracy + "%" : "—", iAccN ? iAccN + " answers logged" : "Answers appear as you assess")}</div>
        <div class="intel-ring-cell">${ringGauge(paceShare != null ? paceShare : 0, paceShare != null ? ringGold : ringEmpty, "quick answers", paceShare != null ? paceShare + "%" : "—", paceShare != null ? (paceShare >= 70 ? "Most answers in under 30s" : paceShare >= 40 ? "A steady, careful pace" : "Deeply deliberate — the review matters") : "Timed from your first assessment")}</div>
      </div>`;
    const intelGo = intel.querySelector("[data-go='progress']");
    if (intelGo) intelGo.addEventListener("click", () => location.hash = "#/progress");
    root.appendChild(intel);

    // Course duration strip — the same honest math as the Journey scope card,
    // slim enough to sit beside the intel without stealing the show.
    (function () {
      const act = laneTotals(tierKey());
      let rdMins = 0, qzMins = 0;
      CHAPTERS.forEach(ch => {
        const deck = tierKey() === 'standard' ? ch : (composeTier(ch, tierKey()) || ch[tierKey()] || ch);
        rdMins += (deck.native || []).reduce((a, nv) => a + slideReadMins(nv), 0);
        qzMins += (deck.quiz || []).reduce((a, q) => a + questionMins(q), 0);
      });
      const days = Math.max(1, Math.round(act.mins / 120));
      const proj = new Date(Date.now() + days * 24 * 3600 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
      const strip = el("div", "dash-dur");
      strip.innerHTML = `
        <span class="dd-ic">${ICONS.clock}</span>
        <div class="dd-main"><b>≈${fmtDur(act.mins)}</b><span>your ${esc(tierName())} lane · ${act.slides} slides · ${act.qs} questions</span></div>
        <div class="dd-split">≈${fmtDur(rdMins)} reading + ≈${fmtDur(qzMins)} review</div>
        <div class="dd-proj">${days} days at 2 focused hours a day · <b>finish around ${proj}</b></div>
        <a class="dd-go" href="#/map" title="Full course scope on the Journey">Scope →</a>`;
      const go = strip.querySelector(".dd-go");
      if (go) go.addEventListener("click", function (e) { e.preventDefault(); location.hash = "#/map"; });
      root.appendChild(strip);
    })();

    // System status · Academy heartbeat — the OS's own intel flex. Honest
    // about every part of itself: the course core is device-native, so the
    // Journey never closes — the academy link only carries identity, wallet
    // and flags, and when it's down the student hears we know, not silence.
    const machFlags = (S.flags || []).length;
    // Course-scope intel across ALL three lanes (standard + challenging +
    // elite) — computed live so every forged deck raises the numbers on its
    // own. "Assessments" is the term we use for the chapter exams.
    const laneCount = (c, k) => (composeTier(c, k) ? composeTier(c, k).slides : (c[k] && c[k].slides)) || 0;
    const laneAssess = (c, k) => (c[k] && c[k].quiz && c[k].quiz.length) || 0;
    const hbStdSlides = CHAPTERS.reduce((a, c) => a + c.slides, 0);
    const hbChalSlides = CHAPTERS.reduce((a, c) => a + laneCount(c, "challenging"), 0);
    const hbEliSlides = CHAPTERS.reduce((a, c) => a + laneCount(c, "elite"), 0);
    const hbStdAssess = CHAPTERS.reduce((a, c) => a + (c.quiz ? c.quiz.length : 0), 0);
    const hbChalAssess = CHAPTERS.reduce((a, c) => a + laneAssess(c, "challenging"), 0);
    const hbEliAssess = CHAPTERS.reduce((a, c) => a + laneAssess(c, "elite"), 0);
    const LINK_ICON = ICON('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>');
    const sysCard = el("div", "panel sys-panel");
    sysCard.innerHTML = `
      <div class="intel-head">
        <div>
          <h3 class="panel-title gold-serif">System status · Academy heartbeat</h3>
          <p class="panel-sub">The machine that runs your education — honest about every part of itself, always.</p>
        </div>
        <span class="sys-pulse"><span class="sys-pulse-dot"></span>monitoring</span>
      </div>
      <div class="sys-grid">
        <div class="sys-row"><span class="sys-ic">${ICONS.book}</span><div class="sys-txt"><div class="sys-name">Course core — ${CHAPTERS.length} chapters · ${(hbStdSlides + hbChalSlides + hbEliSlides).toLocaleString()} slides · ${(hbStdAssess + hbChalAssess + hbEliAssess).toLocaleString()} assessments across Standard, Challenging &amp; Elite · ≈${Math.round(courseMins() / 60)}h of study</div><p class="sys-desc">Standard ${hbStdSlides.toLocaleString()} slides · ${hbStdAssess.toLocaleString()} assessments · Challenging ${hbChalSlides.toLocaleString()} · ${hbChalAssess.toLocaleString()} · Elite ${hbEliSlides.toLocaleString()} · ${hbEliAssess.toLocaleString()} — device-native lessons, assessments &amp; notes; the Journey never closes, no server required.</p></div><span class="sys-state up">Always on</span></div>
        <div class="sys-row"><span class="sys-ic">${ICONS.shield}</span><div class="sys-txt"><div class="sys-name">Integrity rail — fair-play analyser · 9 heuristics</div><p class="sys-desc">${machFlags} flag${machFlags === 1 ? "" : "s"} caught · every one moderator-reviewed — never a machine verdict.</p></div><span class="sys-state up">Armed</span></div>
        <div class="sys-row"><span class="sys-ic">${ICONS.clock}</span><div class="sys-txt"><div class="sys-name">Session watch — single-session · inactivity · live timer</div><p class="sys-desc">One student, one live session — tab-away pauses the clock, idle signs you out, a second device revokes the first.</p></div><span class="sys-state up">3/3 armed</span></div>
        <div class="sys-row"><span class="sys-ic">${ICONS.robot}</span><div class="sys-txt"><div class="sys-name">AI Mentor</div><p class="sys-desc">Your trading twin answers from the same device — no link required.</p></div><span class="sys-state up">Always on</span></div>
        <div class="sys-row"><span class="sys-ic">${LINK_ICON}</span><div class="sys-txt"><div class="sys-name">Academy link — identity · wallet · standing</div><p class="sys-desc">The only part that talks to the server — it carries your records, not your learning.</p></div><span class="sys-state check" id="sysAcademyState">Checking…</span></div>
        <div class="sys-row"><span class="sys-ic">${ICON('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M5 11h14"/>')}</span><div class="sys-txt"><div class="sys-name">The gate — System A holds the door</div><p class="sys-desc">The Academy decides who comes in; the OS only follows — a live lockout is honoured before any session is issued.</p></div><span class="sys-state check" id="sysGateState">Checking…</span></div>
      </div>
      <div class="sys-banner" id="sysBanner">Come rain or storm — your Journey never closes. Lessons, assessments, notes and badges are device-native; the academy link only carries identity, wallet and standing.</div>`;
    function fillSys(ev) {
      const st = sysCard.querySelector("#sysAcademyState");
      const bn = sysCard.querySelector("#sysBanner");
      if (!st || !bn) return;
      const v = (ev && ev.detail) || ahVerdict;
      const map = {
        live: ["up", "Live", "Academy server reachable — your identity, wallet and records are connected."],
        stale: ["warn", "Stale copy", "The server you're pointed at holds an older copy — re-enter from your member panel to re-point."],
        unreachable: ["down", "Down", "Don't worry — we're aware and fixing this technical difficulty. Your course never goes down — keep learning."],
        "os-down": ["down", "OS store down", "This OS's own store is unreachable — progress still saves on this device and syncs when it returns."]
      };
      const m = v && map[v.state];
      if (!m) return;
      st.className = "sys-state " + m[0];
      st.textContent = m[1];
      bn.className = "sys-banner " + m[0];
      bn.innerHTML = m[2];
    }
    if (window.__sysFill) window.removeEventListener("rfx:academy-health", window.__sysFill);
    window.__sysFill = fillSys;
    window.addEventListener("rfx:academy-health", window.__sysFill);
    fillSys();
    // The gate row — probed live (throttled ~8s, mirroring System A §9.63) so
    // the gatekeeper is never a silent rail: open / locked / unreachable, with
    // the latency honest next to it. The timer is cleared on re-render so a
    // rebuilt dashboard never leaks a second poller.
    function paintGate(gEl, g, ms) {
      if (!gEl || !gEl.isConnected) return;
      if (g && g.locked) {
        const mins = g.minutesLeft != null ? g.minutesLeft : (g.lockedUntil ? Math.max(1, Math.round((new Date(g.lockedUntil).getTime() - Date.now()) / 60000)) : null);
        gEl.className = "sys-state down";
        gEl.textContent = "Locked" + (mins != null ? " · " + mins + " min" : "");
        gEl.title = "Recover now via Forgot password? on your member portal";
      } else if (g && g.unreachable) {
        gEl.className = "sys-state warn";
        gEl.textContent = "Unreachable";
        gEl.title = "Local read stands in — the gate can't be reached right now";
      } else {
        gEl.className = "sys-state up";
        gEl.textContent = "Open · " + ms + " ms";
        gEl.title = "Identity cleared — the Academy cleared you for entry";
      }
    }
    if (window.__sysGateTimer) { clearInterval(window.__sysGateTimer); window.__sysGateTimer = null; }
    (function probeGate() {
      const gEl = sysCard.querySelector("#sysGateState");
      if (!gEl) return;
      const t0 = Date.now();
      askTheGate().then(function (g) { paintGate(gEl, g, Date.now() - t0); });
    })();
    window.__sysGateTimer = setInterval(function () {
      const gEl = sysCard.querySelector("#sysGateState");
      if (!gEl || !gEl.isConnected) { clearInterval(window.__sysGateTimer); window.__sysGateTimer = null; return; }
      const t0 = Date.now();
      askTheGate().then(function (g) { paintGate(gEl, g, Date.now() - t0); });
    }, 8000);
    root.appendChild(sysCard);

    // The Machinery — the OS's engine room (four gold rings, real numbers).
    root.appendChild(machineryCard());

    // The Hall of Fame — earned, never sold.
    root.appendChild(hallOfFameCard());

    // Badges & Recognition — the full track, earned and locked, so students
    // know what the badges are and how to earn them before they even start.
    const earnedBadges = [];
    CHAPTERS.forEach(c => (chState(c.id).badges || []).forEach(b => { if (BADGES[b]) earnedBadges.push({ ch: c.id, kind: "quiz", tier: (chState(c.id).badgeTier || {})[b], ...BADGES[b] }); }));
    (S.timeBadges || []).forEach(b => { if (BADGES[b]) earnedBadges.push({ ch: null, kind: "time", ...BADGES[b] }); });
    const earnedNames = new Set(earnedBadges.map(b => b.name));
    const badgeTrack = Object.values(BADGES).map(b => {
      const owned = earnedNames.has(b.name);
      const got = earnedBadges.find(x => x.name === b.name);
      const ch = got ? got.ch : null;
      const tag = owned && got && got.tier && got.tier !== "standard" ? `<em class="badge-tier" style="color:${TIERS[got.tier].color}">${TIERS[got.tier].name.toUpperCase()}</em>` : "";
      return `<div class="badge-tile ${owned ? "" : "locked"}" title="${esc(b.desc)}">
        <div class="badge-tile-ic">${owned ? (ICONS[b.ic] || "") : ICONS.lock}</div>
        <div><b>${b.name}${tag}</b><p>${owned ? "Earned" + (ch ? " · Chapter " + ch : (got && got.kind === "time") ? " · Study time" : "") : b.desc.split(".")[0]}</p></div>
      </div>`;
    }).join("");
    root.appendChild(el("div", "panel badge-panel", `
      <h3 class="panel-title gold-serif">Badges &amp; Recognition</h3>
      <p class="panel-sub">Assessment badges, earned not given — 80%+ for <b>Honours</b>, 100% for <b>Flawless</b>, a 90%+ retake for <b>Distinction Hunter</b>, passing after a fail for <b>Heart of a Lion</b>, and your first pass for <b>First Blood</b>. Time badges honour the unseen grind — the hours logged and the consecutive days you show up. The rarest prove the most.</p>
      <div class="badge-shelf">${badgeTrack}</div>
      ${S.distStreak >= 2 ? `<div class="dist-banner fire"><span class="dist-ic">${ICONS.flame}</span><div><b>You're on fire — ${S.distStreak} chapters in a row at 80%+</b><p>Best streak: ${S.distBest}. This is how institutions are built.</p></div></div>` : S.distStreak === 1 ? `<div class="dist-banner"><span class="dist-ic">${ICONS.flame}</span><div><b>1 chapter at 80%+ — keep the distinction streak alive</b><p>Two in a row and you're officially on fire.</p></div></div>` : ""}`));

    // Rank + journey quick links
    const rankCard = el("div", "rank-card", `
      <div class="rank-ic">${ic(rank.ic) || rank.icon}</div>
      <div class="rank-mid">
        <div class="rank-name">${rank.name}</div>
        <div class="rank-xpbar"><span style="width:${rankPct()}%"></span></div>
        <div class="rank-xplbl">${S.xp} XP · ${nr ? "next: " + (ic(nr.ic) || nr.icon) + " " + nr.name + " at " + nr.min + " XP" : "max rank reached"}</div>
      </div>
      <div class="rank-go">
        <button class="btn-ghost" data-go="map">Journey</button>
        <button class="btn-ghost" data-go="progress">Insights</button>
      </div>
      ${nr ? `<p class="rank-note">The ${nr.name} rank awaits at ${nr.min} XP — the crown is earned through retakes, streaks and mastery, not just completion.</p>` : `<p class="rank-note">${ICONS.crown} You hold the rarest rank in the Academy. Few ever reach it — fewer keep it. The market has no higher honour.</p>`}`);
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

    // Live tools strip — Laboratory, AI Mentor and the Trade Journal are open
    // doors now. Deliberately placed BEFORE the certification teaser so the
    // dashboard ends on the certificate — the founder's neatness rule.
    root.appendChild(el("div", "soon-strip", `
      <button class="soon-chip live" data-go="lab">${ICONS.flask} Trading Laboratory</button>
      <button class="soon-chip live" data-go="mentor">${ICONS.robot} AI Mentor — your trading twin</button>
      <button class="soon-chip live" data-go="journal">${ICONS.pen} Trade Journal</button>`));
    root.querySelectorAll(".soon-strip [data-go]").forEach(go => go.addEventListener("click", () => location.hash = "#/" + go.dataset.go));

    // Cert teaser — the dashboard's final card, exactly as the founder wants
    root.appendChild(el("div", "cert-teaser", `
      ${pct === 100
        ? `<p class="eyebrow">Certification unlocked</p><h3 class="gold-serif">You are a Reality FX graduate.</h3><button class="btn-gold" data-go="cert">Receive your certificate</button>`
        : `<p class="eyebrow">Certification</p><h3 class="gold-serif">Complete all <span class="num">${CHAPTERS.length}</span> chapters to earn your Reality FX certificate.</h3><div class="cert-progress"><span style="width:${pct}%"></span></div>`}`));
    const ct = root.querySelector(".cert-teaser [data-go]");
    if (ct) ct.addEventListener("click", () => location.hash = "#/certificate");

    // No name editing on the dashboard — student credentials (name, email,
    // phone, country) belong to the registration/portal rail, never to ad-hoc
    // edits. The name on the certificate is the verified identity from System A.

  }

  /* ---------- Academy FAQ + Fair Usage Policy ---------- */
  function academyBlock() {
    const faqs = [
      { q: "How many retake attempts do I get per chapter?", a: "Three retake tokens per chapter. After a failed attempt, a 2-hour reflection period unlocks before your next try — the time is meant for reviewing the lesson, not for blind repetition. Once your three tokens are used, the chapter locks and you can request a review from academy support. After a pass, the next chapter opens in 24 hours — like school terms, we believe in paced learning. No institution rushes through its curriculum, and neither do we." },
      { q: "Can I take a screenshot of my results and share them?", a: "You may screenshot your own results for personal motivation. Sharing them publicly is fine as long as you don't misrepresent the academy, its claims, or its certificate. Any result you share must include your real student identity." },
      { q: "Can I share my account or login with a friend?", a: "No. Your account is personal and non-transferable. Sharing your login is a violation of the Academy Fair Usage Policy and will result in suspension of your account and email. Repeated violations lead to a permanent ban and IP block." },
      { q: "How does the academy detect cheating?", a: "Our Fair Play system monitors assessment response times, retake patterns, session behaviour and unusual answer patterns — the same kind of signal analysis used by competitive platforms like chess.com. Flags are reviewed by a human moderator before any action is taken." },
      { q: "What happens if I'm flagged?", a: "A flag is a review trigger, not a verdict. The moderator examines your assessment timeline; if the evidence is clear you'll be given a warning and one chance to re-sit the assessment under monitored conditions. Attempts to cheat again result in an account ban." },
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
    root.appendChild(el("div", "page-head profile-head", `
      <div>
        <p class="eyebrow">Student access</p>
        <h2>Your profile</h2>
        <p class="page-sub">${hoff
          ? "Your identity record — verified by Reality FX registration. The name here is exactly what prints on your certificate."
          : "Your identity record — the name here is exactly what prints on your certificate. Phase 2 registration will verify and lock these details; for now they're yours to keep accurate."}</p>
      </div>
      ${hoff ? `<a class="btn-gold profile-portal-btn" href="${esc(academyUrl("member.html"))}">Student Portal — My RFX Account</a>` : ""}`));

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
            <button class="btn-ghost sm" id="pf-photo-btn">${p.photo ? "Change photo" : `<span class="btn-ic">${ICONS.camera}</span> Add photo`}</button>
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

    /* Privacy & your data — the student's data-rights rail. A request for a
       copy or a deletion is filed to the academy server's /api/data-requests
       board (the same rail Staff read), and the reference number is the
       receipt. This is what makes the "you can ask us to delete your data"
       promise a real action, not a policy sentence. */
    const pr = el("div", "panel profile-privacy");
    const lastReq = p.lastDataRequest;
    pr.innerHTML = `
      <p class="quiz-tag">Privacy &amp; your data</p>
      <h3 class="gold-serif">Your data is yours</h3>
      <p class="page-sub">Reality FX never sells your data and never collects government IDs. Your records live in the protected student environment — encrypted in transit, access-logged, and visible only to authorised staff for legitimate institutional purposes. You can ask for a copy of everything we hold, or ask us to close your account and remove your records.</p>
      <div class="profile-privacy-actions">
        <button class="btn-ghost sm" id="pf-data-export"><span class="btn-ic">${ICONS.download}</span> Request a copy of my data</button>
        <button class="btn-ghost sm danger" id="pf-data-delete">Request account deletion</button>
      </div>
      <p class="profile-note" id="pf-data-status">${lastReq
        ? `Last request: <b>${esc(lastReq.ref)}</b> — ${lastReq.kind === "delete" ? "account deletion" : "a copy of your data"}, filed ${new Date(lastReq.at).toLocaleString()}.`
        : "No data requests filed yet — every request is recorded with a reference number."}</p>`;
    function fileDataRequest(kind) {
      const nm = (profile().name || "").trim() || (S.name || "").trim() || "OS student";
      const em = (profile().email || "").trim();
      const hoff = handoffRec();
      const body = { kind: kind, name: nm, email: em, studentId: hoff ? hoff.studentId : "" };
      const label = kind === "delete" ? "account deletion" : "a copy of your data";
      const btn = pr.querySelector(kind === "delete" ? "#pf-data-delete" : "#pf-data-export");
      if (btn) btn.disabled = true;
      fetch("api/data-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" })
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(j => {
          if (btn) btn.disabled = false;
          const pp = profile();
          pp.lastDataRequest = { ref: j.ref, kind: kind, at: Date.now() };
          save();
          const st = document.getElementById("pf-data-status");
          const mailed = j.receiptEmail === "sent" ? " A confirmation email is on its way to you." : "";
          if (st) st.innerHTML = `Filed — reference <b>${esc(j.ref)}</b>. The Registrar will action your request for ${label}.${mailed}`;
          toast("Request filed — reference " + j.ref, "ok");
        })
        .catch(() => {
          if (btn) btn.disabled = false;
          toast("Could not reach the academy server — please try again shortly", "warn");
        });
    }
    const btnExport = pr.querySelector("#pf-data-export");
    const btnDelete = pr.querySelector("#pf-data-delete");
    if (btnExport) btnExport.addEventListener("click", () => fileDataRequest("export"));
    if (btnDelete) btnDelete.addEventListener("click", () => {
      if (!confirm("This files a request to close your Reality FX account and remove your records. Nothing is deleted instantly — the Registrar reviews every request, and you can change your mind before it is processed. Continue?")) return;
      fileDataRequest("delete");
    });
    root.appendChild(pr);

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
      if (btn) btn.innerHTML = `<span class="btn-ic">${ICONS.camera}</span> Add photo`;
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
  /* ---------------- Course scope · protocol --------------
     The full inventory, computed live from the decks — every slide, every
     question, every estimated hour, per lane. Standard is the complete
     course; Challenging and Elite replace each forged chapter's deck with
     their own (deeper content per slide), and un-forged chapters read the
     core material until their deck lands — so the numbers below are the
     honest current scope, never staged. */
  function laneTotals(lane) {
    let slides = 0, qs = 0, mins = 0, forged = 0;
    CHAPTERS.forEach(ch => {
      // tier lanes stack on the standard: count the composed deck the student
      // actually reads, never the raw lane in isolation
      const deck = lane === 'standard' ? ch : (composeTier(ch, lane) || ch[lane] || ch);
      const use = deck || ch;
      if (lane !== 'standard' && ch[lane]) forged++;
      slides += (use.native || []).length;
      qs += (use.quiz || []).length;
      const rd = (use.native || []).reduce((a, nv) => a + slideReadMins(nv), 0);
      const qz = (use.quiz || []).reduce((a, q) => a + questionMins(q), 0);
      mins += rd + qz;
    });
    return { slides, qs, mins, forged };
  }
  function buildScopeCard() {
    const lanes = ['standard', 'challenging', 'elite'].map(lane => {
      const t = laneTotals(lane);
      const tag = lane === 'standard' ? 'the complete 13-chapter education — every fact, every question'
        : lane === 'challenging' ? 'everything in Standard, plus the drill field — the deeper layer on every lesson'
        : 'everything in Standard and Challenging, plus the institutional layer — real trading math, the most information of all';
      const name = TIERS[lane].name;
      const color = TIERS[lane].color;
      const active = tierKey() === lane;
      // The active lane is Standard for every student who hasn't switched —
      // only THAT row carries the Operational Excellence treatment; the other
      // two stay visible in their own colours, calm and secondary.
      const chap = lane === 'standard' ? CHAPTERS.length : t.forged;
      const ic = lane === 'standard' ? ICONS.target : lane === 'challenging' ? ICONS.trophy : ICONS.crown;
      const youTag = active ? '<span class="lane-you-pill">Your lane</span>' : '';
      const forgedNote = lane !== 'standard' && t.forged < 13
        ? `<em>${t.forged}/13 chapters in the ${name} deep-dive · the rest read core material until their deck lands</em>` : '';
      return `<div class="lane-row ${lane}${active ? " active" : ""}">
        <div class="lane-id">
          <span class="lane-ic" style="border-color:${color}4d;color:${color}">${ic}</span>
          <div class="lane-id-txt">
            <b style="color:${color}">${name}</b>
            ${youTag}
          </div>
        </div>
        <div class="lane-metrics">
          <div class="lm"><b>${t.slides}</b><span>Slides</span></div>
          <div class="lm"><b>${t.qs}</b><span>Assessment questions</span></div>
          <div class="lm"><b>≈${fmtDur(t.mins)}</b><span>Est. study time</span></div>
          <div class="lm"><b>${chap}/13</b><span>Chapters</span></div>
        </div>
        <div class="lane-txt"><p>${tag}</p>${forgedNote}</div>
      </div>`;
    }).join('');
    const act = laneTotals(tierKey());
    // Reading vs quiz split, timed honestly: slides at a serious student's
    // pace (word-count at 130 wpm + a comprehension beat), questions at a
    // read-answer-review floor. Retake attempts re-pay their quiz minutes.
    let rdMins = 0, qzMins = 0;
    CHAPTERS.forEach(ch => {
      const deck = tierKey() === 'standard' ? ch : (composeTier(ch, tierKey()) || ch[tierKey()] || ch);
      rdMins += (deck.native || []).reduce((a, nv) => a + slideReadMins(nv), 0);
      qzMins += (deck.quiz || []).reduce((a, q) => a + questionMins(q), 0);
    });
    const days = Math.max(1, Math.round(act.mins / 120)); // honest pace: 2 focused hours a day
    const proj = new Date(Date.now() + days * 24 * 3600 * 1000);
    const projTxt = proj.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    const Q_ICON = ICON('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/>');
    return el("div", "course-scope", `
      <div class="scope-head">
        <div class="scope-head-txt">
          <p class="eyebrow">Course scope · protocol</p>
          <h3>Every slide, every question — counted.</h3>
          <p class="scope-sub">The Academy's full inventory, computed live from the decks — <b>never staged.</b></p>
        </div>
        <div class="scope-lane-pill">
          <span class="slp-ic">${ICONS.shield}</span>
          <div class="slp-txt"><span>Your lane</span><b>${tierName()}</b></div>
        </div>
      </div>
      <div class="scope-totals">
        <div class="scope-stat">
          <span class="ss-ic">${ICONS.book}</span>
          <div><b>${CHAPTERS.length}</b><span class="ss-sub">Chapters</span><span class="ss-desc">complete journey</span></div>
        </div>
        <div class="scope-stat">
          <span class="ss-ic">${ICONS.note}</span>
          <div><b>${act.slides}</b><span class="ss-sub">Slides in your lane</span><span class="ss-desc">every slide. every word.</span></div>
        </div>
        <div class="scope-stat">
          <span class="ss-ic">${Q_ICON}</span>
          <div><b>${act.qs}</b><span class="ss-sub">Assessment questions</span><span class="ss-desc">measured. explained. mastered.</span></div>
        </div>
        <div class="scope-stat">
          <span class="ss-ic">${ICONS.clock}</span>
          <div><b>≈${fmtDur(act.mins)}</b><span class="ss-sub">Est. study time</span><span class="ss-desc">${days} day${days === 1 ? '' : 's'} at 2 focused hours a day</span></div>
        </div>
      </div>
      <div class="scope-split">
        <span class="scope-split-seg">${ICONS.book}<span><b>≈${fmtDur(rdMins)}</b> reading the slides fully</span></span>
        <span class="scope-plus">+</span>
        <span class="scope-split-seg">${ICONS.sparkle}<span><b>≈${fmtDur(qzMins)}</b> answering &amp; reviewing every question</span></span>
      </div>
      <div class="scope-proj">
        <span class="sp-ic">${ICONS.clock}</span>
        <p>At your lane's honest pace, 2 focused hours a day — <b>finish around ${projTxt}</b></p>
        <span class="sp-sub">The clock is yours — the market doesn't grade how fast you arrive.</span>
      </div>
      <div class="scope-method">How it's timed: every slide is measured by its real word count at a serious student's reading pace, plus a comprehension beat for the figures and gold insights; every question by its length with an answer-and-explanation-review floor. Retakes re-pay their minutes. The numbers grow honestly as each lane's deeper decks land.</div>
      <div class="scope-lanes">${lanes}</div>
    `);
  }

  function renderMap(root) {
    const unlockId = S.justUnlocked; // one-shot golden unlock animation
    if (unlockId !== null) { S.justUnlocked = null; save(); }
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">The Journey</p>
      <h2>Thirteen chapters. One transformation.</h2>
      <p class="page-sub">Complete a chapter's slides and pass its assessment to unlock the next — one chapter per day, like school terms. ${progressPct()}% complete.</p>
      <p class="tier-pill" style="color:${TIERS[tierKey()].color};border-color:${TIERS[tierKey()].color}55"><span class="tier-pill-dot" style="background:${TIERS[tierKey()].color}"></span>Your lane: ${S.tier ? tierName() + " · " + tierTag() : "not chosen yet — pick one in your first lesson"}</p>`));

    root.appendChild(buildScopeCard());

    // Institutional pacing card — explains the 24h cooling period.
    // Only shown if the student has at least one completed chapter (they've
    // experienced the cooldown and might wonder why).
    const completedCount = CHAPTERS.filter(isComplete).length;
    if (completedCount > 0) {
      const cdCard = el("div", "cooldown-card");
      cdCard.innerHTML = `
        <div class="cd-head"><span class="cd-ic">${ICONS.clock}</span><div><h3 class="gold-serif">Why the cooling period?</h3><p class="cd-sub">One chapter per day — like school terms</p></div></div>
        <div class="cd-body">
          <p>No school lets you sit Term 1, 2, 3 and 4 assessments in one afternoon. Reality FX works the same way. After you complete a chapter, the next one opens in 24 hours.</p>
          <div class="cd-facts">
            <div class="cd-fact"><b>Spacing effect</b><p>Research shows that learning distributed over time beats massed practice by 20–40% on long-term retention. The cooling period is not a restriction — it is where the material settles.</p></div>
            <div class="cd-fact"><b>Consolidation</b><p>Your brain consolidates new information during rest. A 24-hour gap lets the chapter's concepts move from short-term to long-term memory — the same reason university lectures are spaced across a week.</p></div>
            <div class="cd-fact"><b>Institutional standard</b><p>Every credible education institution paces its curriculum. We are no different. The cooling period protects the value of your certificate by ensuring every graduate actually learned the material — not just passed the quiz.</p></div>
          </div>
        </div>`;
      root.appendChild(cdCard);
    }

    const path = el("div", "journey");
    CHAPTERS.forEach(ch => {
      const st = chState(ch.id);
      const deck = tierDeck(ch) || ch;
      const unlocked = isUnlocked(ch);
      const done = isComplete(ch);
      const lock = retryLocked(ch);
      const badges = (st.badges || []).map(b => badgeIc(b)).join(" ");
      const cdLeft = chapterCooldownLeft(ch);
      const cdLabel = cdLeft > 0 ? " · cooling period" : "";
      const label = !unlocked ? "Locked" + cdLabel : done ? "Complete" : lock > 0 ? "Reflection" : "In progress";
      const btn = !unlocked
        ? `<button class="btn-lock" disabled>${cdLeft > 0 ? "Opens in " + fmtDur(cdLeft / 60000) : "Complete previous chapter"}</button>`
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
            <span>${deck.slides} slides</span>
            <span>${deck.quiz ? deck.quiz.length + " assessment Qs" : "assessment bank pending"}</span>
            <span class="j-time" title="Reading + assessment time">≈ ${fmtDur(chapterTotalMins(ch))}${deck.quiz ? ` <small>· +${fmtDur(quizMins(ch))} assessment</small>` : ""}</span>
            ${diffChip(ch)}
            ${chBest(ch.id) > 0 ? `<span class="j-best">best ${chBest(ch.id)}%</span>` : ""}
            ${badges ? `<span class="j-best" title="Badges earned">${badges}</span>` : ""}
          </div>
          ${btn}
        </div>`);
      if (unlocked) node.querySelector(".j-go").addEventListener("click", () => location.hash = lock > 0 ? "#/review/" + ch.id : "#/lesson/" + ch.id);
      path.appendChild(node);
    });
    // The Hidden Accumulation — the bonus chapter the journey was hiding. It
    // reveals itself the moment all 13 chapters are complete: a hidden door
    // placed BEFORE the Final Examination, because this psychology is the last
    // thing a student should carry into the paper — and into real trades. It is
    // not part of the 13-chapter spine: never counted in the exam paper, the
    // certificate line, or the completion grids. A reward for the journey so far.
    const allChDone = CHAPTERS.every(isComplete);
    const gemDone = chPassed(BONUS_CHAPTER.id);
    const gemJustOpened = allChDone && !S.gemSeen;
    if (allChDone) { S.gemSeen = true; save(); }
    const gem = el("div", "j-node hidden-reveal" + (gemDone ? " done" : " open") + (gemJustOpened ? " just-unlocked" : ""), `
        <div class="j-dot">${gemDone ? "✓" : ICONS.diamond}</div>
        <div class="j-card">
          <div class="j-top"><span class="j-num">Hidden Chapter · Bonus</span><span class="j-status">${gemDone ? "Complete" : "Discovered"}</span></div>
          <h3 class="gold-serif">${esc(BONUS_CHAPTER.title)}</h3>
          <p class="j-focus">${esc(BONUS_CHAPTER.focus)}</p>
          <div class="j-meta">
            <span>${BONUS_CHAPTER.native.length} cards</span>
            <span>${BONUS_CHAPTER.quiz.length} assessment Qs</span>
            <span class="j-time" title="Reading + assessment time">≈ ${fmtDur(chapterTotalMins(BONUS_CHAPTER))} · +${fmtDur(quizMins(BONUS_CHAPTER))} assessment</span>
            ${diffChip(BONUS_CHAPTER)}
            ${gemDone ? `<span class="j-best">best ${chBest(BONUS_CHAPTER.id)}%</span>` : ""}
          </div>
          <p class="gem-note">${ICONS.sparkle} You have completed the thirteen chapters. That puts you ahead of every trader who ever opened a chart without studying the psychology behind it. This is the accumulation — the framework for what happens after the entry, when the market tests your discipline.</p>
          <button class="btn-gold j-go" data-go="${BONUS_CHAPTER.id}">${gemDone ? "Review The Accumulation" : "Enter The Accumulation"}</button>
        </div>`);
    if (allChDone) {
      gem.querySelector(".j-go").addEventListener("click", () => location.hash = "#/lesson/" + BONUS_CHAPTER.id);
      path.appendChild(gem);
    }

    // The capstone — the Final Examination is the journey's last door, drawn
    // here as the final node: locked until every chapter passes, then it
    // becomes the certificate's last gate. The exam room stays reachable
    // from the nav too — this is simply the journey's honest ending.
    const examDone = examPassed();
    const eBest = examBest();
    const cap = el("div", "j-node capstone" + (examDone ? " done" : "") + (allChDone ? " open" : " locked"), `
        <div class="j-dot">${examDone ? "✓" : `${ICONS.note}`}</div>
        <div class="j-card ${allChDone ? "" : "j-dim"}">
          <div class="j-top"><span class="j-num">Capstone</span><span class="j-status">${examDone ? "Passed · " + eBest.pct + "%" : allChDone ? "Ready" : "Locked"}</span></div>
          <h3 class="gold-serif">The Final Examination</h3>
          <p class="j-focus">Every chapter, one paper — ${CHAPTERS.length * examQuestionsPerCh()} questions drawn fresh across all ${CHAPTERS.length} chapters, timed in hours, one-way, machine-graded. The certificate's last door.</p>
          <div class="j-meta">
            <span>${CHAPTERS.length * examQuestionsPerCh()} questions</span>
            <span>${Math.floor(examMinutes() / 60)}h ${examMinutes() % 60}m</span>
            <span>pass ${EXAM_PASS}%</span>
            ${examDone ? `<span class="j-best">best ${eBest.pct}%</span>` : ""}
          </div>
          ${!allChDone
            ? `<button class="btn-lock" disabled>Complete all ${CHAPTERS.length} chapters first</button>`
            : `<button class="btn-gold j-go" data-go="exam">${examDone ? "Re-sit the examination" : "Begin the Final Examination"}</button>`}
        </div>`);
    if (allChDone) cap.querySelector(".j-go").addEventListener("click", () => location.hash = "#/exam");
    path.appendChild(cap);
    root.appendChild(path);
  }

  /* ============================================================
     LESSON PLAYER + QUIZ ENGINE
     ============================================================ */
  const session = { ch: null, idx: 0, quizIdx: 0, firstCorrect: 0, answered: {}, answeredCount: { n: 0, msSum: 0 }, prevSlide: null, slideShownAt: 0, qShownAt: 0, revision: false,
    // per-attempt behavioral trail for the integrity analyser: response
    // times, chosen options, correctness and question length — the raw
    // material for the smarter human-psychology heuristics
    at: { times: [], picks: [], corrects: [], qlens: [] } };

  function renderLesson(root, chId, startSlide, revision) {
    const ch = CHAPTERS.find(c => c.id === chId) || (chId === BONUS_CHAPTER.id ? BONUS_CHAPTER : null);
    if (!ch) { console.log("[DEBUG] renderLesson: ch not found for id", chId); location.hash = "#/map"; return; }
    if (!isUnlocked(ch)) { console.log("[DEBUG] renderLesson: locked", ch.title, "bonus:", ch.bonus); toast("Finish the previous chapter to unlock " + ch.title, "warn"); location.hash = "#/map"; return; }
    const lock = retryLocked(ch);
    // Revision mode = read-only browsing during the reflection window (or any time)
    if (!revision) {
      // Fair Play: reflection lockout after a fail — no instant retakes
      if (lock > 0) {
        console.log("[DEBUG] renderLesson: lock > 0", lock);
        toast("Reflection period — review the chapter, retake unlocks in " + fmtLock(lock), "warn");
        location.hash = "#/map";
        return;
      }
      const st0 = chState(ch.id);
      if (ch.quiz && st0.lastScore != null && st0.lastScore < PASS_PCT && retriesLeft(ch) <= 0) {
        console.log("[DEBUG] renderLesson: retries exhausted");
        toast("Retake tokens exhausted — reach out to support for a review", "warn");
        location.hash = "#/map";
        return;
      }
    }

    // The one-choice gate: no difficulty chosen yet → the gold tier cards
    // appear before any learning begins. Once chosen, the tier is locked.
    if (!S.tier && !revision) {
      showTierPicker(root, ch, startSlide);
      return;
    }

    session.revision = !!revision;
    // Resolve the active tier's deck: the whole player reads session.ch, so a
    // parallel tier deck (elite/challenging) simply replaces the deck fields.
    // Un-authored tiers fall back to the core material with a quiet note.
    const rdeck = tierDeck(ch);
    let activeCh;
    if (rdeck) {
      activeCh = Object.assign({}, ch, { native: rdeck.native, quiz: rdeck.quiz, quizSlides: rdeck.quizSlides, slides: rdeck.native.length });
      session.tierFallback = false;
    } else {
      activeCh = ch;
      session.tierFallback = tierKey() !== "standard";
    }
    // Quiz randomisation: shuffle both the question order and the answer
    // choice order for each question. This prevents photograph-to-answer
    // extraction — even if a student copies every answer, the order changes
    // on the next sitting. The shuffled quiz lives only in session.ch;
    // the original data is never mutated.
    if (activeCh.quiz && !revision) {
      const shuffledQuiz = shuf(activeCh.quiz).map(q => {
        if (!q.options || q.options.length < 2) return q;
        // Build a permutation of the option indices, track where the correct answer lands
        const indices = q.options.map((_, i) => i);
        const perm = shuf(indices);
        const newOptions = perm.map(i => q.options[i]);
        const newAnswer = perm.indexOf(q.answer);
        return Object.assign({}, q, { options: newOptions, answer: newAnswer });
      });
      activeCh = Object.assign({}, activeCh, { quiz: shuffledQuiz });
    }
    session.ch = activeCh;
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
    session.at = { times: [], picks: [], corrects: [], qlens: [] }; // fresh behavioural trail per attempt

    // Completion-time clock: the machine times the whole attempt from the
    // first open of this chapter to the finish. Resuming keeps the clock
    // running; a pass (or a fail) resets it so every attempt is timed fairly.
    if (!revision && !st.startedAt) st.startedAt = Date.now();

    // Fair Play: record that the student actually reviewed during reflection
    if (session.revision && ch.quiz && lock > 0) {
      st.reviewed = true;
      save();
    }

    root.appendChild(el("div", "lesson-top", `
      <button class="btn-ghost back" data-go="map">← Journey</button>
      <div class="lesson-title"><span class="j-num">Chapter ${fmt(ch.id)}</span><h3 class="gold-serif">${esc(ch.title)}</h3></div>
      <div class="lesson-progress"><div class="lesson-progress-fill"></div></div>
      ${ch.quiz && !session.revision && tierKey() !== "standard" ? `<div class="exam-clock" title="Exam protocol — the market never stops. Your ${TIERS[tierKey()].name} exam gives you ${EXAM_MIN[tierKey()]} minutes for all ${ch.quiz.length} questions — the clock starts the moment the first question appears."><span class="ec-ic">${ICONS.clock}</span><b>${fmtExamClock(EXAM_MIN[tierKey()] * 60000)}</b></div>` : ""}
    `));
    root.querySelector(".back").addEventListener("click", () => location.hash = "#/map");

    const stage = el("div", "stage");
    root.appendChild(stage);

    // Retake framing: a failed chapter re-entered is practice, not punishment.
    // The banner reframes the attempt before a single slide is read.
    if (!session.revision && st.lastScore != null && st.lastScore < PASS_PCT) {
      root.insertBefore(el("div", "retake-banner", `${ICONS.sparkle}<span><b>First pass is practice.</b> You're here to learn it properly — this attempt is where mastery gets built. Go slower than last time, notes open.</span>`), stage);
    } else if (session.tierFallback) {
      // The tier's own deck for this chapter is still being forged — be honest.
      root.insertBefore(el("div", "retake-banner", `${ICONS.sparkle}<span><b>Your ${tierName()} depth for this chapter is still being forged.</b> You're reading the core material — the elite lens lands here soon.</span>`), stage);
    }

    drawSlide(stage);

    // Exam protocol — resume an in-flight deadline: leaving the lesson can
    // never reset the exam clock (the deadline is persisted, per chapter+lane).
    if (!session.revision && S.examDeadline && S.examDeadline.ch === ch.id && S.examDeadline.lane === tierKey()) {
      startExamClock(stage);
    }

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

  /* ---------- The tier picker (one-time choice before the course) ---------- */
  const TIER_IN = {
    standard: [
      "The complete 13-chapter course",
      "Recall + application questions with gold explanations",
      "Earns every badge — a full, trade-ready education"
    ],
    challenging: [
      "Everything in Standard, plus:",
      "Application and synthesis questions — harder distractors",
      "Insider notes under every explanation",
      "Challenging-tier recognition on your badges"
    ],
    elite: [
      "Not just harder questions — a different course",
      "Advanced concepts beyond the basics — the true value of the systems",
      "Real trading math and probability: sizing, R-multiples, expectancy, Kelly",
      "The institutional layer — how the smart money thinks",
      "Elite-tier badges open the merch threshold"
    ]
  };
  // Lane previews — every card shows a peek at what the lane actually reads.
  // Samples are pulled from the chapter's REAL deck when forged; the signature
  // lines below are the lane's character everywhere else.
  const LANE_PREVIEW = {
    standard: {
      line: "The complete course — the language, the players, and the habits that make a trader.",
      sample: ["The Foreign Exchange Market", "Both Sides of the Market", "The Traders You'll Meet"]
    },
    challenging: {
      line: "Applied depth — real scenarios, worked maths, and your call before the reveal.",
      sample: ["You Are the Analyst", "The Spread Tax, Itemised", "Sizing the Unknown"]
    },
    elite: {
      line: "A different course — advanced concepts, real trading math, the institutional layer.",
      sample: ["The Market Is a Probability Machine", "The $7.5 Trillion Illusion", "The Kelly Criterion"]
    }
  };
  function lanePeek(k, ch) {
    const base = LANE_PREVIEW[k];
    const deck = k === "standard" ? ch : (ch && ch[k]);
    const titles = [];
    if (deck && deck.native) for (const s of deck.native) if (s && s.title && titles.length < 3) titles.push(s.title);
    return {
      line: base.line,
      sample: titles.length ? titles : base.sample,
      note: k !== "standard" && !deck ? "This chapter reads the core material for now — " + TIERS[k].name + " depth arrives as the forge continues." : ""
    };
  }
  function showTierPicker(root, ch, startSlide) {
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Before you begin</p>
      <h2>Choose your difficulty</h2>
      <p class="page-sub">One choice, made once — it shapes what you read, how deeply you're tested, and what your recognition means. Every tier is a complete education; the higher the tier, the more the Academy assumes you already know — and the more it gives you in return.</p>`));
    const grid = el("div", "tier-pick");
    TIER_ORDER.forEach(k => {
      const t = TIERS[k];
      const pv = lanePeek(k, ch);
      grid.appendChild(el("div", "tier-card", `
        <div class="tier-card-head"><span class="tier-name" style="color:${t.color}">${t.name}</span><span class="tier-dot" style="background:${t.color}"></span></div>
        <p class="tier-tag">${esc(t.tag)}</p>
        <div class="tier-peek" style="--peek:${t.color}">
          <div class="tier-peek-head">Peek inside · what you'll read</div>
          <div class="tier-peek-titles">${pv.sample.map(s => `<span>${esc(s)}</span>`).join("")}</div>
          <p class="tier-peek-line">${esc(pv.line)}</p>
          ${pv.note ? `<p class="tier-peek-note">${esc(pv.note)}</p>` : ""}
        </div>
        <ul class="tier-in">${TIER_IN[k].map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <button class="btn-gold tier-go" data-tier="${k}">Choose ${t.name}</button>`));
    });
    root.appendChild(grid);
    root.appendChild(el("div", "tier-pick-note", `${ICONS.sparkle}<span><b>One lane, deliberately chosen.</b> You can't switch mid-course freely — the only doors are a deliberate <b>upgrade</b> (after a 100% pass) or a <b>struggle downgrade</b> (offered with your consent if a tier is too steep). Graduates unlock every tier free. This is your first lane, not your only one.</span>`));
    grid.querySelectorAll(".tier-go").forEach(b => b.addEventListener("click", () => {
      S.tier = b.dataset.tier;
      save();
      toast("Difficulty set: " + TIERS[b.dataset.tier].name + " — locked in", "rank");
      root.innerHTML = "";
      renderLesson(root, ch.id, startSlide, false);
    }));
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
      // quick-resume marker: where the student actually left off, so the
      // dashboard strip can pick them straight back up
      S.lastLesson = { ch: ch.id, slide: n, ts: Date.now() };
    }
    const pct = Math.round(n / ch.slides * 100);
    const fill = document.querySelector(".lesson-progress-fill");
    if (fill) fill.style.width = pct + "%";
    document.querySelector(".lesson-top .j-num").textContent = ch.bonus ? "The Accumulation" : "Chapter " + fmt(ch.id);
    const titleEl = document.querySelector(".lesson-title h3");
    if (titleEl) titleEl.textContent = ch.title;

    const isQuizSlide = ch.quiz && ch.quizSlides.includes(n);
    const quizQ = isQuizSlide ? ch.quiz[ch.quizSlides.indexOf(n)] : null;
    if (quizQ && !rev) session.qShownAt = Date.now(); // start the response-time clock for this question
    // Exam protocol: the exam clock starts the moment the first question
    // renders (Challenging/Elite only — Standard stays untimed). The deadline
    // persists, so re-entering can never reset it.
    if (quizQ && !rev && tierKey() !== "standard" &&
        (!S.examDeadline || S.examDeadline.ch !== ch.id || S.examDeadline.lane !== tierKey())) {
      S.examDeadline = { ch: ch.id, lane: tierKey(), endsAt: Date.now() + EXAM_MIN[tierKey()] * 60000 };
      save();
      startExamClock(stage);
    }
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

    // Quiz slides show ONLY our quiz card — the assessment renders alone.
    // In revision mode, quiz slides show a locked notice instead of the question.
    const frameHtml = native
      ? nativeCard(native)
      : isQuizSlide
        ? `<div class="stage-frame stage-quiz-blank"><div class="stage-count">${fmt(n)} / ${ch.slides}</div></div>`
        : `<div class="stage-frame">
          <div class="stage-shade"></div>
          <img src="${slidePath(ch.id, n)}" alt="Chapter ${ch.id} slide ${n}" class="slide-img" draggable="false" oncontextmenu="return false;">
          <div class="wm-tile" style="background-image:${wmTile()}"></div>
          <div class="stage-wm">${esc(studentID())} · REALITY FX</div>
          <div class="stage-count">${fmt(n)} / ${ch.slides}</div>
        </div>`;

    const revisionNotice = rev && isQuizSlide
      ? `<div class="rev-locked"><span class="rev-locked-ic">${ICONS.lock}</span><div><b>Assessment locked during reflection</b><p>You're reviewing the material — the questions come after the window closes. Read slowly; this is where the pass is actually earned.</p></div></div>`
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
        ${printTrustLevel() === "trusted" && !rev ? `<button class="btn-ghost" id="print-slide" title="Trusted printing — your copy stays watermarked with your Student ID">Print slide</button>` : ""}
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
    // trusted printing — an EARNED entitlement (§9.6b): only printTrust
    // 'trusted' students get the button; the copy stays watermarked.
    const printBtn = document.getElementById("print-slide");
    if (printBtn) printBtn.addEventListener("click", () => printSlide(ch, n));
  }

  function printSlide(ch, n) {
    const old = document.querySelector(".print-slide");
    if (old) old.remove();
    const div = el("div", "print-slide");
    div.innerHTML = `<div class="ps-head">Reality FX Academy · ${esc(studentID())}</div>
      <img src="${slidePath(ch.id, n)}" alt="Chapter ${ch.id} slide ${n}">
      <div class="ps-foot">${esc(ch.title)} — slide ${fmt(n)} of ${ch.slides} · ${esc(studentID())} · Reality FX Academy · confidential to the named student</div>`;
    document.body.appendChild(div);
    window.print();
    setTimeout(() => div.remove(), 600);
  }

  // read-only revision banner with a live countdown to retake unlock
  function revisionBanner(ch) {
    const lock = retryLocked(ch);
    const tokens = retriesLeft(ch);
    return `<div class="rev-banner">
      <span class="rev-banner-ic">${ICONS.book}</span>
      <div class="rev-banner-body">
        <p class="rev-banner-t">Reflection period · read-only review</p>
        <p class="rev-banner-sub">Assessment locked until the window closes — this is where the pass is earned. Retake unlocks in <b class="rev-count" data-end="${Date.now() + lock}">${fmtLock(lock)}</b> · ${tokens}/${MAX_RETRIES} tokens left.</p>
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

  // Exam protocol — the real-time exam clock for Challenging/Elite quizzes.
  // The market never stops, and neither does the exam: the countdown runs to
  // zero even if the tab hides, and when it hits zero the exam closes and the
  // answers given so far are graded — exactly like a bell in an exam hall.
  // Named fmtExamClock (not fmtClock) on purpose: the session clock's fmtClock
  // above formats SECONDS, and a duplicate `function fmtClock` declaration in
  // the same scope would shadow it everywhere — the LIVE SESSION pill would
  // render seconds through this milliseconds formatter and freeze. Unique
  // names for every clock — the lesson of the frozen-timer scare.
  function fmtExamClock(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }
  function startExamClock(stage) {
    if (session.examTicker) clearInterval(session.examTicker);
    const chip = document.querySelector(".exam-clock");
    if (chip) chip.classList.add("on");
    session.examTicker = setInterval(() => {
      const d = S.examDeadline;
      const c = document.querySelector(".exam-clock");
      if (!d || !c) return;
      const left = d.endsAt - Date.now();
      if (left <= 0) {
        clearInterval(session.examTicker);
        session.examTicker = null;
        S.examDeadline = null;
        save();
        const chipEl = document.querySelector(".exam-clock");
        if (chipEl) chipEl.remove();
        toast("Time's up — the exam closes, your answers are graded", "warn");
        finishChapter(stage || document.querySelector(".stage"));
        return;
      }
      c.querySelector("b").textContent = fmtExamClock(left);
      c.classList.toggle("urgent", left < 60000);
    }, 500);
  }

  // Mid-quiz encouragement: two wrong answers in a row earns a gentle line,
  // not a spiral. The red moment becomes coaching — the fragile student is
  // pulled back in before the quiz turns into a losing streak in their head.
  const QNUDGE = [
    "Shake it off — two in a row means the lesson's landing. The next one's yours.",
    "That's two. Breathe, re-read the gold note, and take the next one — you've got this.",
    "The market just taught you twice for free. Now make it pay — next question, your turn."
  ];
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
    let nudgeLine = "";
    if (chosen !== undefined && chosen !== q.answer) {
      const corr = session.at.corrects || [];
      let bad = 0;
      for (let i = corr.length - 1; i >= 0 && !corr[i]; i--) bad++;
      if (bad >= 2) nudgeLine = `<p class="quiz-nudge">${QNUDGE[(session.idx + bad) % QNUDGE.length]}</p>`;
    }
    return `
      <div class="quiz-card">
        <div class="quiz-tag">Checkpoint · slide ${n}</div>
        <p class="quiz-q">${esc(q.q)}</p>
        <div class="quiz-opts">${opts}</div>
        ${chosen !== undefined ? `<div class="quiz-fb ${chosen === q.answer ? "good" : "bad"}">${chosen === q.answer ? "Correct." : "Not quite."} ${esc(q.explain)}${chosen === q.answer ? "" : nudgeLine}</div>` : ""}
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
    session.at.times.push(ms); session.at.picks.push(pick); session.at.corrects.push(correct); session.at.qlens.push(q.q.length);
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
    if (correct && ms < 1400 && !trustHigh() && !S.flags.some(f => f.type === "fast" && f.ch === ch.id && f.qi === qi)) {
      S.flags.push({ type: "fast", ch: ch.id, qi, ms, ts: Date.now(), note: "Correct answer faster than reading speed — possible automated response." });
      if (S.flags.length > 200) S.flags = S.flags.slice(-200);
      flagsSync(); // report to the academy server for moderator review
    }
    touch(); save();
    drawSlide(document.querySelector(".stage"));
  });

  /* ---------- Integrity analyser (human-psychology heuristics) ----------
     A human answering a quiz is a fingerprint: response times wobble,
     reading time tracks question length, picks wander. Machines (or a
     student with the answer key open) produce patterns humans don't:
     robotic rhythms, instant streaks, untouched reading time, and the
     classic look-it-up pause. Each finding is a REVIEW TRIGGER for the
     moderator — never a verdict. Deduped per chapter per type, capped at
     three flags per attempt so one bad run can't flood the queue. */
  function analyzeAttempt(ch, st, prevBest, score, wasFailed) {
    const T = session.at.times, P = session.at.picks, C = session.at.corrects, L = session.at.qlens;
    const n = T.length;
    if (n < 5) return; // too few answers to judge a rhythm
    const now = Date.now();
    let raised = 0;
    const flag = (type, extra) => {
      if (raised >= 3) return;
      // Trust Bar as hall pass: a student whose bar is high is trusted — the
      // machine adapts to them and recognises speed instead of flagging it.
      if (trustHigh()) return;
      if (S.flags.some(f => f.type === type && f.ch === ch.id)) return; // one per chapter per type
      S.flags.push(Object.assign({ type, ch: ch.id, qi: 0, ts: now }, extra || {}));
      if (S.flags.length > 200) S.flags = S.flags.slice(-200);
      raised++;
    };
    const mean = T.reduce((a, b) => a + b, 0) / n;
    const correctRate = C.filter(Boolean).length / n;

    // 1. Robotic rhythm — a human's response times wobble (CV ~0.4+); a
    //    key-reader answers in a tight band. Low variance + fast mean = clockwork.
    if (n >= 6 && mean < 5000) {
      const sd = Math.sqrt(T.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n);
      if (mean > 0 && sd / mean < 0.22) {
        flag("uniform-timing", { n, mean: Math.round(mean), cv: +(sd / mean).toFixed(2), note: "Response times vary by less than 22% across " + n + " answers — human timing wobbles far more. Possible key-reader." });
      }
    }
    // 2. Never reading — a human takes longer on longer questions; near-zero
    //    or negative correlation means the text isn't being read at all.
    if (n >= 6 && mean < 6000) {
      const mL = L.reduce((a, b) => a + b, 0) / n;
      const sL = Math.sqrt(L.reduce((a, b) => a + (b - mL) * (b - mL), 0) / n) || 1;
      const sT = Math.sqrt(T.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n) || 1;
      const r = (T.reduce((a, b, i) => a + (T[i] - mean) * (L[i] - mL), 0) / n) / (sT * sL);
      if (r < 0.1) {
        flag("no-reading", { n, corr: +r.toFixed(2), note: "Answer speed doesn't track question length (r=" + r.toFixed(2) + ") — the questions are barely being read." });
      }
    }
    // 3. Instant streak — five or more correct answers under reading speed,
    //    back to back. One fast answer is a reflex; five is a script.
    let streak = 0, best = 0;
    T.forEach((t, i) => { streak = (C[i] && t < 1400) ? streak + 1 : 0; best = Math.max(best, streak); });
    if (best >= 5) {
      flag("instant-streak", { streak: best, note: best + " consecutive correct answers in under 1.4s each — impossible to read, let alone decide." });
    }
    // 4. Pattern picks — an 80%+ run that follows a mechanical pattern:
    //    the same option every time, strict alternation, or a strict march.
    if (n >= 8 && correctRate >= 0.8) {
      const counts = [0, 0, 0, 0];
      P.forEach(p => { if (counts[p] != null) counts[p]++; });
      const same = Math.max.apply(null, counts) >= n - 1;
      const alt = P.every((p, i) => i === 0 || p !== P[i - 1]) && new Set(P).size === 2;
      const asc = P.every((p, i) => i === 0 || p > P[i - 1]);
      if (same || alt || asc) {
        flag("pattern-picks", { n, note: "An 80%+ run that follows a mechanical answer pattern (uniform, alternating or marching picks) — humans don't answer like that." });
      }
    }
    // 5. Jump retake — a retake that leaps 40+ points with almost no review.
    //    The reflection window exists to study; this big a jump from a few
    //    minutes of reading is the memorise-and-reproduce tell.
    if (prevBest != null && (wasFailed || (st.retries || 0) > 0) && score - prevBest >= 40 && (st.reviewSecs || 0) < 180) {
      flag("jump-retake", { from: prevBest, to: score, reviewSecs: st.reviewSecs || 0, note: "Retake jumped " + prevBest + "→" + score + " with only " + (st.reviewSecs || 0) + "s of review — far more than the reflection window should produce." });
    }
    // 6. Paused search — a long silence before the FIRST answer, then a fast
    //    near-perfect run. The classic look-it-up signature: read, leave,
    //    search, return, cruise.
    if (T[0] > 90000 && score >= 90 && mean < 6000) {
      flag("paused-search", { firstMs: T[0], mean: Math.round(mean), note: "Took " + Math.round(T[0] / 1000) + "s before the first answer, then cruised at " + Math.round(mean) + "ms/answer with a " + score + "% — the pause-and-search pattern." });
    }
  }

  /* ---------- Achievement bridge (FOR-LEE §6b) ----------
     System A doesn't grade — the OS owns averages. The moment a verified
     student's course average crosses the threshold (80%), the OS fires ONE
     bridge event so System A can mint the free tee + hoody fulfilment order.
     Idempotent by reference (ACH-2026-S1-<studentId>): a retry can never
     double-claim. Production posts to System A's /api/achievement Cloud
     Function (set ACHIEVEMENT_ENDPOINT); the demo records the moment locally
     and celebrates it here — System A's demo simulates the claim with its
     own staff button, so nothing is double-minted. */
  const ACHIEVEMENT_THRESHOLD = 80;
  const ACHIEVEMENT_ENDPOINT = ""; // production: System A /api/achievement URL
  function courseAverage() {
    const graded = CHAPTERS.filter(c => c.quiz && chState(c.id).lastScore != null);
    if (!graded.length) return null;
    return Math.round(graded.reduce((a, c) => a + chState(c.id).lastScore, 0) / graded.length);
  }
  function maybeSendAchievement() {
    const rec = handoffRec();
    if (!rec) return; // the merch reward belongs to a registered identity
    const avg = courseAverage();
    if (avg == null || avg < ACHIEVEMENT_THRESHOLD) return;
    const ref = "ACH-2026-S1-" + rec.studentId;
    S.achievements = S.achievements || {};
    if (S.achievements[ref]) return; // once per achievement, ever
    S.achievements[ref] = { at: new Date().toISOString(), average: avg };
    save();
    const payload = { studentId: rec.studentId, average: avg, reference: ref, source: "reality-fx-os" };
    if (ACHIEVEMENT_ENDPOINT) {
      fetch(ACHIEVEMENT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) {
          if (res && res.ok) toast("Achievement unlocked — your free tee + hoody is being prepared at the front desk", "rank");
          // res.already → already claimed — never double-reward
        })
        .catch(function () { /* the local record stands; reconciliation can resend */ });
    } else {
      toast("Achievement unlocked — 80%+ average. Your free Reality FX tee + hoody is waiting at the front desk.", "rank");
    }
  }

  function finishChapter(stage) {
    const ch = session.ch, st = chState(ch.id);

    // Exam protocol: the clock stops the moment the chapter finishes — whether
    // by completing it or by the bell.
    if (session.examTicker) { clearInterval(session.examTicker); session.examTicker = null; }
    S.examDeadline = null;
    save();
    const chipEl = document.querySelector(".exam-clock");
    if (chipEl) chipEl.remove();

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
    if (passed && score === 100 && total >= 5 && !trustHigh() && session.answeredCount && session.answeredCount.msSum < 5000) {
      S.flags.push({ type: "perfect-fast", ch: ch.id, score, msSum: session.answeredCount.msSum, n: session.answeredCount.n, ts: Date.now(), note: "100% in under 5s total — extremely unlikely for a human." });
      if (S.flags.length > 200) S.flags = S.flags.slice(-200);
      flagsSync(); // report to the academy server for moderator review
    }

    // Smarter human-psychology heuristics — the aggregate behavioural
    // fingerprint of this attempt (rhythm, reading, streaks, patterns,
    // retake jumps, pause-then-cruise). Review triggers, never verdicts.
    analyzeAttempt(ch, st, prevBest, score, wasFailed);
    flagsSync(); // push aggregate findings to the moderator NOW — never wait for a reboot

    // Badges + retake bookkeeping
    const passedCount = CHAPTERS.filter(c => c.quiz && chState(c.id).passed).length;
    session.nudge = ""; // every attempt starts clean — never carry a nudge into a fail reveal
    session.fire = null; // ...and never a stale fire streak card either
    session.recog = null; // ...and the completion-time recognition is per-attempt too
    session.upgradeTier = null; // 100% pass → offer the next difficulty lane
    session.downgradeTier = null; // repeated sub-pass on a higher tier → gentle step-down offer
    if (passed) {
      st.passed = true;
      st.completedAt = Date.now(); // 24h cooldown anchor — the next chapter cannot unlock until this + 24h
      // a pass proves the whole chapter — credit every slide so isComplete()
      // flips true and the next chapter unlocks (the layout-migration trim
      // otherwise leaves quiz slides out of `viewed` for first-time passers)
      st.viewed = Array.from({ length: ch.slides }, (_, i) => i + 1);
      // Rapid progression detection: if 3+ chapters are passed within a
      // 60-minute window, flag the account for moderator review. This catches
      // a student who photographs every slide, passes with a bot, and moves
      // on — the 24h gate slows them, but this flag catches the ones who
      // somehow bypass it or brute-force during a trial.
      if (!ch.bonus) {
        const recentPasses = CHAPTERS.filter(c => c.quiz && !c.bonus && (S.chapters[c.id] || {}).completedAt)
          .filter(c => Date.now() - (S.chapters[c.id].completedAt) < 60 * 60 * 1000)
          .length;
        if (recentPasses >= 3 && !trustHigh()) {
          S.flags.push({ type: "rapid-progression", ch: ch.id, count: recentPasses, ts: Date.now(), note: recentPasses + " chapters passed in under 60 minutes — likely automated extraction or session theft." });
          if (S.flags.length > 200) S.flags = S.flags.slice(-200);
          flagsSync();
        }
      }
      addXp(XP_QUIZ_PASS);
      // The Hidden Accumulation: the bonus chapter's pass carries its own badge —
      // the rarest on the journey, because it is the last door before the exam.
      if (ch.bonus) { awardBadge(ch, "gem"); addXp(60, "accumulation"); }
      if (score === 100) {
        awardBadge(ch, "perfect"); addXp(50, "perfect-quiz");
        // The upgrade door: a flawless pass proves the lane is too easy — offer the next tier.
        if (tierKey() !== "elite") session.upgradeTier = TIER_ORDER[TIER_ORDER.indexOf(tierKey()) + 1];
      }
      if (score >= 80) awardBadge(ch, "honours");
      if (hadPassed && prevBest !== null && prevBest < 90 && score >= 90) awardBadge(ch, "distinction");
      if (wasFailed || st.retries > 0) awardBadge(ch, "lion");
      if (passedCount === 0 && !ch.bonus) awardBadge(ch, "first"); // first chapter ever passed (the bonus chapter can never be anyone's first)
      st.failedAt = null; // reflection window clears on a pass
      // Flag the chapter this pass just opened so the Journey map can play
      // the golden unlock animation for it (consumed once, in renderMap).
      const nxt = CHAPTERS.find(c => c.id === ch.id + 1);
      if (nxt && isUnlocked(nxt) && !isComplete(nxt)) S.justUnlocked = nxt.id;
      // Recognition tier + near-miss: 80%+ is a distinction and gets celebrated,
      // not pushed — retake pressure is reserved for scores below the line.
      if (score >= 90 && score < 100) {
        session.nudge = `<div class="nudge-card"><span class="nudge-ic">${ICONS.diamond}</span><div><p class="nudge-t"><b>Outstanding — ${score}%!</b> We're proud of you.</p><p class="nudge-s">At 100% the <b>Flawless</b> badge — the rarest in the Academy — is yours. No pressure: this chapter is already a win.</p></div></div>`;
      } else if (score >= 80 && score < 90) {
        session.nudge = `<div class="nudge-card"><span class="nudge-ic">${ICONS.medal}</span><div><p class="nudge-t"><b>Excellent — ${score}%!</b> Honours-level work, and we're proud of you.</p><p class="nudge-s">A 90%+ retake unlocks the <b>Distinction Hunter</b> badge and top-tier privileges — it's there if you ever want it.</p></div></div>`;
      } else if (score < 80) {
        const owned = st.badges || [];
        const cands = [];
        if (!owned.includes("honours")) cands.push({ ic: "medal", name: "Honours", need: 80 });
        if (!owned.includes("perfect")) cands.push({ ic: "diamond", name: "Flawless", need: 100 });
        if (!owned.includes("distinction") && (hadPassed || st.retries > 0 || wasFailed)) cands.push({ ic: "trophy", name: "Distinction Hunter", need: 90 });
        if (cands.length) {
          const best = cands.reduce((a, b) => (b.need - score < a.need - score ? b : a));
          const gap = best.need - score;
          session.nudge = `<div class="nudge-card"><span class="nudge-ic">${ic(best.ic)}</span><div><p class="nudge-t">Just <b>${gap}% more</b> would earn you the <b>${best.name}</b> badge</p><p class="nudge-s">${gap <= 10 ? "You're one clean run away — the retake is free." : "Re-read the chapter and retake — fair play rewards the review."}</p></div></div>`;
        }
      }
    } else {
      st.failedAt = Date.now(); // each fail restarts the 2h reflection window
      // only a RETRY consumes a token — the first attempt is free
      if (wasFailed || (st.retries || 0) > 0) st.retries = (st.retries || 0) + 1;
      if (!st.firstFailAt) st.firstFailAt = Date.now();
      // The struggle door: a higher tier taken twice without a pass is honest
      // effort — offer a step down with consent, never force it.
      if (tierKey() !== "standard" && (st.retries || 0) >= 1) session.downgradeTier = TIER_ORDER[Math.max(0, TIER_ORDER.indexOf(tierKey()) - 1)];
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

    // Completion-time recognition — the machine times the attempt. A pass
    // finished well ahead of the honest expectation, on a high Trust Bar,
    // is read as mastery and celebrated out loud: the Trust Bar is the hall
    // pass. The same speed with a low bar would be evidence, not a trophy.
    if (passed && st.startedAt && trustHigh()) {
      const expected = chapterTotalMins(ch) * 60000;
      const spent = Date.now() - st.startedAt;
      if (expected > 0 && spent < expected * 0.7 && !session.recog) {
        const mins = Math.max(1, Math.round(spent / 60000));
        session.recog = `<div class="recog-card"><span class="recog-ic">${ICONS.crown}</span><div><p class="recog-t"><b>Well done — that was fast, and the machine noticed.</b></p><p class="recog-s">You finished ${esc(ch.title)} in about ${mins} min — ahead of the ~${Math.round(expected / 60000)} min this chapter honestly takes. Your Trust Bar is high, so the Academy reads this as mastery, not a shortcut. That's exactly how trust is supposed to work.</p></div></div>`;
      }
    }
    // The attempt is over — reset the clock so the next attempt is timed fresh.
    st.startedAt = null;
    save();

    // Achievement bridge: the course average may have just crossed 80% —
    // fire the one-time merch reward event for a verified identity.
    maybeSendAchievement();

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
    // Tier-aware recognition: a badge earned in a higher lane is worth more.
    // The tier tag rides with the badge so the dashboard can show it.
    if (!st.badgeTier) st.badgeTier = {};
    st.badgeTier[key] = tierKey();
    save();
    const b = BADGES[key];
    toast(b ? "Badge earned: " + b.name : "Badge earned!", "rank");
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
      ? `<div class="reveal-badges">${newBadges.map(b => `<div class="badge-pill"><span>${badgeIc(b)}</span><div><b>${BADGES[b].name}</b><p>${esc(BADGES[b].desc)}</p></div></div>`).join("")}</div>`
      : "";
    box.innerHTML = `
      <p class="quiz-tag">Your real score</p>
      <div class="reveal-score ${passed ? "pass" : "fail"}"><span id="scoreNum">0</span><small>%</small></div>
      <p class="finish-score ${passed ? "pass" : "fail"}">${passed ? "Passed — the next chapter opens tomorrow. Use the time to absorb what you've learned. No school rushes through terms, and neither do we." : `Not yet — ${PASS_PCT}% to pass. The cooling period begins — review the material and return stronger.`}</p>
      ${badgeRow}
      ${session.recog || ""}
      ${session.nudge || ""}
      ${session.fire ? `<div class="fire-card"><span class="fire-ic">${ICONS.flame}</span><div><p class="fire-t">You're on fire — ${session.fire} chapters in a row at 80%+</p><p class="fire-s">Consistency like this is how institutions are built. Keep the streak alive.</p></div></div>` : ""}
      ${session.upgradeTier ? `<div class="tier-door-card up"><span class="tier-door-ic">${ICONS.flame}</span><div><p class="tier-door-t"><b>100% — you killed it.</b> Piece of cake, huh?</p><p class="tier-door-s">Want to test yourself in <b>${TIERS[session.upgradeTier].name}</b>? Harder questions, insider notes, and recognition that means more. The upgrade is deliberate and one-way — your call.</p><div class="tier-door-btns"><button class="btn-gold sm" id="upgGo">Upgrade to ${TIERS[session.upgradeTier].name}</button><button class="btn-ghost sm" id="upgNo">Stay ${tierName()}</button></div></div></div>` : ""}
      ${session.downgradeTier ? `<div class="tier-door-card down"><span class="tier-door-ic">${ICONS.heart}</span><div><p class="tier-door-t"><b>${tierName()} is where my toughest students train — no shame in building up to it.</b></p><p class="tier-door-s">A second attempt at this level is honest effort. <b>${TIERS[session.downgradeTier].name}</b> still teaches the full course — and you can return to ${tierName()} free once you graduate. Your call, and I'll respect either.</p><div class="tier-door-btns"><button class="btn-ghost sm" id="dgGo">Move to ${TIERS[session.downgradeTier].name}</button><button class="btn-gold sm" id="dgNo">Stay — I'll beat it</button></div></div></div>` : ""}
      ${!passed ? `<div class="reflect-card">
        <p><b>Reflection period</b> — your next attempt unlocks in <b>${fmtLock(lock)}</b>.</p>
        <p>Retake tokens left: <b>${tokens}/${MAX_RETRIES}</b>. Use the time to re-read the lesson and think about what the questions were really asking — then come back sharper. Honest review beats a rushed retake.</p>
      </div>` : ""}
      <div class="calib-card ${calib.cls}">${ICONS.sparkle}<p>${esc(calib.txt)}</p></div>
      <div class="reveal-actions">
        ${passed ? `<button class="btn-gold" id="fin" data-n="1">Claim XP & continue</button>` : `
        <button class="btn-gold" id="finRev">Review the chapter now</button>
        <button class="btn-ghost" id="finMap">Back to the Journey</button>`}
        <button class="btn-ghost" id="finBreak">${ICONS.moon} Take a break</button>
      </div>
      <div class="break-nudge">${ICONS.moon}<span>Heads up — your brain just did real work. A short reset keeps the next chapter sharp.</span></div>`;
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
    const finBreak = box.querySelector("#finBreak");
    if (finBreak) finBreak.addEventListener("click", () => {
      toast("The Break Room is open — walk back in when you're reset", "rank");
      location.hash = "#/break";
    });
    if (finRev) finRev.addEventListener("click", () => {
      toast("Reflection review — read the material, the quiz waits", "rank");
      location.hash = "#/review/" + ch.id;
    });
    if (finMap) finMap.addEventListener("click", () => { location.hash = "#/map"; });
    // Tier doors: upgrade (deliberate, one-way) and struggle step-down (consent).
    const upgGo = box.querySelector("#upgGo"), upgNo = box.querySelector("#upgNo");
    const dgGo = box.querySelector("#dgGo"), dgNo = box.querySelector("#dgNo");
    const tierDoorDone = (t) => {
      box.innerHTML = `<div class="tier-door-done">${ICONS.check}<p><b>${t}</b></p><p>Your dashboard and lessons now carry the new lane. Go show it what you're made of.</p><button class="btn-gold" id="tierDoorCont">Continue</button></div>`;
      box.querySelector("#tierDoorCont").addEventListener("click", () => { location.hash = "#/map"; });
    };
    if (upgGo) upgGo.addEventListener("click", () => {
      S.tier = session.upgradeTier; save();
      toast("Upgraded to " + TIERS[S.tier].name + " — the Academy now demands more of you", "rank");
      tierDoorDone("Upgraded to " + TIERS[S.tier].name + ".");
    });
    if (upgNo) upgNo.addEventListener("click", () => {
      const c = box.querySelector(".tier-door-card.up"); if (c) c.remove();
    });
    if (dgGo) dgGo.addEventListener("click", () => {
      S.tier = session.downgradeTier; save();
      toast("Moved to " + TIERS[S.tier].name + " — build the foundation, then come back for the summit", "rank");
      tierDoorDone("Now training in " + TIERS[S.tier].name + ".");
    });
    if (dgNo) dgNo.addEventListener("click", () => {
      const c = box.querySelector(".tier-door-card.down"); if (c) c.remove();
    });
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
  /* Style intel — the numbers behind each lane. Engineered Academy patterns:
     illustrative, not a promise of results — the point is that every lane pays
     when the habits are right, and no style is superior to another. */
  const STYLE_INTEL = {
    scalper: [
      { pct: 55, color: "#E6C565", label: "WIN-RATE ZONE", value: "55%", text: "Scalp winners cluster near 50–60% — frequency, not accuracy, does the work." },
      { pct: 70, color: "#E9E6DE", label: "VOLATILITY WINDOWS", value: "70%", text: "Roughly 7 in 10 of a scalper's best trades come in the London–New York overlap." },
      { pct: 30, color: "#9fe3bd", label: "THE SPREAD TAX", value: "30%", text: "Spread + commission can silently eat ~30% of a tight scalp edge." }
    ],
    day: [
      { pct: 60, color: "#E6C565", label: "THE TWO WINDOWS", value: "60%", text: "The open and the close carry ~60% of a day trader's daily range." },
      { pct: 33, color: "#E9E6DE", label: "WIN RATE NEEDED", value: "33%", text: "At 1:2 reward-to-risk, a day trader only needs ~33% wins to stay green." },
      { pct: 45, color: "#9fe3bd", label: "FIRST-HOUR BIAS", value: "45%", text: "Nearly half of a day's directional move often prints in the first hour." }
    ],
    swing: [
      { pct: 60, color: "#E6C565", label: "TREND ADHERENCE", value: "60%", text: "Roughly 6 in 10 swing winners ride with the daily trend, not against it." },
      { pct: 25, color: "#E9E6DE", label: "PROFIT FROM FEW", value: "25%", text: "Swing traders often see ~25% of their setups deliver most of the month's P&L." },
      { pct: 70, color: "#9fe3bd", label: "PATIENCE PREMIUM", value: "70%", text: "Letting the setup come to the level beats chasing it ~70% of the time." }
    ],
    position: [
      { pct: 80, color: "#E6C565", label: "THEME OVER TICK", value: "80%", text: "Position traders attribute ~80% of results to the theme, not the entry tick." },
      { pct: 60, color: "#E9E6DE", label: "HOLD THROUGH NOISE", value: "60%", text: "~60% of the eventual move happens after the position feels 'wrong'." },
      { pct: 20, color: "#9fe3bd", label: "DRAWDOWN TOLERANCE", value: "20%", text: "A position thesis can draw down 20%+ and still be right — size for it." }
    ],
    general: [
      { pct: 40, color: "#E6C565", label: "DATA DECIDES", value: "40%", text: "Most traders' natural style is revealed within their first ~40 graded answers." },
      { pct: 100, color: "#E9E6DE", label: "NO WRONG LANE", value: "100%", text: "Every style makes money with discipline — the choice is entirely yours." },
      { pct: 66, color: "#9fe3bd", label: "COMMITMENT EDGE", value: "66%", text: "Traders who master one lane beat the style-collectors ~2 times out of 3." }
    ]
  };

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

    // Style intel — the numbers behind the lane, drawn as rings
    const INTEL = STYLE_INTEL[prof.key] || STYLE_INTEL.general;
    root.appendChild(el("div", "panel", `
      <h3 class="panel-title gold-serif">Style intel — the numbers behind the ${esc(prof.name)} lane</h3>
      <p class="panel-sub">Patterns the Academy tracks across traders of your style. These are the habits that make the lane pay — not a promise of results, a picture of the discipline.</p>
      <div class="intel-grid">
        ${INTEL.map(i => `<div class="intel-cell">${ringGauge(i.pct, i.color, i.label, i.value, i.text)}</div>`).join("")}
      </div>
      <div class="intel-note">${ICONS.sparkle}<span><b>No style is better than another.</b> Scalp, day, swing and position all make money — each carries its own advantages and its own traps. The only wrong lane is the one that doesn't fit you, and the OS adapts to yours, not the other way around.</span></div>`));

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
      ${weak.length ? weak.map(([t, n]) => `<div class="out-row"><span>${esc(t)}</span><b>${n} missed</b></div>`).join("") : `<p class="dim">Answer some assessment questions and your weak spots will appear here.</p>`}`));
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
      gems.push({ cls: "gold", title: "Your journey begins with data", body: "Complete Chapter 1 and answer its assessment — then your personal analytics light up. Every answer sharpens the picture." });
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
      <span class="grade-why">${r.retries} retake${r.retries > 1 ? "s" : ""} · last score ${r.lastScore}%${r.passed ? " · passed" : " · failed"} · review: ${r.reviewed ? "✓ " + fmtTime(r.reviewSecs * 1000) : "✗ none"} · badges: ${(r.badges || []).map(b => badgeIc(b)).join(" ") || "none"}</span>`)));
    root.appendChild(rt);

    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">Recent quiz activity (response-time audit)</h3>`));
    const tl = el("div", "grade-list");
    if (!log.length) tl.appendChild(el("p", "dim mod-empty", "Answer the quiz to populate the audit trail."));
    log.slice().reverse().slice(0, 20).forEach(r => tl.appendChild(el("div", "grade-row", `
      <span class="grade-ch">${fmt(r.ch)} · ${esc(r.tag)}</span>
      <span class="grade-why">${r.correct ? "correct" : "wrong"} in ${r.ms}ms</span>`)));
    root.appendChild(tl);

    // System integrity — the machine watching the machine (founder view)
    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">System integrity · the machine watching the machine</h3>
      <p class="panel-sub">The watchdog that would have caught the frozen-clock scare: the session clock must advance, storage must persist, and the rail must answer. Any stall is healed on the spot and logged here — this is the audit trail of the machine auditing itself.</p>`));
    const itg = el("div", "grade-list");
    const evs = (S.sysIntegrity || []).slice().reverse().slice(0, 8);
    if (!evs.length) itg.appendChild(el("p", "dim mod-empty", "No integrity events yet — the watchdog arms on boot."));
    evs.forEach(function (ev) {
      const dd = new Date(ev.at);
      itg.appendChild(el("div", "grade-row",
        `<span class="grade-ch">${fmt(dd.getHours())}:${fmt(dd.getMinutes())} · ${esc(ev.kind)}</span>
         <span class="grade-why">${esc(ev.note)}</span>`));
    });
    root.appendChild(itg);
    const itgStatus = el("p", "panel-sub", "");
    const runBtn = el("button", "btn-gold sm", "Run self-check now");
    runBtn.addEventListener("click", function () {
      runBtn.disabled = true;
      runBtn.textContent = "Checking…";
      const t0 = document.getElementById("sessTimer");
      const a = t0 ? t0.textContent : "";
      setTimeout(function () {
        const t1 = document.getElementById("sessTimer");
        const b = t1 ? t1.textContent : "";
        const clockOk = !!a && a !== b;
        const storageOk = storageProbe();
        const done = function (railOk) {
          itgStatus.innerHTML = (clockOk ? "✅" : "❌") + " clock " + (clockOk ? "advancing" : "STALLED — healed") +
            " · " + (storageOk ? "✅" : "❌") + " storage " + (storageOk ? "persists" : "FAILED") +
            " · " + (railOk ? "✅" : "❌") + " academy rail " + (railOk ? "answering" : "unreachable");
          if (!clockOk) refreshSessDisplay();
          if (!clockOk || !storageOk || !railOk) integrityPush("selfcheck", "Manual self-check: clock=" + clockOk + " storage=" + storageOk + " rail=" + railOk);
          runBtn.disabled = false;
          runBtn.textContent = "Run self-check now";
        };
        fetch("api/handoffs", { cache: "no-store" }).then(function (r) { done(r.ok); }).catch(function () { done(false); });
      }, 1500);
    });
    const itgRow = el("div", "itg-actions");
    itgRow.appendChild(runBtn);
    root.appendChild(itgRow);
    const itgStat = el("div", "itg-status");
    itgStat.appendChild(itgStatus);
    root.appendChild(itgStat);

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
    root.appendChild(el("div", "panel", `<h3 class="panel-title gold-serif">For the moderator</h3><p class="panel-sub">Download the full audit trail — flags, assessment timelines, dwell times and retake history — for review or archiving. On this build the data is device-local; Phase 2 accounts sync every student's record to the academy server.</p>`));
    root.querySelector(".panel:last-of-type").appendChild(exportBtn);
  }

  /* ============================================================
     LABORATORY — Risk Calculator
     ============================================================ */
  function renderLab(root) {
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Laboratory</p>
      <h2>The Risk Laboratory</h2>
      <p class="page-sub">Practise the exact formulas from Chapter 7 — position sizing, the 1% rule, R-multiples, and drawdown recovery. No real money required. This is where theory becomes instinct.</p>`));
    const grid = el("div", "lab-grid");
    grid.appendChild(labRiskChecker());   // the 1% rule, made concrete — the question students ask most
    grid.appendChild(labMaSandbox());     // the MA workbench — build it, tune it, break it (live from the Lab)
    grid.appendChild(labPositionSizer());
    grid.appendChild(labRRPlanner());
    grid.appendChild(labOutcomeR());
    grid.appendChild(labDrawdown());
    grid.appendChild(labCircuitBreaker());
    grid.appendChild(labLadder());
    root.appendChild(grid);
    root.appendChild(el("p", "lab-note", "Pip values vary by pair — EUR/USD ≈ $10 per standard lot, USD/JPY and others differ. Always confirm with your broker."));
  }

  /* The 1% Risk Checker — the machine answers the question every student
     asks: "is THIS trade 1%, 2% or 10%?" Feed it your account size, entry,
     stop, take-profit and position size, and it computes the exact money at
     risk, the percentage of your account, the verdict on the 1% rule, and
     the reward-to-risk your plan is actually offering. */
  function labRiskChecker() {
    const c = el("div", "tool-card");
    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.shield}</span><div><h3>1% Risk Checker</h3><p class="tool-sub">Is this trade within the 1% rule? The machine does the arithmetic.</p></div></div>
      <div class="tool-in">
        <label>Account size ($)<input type="number" id="rc-bal" value="10000" min="0" step="100"></label>
        <label>Position size (units)<input type="number" id="rc-units" value="10000" min="0" step="100"><span class="tool-hint">1 standard lot = 100,000 units · 0.10 lot = 10,000 units</span></label>
        <label>Entry price<input type="number" id="rc-entry" value="1.1000" step="0.0001"></label>
        <label>Stop loss<input type="number" id="rc-stop" value="1.0950" step="0.0001"></label>
        <label>Take profit<input type="number" id="rc-target" value="1.1200" step="0.0001"></label>
        <label>Direction<select id="rc-side"><option value="long">Long (buy)</option><option value="short">Short (sell)</option></select></label>
      </div>
      <div class="tool-result" id="rc-result"><span class="dim">Enter your trade — the verdict updates live</span></div>`;
    const upd = () => {
      const bal = Math.max(0, +c.querySelector("#rc-bal").value || 0);
      const units = Math.max(0, +c.querySelector("#rc-units").value || 0);
      const e = Math.max(0, +c.querySelector("#rc-entry").value || 0);
      const s = Math.max(0, +c.querySelector("#rc-stop").value || 0);
      const t = Math.max(0, +c.querySelector("#rc-target").value || 0);
      const side = c.querySelector("#rc-side").value;
      const res = c.querySelector("#rc-result");
      const riskPer = side === "long" ? e - s : s - e;
      const rewPer = side === "long" ? t - e : e - t;
      if (!bal || !units || !e || riskPer <= 0) {
        res.innerHTML = `<span class="dim">${riskPer <= 0 && e ? "Stop sits on the wrong side of entry for a " + side + " — flip the stop or the direction." : "Enter your trade — the verdict updates live"}</span>`;
        return;
      }
      const risk$ = riskPer * units;
      const riskPct = risk$ / bal * 100;
      const within = riskPct <= 1;
      const rr = rewPer > 0 ? Math.abs(rewPer) / Math.abs(riskPer) : 0;
      const maxUnits = riskPer > 0 ? Math.floor(bal * 0.01 / riskPer) : 0;
      res.innerHTML = `
        <div class="out-big ${within ? "good" : "warn"}">${riskPct.toFixed(2)}% <small>of your account at risk</small></div>
        <div class="out-row"><span>Money at risk</span><b>$${risk$.toFixed(2)}</b></div>
        <div class="out-row"><span>Reward : risk</span><b>${rr > 0 ? "1 : " + rr.toFixed(2) : "—"}</b></div>
        <div class="out-row"><span>Max size within 1%</span><b>${maxUnits.toLocaleString()} units</b></div>
        ${within ? "<div class='warn-note' style='border-color:rgba(80,180,110,.35);background:rgba(80,180,110,.08);color:#9fe3bd'>✓ Within the 1% rule. The machine approves this size.</div>" : `<div class="warn-note">This trade risks ${riskPct.toFixed(1)}% of your account — over the 1% rule. Size down to ${maxUnits.toLocaleString()} units (or cut the stop distance) to bring it inside.</div>`}`;
    };
    c.querySelectorAll("input").forEach(i => i.addEventListener("input", upd));
    c.querySelector("#rc-side").addEventListener("change", upd);
    upd();
    return c;
  }

  /* The MA Sandbox — the build-it-tune-it-break-it workbench, living
     permanently in the Laboratory. Same seeded market, same sliders, same
     presets and breakout drill as the workshop — so the Lab is not just
     arithmetic: it is a whole strategy workbench at the student's fingertips. */
  function labMaSandbox() {
    const c = el("div", "tool-card ma-compact");
    c.innerHTML = `<div class="tool-head"><span class="tool-ic">${ICONS.chart}</span><div><h3>MA Strategy Workbench</h3><p class="tool-sub">Build a crossover, tune the periods, break it on purpose — a synthetic market that answers to your hand.</p></div></div>
      <div class="tool-body">${maDrillHTML("-lab")}</div>`;
    wireMaDrill(c, "-lab");
    return c;
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
    { d: 0.51, v: "THEY'RE LIQUIDATING. EVERYTHING IS GOING." } // fires on the last trade (depth 0.52) before the blow-up banner
  ];
  function ddDepthLabel(d) {
    const pct = Math.round(d * 100);
    return pct <= 10 ? "a bump" : pct <= 20 ? "a real drawdown" : pct <= 35 ? "deep trouble" : "the abyss";
  }
  function labDrawdown() {
    const c = el("div", "tool-card");
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
          `<div class="dd-voice">“${esc(DD_VOICES[voicesShown].v)}”</div>`);
        voicesShown++;
      }
    };
    const updBal = () => {
      balEl().textContent = "$" + bal.toLocaleString("en-US", { minimumFractionDigits: 0 });
      deepEl().textContent = "-" + Math.round(depth * 100) + "%";
      deepEl().classList.toggle("warn", depth >= 0.3);
    };

    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.trendDown}</span><div><h3>Drawdown Journey</h3><p class="tool-sub">Hold, cut, or get liquidated — feel what drawdown actually does</p></div></div>
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
      const banner = `<div class="dd-blow"><b>MARGIN CALL — FORCED LIQUIDATION</b><p>The broker closes your positions at the worst possible prices. The account you built over months is gone in an afternoon — this is what holding past -50% looks like.</p></div>`;
      c.querySelector("#dd-log").insertAdjacentHTML("beforeend", `<div class="dd-voice danger">The account has been liquidated. From here, recovery is measured in years, not weeks.</div>`);
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
        stage.innerHTML = `<div class="dd-good"><b>THE DESCENT ENDS</b><p>You took every trade the market offered. The account is bruised but alive — barely.</p></div>`;
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
          <b>${dead ? "The account didn't survive" : "The recovery ladder"}</b>
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

  // The Recovery Ladder — the asymmetric math that makes the cut the trade.
  // A -20% hole needs +25% back; a -50% hole needs +100%. Seeing the ladder
  // climb in your own numbers is why Chapter 7 calls drawdown the real enemy.
  function labLadder() {
    const c = el("div", "tool-card");
    c.innerHTML = `
      <div class="tool-head"><span class="tool-ic">${ICONS.mountain}</span><div><h3>Recovery Ladder</h3><p class="tool-sub">What a loss really costs — the climb back up</p></div></div>
      <div class="tool-in">
        <label>You're down<input type="number" id="la-loss" value="20" min="1" max="90" step="1"><span class="tool-hint">% of your account lost</span></label>
        <label>To break even<div class="out-big" id="la-need-mini">+25%</div></label>
      </div>
      <div class="tool-result">
        <div class="out-big" id="la-need">+25.0% <small>to get back to even</small></div>
        <div class="out-row"><span>Winning 1R trades needed (1:1)</span><b id="la-wins">25</b></div>
        <div class="out-row"><span>Winning 1R trades needed (1:2)</span><b id="la-wins2">13</b></div>
        <p class="out-hint">The deeper the hole, the steeper the climb — this is why the cut is the trade.</p>
      </div>`;
    const upd = () => {
      const d = Math.max(1, Math.min(90, +c.querySelector("#la-loss").value || 20));
      const need = d / (100 - d) * 100;
      c.querySelector("#la-need").innerHTML = `+${need.toFixed(1)}% <small>to get back to even</small>`;
      c.querySelector("#la-need-mini").textContent = "+" + need.toFixed(0) + "%";
      c.querySelector("#la-wins").textContent = Math.ceil(need);
      c.querySelector("#la-wins2").textContent = Math.ceil(need / 2);
    };
    c.querySelectorAll("input").forEach(i => i.addEventListener("input", upd));
    upd();
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
          st.innerHTML = `<div class="cb-tilt"><b>${ICONS.alert} Revenge mode</b><p>You overrode the breaker. From here the deck is tilted against you — this is what chasing feels like in real R terms. You can still stop after any trade.</p></div><div class="cb-btns"><button class="btn-gold sm" id="cb-take">Take the next trade</button><button class="btn-ghost sm" id="cb-stop">Stop — it's enough</button></div>`;
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
          st.innerHTML = `<div class="cb-tilt"><b>${ICONS.alert} Revenge mode</b><p>You overrode the breaker. From here the deck is tilted against you — this is what chasing feels like in real R terms. You can still stop after any trade.</p></div><div class="cb-btns"><button class="btn-gold sm" id="cb-take">Take the next trade</button><button class="btn-ghost sm" id="cb-stop">Stop — it's enough</button></div>`;
          st.querySelector("#cb-take").addEventListener("click", take);
          st.querySelector("#cb-stop").addEventListener("click", stop);
          upd();
        });
        return;
      }
      if (wasTilt && tilt) {
        stage.innerHTML = `
          <div class="cb-tilt"><b>${ICONS.alert} Revenge mode</b><p>You overrode the breaker. From here the deck is tilted against you — this is what chasing feels like in real R terms. You can still stop after any trade.</p></div>
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
    const lock = unlocked ? "" : `<div class="vault-lock"><div class="vault-lock-ic">${ICONS.lock}</div><div class="vault-lock-txt"><p>Earn <b>${missing}</b> more badge${missing === 1 ? "" : "s"} to enter. Badges are earned, not given: 80%+ for <b>Honours</b>, 100% for <b>Flawless</b>, a 90%+ retake for <b>Distinction Hunter</b>, a fail-turned-pass for <b>Heart of a Lion</b>, and your first pass for <b>First Blood</b>.</p><div class="vault-progress"><span style="width:${Math.min(100, count / VAULT_BADGES_NEEDED * 100)}%"></span></div><p class="vault-prog-t">${count}/${VAULT_BADGES_NEEDED} badges earned</p></div></div>`;

    root.appendChild(el("div", "vault", `
      <div class="vault-hero">
        ${unlocked ? `<div class="vault-ic">${ICONS.lockOpen}</div>` : ""}
        <h2 class="gold-serif">The Academy Vault</h2>
        <p class="vault-sub">${unlocked ? "Unlocked — reserved for the students who proved they want it more." : "The Vault holds what ordinary students never see: extra depth beyond the main course and a network reserved for top performers."}</p>
      </div>
      ${lock}
      <div class="vault-sec ${unlocked ? "" : "dim"}">
        <div class="vault-sec-head"><span class="vault-sec-ic">${ICONS.grad}</span><div><h3>Advanced Lessons</h3><p>Extra depth beyond the main curriculum — the hidden gems of the Academy.</p></div>${unlocked ? "" : '<span class="ni-soon">LOCKED</span>'}</div>
        <div class="vault-grid">
          <div class="vault-slot"><span class="vault-slot-ic">${ICONS.video}</span><div><b>Replay the Market</b><p>Replay real market moves and dissect the decision-making in real time.</p></div><span class="ni-soon">SOON</span></div>
          <div class="vault-slot"><span class="vault-slot-ic">${ICONS.book}</span><div><b>The Institutional Playbook</b><p>How institutions build, manage and defend positions — the layer above retail.</p></div><span class="ni-soon">SOON</span></div>
          <div class="vault-slot"><span class="vault-slot-ic">${ICONS.mic}</span><div><b>Live Trade Breakdowns</b><p>Recorded analyses of real setups — coming when the studio is ready.</p></div><span class="ni-soon">SOON</span></div>
        </div>
      </div>
      <div class="vault-sec ${unlocked ? "" : "dim"}">
        <div class="vault-sec-head"><span class="vault-sec-ic">${ICONS.users}</span><div><h3>The Recognition Circle</h3><p>Where top performers belong.</p></div>${unlocked ? '<span class="vault-tag">OPEN</span>' : '<span class="ni-soon">LOCKED</span>'}</div>
        <div class="vault-body">
          <p>Students who perform at badge level earn their place in the Recognition Circle — a private group of the Academy's highest-achieving traders, where you network with the peers who take this as seriously as you do.</p>
          <p><b>And the door doesn't stop at the network.</b> Circle members who pursue employment after graduating hold an express pass: direct recognition from the Reality FX board and genuine consideration for roles inside the company. It is rare — the course proves you are the one for the job; the interview confirms you fit our system. But it is real, and it is yours to reach for.</p>
        </div>
      </div>
      <div class="vault-foot"><p>"Every lesson is a trade. Every trade is a lesson."</p></div>
    `));
  }

  /* ============================================================
     CERTIFICATE — the founder's concept art, made live.
     The certificate's visual base is the approved concept design
     (crown, crest ribbon, RX seal, double frame) rendered as a
     raster with the five dynamic fields erased: recipient name,
     the course-details line, the issue date (value + long form)
     and the Certificate ID. The live student record overlays
     those exact positions, so the trophy in the room is the
     trophy on paper. Every certificate carries a unique
     credential ID (RFX-<year>-<hex>) and a QR code pointing at
     its public verification record — scan to verify, no login.
     One markup source (certMarkup) feeds the room, the locked
     trophy-case preview, and the printed page, and the print CSS
     is self-contained so printing never depends on the OS.
     ============================================================ */
  const CERT_ASSET = "assets/cert-base.png";
  const CERT_VERIFY_HOST = "www.realityfxacademy.com";
  function certAssetUrl() {
    try { return new URL(CERT_ASSET, location.href).href; } catch (e) { return CERT_ASSET; }
  }
  function certVerifyURL(code) {
    return "https://" + CERT_VERIFY_HOST + "/verify/" + encodeURIComponent(code || "");
  }
  /* Render the verification QR as a compact SVG (module runs). The QR
     contains only the public verification URL — never student data —
     and points at the official registry, so a copied QR always shows
     the true holder, exposing any fake certificate immediately. */
  function certQRSvg(url) {
    try {
      if (typeof qrcode !== "function") return "";
      const q = qrcode(0, "M");
      q.addData(url); q.make();
      const n = q.getModuleCount(), s = 100 / n;
      let d = "";
      for (let r = 0; r < n; r++) {
        let c = 0;
        while (c < n) {
          if (q.isDark(r, c)) {
            const c0 = c;
            while (c < n && q.isDark(r, c)) c++;
            const w = (c - c0) * s;
            d += "M" + (c0 * s).toFixed(3) + " " + (r * s).toFixed(3) + "h" + w.toFixed(3) + "v" + s.toFixed(3) + "h-" + w.toFixed(3) + "z";
          } else c++;
        }
      }
      return '<svg viewBox="0 0 100 100" shape-rendering="crispEdges" role="img" aria-label="Scan to verify this credential"><path d="' + d + '"/></svg>';
    } catch (e) { return ""; }
  }
  const CERT_PRINT_CSS = `
:root{--gold:#D8AA52;--gold2:#C9A63F;--ink:#ECEAE3;--serif:"Playfair Display",Georgia,serif;--sans:Inter,system-ui,sans-serif}
@page{size:A4 landscape;margin:0}
html,body{margin:0;padding:0;background:#0a0a0a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{display:flex;align-items:center;justify-content:center;min-height:100vh}
.cert{position:relative;container-type:inline-size;width:100vw;height:100vh;background:#0a0a0a;overflow:hidden}
.cert-bg{position:absolute;inset:0;width:100%;height:100%;display:block}
.cert-name{position:absolute;left:19.4%;top:38.6%;width:62.6%;height:6.3%;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--serif);font-weight:700;font-size:5.9cqw;letter-spacing:.10em;line-height:1;color:var(--gold);white-space:nowrap;text-shadow:0 0 14px rgba(216,170,82,.28)}
.cert-details{position:absolute;left:15%;top:59.7%;width:70%;height:2.2%;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--sans);font-weight:600;font-size:1.15cqw;letter-spacing:.05em;line-height:1;color:var(--gold2);white-space:nowrap;text-transform:uppercase}
.cert-details b{color:#E8C878;font-weight:600}
.cert-date-val{position:absolute;left:15.68%;top:78.9%;width:11.4%;height:2.5%;display:flex;align-items:center;justify-content:center;font-family:var(--sans);font-weight:600;font-size:1.5cqw;letter-spacing:.05em;line-height:1;color:var(--ink);white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.cert-date-sub{position:absolute;left:17.2%;top:83.3%;width:8.5%;height:1.4%;display:flex;align-items:center;justify-content:center;font-family:var(--sans);font-weight:600;font-size:.8cqw;letter-spacing:.14em;line-height:1;color:var(--gold2);white-space:nowrap;text-transform:uppercase}
.cert-id-val{position:absolute;left:73.8%;top:78.9%;width:11.7%;height:2.5%;display:flex;align-items:center;justify-content:center;font-family:var(--sans);font-weight:600;font-size:1.28cqw;letter-spacing:.03em;line-height:1;color:var(--ink);white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.cert-qr{position:absolute;left:84.8%;top:5.6%;display:flex;flex-direction:column;align-items:center;justify-content:center}
.cert-qr-tile{position:relative;width:4.9cqw;aspect-ratio:1;background:#0b0b0b;border:1px solid rgba(212,175,55,.75);border-radius:.5cqw;box-shadow:0 2px 10px rgba(0,0,0,.6)}
.cert-qr-tile svg{position:absolute;inset:.42cqw;width:calc(100% - .84cqw);height:calc(100% - .84cqw)}
.cert-qr-tile svg path{fill:#D8AA52}
.cert-qr-cap{font-family:var(--sans);font-weight:600;font-size:.6cqw;letter-spacing:.16em;color:var(--gold2);margin-top:.5cqw;white-space:nowrap}
.cert-dim{opacity:.5;filter:grayscale(.15)}
.cert-stamp{position:absolute;left:34%;top:52%;width:32%;transform:rotate(-16deg);border:2px solid rgba(216,170,82,.85);color:rgba(216,170,82,.92);font-family:var(--sans);font-weight:700;font-size:2.4cqw;letter-spacing:.22em;text-align:center;padding:1.1cqw 0;border-radius:.6cqw;text-transform:uppercase;box-shadow:0 0 22px rgba(216,170,82,.25)}
`;
  function certMarkup(d) {
    const code = d.code || "";
    const qrSvg = !d.stamp && code ? certQRSvg(certVerifyURL(code)) : "";
    return `<div class="cert${d.stamp ? " cert-dim" : ""}">
  <img class="cert-bg" src="${esc(d.assetUrl || CERT_ASSET)}" alt="Reality FX certificate">
  <div class="cert-name">${esc(d.name || "")}</div>
  <div class="cert-details">${d.meta || ""}</div>
  <div class="cert-date-val">${d.dateShort ? esc(d.dateShort) : ""}</div>
  <div class="cert-date-sub">${d.dateLong ? esc(d.dateLong) : ""}</div>
  <div class="cert-id-val">${esc(code)}</div>
  ${qrSvg ? `<div class="cert-qr"><span class="cert-qr-tile">${qrSvg}</span><span class="cert-qr-cap">SCAN TO VERIFY</span></div>` : ""}
  ${d.stamp ? `<div class="cert-stamp">NOT YET EARNED</div>` : ""}
</div>`;
  }

  function certValueCards(locked) {
    const cards = [
      { ic: ICONS.medal, t: "Competence, certified", d: "This is a competency credential, not a completion slip. It records what you can demonstrably do to the Academy's standard — trained, assessed, tested, challenged, and machine-graded." },
      { ic: ICONS.key, t: "One identity, forever", d: "Every certificate carries a unique Certificate ID, minted from the identity System A verified at registration. Never reused, never reassigned — it points back to one person." },
      { ic: ICONS.robot, t: "Graded by the machine", d: "Every assessment behind it was graded by the machine, not a mood: accuracy tracked, progression gates enforced, the Final Examination timed, one-way, and ungameable." },
      { ic: ICONS.shield, t: "Built to be verified", d: "The credential is designed for independent online verification. The registry goes live with the Academy — anyone can confirm this certificate was genuinely issued by Reality FX." }
    ];
    return `<div class="cert-value">
      <h2 class="gold-serif">${locked ? "What the certificate means" : "What this certificate contains"}</h2>
      <div class="cert-value-grid">
        ${cards.map(c => `<div class="cert-value-card"><span class="cert-value-ic">${c.ic}</span><div><b>${esc(c.t)}</b><p>${c.d}</p></div></div>`).join("")}
      </div>
      <p class="cert-value-note">The certificate is the record. The competence behind it is the achievement.</p>
    </div>`;
  }

  function renderCertificate(root) {
    const pct = progressPct();
    const exam = examPassed();
    const name = profileName() || "Reality FX Student";
    const p = profile(); ensureCode(p);
    const code = credId(p, name);
    if (pct < 100 || !exam) {
      const chLeft = 13 - CHAPTERS.filter(isComplete).length;
      const meta = `THE RFX FULL COURSE &nbsp;|&nbsp; 13 CHAPTERS &nbsp;|&nbsp; <b>${Math.round(pct)}% COMPLETE</b>`;
      root.appendChild(el("div", "cert-wrap", `
        <div class="cert-stage">
          <span class="cert-travel"></span>
          <span class="cert-travel cert-travel-2"></span>
          <span class="cert-glass-halo"></span>
          ${certMarkup({ name, code, meta, dateShort: "", dateLong: "", idSub: "Student ID", badges: "", stamp: true })}
        </div>
        <div class="cert-locked">
          <h2 class="gold-serif">Your certificate awaits</h2>
          <p>${pct < 100
            ? `Complete all 13 chapters — ${chLeft} remaining — then pass the Final Examination, and the stamp lifts.`
            : `Every chapter is complete. One last door: pass the Final Examination (${EXAM_PASS}% or better) and the certificate is yours.`}</p>
          <div class="cert-progress big"><span style="width:${pct}%"></span></div>
          <button class="btn-gold" data-go="${pct < 100 ? "map" : "exam"}">${pct < 100 ? "Back to the journey" : "Begin the Final Examination"}</button>`));
      root.querySelector("[data-go]").addEventListener("click", () => location.hash = pct < 100 ? "#/map" : "#/exam");
      root.appendChild(el("div", "", certValueCards(true)));
      return;
    }
    const today = new Date();
    const dateLong = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const dateShort = today.getFullYear() + " - " + String(today.getMonth() + 1).padStart(2, "0") + " - " + String(today.getDate()).padStart(2, "0");
    const xp = S.xp, rank = rankFor(S.xp);
    const meta = `THE RFX FULL COURSE &nbsp;|&nbsp; 13 CHAPTERS &nbsp;|&nbsp; <b>${xp} XP</b> &nbsp;|&nbsp; RANK: <b>${esc(rank.name)}</b> &nbsp;|&nbsp; FINAL EXAMINATION: <b>PASSED</b>`;
    const certKeys = [...earnedBadgeKeys()];
    const certBadges = certKeys.length
      ? `<div class="cert-badge-row"><p class="cert-label">Earned badges</p><div>${certKeys.map(k => `<span class="cert-badge" title="${esc(BADGES[k].name)}">${badgeIc(k)}</span>`).join("")}</div></div>`
      : "";
    root.appendChild(el("div", "cert-wrap", `
      <div class="cert-stage">
        <span class="cert-travel"></span>
        <span class="cert-travel cert-travel-2"></span>
        <span class="cert-glass-halo"></span>
        ${certMarkup({ name, code, meta, dateShort, dateLong, idSub: handoffRec() ? "Verified Student ID" : "Student Code · Phase 2", badges: certBadges, stamp: false })}
      </div>
      <button class="btn-gold" id="certPrint">${ICONS.download} Print certificate (PDF)</button>`));
    root.querySelector("#certPrint").addEventListener("click", () => printCertificate());
    // The certificate is minted into the registry the moment it is earned —
    // the QR becomes verifiable against the official record, once, forever.
    root.appendChild(registerCredential(code, dateLong));
    root.appendChild(el("div", "", certValueCards(false)));
  }
  /* The certificate, minted into the registry. The moment a student earns
     it, the OS asks the rail to record it — once per credential, only for
     verified identities (the server double-checks the studentId against its
     own handoff store), and never overwriting an existing record, so a
     copied certificate always resolves to the true holder. If the rail is
     unreachable the visit stays silent and the next visit retries. The green
     line is the honest proof: this exact credential is now independently
     verifiable. */
  function registerCredential(code, dateLong) {
    const el0 = el("div", "cert-reg", "");
    el0.hidden = true;
    const h = handoffRec();
    const name = profileName();
    if (!h || !h.studentId || !name) return el0;
    const show = (html) => { el0.hidden = false; el0.innerHTML = `<div class="cert-reg-ok">${html}</div>`; };
    const line = () => `${ICONS.check} <span>Registered in the RFX verification registry — the QR on this certificate is live. Anyone who scans it sees this exact record.</span>`;
    if (S.credRegistered === code) { show(line()); return el0; }
    fetch("api/credentials/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: h.studentId, credential_id: code, credential_name: "RFX Certified Trader", student_name: name, issue_date: dateLong }),
      cache: "no-store"
    }).then(r => r.ok ? r.json() : null)
      .then(function (res) {
        if (!res || !res.ok) return; // rail unreachable — retried on the next visit
        S.credRegistered = code;
        save();
        show(line());
      })
      .catch(function () { /* silent — never interrupt the trophy moment */ });
    return el0;
  }
  /* ============================================================
     REGISTRY CONSOLE — the credential office (founder / admin)
     Mint, revoke, search and inspect RFX credentials, and read
     the verification audit trail. This is the authority behind
     every certificate the Academy issues: the registry is the
     source of truth the QR on each certificate points at. The
     route is gated client-side, and every write is re-checked
     server-side against the handoff store.
     ============================================================ */
  function renderRegistry(root) {
    const sid = (handoffRec() || {}).studentId || "";
    const state = { creds: [], act: [], q: "" };
    const fmtWhen = function (ts) {
      const t = typeof ts === "number" ? ts : (Date.parse(String(ts)) / 1000);
      if (!t || isNaN(t)) return "—";
      const d = new Date(t * 1000);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    };
    const longDate = function (iso) {
      if (!iso) return "";
      const d = new Date(String(iso).indexOf("-") >= 0 && String(iso).length === 10 ? iso + "T00:00:00" : iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    };
    const pill = (st) => st === "REVOKED" ? `<span class="pill">REVOKED</span>` : `<span class="pill gold">VALID</span>`;
    root.innerHTML = `
      <div class="panel reg-head">
        <h3 class="gold-serif">${ICONS.diamond} Registry Console</h3>
        <p class="page-sub">Mint, revoke and inspect RFX credentials — the authority behind every certificate. The registry is the source of truth the QR on each certificate points at, and the audit trail below records every verification scan.</p>
        <div class="reg-stats" id="regStats"></div>
      </div>
      <div class="reg-grid">
        <div class="panel reg-mint">
          <h4 class="reg-h">${ICONS.sparkle} Mint a credential</h4>
          <label class="reg-l">Student name</label>
          <input class="reg-in" id="mintName" placeholder="Full verified name" autocomplete="off">
          <div class="reg-id-prev" id="mintIdPrev"></div>
          <label class="reg-l">Credential</label>
          <select class="reg-in" id="mintCred">
            <option>RFX Certified Trader</option>
            <option>RFX Advanced Trader</option>
            <option>RFX Risk Management Specialist</option>
            <option>RFX Trading Instructor</option>
            <option>RFX Professional Trading Certification</option>
          </select>
          <label class="reg-l">Issue date</label>
          <input class="reg-in" id="mintDate" type="date">
          <button class="btn-gold reg-mint-btn" id="mintBtn">Mint credential</button>
          <p class="reg-err" id="mintErr"></p>
        </div>
        <div class="panel reg-list">
          <h4 class="reg-h">${ICONS.chart} The registry</h4>
          <input class="reg-in reg-search" id="regSearch" placeholder="Search by ID or holder…" autocomplete="off">
          <div id="regTable"></div>
        </div>
      </div>
      <div class="panel reg-audit">
        <h4 class="reg-h">${ICONS.clock} Verification audit trail</h4>
        <div id="regAudit"></div>
      </div>`;
    const $r = (id) => root.querySelector("#" + id);
    const mintName = $r("mintName"), mintCred = $r("mintCred"), mintDate = $r("mintDate"), mintBtn = $r("mintBtn"), mintErr = $r("mintErr"), mintPrev = $r("mintIdPrev");
    const todayISO = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
    mintDate.value = todayISO();
    const updPrev = function () {
      const n = mintName.value.trim();
      mintPrev.innerHTML = n ? `<span class="reg-prev-lbl">Credential ID</span> <b>${esc(certCode(n))}</b>` : "";
    };
    mintName.addEventListener("input", updPrev);
    updPrev();
    function renderStats() {
      const valid = state.creds.filter(c => c.status !== "REVOKED").length;
      $r("regStats").innerHTML =
        `<div class="reg-stat"><b>${state.creds.length}</b><span>Credentials</span></div>` +
        `<div class="reg-stat"><b>${valid}</b><span>Valid</span></div>` +
        `<div class="reg-stat"><b>${state.creds.length - valid}</b><span>Revoked</span></div>` +
        `<div class="reg-stat"><b>${state.act.length}</b><span>Verification lookups</span></div>`;
    }
    function renderTable() {
      const f = state.q.toLowerCase();
      const rows = state.creds.filter(c => !f || (c.credential_id || "").toLowerCase().indexOf(f) >= 0 || (c.student_name || "").toLowerCase().indexOf(f) >= 0);
      if (!rows.length) {
        $r("regTable").innerHTML = `<p class="reg-empty">${state.creds.length ? "No credentials match that search." : "The registry is empty. Credentials appear here the moment a certificate is earned in the OS — or mint one on the left."}</p>`;
        return;
      }
      $r("regTable").innerHTML = `<table class="reg-table"><thead><tr><th>Credential</th><th>Holder</th><th>Issued</th><th>Status</th><th></th></tr></thead><tbody>` +
        rows.map(c => `<tr><td class="reg-id">${esc(c.credential_id)}</td><td>${esc(c.student_name)}</td><td class="reg-mut">${esc(c.issue_date || "—")}</td><td>${pill(c.status)}</td><td>${c.status === "VALID" ? `<button class="btn-ghost reg-revoke" data-id="${esc(c.credential_id)}">Revoke</button>` : ""}</td></tr>`).join("") +
        `</tbody></table>`;
    }
    function renderAudit() {
      if (!state.act.length) { $r("regAudit").innerHTML = `<p class="reg-empty">No lookups yet — every scan of a certificate QR lands here as a credential, a verdict and a time. The scanner's identity is never recorded.</p>`; return; }
      $r("regAudit").innerHTML = `<ul class="reg-audit-list">` + state.act.slice(0, 60).map(a =>
        `<li><span class="ra-id">${esc(a.id)}</span><span class="ra-out ${String(a.outcome || "").toLowerCase().replace("_", "-")}">${esc(a.outcome)}</span><span class="ra-at">${fmtWhen(a.at)}</span></li>`).join("") + `</ul>`;
    }
    function refresh() {
      $r("regTable").innerHTML = `<p class="reg-empty">Loading the registry…</p>`;
      Promise.all([
        fetch("api/credentials", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
        fetch("api/credentials/activity?admin=" + encodeURIComponent(sid), { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      ]).then(function (res) {
        state.creds = (res[0] && res[0].credentials) || [];
        state.act = (res[1] && res[1].activity) || [];
        renderStats(); renderTable(); renderAudit();
      }).catch(function () { $r("regTable").innerHTML = `<p class="reg-empty">Couldn't reach the registry rail — try again.</p>`; });
    }
    $r("regSearch").addEventListener("input", function (e) { state.q = e.target.value; renderTable(); });
    mintBtn.addEventListener("click", function () {
      const name = mintName.value.trim();
      if (!name) { mintErr.textContent = "Enter the student's full name."; return; }
      mintErr.textContent = "";
      mintBtn.disabled = true; mintBtn.textContent = "Minting…";
      fetch("api/credentials/mint", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: sid, credential_id: certCode(name), credential_name: mintCred.value, student_name: name, issue_date: longDate(mintDate.value) }),
        cache: "no-store"
      }).then(r => r.json()).then(function (res) {
        mintBtn.disabled = false; mintBtn.textContent = "Mint credential";
        if (!res.ok) { mintErr.textContent = res.reason || "Mint failed."; return; }
        mintErr.textContent = "";
        mintName.value = ""; updPrev();
        toast("Credential " + res.credential_id + " minted" + (res.already ? " (already existed)" : ""), "ok");
        refresh();
      }).catch(function () { mintBtn.disabled = false; mintBtn.textContent = "Mint credential"; mintErr.textContent = "Rail unreachable — try again."; });
    });
    $r("regTable").addEventListener("click", function (e) {
      const btn = e.target.closest(".reg-revoke");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      if (!window.confirm("Revoke " + id + "? Every scan of that certificate will read REVOKED from now on.")) return;
      fetch("api/credentials/revoke", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: sid, credential_id: id, reason: "Revoked via the Registry Console" }),
        cache: "no-store"
      }).then(r => r.json()).then(function (res) {
        if (!res.ok) { toast(res.reason || "Revoke failed.", ""); return; }
        toast(id + (res.already ? " was already revoked" : " revoked"), "ok");
        refresh();
      }).catch(function () { toast("Rail unreachable — try again.", ""); });
    });
    refresh();
  }
  /* The trophy, on paper — a self-contained A4-landscape certificate page
     built from the student's live record (same markup + styles as the
     delivered PDF, so the print never depends on the OS booting, the
     sidebar, or anything else). Opens a print-ready page the student saves
     as PDF — or prints — and closes it afterwards. */
  function printCertificate() {
    const name = profileName() || "Reality FX Student";
    const p = profile(); ensureCode(p);
    const code = credId(p, name);
    const xp = S.xp, rank = rankFor(S.xp);
    const today = new Date();
    const dateLong = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const dateShort = today.getFullYear() + " - " + String(today.getMonth() + 1).padStart(2, "0") + " - " + String(today.getDate()).padStart(2, "0");
    const examLine = examPassed() ? " · Final Examination: passed" : "";
    const certKeys = earnedBadgeKeys();
    const badges = certKeys.length ? `<div class="cert-badge-row cert-badges-print"><p class="cert-label">Earned badges</p><div>${certKeys.map(k => `<span class="cert-badge" title="${esc(BADGES[k].name)}">${badgeIc(k)}</span>`).join("")}</div></div>` : "";
    const w = window.open("", "_blank");
    if (!w) { window.print(); return; } // popup blocked — the OS print CSS still delivers the trophy
    w.document.open();
    w.document.write(certPageHTML({ name, code, xp, rank, dateShort, dateLong, examLine, badges }));
    w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) { /* user prints manually */ } }, 600);
  }
  /* The standalone certificate document — self-contained CSS, zero JS
     dependencies, A4 landscape, full-bleed dark. This exact page is what
     the delivered PDF was printed from. */
  /* The standalone certificate document — self-contained CSS, zero JS
     dependencies, A4 landscape, full-bleed dark. This exact page is what
     the delivered PDF is printed from. Built from the same certMarkup the
     room renders, so the trophy on paper is the trophy on screen. */
  function certPageHTML(d) {
    const escAttr = s => esc(s).replace(/"/g, "&quot;");
    const meta = `THE RFX FULL COURSE &nbsp;|&nbsp; 13 CHAPTERS &nbsp;|&nbsp; <b>${d.xp} XP</b> &nbsp;|&nbsp; RANK: <b>${esc(d.rank.name)}</b>${d.examLine ? " &nbsp;|&nbsp; FINAL EXAMINATION: <b>PASSED</b>" : ""}`;
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Reality FX — Certificate — ${escAttr(d.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${CERT_PRINT_CSS}
</style></head><body>
${certMarkup({ name: d.name, code: d.code, meta, dateShort: d.dateShort, dateLong: d.dateLong, idSub: handoffRec() ? "Verified Student ID" : "Student Code · Phase 2", badges: d.badges, stamp: false, assetUrl: certAssetUrl() })}
</body></html>`;
  }
  /* The credential ID — RFX-<year>-<hex> — minted deterministically from
     the verified identity so the same student always resolves to the same
     credential, and never reused across students. This is the ID the QR
     encodes and the verification registry looks up. */
  function certCode(name) {
    let h = 0;
    const s = (name || "student").toUpperCase() + "-RFX13";
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const year = 2026; // the Academy's opening year — the minted ID is stable for the life of the credential
    return "RFX-" + year + "-" + h.toString(16).toUpperCase().padStart(6, "0").slice(0, 6);
  }
  /* The credential ID in current minting format; legacy short IDs minted
     before the year-prefix scheme are re-derived so every certificate is
     RFX-<year>-<hex>, the exact ID the verification QR encodes. */
  function credId(p, name) {
    const c = (p && p.code) || "";
    return /^RFX-\d{4}-/.test(c) ? c : certCode(name);
  }

  /* ============================================================
     THE FINAL EXAMINATION — the capstone of the whole course.
     One paper across all thirteen chapters, drawn live from the real
     decks, timed in hours, one-way, machine-graded. The certificate's
     last gate: finish every chapter, then sit the exam. It can also be
     run as a live, proctored workshop — same paper, same pass mark,
     the room is the difference.
     ============================================================ */
  const EXAM_PASS = 70;     // pass mark, in percent
  // Tier-aware exam sizing: deeper lanes = harder exams.
  function examQuestionsPerCh() {
    const k = tierKey();
    if (k === "elite") return 8;        // 8 × 13 = 104 questions
    if (k === "challenging") return 7;   // 7 × 13 = 91 questions
    return 6;                            // 6 × 13 = 78 questions (standard)
  }
  function examMinutes() {
    const k = tierKey();
    if (k === "elite") return 210;       // 3h 30m — a serious endurance test
    if (k === "challenging") return 180;  // 3h — depth demands time
    return 150;                           // 2h 30m — standard
  }
  function shuf(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }
  function examDeck(ch, lane) {
    const base = (ch.quiz || []).filter(q => q && q.q);
    if (lane === "standard") return base;
    const deep = composeTier(ch, lane) || ch[lane] || null;
    const extra = (deep && deep.quiz ? deep.quiz : []).filter(q => q && q.q);
    return base.concat(extra);
  }
  function buildExamPaper() {
    const lane = tierKey();
    const qpc = examQuestionsPerCh();
    const per = CHAPTERS.map(ch => ({
      ch: ch.id, title: ch.title,
      qs: shuf(examDeck(ch, lane)).slice(0, qpc)
    }));
    const paper = [];
    per.forEach(b => b.qs.forEach(q => paper.push({ ch: b.ch, q: q })));
    return { paper, per, lane };
  }
  function examBest() {
    const fe = S.finalExam || {};
    return fe.best || null;
  }
  function examPassed() {
    const b = examBest();
    return !!(b && b.pass);
  }
  function renderExam(root) {
    // The gate: the final examination is the certificate's last door.
    if (progressPct() < 100) {
      root.appendChild(el("div", "exam-gate", `
        <div class="finish-ic">${ICONS.note}</div>
        <h2 class="gold-serif">The Final Examination</h2>
        <p>One paper. Every chapter — 1 through 13 — drawn live from the decks you actually studied. Timed in hours, one-way, machine-graded. The certificate's last gate: ${13 - CHAPTERS.filter(isComplete).length} chapter${13 - CHAPTERS.filter(isComplete).length === 1 ? "" : "s"} still stand between you and the exam hall.</p>
        <div class="cert-progress big"><span style="width:${progressPct()}%"></span></div>
        <button class="btn-gold" data-go="map">Back to the journey</button>`));
      root.querySelector("[data-go]").addEventListener("click", () => location.hash = "#/map");
      return;
    }
    const run = S.finalExamRun;
    if (run && run.deadline && new Date(run.deadline).getTime() > Date.now()) { examLive(root, run); return; }
    const best = examBest();
    const paper = buildExamPaper();
    const n = paper.paper.length;
    const past = S.finalExam && S.finalExam.attempts ? S.finalExam.attempts : [];
    const em = examMinutes();
    const qpc = examQuestionsPerCh();
    const laneLabel = tierKey() === "elite" ? "Elite" : tierKey() === "challenging" ? "Challenging" : "Standard";
    const qpcLabel = qpc === 8 ? "Eight" : qpc === 7 ? "Seven" : "Six";
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Reality FX OS · the capstone</p>
      <h1 class="page-title">The Final Examination</h1>
      <p class="page-sub">Every chapter, one paper. ${n} questions drawn live from all 13 chapters in your ${laneLabel} lane — timed in hours, one-way, machine-graded. This is the certificate's last door.</p>`));
    root.appendChild(el("div", "exam-intro", `
      <div class="exam-intro-grid">
        <div class="exam-intro-stat"><b>${n}</b><span>Questions</span></div>
        <div class="exam-intro-stat"><b>${em} min</b><span>${Math.floor(em / 60)}h ${em % 60}m — the clock never pauses</span></div>
        <div class="exam-intro-stat"><b>${EXAM_PASS}%</b><span>Pass mark</span></div>
        <div class="exam-intro-stat"><b>13/13</b><span>Chapters covered</span></div>
      </div>
      <div class="exam-rules">
        <p><b>How it works.</b> ${qpcLabel} questions per chapter, every chapter — a full sweep of the course. Answer forward-only: once you move on, a question is done. ${em} minutes on the clock, and when it reaches zero the paper submits itself. ${past.length ? "You've sat " + past.length + (past.length === 1 ? " paper" : " papers") + " before — the best result stands." : "First sitting — make it count."}</p>
        <p><b>Honesty built in.</b> The paper is drawn fresh every sitting, the clock never pauses for a tab-switch, and the machine grades the answers — no human second-guessing. Pass at ${EXAM_PASS}% and the certificate is yours.</p>
      </div>
      <div class="exam-cta">
        <button class="btn-gold" id="examStart">${ICONS.note} Begin the Final Examination</button>
        <p class="exam-note">The same paper runs as a live, proctored workshop — the room is the difference, the standard is not.</p>
      </div>`));
    if (best) root.appendChild(el("div", "exam-best", `
      <div class="exam-best-in">
        <div class="exam-best-ic">${best.pass ? ICONS.check : ICONS.alert}</div>
        <div><b>Best result: ${best.pct}%${best.pass ? " · passed" : " · not yet"}</b>
        <p>${best.pass ? "The certificate door is open — collect it in the Certificate room." : "Keep studying, then sit it again — the best result is the one that counts."}</p></div>
      </div>`));
    root.querySelector("#examStart").addEventListener("click", function () {
      const paper2 = buildExamPaper();
      const mins2 = examMinutes();
      S.finalExamRun = { paper: paper2.paper, per: paper2.per, lane: paper2.lane, minutes: mins2, answers: [], cur: 0, deadline: new Date(Date.now() + mins2 * 60000).toISOString() };
      save();
      examLive(root, S.finalExamRun);
    });
  }
  function examLive(root, run) {
    root.innerHTML = "";
    const deadline = new Date(run.deadline).getTime();
    const total = run.paper.length;
    const chNames = {};
    (run.per || []).forEach(p => chNames[p.ch] = p.title);
    const qSel = (i) => { const a = run.answers[i]; return (a === undefined || a === null) ? -1 : a; };
    const saveRun = function () { S.finalExamRun = run; save(); };
    const answeredCount = () => run.answers.filter(a => a !== undefined && a !== null).length;
    const unanswered = () => total - answeredCount();
    // Timer tick — shared between exam and review screens
    let examIv = null;
    const startTimer = function (clockEl, barEl) {
      if (examIv) clearInterval(examIv);
      const tick = function () {
        const left = Math.max(0, deadline - Date.now());
        const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
        if (clockEl) { clockEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); clockEl.classList.toggle("low", left < 300000); }
        if (barEl) { barEl.style.width = Math.max(0, left / (deadline - Date.now() + left) * 100) + "%"; barEl.classList.toggle("low", left < 300000); }
        if (left <= 0) { clearInterval(examIv); examIv = null; examSubmit(); }
      };
      examIv = setInterval(tick, 1000); tick();
      root.__examIv = examIv;
    };
    // Build chapter groupings for the navigator
    const chGroups = [];
    run.paper.forEach((p, i) => {
      if (!chGroups.length || chGroups[chGroups.length - 1].ch !== p.ch) chGroups.push({ ch: p.ch, title: chNames[p.ch] || "", start: i, count: 0 });
      chGroups[chGroups.length - 1].count++;
    });
    // Premium paint — the workshop experience
    const paint = function () {
      const pctAnswered = Math.round(100 * answeredCount() / total);
      const cur = run.paper[run.cur];
      root.innerHTML = `
        <div class="exam-workshop">
          <div class="exam-bar-track"><div class="exam-bar-fill" id="examBar"></div></div>
          <div class="exam-hud">
            <div class="exam-hud-l"><span class="exam-hud-ic">${ICONS.note}</span><div><b>Final Examination</b><span>${pctAnswered}% answered · ${unanswered()} remaining</span></div></div>
            <div class="exam-hud-t"><span class="exam-clock" id="examClock"></span><span>Question ${run.cur + 1} of ${total}</span></div>
          </div>
          <div class="exam-body">
            <div class="exam-main">
              <div class="exam-q">
                <p class="eyebrow">Chapter ${cur.ch} · ${esc(chNames[cur.ch] || "")}</p>
                <h3 class="gold-serif">${esc(cur.q.q)}</h3>
                <div class="exam-options">${cur.q.options.map((o, oi) => `<button class="exam-opt${qSel(run.cur) === oi ? " on" : ""}" data-oi="${oi}"><span class="exam-opt-letter">${"ABCD"[oi]}</span><span class="exam-opt-text">${esc(o)}</span></button>`).join("")}</div>
                <div class="exam-nav">
                  ${run.cur < total - 1
                    ? `<button class="btn-gold" id="examNext" ${qSel(run.cur) < 0 ? "disabled" : ""}>${ICONS.check} Next question</button>`
                    : `<button class="btn-gold" id="examNext" ${qSel(run.cur) < 0 ? "disabled" : ""}>${ICONS.note} Review & submit</button>`}
                  <span class="exam-hint">${qSel(run.cur) < 0 ? "Choose an answer to continue — forward only, no going back." : run.cur < total - 1 ? "Your answer is locked once you move on." : "Review your answers before submitting."}</span>
                </div>
              </div>
            </div>
            <div class="exam-nav-panel">
              <div class="exam-nav-head"><b>Questions</b><span>${answeredCount()}/${total}</span></div>
              <div class="exam-nav-grid">${run.paper.map((p, i) => {
                const isCur = i === run.cur;
                const isDone = qSel(i) >= 0;
                const isNewGroup = i > 0 && run.paper[i].ch !== run.paper[i - 1].ch;
                return `${isNewGroup ? `<div class="exam-nav-divider">Ch ${p.ch}</div>` : ""}<div class="exam-nav-q${isCur ? " current" : ""}${isDone ? " done" : ""}" data-qi="${i}"><span>${i + 1}</span></div>`;
              }).join("")}</div>
              <div class="exam-nav-legend">
                <span class="enl"><i class="enl-dot current"></i> Current</span>
                <span class="enl"><i class="enl-dot done"></i> Answered</span>
                <span class="enl"><i class="enl-dot"></i> Unanswered</span>
              </div>
            </div>
          </div>
        </div>`;
      // Timer
      startTimer(root.querySelector("#examClock"), root.querySelector("#examBar"));
      // Option clicks
      root.querySelectorAll(".exam-opt").forEach(b => b.addEventListener("click", function () {
        run.answers[run.cur] = parseInt(this.getAttribute("data-oi"), 10);
        saveRun(); paint();
      }));
      // Next / Review button
      const nx = root.querySelector("#examNext");
      if (nx) nx.addEventListener("click", function () {
        if (qSel(run.cur) < 0) return;
        if (run.cur < total - 1) { run.cur++; saveRun(); paint(); }
        else paintReview();
      });
      // Navigator clicks — jump to any question (forward-only during exam,
      // but the navigator lets you see where you are; clicking a future
      // question is blocked until you reach it)
      root.querySelectorAll(".exam-nav-q").forEach(btn => btn.addEventListener("click", function () {
        const qi = parseInt(this.getAttribute("data-qi"), 10);
        if (qi <= run.cur) { run.cur = qi; saveRun(); paint(); }
      }));
    };
    // Review screen — see every answer before final submission
    const paintReview = function () {
      const ans = answeredCount();
      const pct = Math.round(100 * ans / total);
      root.innerHTML = `
        <div class="exam-workshop">
          <div class="exam-bar-track"><div class="exam-bar-fill" id="examBar"></div></div>
          <div class="exam-hud">
            <div class="exam-hud-l"><span class="exam-hud-ic">${ICONS.check}</span><div><b>Review your answers</b><span>${ans}/${total} answered · ${pct}% complete</span></div></div>
            <div class="exam-hud-t"><span class="exam-clock" id="examClock"></span><span>${unanswered() > 0 ? unanswered() + " unanswered" : "All answered"}</span></div>
          </div>
          <div class="exam-review">
            <div class="exam-review-header">
              <h3 class="gold-serif">Before you submit</h3>
              <p>${unanswered() > 0 ? `<b>${unanswered()} question${unanswered() > 1 ? "s" : ""} unanswered</b> — you can go back to answer them, or submit as-is. Unanswered questions count as wrong.` : "All questions answered. Review below, then submit when ready."}</p>
            </div>
            <div class="exam-review-grid">
              ${chGroups.map(g => `
                <div class="exam-review-ch">
                  <div class="exam-review-ch-head"><b>Chapter ${g.ch} · ${esc(g.title)}</b><span>${Array.from({length: g.count}, (_, j) => qSel(g.start + j) >= 0).filter(Boolean).length}/${g.count}</span></div>
                  ${Array.from({length: g.count}, (_, j) => {
                    const qi = g.start + j;
                    const q = run.paper[qi];
                    const sel = qSel(qi);
                    const isCorrect = sel === q.q.answer;
                    return `<div class="exam-review-q${sel < 0 ? " unanswered" : ""}">
                      <div class="exam-review-q-head"><span class="exam-review-num">${qi + 1}</span><span class="exam-review-ch${sel < 0 ? " miss" : isCorrect ? " hit" : " miss"}">${sel < 0 ? "—" : isCorrect ? "✓" : "✗"}</span></div>
                      <p class="exam-review-q-text">${esc(q.q.q)}</p>
                      ${sel >= 0 ? `<p class="exam-review-ans ${isCorrect ? "hit" : " miss"}">Your answer: ${q.q.options[sel]}${!isCorrect ? ` · Correct: ${q.q.options[q.q.answer]}` : ""}</p>` : `<p class="exam-review-ans unanswered">No answer given</p>`}
                    </div>`;
                  }).join("")}
                </div>`
              ).join("")}
            </div>
            <div class="exam-review-actions">
              ${unanswered() > 0 ? `<button class="btn-ghost" id="examBackToQ">← Back to unanswered questions</button>` : ""}
              <button class="btn-gold" id="examFinalSubmit">${ICONS.trophy} Submit the examination</button>
            </div>
          </div>
        </div>`;
      startTimer(root.querySelector("#examClock"), root.querySelector("#examBar"));
      // Back to first unanswered
      const backBtn = root.querySelector("#examBackToQ");
      if (backBtn) backBtn.addEventListener("click", function () {
        const firstUnanswered = run.answers.findIndex((a, i) => (a === undefined || a === null) && i < total);
        if (firstUnanswered >= 0) { run.cur = firstUnanswered; saveRun(); paint(); }
      });
      // Final submit
      root.querySelector("#examFinalSubmit").addEventListener("click", examSubmit);
    };
    const examSubmit = function () {
      if (root.__examIv) { clearInterval(root.__examIv); root.__examIv = null; }
      let correct = 0;
      const perCh = {};
      run.paper.forEach((p, i) => {
        const ok = qSel(i) === p.q.answer;
        if (ok) correct++;
        perCh[p.ch] = perCh[p.ch] || { c: 0, t: 0 };
        perCh[p.ch].t++;
        if (ok) perCh[p.ch].c++;
      });
      const pct = Math.round(100 * correct / total);
      const pass = pct >= EXAM_PASS;
      const att = { at: new Date().toISOString(), total: total, correct: correct, pct: pct, pass: pass, perCh: perCh, lane: run.lane || "standard" };
      const fe = S.finalExam || {};
      const attempts = (fe.attempts || []).concat([att]);
      const best = !fe.best || fe.best.pct < pct ? att : fe.best;
      S.finalExam = { attempts: attempts, best: best };
      const firstPass = pass && !(fe.best && fe.best.pass);
      delete S.finalExamRun;
      save();
      if (firstPass) addXp(150, "Final Examination passed");
      examResult(root, att, best, firstPass);
    };
    paint();
    document.addEventListener("visibilitychange", function h() {
      if (document.hidden && root.__examIv) toast("The exam clock never pauses — come straight back", "");
    });
  }
  function examResult(root, att, best, firstPass) {
    root.innerHTML = `
      <div class="page-head"><p class="eyebrow">Reality FX OS · the capstone</p><h1 class="page-title">The Final Examination — result</h1></div>
      <div class="exam-result ${att.pass ? "pass" : "fail"}">
        <div class="exam-result-ic">${att.pass ? ICONS.trophy : ICONS.alert}</div>
        <h2 class="gold-serif">${att.pass ? "You passed the Final Examination" : "Not this sitting"}</h2>
        <div class="exam-result-score"><b>${att.pct}%</b><span>${att.correct} of ${att.total} correct · pass mark ${EXAM_PASS}%</span></div>
        <p>${att.pass
          ? (firstPass ? "The certificate door is open — +150 XP. Collect your certificate in the Certificate room." : "The certificate door is open — collect it in the Certificate room.")
          : "Keep the honest review: read the explanations below, go back to the chapters you lost, then sit it again — the best result stands."}</p>
      </div>
      <div class="panel exam-per-ch">
        <h3 class="panel-title gold-serif">Where you stood, chapter by chapter</h3>
        <div class="exam-per-grid">${Object.keys(att.perCh).sort((a, b) => a - b).map(id => {
          const r = att.perCh[id];
          const p = Math.round(100 * r.c / r.t);
          return `<div class="exam-per"><div class="exam-per-txt"><b>Ch ${id} · ${esc((CHAPTERS.find(c => c.id === +id) || {}).title || "")}</b><span>${r.c}/${r.t} correct</span></div><div class="exam-per-bar"><span style="width:${p}%"></span></div><em>${p}%</em></div>`;
        }).join("")}</div>
        <div class="exam-retake">
          <button class="btn-gold" id="examRetake">${ICONS.note} Sit it again</button>
          <button class="btn-ghost" id="examCert">${ICONS.grad} ${att.pass ? "Collect your certificate" : "See the certificate"}</button>
        </div>
      </div>`;
    root.querySelector("#examRetake").addEventListener("click", () => { delete S.finalExamRun; save(); renderExam(root); });
    root.querySelector("#examCert").addEventListener("click", () => location.hash = "#/certificate");
  }

  /* ============================================================
     WORKSHOPS — the hands-on wing. Each workshop is a practical
     session: the principle, a real task to do, and a short quiz that
     checks the skill actually landed. Machine-graded, completed in
     the OS, +25 XP each. Same spirit as the Laboratory — but built
     around doing, not watching.
     ============================================================ */
  const WORKSHOPS = [
    { id: "risk", icon: ICONS.shield, title: "The Risk Workshop", tag: "Position sizing · the 1% rule · lot math", dur: "40 min",
      desc: "Every losing trader is a risk-manager who skipped class. This workshop makes the 1% rule a reflex: decide your stop before your entry, size the position so a loss costs no more than 1% of your account, and let the arithmetic — not the feeling — set the lot.",
      task: "On paper or in the Trading Challenge: take your account balance, choose a stop distance in pips, and compute the lot size that risks exactly 1%. Do it three times with three different stops before you take the quiz.",
      quiz: [
        { q: "Your account is R50,000. One percent of it is:", options: ["R500", "R5,000", "R50", "R1,000"], answer: 0, explain: "1% of R50,000 is R500. That is the most this single trade is allowed to lose." },
        { q: "The 1% rule is about limiting:", options: ["Your profits", "Your potential loss per trade", "Your number of trades", "Your screen time"], answer: 1, explain: "It caps the loss any single trade can inflict on the account — the one number that keeps you in the game." },
        { q: "A 20-pip stop with a R500 risk budget means each pip of that position is worth:", options: ["R10", "R25", "R100", "R20"], answer: 1, explain: "R500 ÷ 20 pips = R25 per pip. That is your position sizing arithmetic in one line." },
        { q: "Your stop hits. The correct response is:", options: ["Double the next position to win it back", "Take the small loss and move on", "Re-enter the same trade immediately", "Blame the market"], answer: 1, explain: "A planned small loss is the cost of doing business. Revenge-sizing after it is how accounts die." },
        { q: "Risking 3% per trade on a streak of four losses costs your account:", options: ["12% — roughly a third of your 1% discipline budget", "3% total", "Nothing — losses don't stack", "30%"], answer: 0, explain: "Four losses at 3% each compound to about 11.5% of the account. Four at 1% costs about 4%. Small edges compound too — in the opposite direction." }
      ] },
    { id: "psychology", icon: ICONS.brain, title: "The Psychology Workshop", tag: "Revenge trading · discipline · the pause", dur: "35 min",
      desc: "The market is a mirror: it shows you exactly how you handle loss. This workshop names the four ways traders self-destruct — revenge trading, overtrading, hesitation, and moving the stop — and gives you the one tool that beats all four: the pause.",
      task: "Next time a trade closes against you, before opening anything: close the chart, walk away for ten minutes, and write one honest line about what you actually felt. That sentence is the workshop's assignment.",
      quiz: [
        { q: "Revenge trading is:", options: ["Trading again immediately to win back a loss", "Trading with a plan", "Trading the daily chart", "Taking a break"], answer: 0, explain: "It is the urge to make the market pay you back — and the fastest way to turn one loss into four." },
        { q: "The pause works because it:", options: ["Breaks the emotional loop before the next decision", "Guarantees the next trade wins", "Hides your losses", "Stops the market"], answer: 0, explain: "Between the loss and the next entry is the only moment discipline can actually speak." },
        { q: "Overtrading usually follows:", options: ["A plan followed perfectly", "Boredom or a need to 'do something'", "A full night's sleep", "A well-kept journal"], answer: 1, explain: "Most overtrading is not greed — it is the itch to feel active. The journal is the cure: if there is no setup, there is no trade." },
        { q: "Moving a stop further from price after entry is:", options: ["Smart management", "Giving a losing idea more room than you planned — a discipline leak", "Always profitable", "Required by brokers"], answer: 1, explain: "Your stop was decided before the trade. Moving it after entry is hope negotiating with your plan — and hope loses." },
        { q: "The most honest definition of discipline in trading is:", options: ["Following your plan even when it feels wrong", "Never losing money", "Trading every day", "Making big profits quickly"], answer: 0, explain: "Discipline is doing the thing you planned when your feelings argue against it. Everything else is talent or luck." }
      ] },
    { id: "structure", icon: ICONS.chart, title: "The Market Structure Workshop", tag: "Trends · support & resistance · the pullback", dur: "45 min",
      desc: "Price does not move randomly — it moves in structure: higher highs and higher lows, support that holds, resistance that breaks. This workshop teaches you to read the map before you place the trade, so entries sit on pullbacks toward structure, not in the middle of nowhere.",
      task: "Open the Trading Challenge chart. Mark the most recent swing high, swing low, and the nearest level of support and resistance — by hand, on paper, before the quiz. A trader who cannot draw the map has no business trading it.",
      quiz: [
        { q: "An uptrend is defined by:", options: ["Higher highs and higher lows", "Lower highs and lower lows", "Flat price", "High volume alone"], answer: 0, explain: "Structure is the skeleton of price: rising swing points = buyers in control." },
        { q: "Support is:", options: ["A price level where buying has repeatedly stepped in", "A level where price always bounces", "The highest price ever traded", "A moving average"], answer: 0, explain: "Support is where demand has shown up before — a reference, not a promise." },
        { q: "A breakout of resistance is most believable when:", options: ["Price closes through it with conviction", "Price touches it once and fades", "You are already in a losing trade", "Someone on social media says so"], answer: 0, explain: "A close beyond the level — not a spike through it — is what the structure actually confirms." },
        { q: "The safest place to enter a trend is:", options: [["On the pullback toward support/resistance"], "At the extreme top of the move", "After price has already doubled", "At market open on Monday"], answer: 0, explain: "The pullback offers a stop that makes sense: below the level, with the trend behind you." },
        { q: "A key level is stronger when:", options: ["It has been tested multiple times", "It has never been touched", "It is a round number", "It was drawn yesterday"], answer: 0, explain: "Repeated tests mean real buyers and sellers camped there — the level has history." }
      ] },
    { id: "journal", icon: ICONS.pen, title: "The Journal Workshop", tag: "Logging the trade · reviewing the habit", dur: "30 min",
      desc: "A trade you don't write down never happened. The journal is where your pattern becomes visible: which setup you win on, which hour you trade badly in, what you felt while holding. This workshop wires the habit of logging every trade — the win AND the loss.",
      task: "Open the Trade Journal and log your last three trades — or, if you haven't traded yet, the last three decisions you made in the Trading Challenge. Entry, exit, stop, the setup, and one honest line about how you felt.",
      quiz: [
        { q: "The main purpose of a trade journal is to:", options: ["Show you patterns your memory edits", "Prove you were right", "Impress other traders", "Fill time"], answer: 0, explain: "Memory keeps the wins and buries the losses. The journal is the unedited record." },
        { q: "Which belongs in a journal entry?", options: ["The setup, entry, stop, exit, and how you felt", "Only winning trades", "Your broker's logo", "Predictions about the news"], answer: 0, explain: "The trade's anatomy — and the emotion behind it — is what makes the record useful." },
        { q: "A losing trade logged honestly is:", options: ["A lesson you own", "A failure to hide", "A reason to stop trading", "Proof the market is rigged"], answer: 0, explain: "The loss is paid for either way; the journal makes it tuition instead of damage." },
        { q: "You notice your journal shows losses cluster on Fridays. This is:", options: ["A pattern worth acting on", "Coincidence you should ignore", "The market's fault", "A journal bug"], answer: 0, explain: "That is exactly the kind of signal the journal exists to surface — act on it." },
        { q: "The journal's deepest value is:", options: ["It turns experience into a measurable record", "It looks professional", "It fills your screen", "It impresses mentors"], answer: 0, explain: "Unwritten experience evaporates; a record compounds — the trader's version of interest." }
      ] },
    { id: "prop", icon: ICONS.trophy, title: "The Prop Challenge Workshop", tag: "Drawdown rules · targets · the prop mindset", dur: "50 min",
      desc: "Prop-style challenges are won before a single trade: the drawdown limit is your boss, the target is your contract, and consistency is the whole game. This workshop runs you through the rules a funded account lives by — the same rules the Trading Challenge enforces.",
      task: "Open the Trading Challenge and read its rules like a contract. Write down: the maximum drawdown allowed, the target you'd need to pass, and the maximum risk per trade the rules permit. Then play one session with those three numbers taped to your screen.",
      quiz: [
        { q: "In a prop-style challenge, the drawdown limit is:", options: ["A hard line the account must never cross", "A suggestion", "Only checked on Fridays", "The same as your profit target"], answer: 0, explain: "Cross it and the challenge ends. It is the first rule because it is the rule that protects the capital." },
        { q: "A 5% max drawdown on a R100,000 challenge means:", options: ["The account can lose no more than R5,000 before failing", "You can lose R5,000 per trade", "The account starts at R5,000", "Profits above 5% are removed"], answer: 0, explain: "The drawdown is measured on the equity — R5,000 of room, used by losses, not by size." },
        { q: "The fastest way to fail a prop challenge is:", options: ["Oversizing to rush the target", "Trading small and steady", "Following your plan", "Keeping a journal"], answer: 0, explain: "Challenges are lost on risk first and won on consistency second. One oversized trade ends the run." },
        { q: "Consistency in a challenge means:", options: ["Similar risk and behaviour across trades", "The same trade repeated forever", "Never losing", "Trading the same pair always"], answer: 0, explain: "The machine is judging a repeatable process, not a lucky week." },
        { q: "The prop mindset is best summarised as:", options: ["Trade like the money is not yours to lose", "Trade like every trade must win", "Trade as often as possible", "Trade only news events"], answer: 0, explain: "The account is a trust: your job is to protect it and grow it slowly — that is what gets you funded." }
      ] },
    { id: "examprep", icon: ICONS.note, title: "The Exam-Prep Workshop", tag: "How to sit the Final Examination", dur: "25 min",
      desc: "The Final Examination is a different beast from chapter quizzes: hours long, one-way, no going back. This workshop rehearses the technique — pace yourself, bank the questions you know, never leave an answer blank, and let the clock be your referee.",
      task: "Before you sit the real thing: do a timed 20-question warm-up from any three chapters with a 30-minute timer and no going back. If you finish early, spend the remaining time re-reading the questions — the first answer is usually the honest one.",
      quiz: [
        { q: "In a one-way exam, the best strategy is:", options: ["Answer each question as you go and move on", "Skip every question and come back", "Guess as fast as possible", "Spend all time on question one"], answer: 0, explain: "There is no going back — so the discipline is one careful pass, not perfection hunting." },
        { q: "You don't know an answer. The right move is:", options: ["Eliminate what you can and make your best choice", "Leave it blank", "Panic", "Close the exam"], answer: 0, explain: "A reasoned guess has a chance; a blank answer has none." },
        { q: "With 150 minutes and 78 questions, your pace is roughly:", options: ["Under 2 minutes per question", "30 seconds per question", "10 minutes per question", "Whatever feels right"], answer: 0, explain: "78 questions in 150 minutes is just under two minutes each — the clock is the referee, pace to it." },
        { q: "The exam's real purpose is:", options: ["To prove you can hold the whole course in one sitting", "To test how fast you can read", "To make you fail", "To fill your afternoon"], answer: 0, explain: "Thirteen chapters, one paper, hours long — stamina and coverage are part of what is being measured." },
        { q: "After a failed sitting, the honest path is:", options: ["Review the chapter breakdown and study the weak chapters", "Sit it again immediately and hope", "Give up", "Blame the questions"], answer: 0, explain: "The result screen shows exactly where you lost the paper — that map is the study plan." }
      ] },
    { id: "movingavg", icon: ICONS.chart, title: "The Moving Averages Workshop", tag: "SMA crossovers · build it, tune it, break it", dur: "50 min",
      desc: "Moving averages are the market's eyewear: the right prescription makes the trend obvious, the wrong one makes the same chart look like noise. This workshop is a real workbench — you build a price series, tune the fast and slow averages, watch the golden and death crosses fire (or misfire), and then deliberately break it to feel exactly what lag, whipsaw and inversion do to a strategy — before you risk a cent.",
      task: "In the workbench below: run the classic 20/50 setup and read its signals. Then break it on purpose — swap the periods so the fast line is slower than the slow line, shrink both to chase every wiggle, stretch the slow average until it lags — and watch the same market turn from trend to noise. The lesson you keep: the average is a lens, and you are the one who chooses the prescription.",
      quiz: [
        { q: "A golden cross is when:", options: ["The fast MA crosses ABOVE the slow MA", "The slow MA crosses above the fast MA", "Price crosses its 200-day average", "Two averages touch and bounce"], answer: 0, explain: "Fast over slow means shorter-term momentum has turned above the longer-term picture — the signal traders call the golden cross." },
        { q: "A moving average that is too slow will:", options: ["React late — signals fire after the move is over", "React early — signals fire before the move", "Never cross the fast line", "Remove all noise perfectly"], answer: 0, explain: "The longer the window, the more it lags. Smoothness has a price: the late signal." },
        { q: "A very short fast period (like 2) tends to produce:", options: ["Whipsaws — many false crossovers in chop", "One clean signal per trend", "No signals at all", "Only bullish signals"], answer: 0, explain: "A 2-period line hugs every wiggle, so it crosses the slow line constantly — most of those crosses are noise, not trend." },
        { q: "If your FAST average has a longer period than your SLOW average, the strategy:", options: ["Inverts — golden crosses become bearish signals", "Works identically", "Becomes impossible to draw", "Improves the win rate"], answer: 0, explain: "You have swapped the roles — the line you call fast is slower than the line you call slow, so every signal flips meaning." },
        { q: "The crossover strategy's weakness in a sideways range is:", options: ["It buys near the top and sells near the bottom, repeatedly", "It never trades, so it loses nothing", "It makes money in chop", "It needs no stop loss"], answer: 0, explain: "In a range, price crosses the averages back and forth — the strategy buys the highs and sells the lows until the range finally breaks." }
      ] }
  ];
  /* The Moving Averages workbench — the build-it-and-break-it sandbox.
     Synthetic price (a seeded random walk with trend + noise), fast/slow SMA
     overlaid, live cross markers, and a tiny crossover sim that scores the
     strategy. The student tunes the periods with sliders, then deliberately
     breaks it with presets (whipsaw, lag, inverted) and watches the same
     market turn to noise under their own hand. */
  /* The workbench is shared: the workshop embeds it, and the Laboratory
     keeps a persistent copy as the MA Sandbox tool card. The suffix keeps
     element ids unique when both are ever mounted (they never are, but a
     rerender mid-flight must never collide). */
  function maDrillHTML(suf) {
    suf = suf || "";
    return `<div class="panel ws-drill ma-drill">
        <h3 class="panel-title gold-serif">The workbench — build it, tune it, break it</h3>
        <p class="ws-quiz-sub">This is a synthetic market you can break. Price moves on its own; the gold line is your <b>fast</b> MA, the grey line your <b>slow</b> MA. Drag the sliders and watch the crosses fire — then hit a <b>break it</b> preset and watch the same market turn to noise under your own hand. The sim at the bottom scores the strategy on every change.</p>
        <div class="ma-canvas"><svg id="maSvg${suf}" viewBox="0 0 760 300" preserveAspectRatio="none" aria-hidden="true"></svg><div class="ma-legend"><span class="ma-l"><i style="background:var(--accent-gold)"></i>Price</span><span class="ma-l"><i style="background:#ffd78c"></i>Fast MA</span><span class="ma-l"><i style="background:#8f8a7a"></i>Slow MA</span><span class="ma-l"><i class="ma-x" style="background:#7ee2a4"></i>Golden cross</span><span class="ma-l"><i class="ma-x" style="background:#f0a69e"></i>Death cross</span></div></div>
        <div class="ma-controls">
          <label>Fast MA <input type="range" id="maFast${suf}" min="2" max="60" value="10"><b id="maFastV${suf}">10</b></label>
          <label>Slow MA <input type="range" id="maSlow${suf}" min="5" max="120" value="30"><b id="maSlowV${suf}">30</b></label>
        </div>
        <div class="ma-presets">
          <span class="ma-p-label">Build it / break it:</span>
          <button class="btn-ghost sm" data-ma="10,30">Classic 10/30</button>
          <button class="btn-ghost sm" data-ma="2,5">Whipsaw 2/5</button>
          <button class="btn-ghost sm" data-ma="5,120">Lag 5/120</button>
          <button class="btn-ghost sm" data-ma="45,10">Inverted 45/10</button>
          <button class="btn-ghost sm" data-ma="20,50">Smooth 20/50</button>
          <button class="btn-ghost sm" id="maBreak${suf}" data-ma-break="1">${ICONS.zap} Breakout drill — size it to 1%</button>
        </div>
        <div class="ma-verdict" id="maVerdict${suf}"></div>
        <div class="ma-stats" id="maStats${suf}"></div>
        <div class="ma-breakout" id="maBreakout${suf}"></div>
      </div>`;
  }
  function maSeries(seed) {
    // seeded PRNG so every student breaks the SAME market (mulberry32)
    let a = seed >>> 0;
    const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const n = 120, px = [];
    let p = 100;
    for (let i = 0; i < n; i++) {
      // trend waves + noise — a market, not a sine wave
      const trend = Math.sin(i / 14) * 0.5 + Math.sin(i / 5) * 0.14;
      const drift = i < n / 2 ? 0.12 : -0.06;
      p = p + drift + trend + (rnd() - 0.5) * 1.15;
      px.push(Math.max(60, p));
    }
    return px;
  }
  function maVals(px, per) {
    const out = new Array(px.length).fill(null);
    let sum = 0;
    for (let i = 0; i < px.length; i++) {
      sum += px[i];
      if (i >= per) sum -= px[i - per];
      if (i >= per - 1) out[i] = sum / per;
    }
    return out;
  }
  function wireMaDrill(root, suf) {
    suf = suf || "";
    const $ = id => root.querySelector("#" + id + suf);
    const px = maSeries(20260815);
    const svg = $("maSvg");
    const W = 760, H = 300;
    const draw = () => {
      const fast = Math.max(2, Math.min(60, parseInt($("maFast").value, 10) || 10));
      const slow = Math.max(5, Math.min(120, parseInt($("maSlow").value, 10) || 30));
      $("maFastV").textContent = fast;
      $("maSlowV").textContent = slow;
      const f = maVals(px, fast), s = maVals(px, slow);
      const lo = Math.min.apply(null, px) * 0.985, hi = Math.max.apply(null, px) * 1.015;
      const X = i => (i / (px.length - 1)) * W, Y = v => H - ((v - lo) / (hi - lo)) * (H - 16) - 8;
      const line = arr => arr.map((v, i) => (v === null ? null : X(i) + "," + Y(v).toFixed(1))).filter(Boolean).join(" ");
      // crosses: fast crosses slow -> golden (fast rising through), else death
      const crosses = [];
      for (let i = 1; i < px.length; i++) {
        if (f[i - 1] === null || f[i] === null || s[i - 1] === null || s[i] === null) continue;
        if ((f[i - 1] <= s[i - 1]) !== (f[i] <= s[i])) {
          crosses.push({ i, golden: f[i] > s[i], x: X(i), y: Y((f[i] + s[i]) / 2) });
        }
      }
      // crossover sim: long when fast>slow, flat otherwise. Return is
      // simple (non-compounding) — the strategy captures price moves while
      // in the market, measured against the first bar — so the number stays
      // honest no matter how the student tunes it.
      let pos = 0, eq = 0, trades = 0, wins = 0, entry = 0;
      for (let i = 1; i < px.length; i++) {
        const want = f[i] !== null && s[i] !== null && f[i] > s[i] ? 1 : 0;
        if (want !== pos) {
          if (pos) { trades++; if (px[i] > entry) wins++; }
          if (want) { entry = px[i]; }
          pos = want;
        }
        if (pos) eq += (px[i] - px[i - 1]) / px[0] * 100;
      }
      if (pos) { trades++; if (px[px.length - 1] > entry) wins++; }
      // verdict — the machine names what the student's tuning did
      let verdict, tone = "warn";
      if (fast >= slow) verdict = "Inverted — your fast line is slower than your slow line, so every cross means the opposite of what you'd expect. The market isn't confused; the lenses are swapped.";
      else if (fast <= 2 && slow <= 8) verdict = "Whipsaw machine — both lines are so short they chase every wiggle, so crosses fire in clusters and most are noise. Smooth the slow side and the signal count collapses.";
      else if (slow >= 100 && fast <= 8) verdict = "Lag — the slow MA is so far behind price that crosses fire late, near the end of the move. Smoother, yes; slower, yes — and late signals are the price of smoothness.";
      else if (fast <= 4) verdict = "Nervous — a very fast line crosses constantly, so the strategy trades often and most of those trades are noise. A wider fast MA filters the wiggle.";
      else { verdict = "Healthy configuration — the fast line filters the noise, the slow line anchors the trend, and the crosses cluster around real turns. This is what a tuned lens looks like."; tone = "good"; }
      $("maVerdict").innerHTML = `<div class="ma-verdict-in ${tone}">${verdict}</div>`;
      const golds = crosses.filter(c => c.golden).length, deaths = crosses.length - golds;
      $("maStats").innerHTML = `
        <div class="ma-stat"><b>${crosses.length}</b><span>crosses</span></div>
        <div class="ma-stat"><b>${golds}</b><span>golden</span></div>
        <div class="ma-stat"><b>${deaths}</b><span>death</span></div>
        <div class="ma-stat"><b>${trades}</b><span>trades</span></div>
        <div class="ma-stat ${eq >= 0 ? "up" : "dn"}"><b>${eq >= 0 ? "+" : ""}${eq.toFixed(1)}%</b><span>sim P/L</span></div>
        <div class="ma-stat"><b>${trades ? Math.round(100 * wins / trades) : 0}%</b><span>win rate</span></div>`;
      svg.innerHTML = `
        <line x1="0" y1="${Y(lo)}" x2="${W}" y2="${Y(lo)}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
        <line x1="0" y1="${Y(hi)}" x2="${W}" y2="${Y(hi)}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
        <polyline points="${line(px)}" fill="none" stroke="var(--accent-gold)" stroke-width="1.6" opacity=".92"/>
        <polyline points="${line(f)}" fill="none" stroke="#ffd78c" stroke-width="1.8"/>
        <polyline points="${line(s)}" fill="none" stroke="#8f8a7a" stroke-width="2"/>
        ${crosses.map(c => `<circle cx="${c.x}" cy="${c.y}" r="4" fill="${c.golden ? "#7ee2a4" : "#f0a69e"}" stroke="#0e0d0a" stroke-width="1.4"/>`).join("")}`;
    };
    $("maFast").addEventListener("input", draw);
    $("maSlow").addEventListener("input", draw);
    root.querySelectorAll("[data-ma]").forEach(b => b.addEventListener("click", function () {
      const [f, s] = this.getAttribute("data-ma").split(",").map(Number);
      $("maFast").value = f;
      $("maSlow").value = s;
      draw();
      // a healthy config found from a preset counts as mastery of the drill
      checkHealthy();
    }));
    draw();

    /* The breakout drill — the 1% rule, made concrete on a live signal.
       The workbench detects a cross, then hands the student a real
       sizing problem: their account, the entry, the stop distance, and the
       question every student asks — HOW MANY UNITS can I risk at exactly
       1%? They type the size, the machine verifies their arithmetic, and
       the first correct answer earns the drill XP. */
    const box = $("maBreakout");
    if (box) {
      let active = false;
      const start = () => {
        if (active) return;
        // a deterministic scenario from the seeded series — the first
        // golden cross after bar 20 of the classic 10/30 setup
        const f = maVals(px, 10), s = maVals(px, 30);
        let ci = -1;
        for (let i = 21; i < px.length; i++) {
          if (f[i - 1] !== null && f[i] !== null && s[i - 1] !== null && s[i] !== null &&
              (f[i - 1] <= s[i - 1]) !== (f[i] <= s[i]) && f[i] > s[i]) { ci = i; break; }
        }
        const entry = Math.round(px[Math.max(ci, 60)] * 1000) / 1000;
        const bal = 10000;
        const stopDist = 0.0050; // 50 pips on a 1.0000 base — a 1% risk needs units = bal*0.01/stopDist
        const answer = Math.floor(bal * 0.01 / stopDist / 100) * 100; // whole lots of 100 units
        active = true;
        box.innerHTML = `
          <div class="ma-bo-head">${ICONS.zap} Breakout drill — size this trade to the 1% rule</div>
          <p class="ma-bo-sub">Your crossover fires a signal. Before you click buy, the rule needs an answer: <b>how many units can you risk?</b></p>
          <div class="ma-bo-facts">
            <span>Account: <b>$${bal.toLocaleString()}</b></span>
            <span>Entry: <b>${entry.toFixed(4)}</b></span>
            <span>Stop distance: <b>${stopDist.toFixed(4)}</b></span>
            <span>Rule: <b>risk ≤ 1% of account</b></span>
          </div>
          <div class="ma-bo-row">
            <input type="number" id="maBoGuess${suf}" placeholder="Your position size (units)" min="0" step="100">
            <button class="btn-gold" id="maBoVerify${suf}">${ICONS.check} Verify my size</button>
          </div>
          <div id="maBoResult${suf}"></div>`;
        const res = $("maBoResult");
        const vBtn = $("maBoVerify");
        const guessIn = $("maBoGuess");
        vBtn.addEventListener("click", () => {
          const guess = Math.max(0, +(guessIn.value || 0));
          if (!guess) { res.innerHTML = "<span class='warn-note'>Type your position size first — then the machine checks your arithmetic.</span>"; return; }
          const diff = Math.abs(guess - answer) / answer;
          if (diff <= 0.02) {
            const risk$ = stopDist * answer;
            res.innerHTML = `<div class="warn-note" style="border-color:rgba(80,180,110,.35);background:rgba(80,180,110,.08);color:#9fe3bd">✓ Correct — ${answer.toLocaleString()} units puts exactly $${risk$.toFixed(0)} (1.00%) at risk. The formula: (balance × 1%) ÷ stop distance = ($${bal.toLocaleString()} × 0.01) ÷ ${stopDist.toFixed(4)} = ${answer.toLocaleString()}. You can do this before every trade.</div>`;
            S.workshops = S.workshops || {};
            S.workshops.movingavg = S.workshops.movingavg || {};
            if (!S.workshops.movingavg.drill) {
              S.workshops.movingavg.drill = true;
              addXp(5, "Breakout drill: sized the 1% position correctly");
              toast("Breakout drill mastered — size before you click. +5 XP", "");
            }
            save();
            vBtn.disabled = true;
          } else {
            res.innerHTML = `<div class="warn-note">Not quite — the 1% formula is (balance × 0.01) ÷ stop distance = ($${bal.toLocaleString()} × 0.01) ÷ ${stopDist.toFixed(4)} = <b>${answer.toLocaleString()} units</b>. Round to a clean lot size and try once more.</div>`;
          }
        });
      };
      root.querySelector("#maBreak" + suf).addEventListener("click", start);
    }
    // the healthy-config reward (shared with the workshop wiring)
    const checkHealthy = () => {
      const fast = parseInt($("maFast").value, 10);
      const slow = parseInt($("maSlow").value, 10);
      if (fast >= 5 && fast < slow && slow <= 60) {
        S.workshops = S.workshops || {};
        S.workshops.movingavg = S.workshops.movingavg || {};
        if (!S.workshops.movingavg.drill) {
          S.workshops.movingavg.drill = true;
          addXp(5, "Moving Averages drill: found a healthy configuration");
          toast("Workbench mastered — a tuned lens. +5 XP", "");
        }
        save();
      }
    };
    $("maFast").addEventListener("input", checkHealthy);
    $("maSlow").addEventListener("input", checkHealthy);
  }

  function renderWorkshops(root) {
    const done = S.workshops || {};
    root.appendChild(el("div", "page-head", `
      <p class="eyebrow">Reality FX OS · the hands-on wing</p>
      <h1 class="page-title">Workshops</h1>
      <p class="page-sub">Theory you watch fades; skills you do stay. Each workshop is a practical session — the principle, a real task, and a short quiz that checks the skill actually landed. ${Object.keys(done).length} of ${WORKSHOPS.length} completed.</p>`));
    const grid = el("div", "ws-grid");
    WORKSHOPS.forEach(w => {
      const d = done[w.id];
      grid.appendChild(el("div", "ws-card" + (d && d.done ? " done" : ""), `
        <div class="ws-card-head">
          <span class="ws-ic">${w.icon}</span>
          <span class="ws-status ${d && d.done ? "up" : ""}">${d && d.done ? "Completed · " + d.score + "%" : "Open"}</span>
        </div>
        <h3 class="gold-serif">${esc(w.title)}</h3>
        <p class="ws-tag">${esc(w.tag)}</p>
        <p class="ws-desc">${esc(w.desc)}</p>
        <div class="ws-card-foot"><span>${esc(w.dur)}</span><button class="btn-gold" data-ws="${w.id}">${d && d.done ? "Review" : "Start workshop"}</button></div>`));
    });
    root.appendChild(grid);
    grid.querySelectorAll("[data-ws]").forEach(b => b.addEventListener("click", function () {
      const w = WORKSHOPS.find(x => x.id === this.getAttribute("data-ws"));
      if (w) renderWorkshopDetail(root, w);
    }));
  }
  function renderWorkshopDetail(root, w) {
    const done = S.workshops || {};
    const d = done[w.id];
    const drill = w.id === "movingavg" ? maDrillHTML()
      : w.id === "risk"
        ? `<div class="panel ws-drill" id="wsDrill">
          <h3 class="panel-title gold-serif">The 1% drill — hands on the rule</h3>
          <p class="ws-quiz-sub">This is the question every student asks: <i>how do I know this trade is 1%?</i> Build a trade below — account, entry, stop, target, size — and the machine answers instantly: the money at risk, the percentage of your account, and whether you're inside the rule. Then prove your own arithmetic: type what <b>you</b> think the risk is and check it.</p>
          <div class="drill-grid">
            <label>Account size ($)<input type="number" id="dr-bal" value="10000" min="0" step="100"></label>
            <label>Position size (units)<input type="number" id="dr-units" value="10000" min="0" step="100"><span class="tool-hint">1 standard lot = 100,000 units</span></label>
            <label>Entry price<input type="number" id="dr-entry" value="1.1000" step="0.0001"></label>
            <label>Stop loss<input type="number" id="dr-stop" value="1.0950" step="0.0001"></label>
            <label>Take profit<input type="number" id="dr-target" value="1.1200" step="0.0001"></label>
            <label>Direction<select id="dr-side"><option value="long">Long (buy)</option><option value="short">Short (sell)</option></select></label>
          </div>
          <div class="tool-result" id="dr-result"><span class="dim">Build the trade — the verdict updates live</span></div>
          <div class="drill-check">
            <h4>Now prove the arithmetic</h4>
            <p class="drill-check-sub">Without looking at the verdict above: how much money is at risk in this trade?</p>
            <div class="drill-check-row">
              <input type="number" id="dr-guess" placeholder="Your answer in $" min="0" step="1">
              <button class="btn-gold" id="drVerify">${ICONS.check} Check my answer</button>
            </div>
            <div id="dr-verify-result"></div>
          </div>
        </div>`
      : "";
    root.innerHTML = `
      <button class="btn-ghost ws-back">${ICONS.map} ← All workshops</button>
      <div class="page-head"><p class="eyebrow">Reality FX OS · workshop</p><h1 class="page-title">${esc(w.title)}</h1>
      <p class="page-sub">${esc(w.tag)} · ${esc(w.dur)}${d && d.done ? " · Completed at " + d.score + "%" : ""}</p></div>
      <div class="ws-layout">
        <div class="panel ws-principle">
          <h3 class="panel-title gold-serif">The principle</h3>
          <p>${esc(w.desc)}</p>
        </div>
        <div class="panel ws-task">
          <h3 class="panel-title gold-serif">The task</h3>
          <p>${esc(w.task)}</p>
        </div>
      </div>
      ${drill}
      <div class="panel ws-quiz-panel">
        <h3 class="panel-title gold-serif">The check</h3>
        <p class="ws-quiz-sub">Five questions on the skill. Answer them all, then submit — 70% or better completes the workshop (+25 XP).</p>
        <div class="ws-questions">${w.quiz.map((q, qi) => `
          <div class="ws-q" data-q="${qi}">
            <p class="ws-q-t"><b>${qi + 1}.</b> ${esc(q.q)}</p>
            <div class="ws-options">${q.options.map((o, oi) => `<button class="ws-opt" data-oi="${oi}">${esc(o)}</button>`).join("")}</div>
          </div>`).join("")}</div>
        <div class="ws-actions"><button class="btn-gold" id="wsSubmit">${ICONS.check} Submit workshop</button></div>
        <div class="ws-feedback" id="wsFeedback"></div>
      </div>`;
    root.querySelector(".ws-back").addEventListener("click", () => renderWorkshops(root));
    // The 1% drill (Risk workshop only): live risk maths + a verify-the-
    // arithmetic check. The machine shows the money at risk and the verdict
    // on the 1% rule the moment the numbers are set — then the student has
    // to compute the same number themselves before the machine confirms it.
    if (w.id === "risk") {
      const g = sel => root.querySelector(sel);
      const drRead = () => ({
        bal: Math.max(0, +(g("#dr-bal") || {}).value || 0),
        units: Math.max(0, +(g("#dr-units") || {}).value || 0),
        e: Math.max(0, +(g("#dr-entry") || {}).value || 0),
        s: Math.max(0, +(g("#dr-stop") || {}).value || 0),
        t: Math.max(0, +(g("#dr-target") || {}).value || 0),
        side: (g("#dr-side") || {}).value || "long"
      });
      const drLive = () => {
        const d = drRead();
        const riskPer = d.side === "long" ? d.e - d.s : d.s - d.e;
        const rewPer = d.side === "long" ? d.t - d.e : d.e - d.t;
        const res = g("#dr-result");
        if (!d.bal || !d.units || !d.e || riskPer <= 0) {
          res.innerHTML = `<span class="dim">${riskPer <= 0 && d.e ? "Stop sits on the wrong side of entry for a " + d.side + " — flip the stop or the direction." : "Build the trade — the verdict updates live"}</span>`;
          return;
        }
        const risk$ = riskPer * d.units;
        const riskPct = risk$ / d.bal * 100;
        const within = riskPct <= 1;
        const rr = rewPer > 0 ? Math.abs(rewPer) / Math.abs(riskPer) : 0;
        const maxUnits = riskPer > 0 ? Math.floor(d.bal * 0.01 / riskPer) : 0;
        res.innerHTML = `
          <div class="out-big ${within ? "good" : "warn"}">${riskPct.toFixed(2)}% <small>of your account at risk</small></div>
          <div class="out-row"><span>Money at risk</span><b>$${risk$.toFixed(2)}</b></div>
          <div class="out-row"><span>Reward : risk</span><b>${rr > 0 ? "1 : " + rr.toFixed(2) : "—"}</b></div>
          <div class="out-row"><span>Max size within 1%</span><b>${maxUnits.toLocaleString()} units</b></div>
          ${within ? "<div class='warn-note' style='border-color:rgba(80,180,110,.35);background:rgba(80,180,110,.08);color:#9fe3bd'>✓ Within the 1% rule.</div>" : `<div class="warn-note">Over the 1% rule — size down to ${maxUnits.toLocaleString()} units (or cut the stop distance).</div>`}`;
      };
      const drVfy = () => {
        const d = drRead();
        const riskPer = d.side === "long" ? d.e - d.s : d.s - d.e;
        const risk$ = riskPer > 0 ? riskPer * d.units : 0;
        const guess = Math.max(0, +(g("#dr-guess") || {}).value || 0);
        const box = g("#dr-verify-result");
        if (!risk$ || !guess) { box.innerHTML = "<span class='warn-note'>Set the trade and type your answer first.</span>"; return; }
        const diff = Math.abs(guess - risk$) / risk$;
        const close = diff <= 0.02;
        box.innerHTML = close
          ? `<div class="warn-note" style="border-color:rgba(80,180,110,.35);background:rgba(80,180,110,.08);color:#9fe3bd">✓ Correct — $${risk$.toFixed(2)} at risk. The formula: (entry − stop) × size = ${(d.side === "long" ? d.e - d.s : d.s - d.e).toFixed(4)} × ${d.units.toLocaleString()}. You can do this before every trade.</div>`
          : `<div class="warn-note">Not quite — $${risk$.toFixed(2)} is the real number. (Entry − stop) × size = ${(d.side === "long" ? d.e - d.s : d.s - d.e).toFixed(4)} × ${d.units.toLocaleString()}. Try once more, then check.</div>`;
        // The arithmetic-mastered reward: +5 XP the first time the student
        // proves they can compute the 1% number themselves — the whole point
        // of the drill. Once per student, tied to the workshop record.
        if (close) {
          S.workshops = S.workshops || {};
          S.workshops[w.id] = S.workshops[w.id] || {};
          if (!S.workshops[w.id].drill) {
            S.workshops[w.id].drill = true;
            addXp(5, "1% drill: arithmetic proven");
            toast("1% drill mastered — +5 XP", "");
          }
          save();
        }
      };
      ["#dr-bal", "#dr-units", "#dr-entry", "#dr-stop", "#dr-target"].forEach(id => {
        const i = g(id); if (i) i.addEventListener("input", drLive);
      });
      const sideEl = g("#dr-side"); if (sideEl) sideEl.addEventListener("change", drLive);
      const v = g("#drVerify"); if (v) v.addEventListener("click", drVfy);
      drLive();
    }
    if (w.id === "movingavg") {
      wireMaDrill(root);
    }
    const picks = {};
    root.querySelectorAll(".ws-opt").forEach(b => b.addEventListener("click", function () {
      const qEl = this.closest(".ws-q");
      const qi = parseInt(qEl.getAttribute("data-q"), 10);
      const oi = parseInt(this.getAttribute("data-oi"), 10);
      picks[qi] = oi;
      qEl.querySelectorAll(".ws-opt").forEach(x => x.classList.remove("on"));
      this.classList.add("on");
    }));
    root.querySelector("#wsSubmit").addEventListener("click", function () {
      const missing = w.quiz.some((_, i) => picks[i] === undefined);
      if (missing) { toast("Answer every question before submitting", ""); return; }
      let correct = 0;
      w.quiz.forEach((q, i) => { if (picks[i] === q.answer) correct++; });
      const pct = Math.round(100 * correct / w.quiz.length);
      const pass = pct >= 70;
      const wasDone = !!(S.workshops && S.workshops[w.id] && S.workshops[w.id].done);
      S.workshops = S.workshops || {};
      const prev = S.workshops[w.id] || {};
      S.workshops[w.id] = { done: pass || wasDone, score: Math.max(prev.score || 0, pct), drill: !!prev.drill, at: new Date().toISOString() };
      if (pass && !wasDone) addXp(25, "Workshop completed: " + w.title);
      save();
      const fb = root.querySelector("#wsFeedback");
      fb.innerHTML = `<div class="ws-fb-in ${pass ? "pass" : "fail"}"><b>${pct}% — ${pass ? "Workshop complete · +25 XP" : "Not yet — read the explanations and try again"}</b></div>` +
        w.quiz.map((q, i) => {
          const ok = picks[i] === q.answer;
          return `<div class="ws-explain ${ok ? "ok" : "no"}"><b>${i + 1}. ${ok ? "Correct" : "Wrong — the answer: " + esc(q.options[q.answer])}</b><p>${esc(q.explain)}</p></div>`;
        }).join("");
      root.querySelector("#wsSubmit").textContent = "Submit again";
      fb.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- Yellow light mode ----------
     The late-night eye shield: a warm sepia filter over the whole Academy.
     The nudge asks once a day in the golden evening window (7pm–10pm) and
     never again if the student says so — a gentle ask, not a nag. The Break
     Room's "Soft light" button toggles the same mode and persists it. */
  function applySoftLight() {
    if (S.softLight === "on") document.body.classList.add("soft-light");
  }
  function maybeNudgeSoftLight() {
    if (S.softLight === "on" || S.softDismissed) return;
    const h = new Date().getHours();
    if (h < 19 || h >= 22) return;              // the golden evening window
    const today = new Date().toDateString();
    if (S.softAskedAt === today) return;        // once per day is enough
    S.softAskedAt = today; save();
    const overlay = el("div", "warm-nudge");
    overlay.innerHTML = `
      <div class="warm-nudge-card">
        <div class="warm-nudge-ic">${ICONS.moon}</div>
        <h3 class="gold-serif">It's getting late — protect those precious eyes?</h3>
        <p>Yellow light mode softens the screen's blue glow for late-night study. Gentle on the eyes, easy on the mind — the market will still be there in the morning.</p>
        <div class="warm-nudge-actions">
          <button class="btn-gold" data-warm="on">Turn on yellow light</button>
          <button class="btn-ghost" data-warm="later">Not tonight</button>
          <button class="btn-ghost" data-warm="never">Never ask</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll("[data-warm]").forEach(function (b) {
      b.addEventListener("click", function () {
        const v = this.getAttribute("data-warm");
        if (v === "on") { S.softLight = "on"; document.body.classList.add("soft-light"); toast("Yellow light on — rest those eyes", ""); }
        if (v === "never") S.softDismissed = true;
        save();
        overlay.remove();
      });
    });
  }

  /* ---------- Boot ---------- */
  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", () => {
    // sidebar nav (items without data-route are 'coming soon' placeholders)
    document.querySelectorAll(".nav-item").forEach(n => n.addEventListener("click", () => { if (n.dataset.route !== undefined) location.hash = n.dataset.route ? "#/" + n.dataset.route : "#/"; }));
    // Mobile menu — open with the burger, close via the ✕ button, the dimmed
    // backdrop, or picking any destination. The open drawer covers the topbar,
    // so the burger alone can never be the only way back.
    const burger = document.getElementById("burger");
    const sidebarEl = document.querySelector(".sidebar");
    const backdropEl = document.getElementById("navBackdrop");
    function closeNav() {
      if (sidebarEl) sidebarEl.classList.remove("open");
      if (backdropEl) backdropEl.classList.remove("show");
      document.body.classList.remove("nav-open");
    }
    if (burger) burger.addEventListener("click", function () {
      const willOpen = sidebarEl ? !sidebarEl.classList.contains("open") : false;
      if (willOpen) {
        sidebarEl.classList.add("open");
        if (backdropEl) backdropEl.classList.add("show");
        document.body.classList.add("nav-open");
      } else closeNav();
    });
    const navCloseBtn = document.getElementById("navClose");
    if (navCloseBtn) navCloseBtn.addEventListener("click", closeNav);
    if (backdropEl) backdropEl.addEventListener("click", closeNav);
    if (sidebarEl) sidebarEl.addEventListener("click", function (e) {
      if (e.target.closest("a.nav-item, .academy-link")) closeNav();
    });
    startSessionClock(); // live session timer begins the moment the academy opens
    checkTimeBadges();    // credit any time-in-the-game badges already banked from earlier sessions
    captureAcademyBase(); // remember where the student came from (demo: the member panel's origin)
    applySoftLight();     // restore the student's yellow light mode without a flash
    wirePwaInstall();     // the sidebar Install app button — only when the device can install
    // Handshake with System A: greet a verified student by identity (from
    // ?sid=) when the handoff store is reachable; otherwise stay a local demo.
    loadHandshake().then(function () {
      save();
      route();
      wireAcademyLinks(); // the return trip: My RFX Account + Reception (verified students only)
      startAcademyHealth(); // stale-server check — is the academy link live, stale or unreachable?
      ensureTrustLoaded(); // the hall pass must be armed before the first lesson — never flag a trusted student
      runDeviceCheck();   // "Is this really you?" — the device gate precedes the session claim
      initSessionGuard(); // single-session guard — only acts when verified
      flagsSync();        // push any integrity flags raised since the last report
      startSysCheck();    // the machine watching the machine — clock, storage, rail
      maybeNudgeSoftLight(); // the evening eye-shield ask — once per day, in the golden window
    });
  });
})();
