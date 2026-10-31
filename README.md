# dq-coo-factory

The product behind the AI COO install service. One spec file defines a client;
templates generate the rest.

## Layout

| Path | What it is |
|---|---|
| `spec.schema.yaml` | The shape of a client. Copy, don't edit. |
| `templates/` | Drew's own system with the business parts blanked out |
| `templates/skills/clone-coo.md` | The Hermes skill that runs the whole clone |
| `profiles/` | One script per delivery target |
| `clients/<slug>/spec.yaml` | The only handwritten file per client |
| `clients/<slug>/overrides/skills/` | Optional. A file here replaces the shared template. |
| `clients/<slug>/build/` | Generated. Safe to delete and regenerate. |

## Delivery targets

| Target | Client gets | Typical time |
|---|---|---|
| `hermes-local` | Hermes on their PC behind Tailscale, nothing in the cloud | ~1 hr |
| `hermes-vps` | Hermes on their own VPS, their account and keys | ~1 hr |
| `claude-only` | A Claude Project with the skills loaded, no server at all | ~30 min |

## Client zero

`drew-business` and `drew-personal` are Drew's own instances. They run first and
get tested before anyone pays for one. Both use `overrides/skills/daily-brief.md`
so the morning brief covers what Drew actually tracks.

## Rules that do not bend

1. **No secrets in this repo, ever.** Names only. Values live in the client's `.env`.
   One leaked key here would burn every client at once.
2. **No deploy without Drew's approval.** The skill generates and stops.
3. **No invented answers.** An unanswered interview question is `TODO`, not a guess.
4. **The five gates stay on** unless a client asks in writing and it is recorded.

## Running a clone

In Hermes: "clone my system for <client>". The skill interviews you, writes the
spec, then stops.

To generate the build from a spec by hand:

```bash
pip install pyyaml          # once
python3 scripts/generate.py econstruct
```

It writes `clients/<slug>/build/` and prints every open `TODO`, every secret the
client must supply, and any warning where the chosen delivery target cannot keep a
promise in the spec. Exit code is non-zero while TODOs or warnings remain, so it
can gate a deploy.

`build/` is disposable. Delete it and regenerate any time.

## Skills included

| Skill | What it does |
|---|---|
| `daily-brief` | Money, calendar, what's waiting on you, one next action |
| `lead-triage` | Score, research, draft the reply, stop for approval |
| `inbox-triage` | Sorts into needs-you / drafted / handled. Sends nothing. |
| `invoice-chase` | Who owes what, tone matched to payment history |
| `content-engine` | One input becomes a week of drafts in the owner's voice |
| `rnd-scout` | Weekly hunt for better tools, tested, never installed |
| `clone-coo` | The meta-skill that runs this whole factory |
