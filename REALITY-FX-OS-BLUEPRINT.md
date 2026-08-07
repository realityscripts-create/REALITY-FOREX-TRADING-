# REALITY FX OS — Product Blueprint
*The interactive trading academy. Every lesson is a trade. Every trade is a lesson.*

---

## 1. The Vision

Most trading education dumps information and hopes it sticks. Trading is not mastered by memorising definitions — it is mastered through **experience, repetition, mistakes, reflection, and pattern recognition**.

Reality FX OS transforms the 13-chapter RFX Full Course from a normal course into an interactive trading academy. Students don't just watch Leeroy explain market structure, liquidity, risk management, price action, and psychology — they enter an environment where they *experience* those concepts.

**The loop:** Learn → Experience → Experiment → Reflect → Improve → Master

**The mission:** To transform traders from information collectors into experienced decision makers.

**What it is:** Duolingo + TradingView + flight simulator + university experience — for trading education.

---

## 2. The Raw Material (What We Have)

An audit of the 13 chapters (Nearpod exports, all present on disk):

| # | Chapter | Slides | Built-in Assessment |
|---|---------|--------|---------------------|
| 1 | The Forex Market | 22 | 10 Q pop quiz + 2 polls (trader-type poll, self-assessment) |
| 2 | Fx Terminology & Concepts | 49 | ~32 Q quiz incl. pip/point calculations, lot sizes, leverage |
| 3 | Fundamental Analysis | 41 | ~20 Q incl. NFP scenarios, intrinsic value calculations |
| 4 | Candlesticks | 90 | ~22 Q + fill-in-the-blank (bearish/bullish candle) |
| 5 | Market Movement | 62 | ~24 Q incl. support/resistance, breakouts, impulses |
| 6 | Trading Psychology | 29 | ~13 Q + **50-mark essay** (text or voice-note answer) |
| 7 | Risk Management | 81 | ~30 Q incl. position-size calculation, R-multiples, win rate |
| 8 | Pairs | 43 | ~22 Q incl. NZD→ZAR conversions, liquidity, cross pairs |
| 9 | Market Orders | 43 | ~22 Q — **decision scenarios** ("which order type is ideal?") |
| 10 | Technical Indicators | 63 | ~30 Q on SMA/EMA, RSI, Bollinger, MACD |
| 11 | Market Cycle | 37 | ~18 Q on accumulation/mark-up/distribution/mark-down |
| 12 | The Stock Market | 86 | **PAPER 1** (25 T/F) + **PAPER 2** (24 MCQ) — exam-style |
| 13 | Technical Analysis | 95 | 3-part quiz, ~38 Q on trendlines, patterns, triangles |

**Total: ~740 slides · 300+ assessment questions already written.**

### Key structural finding

The **teaching slides are images** (the Nearpod export embeds the lesson content as designed slides — the text layer only captured the quiz elements). Two ways to handle this:

- **Option A — Embed the slide images** (fast): I can extract every slide as a high-quality image; the OS lesson player displays them with interactive checkpoints between. The course keeps Leeroy's exact visual design. *Recommended for launch.*
- **Option B — Rebuild as native OS content** (premium): each concept becomes native interactive screens. Higher effort, needs source text. *A v2 upgrade path, chapter by chapter.*

### Answer keys

The exports contain questions and options but **not the marked correct answers**. We will draft answer keys from the chapter content and Leeroy verifies each one. (This doubles as a quality pass on the question bank.)

---

## 3. The OS — Screens & Experience

### 3.1 Dashboard (the "institution lobby")
- Progress ring: % through the Full Course
- Current Trader Rank + XP/points toward next rank
- Continue-where-you-left-off card
- Today's discipline check (streak counter)
- Quick journal entry box
- Chapter map shortcut + mentor message area

### 3.2 The Journey Map (13 chapters as a path)
A vertical or winding path with 13 nodes, in the site's gold/dark style. Locked chapters show a gold padlock; completed ones glow with a check. Chapter 1 starts open; each chapter unlocks when the previous chapter's quiz checkpoint is passed.

### 3.3 The Lesson Player (Learn stage)
Each chapter becomes a sequence of:
1. **Concept slides** (Leeroy's extracted slides, or native content in v2)
2. **Checkpoint questions** — every ~3–5 slides, a quiz question from Leeroy's existing bank interrupts: *"Before we continue — quick check."* Pass to proceed; fail → reviewed, retry allowed
3. **Callouts** — pull-quote moments ("Success is a probability game", the philosophy line, etc.)
4. End-of-chapter **pop quiz** (the full bank for that chapter)

### 3.4 Experience Scenarios (Experience stage — the differentiator)
Interactive decision exercises built from the real chapters:
- **Chapter 9 engine:** a chart scenario is presented (price overbought, breaking support, head-and-shoulders formed) — the student chooses the order type and explains *why*. The OS records their **reasoning, not just the answer**.
- **Chapter 4 engine:** show a candlestick image → "What pattern is this and what does it signal?"
- **Chapter 5 engine:** "Price dipped but your support zone held — is this a buy or sell signal? Where is your stop?"
- Process is scored over outcome. The student's reasoning is stored in their journal.

### 3.5 The Laboratory (Experiment stage — Phase 3 of the roadmap)
- **Chart replay / trade simulation:** practice decisions on historical or live price data without risking money
- **Risk calculators:** position size, pip value, R-multiples — the exact formulas from Chapters 2 & 7
- **Strategy testing:** try a setup, see outcomes
- *This is the biggest build; it is Phase 3, not Phase 1.*

### 3.6 The Journal (Reflect stage — every trade is a lesson)
A guided reflection template that mirrors Leeroy's Chapter 6 essay structure:
- Win: "Why did this work? Was my analysis correct? Can I repeat this?"
- Loss: "What information did I miss? Bad execution? Bad psychology? Poor risk management? How do I prevent this?"
- Emotion check: what was I feeling when I entered?
- Every entry earns points and feeds the student's "trader profile."

### 3.7 Trader Ranks & Achievements (Improve → Master)
Ranks aligned to the course journey (draft):
1. **Novice** (start)
2. **Student** (Ch 1–3 complete)
3. **Analyst** (Ch 4–6)
4. **Risk-Aware** (Ch 7–8)
5. **Strategist** (Ch 9–11)
6. **Institution** (Full course + final assessment)

Achievements: streak milestones, perfect quizzes, first journal entry, first scenario passed, paper-trade consistency, etc.

### 3.8 Certification
Final assessment draws from the Chapter 12 exam structure. Passing students earn a **Reality FX Academy certificate** (styled in the brand's gold/dark identity, with a unique certificate code).

---

## 4. Tech Direction

- **Phase 1 (Foundation):** A standalone web app in the site's exact visual language (gold #c5a852 on dark #141414, serif display type). Runs as static HTML/CSS/JS — same hosting as the main site, zero cost, zero maintenance. Progress stored per-device to start.
- **Phase 2 (Accounts):** Firebase (Auth + Firestore, free tier) — real logins, cross-device progress, admin screen for Leeroy to grant access when payment lands, per-student data.
- **Phase 3 (Laboratory):** chart replay + simulation (needs a market-data source — decision to be made when we get there).
- **Phase 4+:** AI mentor, community — later roadmap.

The OS gets its own entrance: a **"Reality FX OS / Student Login"** button on the main site's navbar, opening the OS as its own app.

---

## 5. Build Roadmap (mapped to Leeroy's phases)

| Milestone | Contents | Status |
|-----------|----------|--------|
| **OS Foundation** | App shell, dashboard, journey map (13 nodes), lesson player with extracted slides, checkpoint system, chapter quiz engine with Leeroy's 300+ questions, rank + XP system, local progress, certificate. | **Next build** |
| **OS Experience** | Experience-scenario engine (order-type decisions, candlestick ID, market-move calls), guided journal with reflection prompts. | After Foundation |
| **Accounts** | Firebase auth, admin access-granting, cross-device progress sync. | After Foundation/Experience |
| **Laboratory** | Chart replay, trade simulation, strategy testing, risk calculators as interactive tools. | Separate project phase |
| **AI Mentor** | Personalised behaviour analysis (entering too early, discipline patterns), guided nudges. | Future |
| **Community** | Progress sharing, challenges, competitions. | Future |
| **Academy Expansion** | Same engine, new curricula: investing, financial literacy, wealth creation, business. | Future |

---

## 6. Decisions — Confirmed ✅

1. **Content path: Option A.** Use Leeroy's original slide images for launch (most were hand-created; native rebuild is a later upgrade). **Done — 741 slides extracted** to `os/assets/slides/`.
2. **Answer keys:** drafts from content → Leeroy verifies. Ch 1–2 drafted in `ANSWER-KEYS-DRAFT.md`; 3–13 on request.
3. **Payments:** hosted checkout links, zero payment code. **PayFast recommended** (SA standard — cards, instant EFT, PayPal); **Stripe Payment Links** as the global alternative. Wired into Enroll buttons in the accounts phase.
4. **Access model:** OS included with the RFX Full Course; elevated features (Journal/Laboratory) for the Virtual Mentor tier.
5. **Security:** Phase 1 deterrents in place (watermark, no right-click, no drag). **Real protection = Phase 2**: Firebase auth + lesson assets served only to signed-in students via expiring signed URLs.
6. **Name:** Reality FX OS confirmed. Navbar entrance: **Student Login**.

## 7. Phase 1 Status — Foundation Built ✅

- **App:** `os/index.html` (SPA) + `os/css/os.css` + `os/js/os.js` + `os/js/data.js` — gold/dark, same tokens as the main site
- **Dashboard:** progress ring, rank + XP, streak, continue card, stats, certificate teaser
- **Journey Map:** 13 nodes, unlock gating (all slides viewed + quiz ≥70%)
- **Lesson Player:** 741 slide images, watermark, keyboard nav, progress bar
- **Quiz Engine:** checkpoint quizzes with instant feedback + explanations, first-attempt scoring, retake flow, self-assessment poll
- **Ch 1–2 quiz banks live** (43 questions, answers drafted); **Ch 3–13** load once keys are verified
- **Ranks:** Novice → Student → Analyst → Risk-Aware → Strategist → Institution
- **Progress:** localStorage (per-device); Firebase accounts are Phase 2
- **Certificate view** built; unlocks at 13/13
- **Verified end-to-end:** full Chapter 1 walkthrough — slides, quiz 100%, chapter complete, Chapter 2 unlocks

### Next steps
1. Verify Ch 1-2 answer keys, then draft keys for Ch 3-13 chapter by chapter
2. Extract-then-hide: keep slide assets out of public URLs until Phase 2 gating
3. Phase 2: Firebase auth + admin access-granting + PayFast checkout links
4. Phase 2/3: Journal, Experience scenarios (Ch 4/5/9 engines), Laboratory

## 8. Showcase / Free Trial Mode (conversion engine) 🎟️

**Idea:** anyone can see the whole academy (all 13 chapters on the journey map) but cannot enter any content. Entering Chapter 1 requires purchase.

**Approved design (my recommendation):**
- **Catalog mode (free, no account):** full journey map renders - every chapter title, focus, slide count visible with gold lock icons
- **Sneak peek:** Chapter 1's first 3 slides viewable free (the strongest conversion lever in education - "watch the first lesson free")
- Every locked chapter shows a gold **"Purchase to unlock"** CTA
- Access mode flag in state: `mode: "catalog" | "student"` - students (post-purchase) get full access
- Real enforcement requires Phase 2 (accounts); the showcase UI ships now, hard gating with Phase 2

## 9. Course Modules Roadmap (the Academy expansion) 🏫

The OS engine is course-agnostic (one CHAPTERS array per course), so new modules reuse 100% of the platform: dashboard, journey, quizzes, laboratory, ranks, certificates.

| Module | Status | Notes |
|--------|--------|-------|
| **RFX Full Course** (Forex) | Built | 13 chapters, 741 slides |
| **Reality FX: Crypto** | Future | 8-12 chapters, created from scratch |
| **Reality FX: Commodities** | Future | Gold, oil, grains - natural follow-on |
| **Reality FX: Stocks** | Future | Extends the Chapter 12 foundation |
| **Reality FX: Derivatives** | Future | Options, futures, CFDs - advanced tier |

Order suggestion: Crypto & Commodities first (closest to forex knowledge), then Stocks, then Derivatives. Each module ships chapter by chapter - content creation by me + Leeroy's expertise and verification.

## 10. Native Slide Rebuild (premium content upgrade) 🎨

**Problem:** extracted slides carry Nearpod branding and don't match the premium gold/dark theme.

**Plan (approved direction, chapter-by-chapter):**
1. OCR all 741 slides to recover their text (slides are images - OCR is the reliable extraction path)
2. Rebuild each slide as a native OS card - dark background, gold elements, the site's typography
3. Weave in Quality-Pass improvements as each chapter is rebuilt
4. Start with Chapter 1 (22 slides) as the proof, then proceed chapter by chapter

Native rebuild also solves watermark/DRM concerns long-term: content becomes structured data, not images.
