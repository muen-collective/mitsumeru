---
id: story-pointing
name: Story-pointing epics
description: Assign Fibonacci story points and a three-point hour estimate to every epic before any design or build work starts, calibrated against the velocity log. Triggers whenever an epic is created, planned, or scoped - "give this epic story points", "point this epic", "estimate this epic", "how many hours is this", "scope this".
---

# Story-pointing epics (point before designing)

## When

Always, **before** design or build work starts on an epic. Pointing after
the work is done is hindsight, not estimation - it cannot feed the scope
calculator.

## The three numbers

1. **Story points** - Fibonacci (1, 2, 3, 5, 8, 13). Relative size of the
   epic, not hours. No 4s, 6s, 7s, 9s.
2. **Three-point hours** - optimistic (O), most likely (M), pessimistic (P)
   for the epic, in hours.
3. **Calibration factor** - hours per point from the velocity log
   (`product/strategy/velocity-burn-rate.md` in the hand-me-up workspace).
   M should agree with `points x factor` for the most similar past epic.

## Rules

- Point before designing. Never let actual effort retroactively set the
  points.
- If an epic is over 13 points, split it.
- Name the closest past epic in the velocity log and anchor M on its
  actuals. This is reference-class forecasting: past actuals beat
  optimism, and optimism is the enemy of accurate scoping.
- Note complexity flags that change the factor: new skill needed, client
  onboarding / account setup, a reusable asset already exists.
- Write the result into the epic doc as a `**Estimate:**` line with
  points, O/M/P, expected hours, and the reference epic.

## Formulas

- Expected hours: `E = (O + 4M + P) / 6` (PERT)
- Standard deviation: `σ = (P - O) / 6`
- Safe single-epic estimate: `E + σ` (roughly the 85th percentile)
- Project total: `E_total = ΣE`, `σ_total = √(Σσ²)`; the fixed fee is
  priced at `p90 = E_total + 1.28·σ_total` at $100/hour on paid projects.
  Full method: `product/strategy/scope-calculator.md`.

## Worked example (seed calibration)

Hand Me Up epic "Design direction A" (clone + design, clone-site skill
reused): points 5, O=3h, M=5h, P=9h. `E = (3 + 20 + 9)/6 = 5.3h`, actual
5h. Seed factor: **1 point ≈ 1 hour** for template clone + design once a
clone skill exists.

## Verification

When the epic closes, the retro records actual hours vs E
(`product/strategy/velocity-burn-rate.md`). The delta recalibrates the
factor in the scope calculator. A big delta means the factor or the points
were wrong; log the lesson either way.
