# Reality FX OS — Tier Content Template & the Challenging Lane

> The authoring bible for the difficulty tiers. One machine, one anatomy, three
> lanes. This document is the template every tier deck is forged from — read it
> once, then scaffold and write.

---

## 1. The three lanes, in one breath

| Lane | Colour | Promise | What changes |
|---|---|---|---|
| **Standard** | gold `#E6C565` | The full course — complete and trade-ready on its own | The base deck, as shipped |
| **Challenging** | mint `#9fe3bd` | Applied questions, insider notes, deeper thinking | The **same concepts, drilled**: scenarios, worked maths, commit-reveal, synthesis |
| **Elite** | amber `#e8a33d` | A different course — real trading maths, the institutional layer | **New concepts** above Standard: probability, expectancy, cost, regime, positioning |

The three lanes are not three difficulties of one lesson. They are three
contracts with the student:

- **Standard says:** *understand the market well enough to trade it safely.*
- **Challenging says:** *prove you can apply it — here is the drill field.*
- **Elite says:** *now see the machine underneath.*

**Never call Standard "easy."** Passing Standard is a real achievement and the
wording everywhere (cards, badges, nudges) treats it as one.

---

## 2. Deck anatomy — identical across tiers

Every tier deck is a parallel object inside the chapter, same schema as the
base deck. The player, the progress tracker and the integrity monitor treat it
identically — there is no special rendering path.

```js
{
  // inside a chapter object, alongside quiz/native:
  challenging: {            // or: elite:
    slides: 27,             // total = 15 content + 1 pause + 10 quiz + 1 close
    quizSlides: [17,18,19,20,21,22,23,24,25,26],   // always 17–26
    quiz: [ /* 10 question objects */ ],
    native: [ /* 15 content + pause + 10 nulls + close = 27 entries */ ]
  }
}
```

### The fixed skeleton (27 slides)

| Slides | Role | Required elements |
|---|---|---|
| 1–15 | Content | `eyebrow` (lane + movement), `title`, `lead` (the hook), `body` (2 paras), `bullets` (2–4 gold bullets), and at least one of `callout` / `example` / `insight` |
| 16 | Pause | `kind: "pause"` — a breath before the gate |
| 17–26 | Quiz gate | 10 questions, `null` entries in `native` at exactly these indices |
| 27 | Close | `kind: "close"` — recap + the lane's difference + "the Summit continues in Chapter N's lane" |

**The eyebrow pattern** — every content slide opens with the lane's name and
its movement:
- Challenging: `"Challenging · The drill"`, `"Challenging · The math"`, …
- Elite: `"Elite · The hidden gem"`, `"Elite · The only number"`, …

**The final slide of the deck always points forward:** *"Finish the test, and
the Summit continues in Chapter N's {Challenging|Elite} lane."* It keeps the
course one continuous climb.

### Quiz positions are load-bearing

The structural audit checks that `quizSlides` points exactly at the `null`
entries in `native`. If you shift a slide, re-verify with the checklist in
§7 — a misaligned gate breaks the player.

---

## 3. The Challenging lane — design spec ("more depth")

Challenging is not "harder questions on the same slides." It is the **applied
lane**: the same concepts from Standard, drilled until they become reflexes.
Four depth elements make it distinct, and **every** Challenging deck must
contain all four:

### 3.1 The commit-reveal method (the lane's signature)

Most Challenging slides are **scenarios**, not lectures. The student reads a
situation, commits to a call in their head (or journal), *then* reads the
professional's reasoning in the body and the verdict in the insight.

- Slide 1 of every Challenging deck teaches the method:
  *"Read the scenario. Commit to your call. Then read the reasoning — the
  gap between your call and the professional's is the lesson."*
- The body is written second-person present tense: *"You spot a breakout at
  3 AM. You're about to enter. What's missing?"* — never third-person
  abstract.

### 3.2 Worked maths, in money

Every deck includes at least **three** slides where the student computes a
real number, and the `example` field shows the full working:

- **The cost slide** — "the spread tax, itemised": what a habit costs per
  day / month / year in money.
- **The sizing slide** — risk rule → stop distance → pip value → lot size,
  in one worked line.
- **The leverage/margin slide** — the same adverse move, two different
  leverage ratios, and what each trader's account actually did.

The `example` field is mandatory on these slides — the working is the
lesson, not the answer.

### 3.3 Synthesis questions

At least a third of the gate questions combine **two or more concepts** from
the chapter (e.g. session × spread, leverage × margin level, short ×
slippage). The explanation names both concepts explicitly: *"This is
sessions × costs: the fill was fine, the habit wasn't."*

### 3.4 Insider explanation layers

Every Challenging gate question's `explain` has two beats: the direct answer,
then a **deeper sentence** starting with *"The deeper layer:"* that shows the
institutional / professional view of the same fact. Elite questions go even
further — Challenging explains *why*, Elite reveals *what the pros do with
it*.

### The Challenging tone

Direct, demanding, never mean. The scenario is a drill field, not a trap —
wrong answers are tuition, and the deck's close makes that explicit: *"You
just made the mistakes in a simulator, so you don't make them with money."*

---

## 4. Quiz writing rules (both tier lanes)

1. **Answers are distributed.** Never more than two of the same index in a
   row; across the 10 questions the correct positions should vary (0–3) and
   never form a pattern a fast reader could exploit.
2. **Distractors are plausible.** Each wrong option is a *real* mistake a
   student makes (the common wrong formula, the reversed pair, the
   half-remembered rule) — never an absurdity.
3. **Math questions carry full working in the explanation** — the formula,
   the numbers, the result, and one line on what it means.
4. **`explain` is the lesson, not the justification.** A wrong answer is
   converted into teaching: *"This is {concept}: …"* — never a bare "No."
5. **No trick questions.** The question tests whether the student *understands*
   the concept, not whether they can parse a double negative.
6. **Elite questions carry FIVE options.** The Elite gate is the summit — five
   plausible choices, with the correct position distributed so no pattern is
   exploitable. Challenging uses 3–4 options; Standard keeps its existing
   bank. The renderer already handles any count (flex column) — this is a
   content rule, not a code rule.

---

## 5. The house voice (non-negotiable)

- **Gold bullets** — the `bullets` array reads like proverbs: short, punchy,
  quotable. *"The market pays the process, not the prediction."*
- **The insight line** — every deck's `insight` ends the slide on one
  memorable sentence a student will repeat.
- **The callout** — a single dramatic line in quotes, used sparingly (2–3
  per deck max) for the moments that deserve it.
- **Second person, present tense** in Challenging scenarios.
- **Numbers always concrete** — pips, rands, percentages, never "a lot" or
  "big".

---

## 6. Authoring procedure (rolling build)

1. **Scaffold:** `perl .freebuff/tools/scaffold-tier-deck.pl <ch> <lane>` →
   writes the skeleton block (correct slide count, quiz nulls, placeholder
   slides) to `.freebuff/tools/ch<N>-<lane>-block.js`.
2. **Write:** fill the 15 content slides + 10 questions + close from the
   template above. Keep the eyebrow movements consistent within the deck.
3. **Splice:** copy `.freebuff/tools/splice-tier.pl`, change the anchor to
   the next chapter's `id:` line, run it. It inserts the deck as the last
   key of the target chapter — the block must NOT end with a trailing comma.
4. **Structural audit** (browser): reload with a cache-buster, then confirm
   `slides`, `quizSlides` ↔ null alignment, `quiz.length === 10`,
   `native.length === 27`.
5. **Live walk:** play the deck to completion at human pace (≥1.6s per
   answer), confirm the 100% pass, the tier-tagged badges, and a clean
   console (ignore the sandbox Google-Fonts 404 — that's the preview's
   network, not the OS).

---

## 7. Verification checklist (run before calling a deck done)

- [ ] `slides` matches `native.length` and the header's expected total
- [ ] `quizSlides` indices point exactly at `null` entries in `native`
- [ ] `quiz.length === 10`; close slide is the last native entry
- [ ] Every content slide has `eyebrow`, `title`, `lead`, `body`, `bullets`,
      and at least one of `callout` / `example` / `insight`
- [ ] The pause slide (`kind: "pause"`) sits at index 15 (slide 16)
- [ ] Challenging: ≥3 worked-math slides with `example`; ≥⅓ synthesis
      questions; every explanation has the two-beat structure
- [ ] Quiz answer indices are distributed (no runs of 3+, no patterns)
- [ ] The close slide points forward to the next chapter's same lane
- [ ] Walked live at human pace → 100% pass, badges tier-tagged, console clean
