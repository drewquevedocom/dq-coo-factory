# Profile: claude-only

No server, no install. The client gets a Claude Project with the generated skills
loaded. Fastest delivery and the easiest for a non-technical owner.

## What the client needs first
- Their own Claude account (they sign up; you never create it)
- Their own API keys for anything the spec wires up

## Steps
1. Client creates a Claude Project named `<business_name> — AI COO`.
2. Paste `build/identity.md` into the Project's custom instructions.
3. Upload each file from `build/skills/` to the Project.
4. Connect only the integrations listed in the spec, using the client's own accounts.
5. Walk the owner through one real task end to end, including a gate stop.
6. Hand over `build/HANDOVER.md`.

## Limits — say these out loud at handover
- No scheduled runs. Claude Projects do not wake themselves, so the daily brief is
  something the owner asks for, not something that arrives. If they want it to arrive
  on its own, they need `hermes-local` or `hermes-vps`.
- No phone number and no inbox of its own.
- Memory is whatever the Project holds, not a three-tier agent memory.

If the owner's main reason for buying was "it calls me," this profile is the wrong
one. Say so before taking the money.
