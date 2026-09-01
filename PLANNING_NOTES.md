# Modeling notes & known simplifications

This tool is a planning aid, not tax or investment advice. To keep the engine
understandable and fast enough to run 500+ Monte Carlo simulations in the
browser, it makes some deliberate simplifications. Worth knowing about:

## Real (today's) dollars throughout

The whole engine works in real, inflation-adjusted dollars. Enter expected
returns *above* inflation (a real return), and everything else — spending,
balances, chart output — is already in today's purchasing power. This avoids
tracking a 60-year nominal-dollar compounding chain and matches how most
people think about "how much do I need."

An income source's "real growth" field lets you model things that don't keep
pace with inflation (e.g. a fixed pension with no COLA — enter a small
negative value) as well as things that do (Social Security — 0 is a
reasonable default).

## Retirement age drives the whole household

The primary person's retirement age determines when the whole household
stops contributing and starts withdrawing. A spouse's age is tracked for
their own income-source eligibility, but there's no separate accumulation
timeline for a spouse who retires at a different age.

## Taxes

- Federal brackets and the standard deduction are 2025 figures, held
  constant for the life of the plan (no separate long-run inflation
  adjustment to brackets, since we're already working in real dollars).
- No state income tax.
- Traditional-account withdrawals count as ordinary income; a
  configurable fraction of taxable-account withdrawals is treated as a
  capital gain (a rough stand-in for cost basis) taxed at long-term
  capital-gains rates. Roth and HSA withdrawals are untreated as tax-free.
- Social Security is *not* modeled as partially taxable — all guaranteed
  income is treated as fully taxable ordinary income, which overstates tax
  on Social Security specifically for most households.
- Required minimum distributions apply from age 73 using a simplified IRS
  Uniform Lifetime Table, forcing a minimum traditional-account withdrawal
  regardless of your chosen withdrawal strategy.
- The portfolio actually funds the tax bill each year (it doesn't just
  report a number) — but the withdrawal used to pay taxes isn't itself
  re-taxed, a standard second-order simplification.

## Withdrawal strategies

All three strategies (fixed real, Guyton-Klinger guardrails, variable/
amortization-based) are simplified versions of the real methods — see the
descriptions in the app for what each one does and skips.

## Roth conversion planner

The Roth conversion comparison runs its own simplified simulation, aggregated
by account *type* rather than per account, so the "with" and "without"
conversion runs are perfectly apples-to-apples. It also always assumes flat,
inflation-adjusted spending, so results won't exactly match your dashboard
projection (which uses your chosen withdrawal strategy) — treat it as a
focused comparison tool, not a restatement of the dashboard.

## Life events (spending goals & income events)

A life event (a wedding, an inheritance, a stretch of part-time work) can be
one-time or recurring over an age range, and can land before or after
retirement — unlike the original one-time-items list, these actually affect
account balances during the accumulation phase, not just retirement:

- **During retirement**, a life event behaves like the rest of the engine:
  income reduces the portfolio-funded spending gap, expenses increase it,
  and both flow through the same tax treatment as guaranteed income
  (see Taxes above).
- **Before retirement**, there's no per-account withdrawal-order machinery
  (accounts are still accumulating), so a life event's net cash flow for
  the year is spread across your accounts in proportion to their current
  balance, floored so a single year's expense can't push an account
  negative. This is a simplification: it doesn't respect your withdrawal
  order preference for *which* account absorbs a pre-retirement expense.
- A recurring life event's annual amount grows from the plan's start year
  (age today), the same convention as guaranteed income's "real growth"
  field — not from when the event itself starts.

## Monte Carlo

Each simulated year draws one shared "market shock" applied to every
account, scaled by that account's own volatility — so accounts move
together within a year (realistic) while still having independent
return/volatility assumptions. Returns are drawn from a normal
distribution, which is a simplification of real market return
distributions (no fat tails, no autocorrelation).

## Other known gaps

- No support for modeling a mortgage payoff, rental property expenses vs.
  income separately, or ACA health-insurance subsidy cliffs.
- No Social Security claiming-age optimizer (compare 62 vs. FRA vs. 70) —
  model this manually today by adding a second "what if I claim later"
  scenario in Compare Scenarios.
- Life events and the healthcare bridge are folded into the spending
  baseline a withdrawal strategy tracks, so a very large life event in
  your first retirement year can skew a guardrail/variable strategy's
  ongoing behavior.
