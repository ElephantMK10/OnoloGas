#!/usr/bin/env bash
set -euo pipefail

# Fastlane Match certificates repo setup via gh CLI
# Usage:
#   bash scripts/setup_match_repo.sh [APP_REPO] [CERTS_REPO] [BRANCH]
# Defaults:
#   APP_REPO="KKNMAL003/kikionolo"
#   CERTS_REPO="KKNMAL003/kikionolo-ios-certificates"
#   BRANCH="main"

APP_REPO="${1:-KKNMAL003/kikionolo}"
CERTS_REPO="${2:-KKNMAL003/kikionolo-ios-certificates}"
BRANCH="${3:-main}"

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh CLI not installed. See: https://github.com/cli/cli#installation"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "ERROR: git not installed."; exit 1; }

echo "Ensuring private certificates repo exists: ${CERTS_REPO}"
if gh repo view "${CERTS_REPO}" >/dev/null 2>&1; then
  echo "Repo exists."
else
  echo "Creating ${CERTS_REPO} (private)..."
  gh repo create "${CERTS_REPO}" --private -y
fi

echo
read -r -s -p "Paste a GitHub token with repo WRITE access to ${CERTS_REPO}: " GH_TOKEN
echo

if [[ -z "${GH_TOKEN}" ]]; then
  echo "ERROR: No token provided."
  exit 1
fi

MATCH_GIT_URL="https://x-access-token:${GH_TOKEN}@github.com/${CERTS_REPO}.git"

echo "Testing token access to ${CERTS_REPO} (this may print nothing if repo is empty; that's OK)..."
if git ls-remote "${MATCH_GIT_URL}" >/dev/null 2>&1; then
  echo "Access check completed."
else
  echo "Note: Repo may be empty or token has limited scope. Fastlane match will push on first run."
fi

echo "Setting GitHub Actions secrets in app repo: ${APP_REPO}"
gh secret set MATCH_GIT_URL     -R "${APP_REPO}" --body "${MATCH_GIT_URL}"
gh secret set MATCH_GIT_BRANCH  -R "${APP_REPO}" --body "${BRANCH}"

# Generate a strong password for CI temporary keychain
if command -v openssl >/dev/null 2>&1; then
  MATCH_PW="$(openssl rand -base64 32 | tr -d '\n')"
else
  MATCH_PW="$(python3 - <<'PY'
import secrets, base64
print(base64.b64encode(secrets.token_bytes(32)).decode().strip())
PY
)"
fi

gh secret set MATCH_KEYCHAIN_PASSWORD -R "${APP_REPO}" --body "${MATCH_PW}"

echo
echo "Done."
echo "Added secrets on ${APP_REPO}:"
echo "  - MATCH_GIT_URL (token embedded HTTPS URL)"
echo "  - MATCH_GIT_BRANCH = ${BRANCH}"
echo "  - MATCH_KEYCHAIN_PASSWORD (randomly generated)"
echo
echo "Next:"
echo "  1) Add ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_CONTENT (base64 of your .p8) in repo secrets if not set yet."
echo "  2) Push to main or run the GitHub workflow manually to build & upload to TestFlight."