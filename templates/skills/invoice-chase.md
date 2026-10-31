---
name: invoice-chase
description: Track what is owed and draft reminders matched to each customer's history.
---

# invoice-chase

Runs weekly. Drafts only.

## Step 1 — Who owes what

Pull open invoices with amount, age, and the customer's payment history.
If the accounting system is unreachable, say so and stop. Do not reconstruct
balances from memory or email.

## Step 2 — Tone, by history

| Situation | Tone |
|---|---|
| Good payer, slightly late | Light. Assume it was missed. |
| Repeat late payer | Direct. State the amount and the due date. |
| Far overdue, no contact | Firm. Name the next step plainly. |
| Dispute in the thread | Do not chase. Escalate to the owner. |

Never threaten. Never mention legal action. That is the owner's call and the
owner's wording.

## Step 3 — Hand over

Give the owner one list: customer, amount, days late, suggested tone, and the draft.

**Gate: nothing is sent to a customer without approval.**

## Never

- Never state a balance you did not read from the accounting system.
- Never chase an invoice flagged as disputed or already paid.
- Never contact a customer's customer.
