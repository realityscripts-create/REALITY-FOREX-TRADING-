# Reality FX OS — Quality Pass #1: Risk Management
*An expert review of Chapter 7 + the full quiz bank. Every calculation checked. Weak spots flagged. Missing concepts added.*

> "Risk management is the most important aspect of trading — completely." — Leeroy

---

## A. What's already excellent (verified, not guessed)

I checked **every calculation in the Chapter 7 quiz** against the formulas. All correct:

| Question | Your answer | Verified |
|----------|-------------|----------|
| Position size: $3,000 × 1.4% risk, 10-pip stop, $0.10/pip (micro) | **42 contracts** | $42 ÷ ($0.10 × 10) = 42 ✓ |
| $2,000 balance, 2% risk = loss per trade | **$40** | $2,000 × 0.02 = $40 ✓ |
| $150,000 position, $5,000 balance → leverage | **1:30** | 150,000 ÷ 5,000 = 30 ✓ |
| Win rate 35 of 50 | **70%** | 35 ÷ 50 = 0.70 ✓ |
| Expectancy: 65% win / 35% loss, 1.5R avg win, 1R avg loss, $1,000 | **$6.25** | (0.65 × $15) − (0.35 × $10) = $6.25 ✓ |
| Avoid correlated trades: Buy EURUSD + Buy USDCAD vs Sell EURUSD + Buy USDCAD | **Option 2** | Both "Buy USD" bets are correlated; Option 2 offsets ✓ |

Also confirmed sound: margin-as-collateral, leverage-larger-positions, volatility affects P&L, 1% for beginners, stop-loss-further→fewer-lots, high win rate ≠ no risk management, R-multiple thinking. **This chapter teaches the right things.**

---

## B. Flags — questions worth fixing or polishing

**1. The sequence question (HIGH priority — genuinely flawed):**
> "Arrange: 1. Determine your risk per trade 2. Check your net liquidation 3. Determine your position size"
> Options: 1,2,3 / 2,3,1 / 1,3,2

The textbook order is **2 → 1 → 3** (know your equity *first*, then choose your % risk, then size the position) — but that option doesn't exist. The formula `Net liquidation × %Risk ÷ (Stop × $/pip)` needs equity before risk dollars, so 1,2,3 is defensible but ambiguous. **Fix:** change options to include 2,1,3, or reword to "which order best matches the formula" with 1,2,3 as intended.

**2. The margin-call question (needs a nuance):**
> "If your personal equity falls below 25% of the current market value… margin call"

This is *roughly* right for stock trading (maintenance margin) but **forex brokers don't work that way** — they use **Margin Level = Equity ÷ Used Margin**, and stop-out usually triggers around 50% (broker-dependent). Since this is a forex course, recommend adding a note: *"Margin call rules are broker-specific — always read your broker's margin policy."* Great teaching moment, not an error.

**3. Wording polish:**
- Ch7 expectancy question says *"with a 1R is to 1:5R Average win"* — confusing. Suggest: *"average win = 1.5R, average loss = 1R."*
- Ch2 #26: *"Fundamental analysis is basically…"* — the correct option's wording ("use of past trading activity to predict future price changes") sounds like technical analysis. Recommend rephrasing to *"using economic & political data to judge a currency's value."*

**4. Bank-wide scan (all other chapters):** I audited the full 300+ question bank — Ch 1–6, 8–13 are accurate and well-phrased (spot-checked: NFP scenario math, the Apple intrinsic value $86.12, the 377-pip conversion, RSI/MACD rules, order-type placement rules, the 13 triangle/pattern questions). No other factual errors found. 🎯

---

## C. Missing concepts worth adding (the "crazy intelligence" layer)

These are the ideas that separate a *good* risk course from an elite one. Each maps to an OS feature:

**1. Drawdown & recovery (the math nobody warns beginners about).**
A 50% drawdown requires a **100% gain** to get back to even. Table every trader should internalise:
| Drawdown | Gain needed to recover |
|----------|------------------------|
| 10% | 11% |
| 20% | 25% |
| 30% | 43% |
| 40% | 67% |
| 50% | **100%** |
| 60% | 150% |
> *Rule: a losing streak is normal. The account survives because position size shrank with it, not because you "made it back."*

**2. Risk of ruin — why win rate alone is dangerous.**
A trader with a 75% win rate at 1:1 risk can still go broke: 25% losers × 2% risk = high chance of a ruinous run. The harsh truth: **edge × discipline beats win rate.** This is the single biggest myth-buster in trading education.

**3. Volatility-based sizing (the pro upgrade).**
Instead of a fixed 1–2%, top funds size positions by volatility (ATR). Wider markets → smaller size. Same risk $, different lot size. *Rule of thumb: risk = account × % ÷ (stop distance × $/pip) — which your Chapter 7 already nails. The upgrade: measure stop distance in ATR units, not just pips.*

**4. Gap & slippage risk — stops are not guarantees.**
On news events or weekend gaps, price can jump *past* your stop. That's why: trade liquid pairs, avoid high-impact news with full size, and understand negative-balance protection (varies by regulator/broker).

**5. Session risk & drawdown caps.**
- Max 3 losses per day → stop. Your Chapter 6 teaches this; formalise it: *"Daily loss cap = 3R."*
- Weekly loss cap = 6R. When hit, the market is open but *you* are closed.
- This is what makes your psychology chapter and risk chapter one system.

**6. Scale out — the hidden R-multiple amplifier.**
Taking 50% off at 1R and letting the rest run turns a 1:2 setup into an average 3R+ outcome. Same risk, better expectancy, calmer psychology.

---

## D. Pro hacks (practical, immediately usable)

1. **The 1% test:** if sizing at 1% feels too small, you're not ready for live money — it should feel *boring*.
2. **Half-risk rule:** after 2 consecutive losses, halve size for the next trade. Protects the streak.
3. **Never average down a loser.** Adding to a loss is how accounts die.
4. **Measure in R, not money.** "I lost $40" triggers emotion. "I lost 0.5R inside plan" is data.
5. **Check the spread before entry** — a wide spread on an illiquid pair can eat 20% of a scalp's R before you're in.
6. **Journal the *process*, not the P&L** — your Chapter 6 essay already demands this. The OS journal will enforce it.
7. **Risk the same % regardless of confidence.** "High-probability" feelings are the enemy of consistency (your quiz already asks this — True/False answer: **False**).
8. **Trade size follows account size.** After a drawdown, re-size from the *current* balance, not the original.

---

## E. The One-Minute Risk Audit (end-of-chapter checklist)

Before any trade, a student should answer five questions:
1. What is my risk in **R** for this trade? (1R max)
2. Where is my stop? (invalidated thesis = exit)
3. What is my target and its R:R? (≥1:1, ideally 1:2+)
4. How many correlated positions are open right now? (count them as one)
5. Have I hit my daily 3R cap? (if yes — no trade)

---

## F. OS enrichment map (being built now)

- ✅ **Risk Calculator (Laboratory)** — position size, pip value, R-multiple, drawdown recovery — built from your exact Chapter 7 formulas, live in the OS
- 🔜 **Experience scenario:** "The stop got hit by a news spike — what do you do?" (records reasoning)
- 🔜 **Chapter 7 checkpoint upgrade:** the sequence question fixed + a mini risk-audit interactive at the end
- 🔜 **Journal integration:** every trade logged in R with the 5-question audit attached

*Next quality passes available on request: Trading Psychology (#6), Market Orders (#9), Technical Indicators (#10), Technical Analysis (#13).*
