#!/usr/bin/env python3
"""Turn clients/<slug>/spec.yaml + templates/ into clients/<slug>/build/.

Deliberately dumb: no network, no secrets, no deploy. It renders files and
prints what is still missing. Deploying is a separate, human-approved step.

    python3 scripts/generate.py econstruct
"""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("Need pyyaml:  pip install pyyaml")

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "templates"

GATE_TEXT = {
    "send_to_customer": "Send anything to a customer, client or lead",
    "spend_money": "Spend money or commit to a cost",
    "publish_public": "Publish anything publicly",
    "delete_files": "Delete files or data",
    "change_settings": "Change account or system settings",
    "contact_family": "Contact anyone in the family directly",
}

# Which secret names each stack choice implies. Names only, never values.
STACK_SECRETS = {
    "email": {"gmail": ["GMAIL_OAUTH_CLIENT_ID", "GMAIL_OAUTH_CLIENT_SECRET"],
              "m365": ["MS_GRAPH_CLIENT_ID", "MS_GRAPH_CLIENT_SECRET", "MS_GRAPH_TENANT_ID"]},
    "calendar": {"google": ["GOOGLE_CALENDAR_CREDENTIALS"],
                 "outlook": ["MS_GRAPH_CLIENT_ID"]},
    "accounting": {"quickbooks": ["QBO_CLIENT_ID", "QBO_CLIENT_SECRET"],
                   "xero": ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET"]},
    "phone": {"signalwire": ["SIGNALWIRE_PROJECT_ID", "SIGNALWIRE_TOKEN", "SIGNALWIRE_SPACE"],
              "telnyx": ["TELNYX_API_KEY"]},
    "storage": {"google-drive": ["GOOGLE_DRIVE_CREDENTIALS"],
                "dropbox": ["DROPBOX_TOKEN"]},
}

CONTACT_SECRETS = {"telegram": ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
                   "sms": ["SIGNALWIRE_PROJECT_ID", "SIGNALWIRE_TOKEN"],
                   "voice": ["SIGNALWIRE_PROJECT_ID", "SIGNALWIRE_TOKEN"]}


def dig(data, dotted: str):
    cur = data
    for part in dotted.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def render(text: str, ctx: dict, lists: dict) -> str:
    """Minimal template renderer: {{a.b}} and {{#name}}...{{/name}} over lists."""
    def expand_block(m):
        name, body = m.group(1), m.group(2)
        items = lists.get(name) or []
        if not items:
            return "- (none set)\n"
        out = []
        for item in items:
            if isinstance(item, dict):
                chunk = body
                for k, v in item.items():
                    chunk = chunk.replace("{{%s}}" % k, str(v))
                out.append(chunk)
            else:
                out.append(body.replace("{{.}}", str(item)))
        return "".join(out)

    text = re.sub(r"\{\{#(\w+)\}\}\n?(.*?)\{\{/\1\}\}\n?", expand_block, text, flags=re.S)

    def sub_var(m):
        val = dig(ctx, m.group(1))
        return "TODO" if val is None else str(val)

    return re.sub(r"\{\{([\w.]+)\}\}", sub_var, text)


def collect_todos(node, path="") -> list[str]:
    found = []
    if isinstance(node, dict):
        for k, v in node.items():
            found += collect_todos(v, f"{path}.{k}" if path else k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            found += collect_todos(v, f"{path}[{i}]")
    elif isinstance(node, str) and node.strip().startswith("TODO"):
        found.append(path)
    return found


def main(slug: str) -> int:
    client_dir = ROOT / "clients" / slug
    spec_path = client_dir / "spec.yaml"
    if not spec_path.exists():
        sys.exit(f"No spec at {spec_path}")

    spec = yaml.safe_load(spec_path.read_text())
    build = client_dir / "build"
    if build.exists():
        shutil.rmtree(build)
    (build / "skills").mkdir(parents=True)

    target = dig(spec, "delivery.target")
    if target not in {"hermes-local", "hermes-vps", "claude-only"}:
        sys.exit(f"delivery.target must be hermes-local, hermes-vps or claude-only (got {target!r})")

    gates = [{"gate_description": GATE_TEXT[k]}
             for k, on in (spec.get("approval_gates") or {}).items() if on and k in GATE_TEXT]
    wake = spec.get("contact", {}).get("wake_for") or []

    ctx = {
        **(spec.get("client") or {}),
        "contact": spec.get("contact") or {},
        "schedule": spec.get("schedule") or {},
        "daily_brief_time": dig(spec, "schedule.daily_brief_time"),
        "primary_channel": dig(spec, "contact.primary"),
    }

    # identity.md
    identity = render((TEMPLATES / "identity.md").read_text(), ctx,
                      {"approval_gates": gates, "wake_for": wake})
    (build / "identity.md").write_text(identity)

    # skills the spec switched on
    enabled = [k for k, on in (spec.get("agents") or {}).items() if on]
    written, overridden = [], []
    for name in enabled:
        fname = f"{name.replace('_', '-')}.md"
        # A client-specific version wins over the shared template.
        override = client_dir / "overrides" / "skills" / fname
        src = override if override.exists() else TEMPLATES / "skills" / fname
        if override.exists():
            overridden.append(fname)
        if not src.exists():
            print(f"  ! no template for agent '{name}' — skipped")
            continue
        (build / "skills" / src.name).write_text(render(src.read_text(), ctx, {}))
        written.append(src.name)

    # schedules
    sched = spec.get("schedule") or {}
    (build / "schedules.yaml").write_text(yaml.safe_dump(
        {"timezone": dig(spec, "client.owner_timezone"), **sched,
         "enabled_agents": enabled}, sort_keys=False))

    # .env.example — NAMES ONLY
    names, stack = [], spec.get("stack") or {}
    for field, mapping in STACK_SECRETS.items():
        names += mapping.get(str(stack.get(field)), [])
    names += CONTACT_SECRETS.get(str(dig(spec, "contact.primary")), [])
    names += list(dig(spec, "secrets.required") or [])
    names = sorted(set(names)) or ["ANTHROPIC_API_KEY"]
    env = ["# Secret NAMES only. Fill in on the client's own machine.",
           "# This file is a template; the real .env is never committed anywhere.", ""]
    env += [f"{n}=" for n in names]
    (build / ".env.example").write_text("\n".join(env) + "\n")

    # handover
    biz = dig(spec, "client.business_name") or slug
    owner = dig(spec, "client.owner_name") or "the owner"
    handover = [
        f"# {biz} — your AI COO", "",
        f"Installed as: **{target}**", "",
        "## What it does for you", "",
        *[f"- `{n[:-3]}`" for n in written], "",
        "## How to reach it", "",
        f"- Talk to it on: **{dig(spec, 'contact.primary')}**",
        (f"- Daily brief: **ask for it** — a Claude Project cannot wake itself, "
         f"so nothing arrives on a schedule"
         if target == "claude-only" else
         f"- Daily brief at: **{dig(spec, 'schedule.daily_brief_time')} "
         f"{dig(spec, 'client.owner_timezone')}**"),
        f"- Quiet hours: **{dig(spec, 'schedule.quiet_hours')}**", "",
        "## What it will never do without asking you", "",
        *[f"- {g['gate_description']}" for g in gates], "",
        "It drafts, shows you, and waits. No reply is not a yes.", "",
        "## Your keys", "",
        f"Your API keys live in a `.env` file on your own {('machine' if target != 'claude-only' else 'account')}.",
        f"{owner} owns them. They are never stored in the installer or sent anywhere else.", "",
        "## Turning it off", "",
        ("Remove the skills from your Claude Project." if target == "claude-only"
         else "`systemctl --user stop hermes@" + slug + "` stops it. Your data stays put."), "",
        "## Support", "",
        dig(spec, "handover.support_terms") or "One-time install.", "",
    ]
    (build / "HANDOVER.md").write_text("\n".join(handover))

    # Honesty checks: catch promises this delivery target cannot keep.
    warnings = []
    if target == "claude-only":
        if sched.get("daily_brief_time"):
            warnings.append(
                "claude-only cannot run on a schedule. The daily brief only appears "
                "when the owner asks for it. Say this before taking payment.")
        if dig(spec, "contact.primary") in {"sms", "voice", "telegram"}:
            warnings.append(
                f"contact.primary is '{dig(spec, 'contact.primary')}', but claude-only "
                "has no phone number and no messaging gateway.")
    if dig(spec, "stack.phone") in (None, "none") and dig(spec, "contact.primary") in {"sms", "voice"}:
        warnings.append("contact.primary needs a phone, but stack.phone is none.")
    off = [k for k, on in (spec.get("approval_gates") or {}).items() if not on]
    if off:
        warnings.append(f"approval gate(s) OFF: {', '.join(off)} — confirm the client asked, in writing.")

    todos = collect_todos(spec)
    print(f"\n  Built clients/{slug}/build/  ({target})")
    print(f"  Skills:  {', '.join(written) or 'none'}")
    if overridden:
        print(f"  Client overrides used: {', '.join(overridden)}")
    print(f"  Secrets the client must supply: {', '.join(names)}")
    if todos:
        print(f"\n  {len(todos)} TODO still open — answer these before deploying:")
        for i, t in enumerate(todos, 1):
            print(f"    {i:>2}. {t}")
    else:
        print("\n  No TODOs. Spec is complete.")
    if warnings:
        print("\n  WARNINGS — tell the client before they pay:")
        for w in warnings:
            print(f"    ! {w}")
    print("\n  Nothing has been deployed. Review build/, then run the matching profile.\n")
    return 1 if (todos or warnings) else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python3 scripts/generate.py <client-slug>")
    sys.exit(main(sys.argv[1]))
