---
name: clone-coo
description: Clone Drew's AI COO for a client. Interviews Drew, writes the client spec, generates the install, and stops for approval before anything is deployed.
---

# clone-coo

Triggered when Drew says something like "clone my system for <client>".

## Rules

1. **Never invent an answer.** If Drew doesn't know something, write `TODO` in the spec
   and list it in the summary. A spec full of guesses produces a broken install.
2. **Never put a secret in this repo.** Record secret *names* only. Values go in a
   `.env` on the client's own machine.
3. **Stop at the approval gate.** Generate everything, then wait. Do not deploy to a
   paying client's machine without Drew's explicit yes in this conversation.
4. **Never create accounts.** Oracle, Claude, Telegram and carriers all need the
   client's own signup, card and ID. Produce instructions instead.

## Step 1 — Interview

Ask these in order. One question at a time. Accept "skip" and write `TODO`.

**Business**
- What's the business called, and what does it actually do in the owner's own words?
- Who is the owner, and what should the agent call them?
- What timezone do they work in?

**Delivery**
- Where does this live: their own machine, their own server, or Claude only with no server?
- If a machine or server: whose account pays for it, and what are the specs?

**Stack** — for each, get a name or "none":
- Email, calendar, CRM, accounting, website, phone, file storage.
- Anything else they live in daily.

**Jobs** — which of these does the owner actually want?
- Daily brief, lead triage, inbox triage, invoice chasing, content, R&D scouting.
- Drop anything they shrug at. An unused agent is noise that erodes trust.

**Reach**
- How should the agent contact them: Telegram, email, SMS, or voice?
- What time should the daily brief land, and what are their quiet hours?
- What is worth waking them for outside those hours? If they say "anything,"
  push back once — a system that interrupts constantly gets muted.

**Gates**
- Confirm all five hard gates stay on: send to customer, spend money, publish
  publicly, delete files, change settings.
- If they want one off, record who asked and why. Do not turn one off silently.

## Step 2 — Write the spec

Write `clients/<slug>/spec.yaml` using `spec.schema.yaml` as the shape.
Every unanswered field is `TODO`, never a guess.

## Step 3 — Generate

From `templates/` plus the spec, produce into `clients/<slug>/build/`:
- `identity.md` — the constitution, with the client's business and gates filled in
- `skills/` — only the skills their spec turned on
- `schedules.yaml` — their times, their timezone, their quiet hours
- `.env.example` — secret names only, with a comment saying where real values go
- `HANDOVER.md` — what it does, how to talk to it, how to turn it off

## Step 4 — Report and stop

Tell Drew:
- Which delivery target was chosen
- Every `TODO` still open, as a numbered list
- Which secrets the client must supply, and what each is for
- The exact install command or steps for that target

Then **stop and wait**. The next move is Drew's approval.

## Step 5 — Deploy, only after approval

Run the matching profile in `profiles/`. Smoke-test: one brief, one test message
to the owner's channel, one gate check. Hand over `HANDOVER.md`.
