# Fastlane Match Certificates Repo Setup (GitHub) + Secrets

Use this guide to create a private GitHub repository for Fastlane Match certificates and compose the MATCH_GIT_URL your CI will use. This integrates with:
- [ios/fastlane/Fastfile](../ios/fastlane/Fastfile)
- [.github/workflows/ios-build.yml](../.github/workflows/ios-build.yml)

Why a separate repo?
- Keeps certificates/profiles out of your app repo and avoids .gitignore conflicts that block pushes.
- Allows CI to read/write signing assets securely using a token.

--------------------------------------------------------------------------------

1) Create a PRIVATE GitHub repository for certificates

- GitHub → New repository
  - Name: kikionolo-ios-certificates (or any private name)
  - Visibility: Private
  - Initialize with a README (optional)

- Copy the repository URL (without credentials), e.g.:
  - https://github.com/KKNMAL003/kikionolo-ios-certificates.git

--------------------------------------------------------------------------------

2) Create a GitHub token that can WRITE to the certificates repo

You have two options. Use either ONE (recommended: Fine-grained).

Option A) Fine-grained personal access token (recommended)
- GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
- Repository access:
  - Only select repositories → choose your certificates repo
- Repository permissions:
  - Contents: Read and write
- Save the token. It will look like: github_pat_... (keep it secret)

Option B) Classic personal access token
- GitHub → Settings → Developer settings → Personal access tokens (classic) → Generate new token
- Scopes:
  - repo (gives read/write to private repos)
- Save the token. It will look like: ghp_... (keep it secret)

Security notes:
- Treat tokens like passwords. Do not commit them.
- Prefer fine-grained tokens limited to only the certs repo.

--------------------------------------------------------------------------------

3) Compose MATCH_GIT_URL

Format:
- https://x-access-token:TOKEN@github.com/OWNER/REPO.git

Examples:
- Fine-grained: https://x-access-token:github_pat_xxx@github.com/KKNMAL003/kikionolo-ios-certificates.git
- Classic:      https://x-access-token:ghp_xxx@github.com/KKNMAL003/kikionolo-ios-certificates.git

Branch:
- Use main (or the default branch you created)
- MATCH_GIT_BRANCH = main

--------------------------------------------------------------------------------

4) Add GitHub Actions secrets in your APP repository

In your app repo (this project):
- Settings → Secrets and variables → Actions → New repository secret

Add:
- MATCH_GIT_URL → the full URL containing your token (from step 3)
- MATCH_GIT_BRANCH → main
- MATCH_KEYCHAIN_PASSWORD → a strong random string (used to create/unlock the CI keychain)

Also ensure you have (or will add later for upload to TestFlight):
- APPLE_TEAM_ID → your team ID (e.g., LUHV7R927U)
- ASC_KEY_ID → App Store Connect API key ID (from the ASC “Integrations” page)
- ASC_ISSUER_ID → Issuer ID (shows on the same page)
- ASC_KEY_CONTENT → base64 of the .p8 file contents (single line). See iOS_CI_SETUP.md for encoding instructions.

Note: You already see Issuer ID and a Key ID on App Store Connect. You still need the .p8 contents (or generate a new API key if you don’t have the .p8).

--------------------------------------------------------------------------------

5) First-time repo test (optional, local)

From your local machine (optional validation):
- export MATCH_GIT_URL="https://x-access-token:TOKEN@github.com/OWNER/REPO.git"
- git ls-remote "$MATCH_GIT_URL"
  - If you see refs, access is working.

You can also let CI create/populate the repo on first run. Fastlane match will push the generated certs/profiles into that repo.

--------------------------------------------------------------------------------

6) How CI uses these secrets

The workflow step “Build and upload to TestFlight” in [.github/workflows/ios-build.yml](../.github/workflows/ios-build.yml) passes:
- MATCH_GIT_URL, MATCH_GIT_BRANCH → directs fastlane match to your certs repo/branch
- MATCH_KEYCHAIN_PASSWORD → creates/unlocks a temporary keychain on the macOS runner (prevents UI prompts)
- ASC_KEY_* → authenticates to App Store Connect using API key (avoids Apple ID 2FA)

Refer to lanes in [ios/fastlane/Fastfile](../ios/fastlane/Fastfile):
- match(...) uses api_key: app_store_connect_api_key(...) to auth
- build_app produces ios/build/OnoloGas.ipa
- pilot uploads to TestFlight

--------------------------------------------------------------------------------

7) Trigger a run

After the secrets are added:
- Push to main, or
- GitHub → Actions → Build and Deploy iOS App → Run workflow

On first run, fastlane match will:
- Create certificates and provisioning profiles
- Encrypt and push them to your certs repo on MATCH_GIT_BRANCH

--------------------------------------------------------------------------------

8) Troubleshooting

- Error: “The following paths are ignored by one of your .gitignore files: certs/…p12”
  - Cause: Certificates are being pushed to your APP repo (blocked by .gitignore).
  - Fix: Ensure MATCH_GIT_URL points to the separate certificates repo as set above.

- Error: “SecKeychainItemSetAccessWithPassword … passphrase is not correct”
  - Cause: No/mismatched MATCH_KEYCHAIN_PASSWORD.
  - Fix: Set MATCH_KEYCHAIN_PASSWORD secret. It can be any strong string; must match what fastlane uses during CI run.

- 403/404 when pushing to certs repo
  - Cause: Token lacks write permission or wrong repo URL.
  - Fix: Recreate token with repo read/write (fine-grained “Contents: Read and write” on the certs repo), verify MATCH_GIT_URL format.

- App Store Connect auth prompts
  - Cause: Missing/incorrect ASC_KEY_* secrets or invalid .p8 base64.
  - Fix: Provide ASC_KEY_ID, ASC_ISSUER_ID, and base64 of your .p8 in ASC_KEY_CONTENT.

--------------------------------------------------------------------------------

9) Optional: SSH deploy key (alternative to token)

Fastlane match also supports SSH with DEPLOY_KEY and an SSH repo URL. This requires:
- Creating a deploy key in the certs repo
- Providing the private key in CI (secret)
- Setting MATCH_GIT_URL to the SSH URL (git@github.com:OWNER/REPO.git)
For simplicity, the HTTPS token approach above is recommended.

--------------------------------------------------------------------------------

Quick checklist

- [ ] Private GitHub repo created for certs (private visibility)
- [ ] Fine-grained or classic token created with repo write access
- [ ] MATCH_GIT_URL composed with x-access-token and token
- [ ] MATCH_GIT_BRANCH added (e.g., main)
- [ ] MATCH_KEYCHAIN_PASSWORD secret set (strong random)
- [ ] APPLE_TEAM_ID secret set
- [ ] ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_CONTENT secrets set (see docs/IOS_CI_SETUP.md)

If all are set, run the workflow to build and upload to TestFlight.

Links:
- Lanes: [ios/fastlane/Fastfile](../ios/fastlane/Fastfile)
- Workflow: [.github/workflows/ios-build.yml](../.github/workflows/ios-build.yml)
- CI Setup guide (API key and base64 instructions): [docs/IOS_CI_SETUP.md](./IOS_CI_SETUP.md)