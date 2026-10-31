#!/usr/bin/env bash
# Profile: hermes-local — Hermes on the CLIENT'S own computer.
# Run this ON the client's machine during the remote session, after Drew has
# approved the generated build. Data never leaves their hardware.
#
# This script never creates accounts and never touches a secret value.
# The client supplies their own .env before the first start.
set -euo pipefail

SLUG="${1:-}"
[ -z "$SLUG" ] && { echo "usage: hermes-local.sh <client-slug>"; exit 1; }

BUILD="clients/${SLUG}/build"
[ -d "$BUILD" ] || { echo "No build at ${BUILD}. Run the clone-coo skill first."; exit 1; }

echo "==> 1/6 Base packages"
sudo apt-get update -y
sudo apt-get install -y curl ufw fail2ban

echo "==> 2/6 Firewall: deny inbound, allow nothing public"
# Hermes is reached over Tailscale only. No public ports, by design.
sudo ufw --force default deny incoming
sudo ufw --force default allow outgoing
sudo ufw --force enable

echo "==> 3/6 Tailscale"
curl -fsSL https://tailscale.com/install.sh | sh
echo "    Run 'sudo tailscale up' and authenticate as the CLIENT, not as Drew."

echo "==> 4/6 Hermes"
# Installs under the client's own user. Review the installer before trusting it.
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

echo "==> 5/6 Config"
install -d -m 700 "$HOME/.hermes/${SLUG}"
cp "${BUILD}/identity.md"     "$HOME/.hermes/${SLUG}/"
cp -r "${BUILD}/skills"       "$HOME/.hermes/${SLUG}/"
cp "${BUILD}/schedules.yaml"  "$HOME/.hermes/${SLUG}/"
cp "${BUILD}/.env.example"    "$HOME/.hermes/${SLUG}/.env.example"
chmod 600 "$HOME/.hermes/${SLUG}/.env.example"

cat <<'NOTE'

  STOP HERE.

  The client now fills in their own .env:

      cp ~/.hermes/<slug>/.env.example ~/.hermes/<slug>/.env
      chmod 600 ~/.hermes/<slug>/.env
      # then paste their own keys

  Drew never types or stores the client's keys.

NOTE

echo "==> 6/6 Service (starts only once .env exists)"
echo "    systemctl --user enable --now hermes@${SLUG}"
echo
echo "Smoke test before handover:"
echo "  1. one daily brief on demand"
echo "  2. one message to the owner's channel"
echo "  3. one action that must hit an approval gate — confirm it STOPS"
