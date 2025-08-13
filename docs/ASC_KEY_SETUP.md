# App Store Connect API Key (ASC) Setup for Fastlane CI

Use this guide to generate a new App Store Connect API key, base64-encode it, and set the required GitHub Actions secrets so Fastlane can upload to TestFlight without 2FA.

These secrets are consumed by:
- Fastlane lanes in [ios/fastlane/Fastfile](../ios/fastlane/Fastfile)
- GitHub Actions workflow in [.github/workflows/ios-build.yml](../.github/workflows/ios-build.yml)

Prerequisites:
- Apple Developer Program account with access to your team and app (com.onologroup.orders)
- GitHub repository admin access for KKNMAL003/kikionolo

--------------------------------------------------------------------------------

1) Generate a NEW App Store Connect API Key (.p8)

1. Go to App Store Connect:
   - https://appstoreconnect.apple.com/
2. Navigate to:
   - Users and Access → Integrations → Keys (Team Keys tab)
3. Click the blue “+” to create a key:
   - Name: Fastlane CI (or similar)
   - Roles: App Manager (sufficient for TestFlight, builds, and metadata)
   - Scope: All apps (recommended) or the specific app if you prefer narrower access
4. Create the key and then download the .p8 file immediately:
   - You can only download it once.
5. Note:
   - Key ID: visible on the Keys list (e.g., ABCDE12345)
   - Issuer ID: visible at the top of the Keys page (UUID string)

Security tips:
- Store the .p8 in a secure vault (e.g., 1Password, Bitwarden, Keychain).
- Do not commit the .p8 to git.
- We will only commit a base64 string to GitHub Secrets (not to the repo).

--------------------------------------------------------------------------------

2) Base64-encode the .p8 (single line)

Choose the command for your OS. Replace AuthKey_ABCDE12345.p8 with your downloaded file.

macOS:
- Copy to clipboard:
  base64 -i AuthKey_ABCDE12345.p8 | tr -d '\n' | pbcopy
- Or write to a file:
  base64 -i AuthKey_ABCDE12345.p8 | tr -d '\n' > asc_key_base64.txt

Linux:
- Copy (with xclip):
  base64 AuthKey_ABCDE12345.p8 | tr -d '\n' | xclip -selection clipboard
- Or write to a file:
  base64 AuthKey_ABCDE12345.p8 | tr -d '\n' > asc_key_base64.txt

Windows (PowerShell):
- [Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_ABCDE12345.p8")) | Set-Clipboard
- Or to a file:
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_ABCDE12345.p8")) | Out-File -NoNewline asc_key_base64.txt

Validation:
- The output must be a single line with no spaces or newlines.
- If you created asc_key_base64.txt:
  cat asc_key_base64.txt  # ensure it’s a single long line

--------------------------------------------------------------------------------

3) Set GitHub Actions secrets for KKNMAL003/kikionolo

You can set via GitHub UI or gh CLI.

A) GitHub UI (simple)
- Go to your repo: https://github.com/KKNMAL003/kikionolo
- Settings → Secrets and variables → Actions → New repository secret
- Create:
  - Name: ASC_KEY_ID
    - Value: Your Key ID (e.g., 6L223HP836)
  - Name: ASC_ISSUER_ID
    - Value: Your Issuer ID (from top of Keys page)
  - Name: ASC_KEY_CONTENT
    - Value: Paste the entire base64 string (single line)

B) gh CLI (non-interactive)
Replace the placeholders with your actual values and run locally:

APP_REPO="KKNMAL003/kikionolo"
ASC_KEY_ID="YOUR_KEY_ID"
ASC_ISSUER_ID="YOUR_ISSUER_ID"
ASC_KEY_CONTENT="$(cat /path/to/asc_key_base64.txt)"  # or paste the string

gh secret set ASC_KEY_ID      -R "$APP_REPO" --body "$ASC_KEY_ID"
gh secret set ASC_ISSUER_ID   -R "$APP_REPO" --body "$ASC_ISSUER_ID"
gh secret set ASC_KEY_CONTENT -R "$APP_REPO" --body "$ASC_KEY_CONTENT"

Notes:
- We already set MATCH_GIT_URL, MATCH_GIT_BRANCH, and MATCH_KEYCHAIN_PASSWORD earlier for Fastlane Match.
- Rotate any personal access tokens shared in chat after setup is confirmed.

--------------------------------------------------------------------------------

4) Run the workflow

Once ASC_* secrets are added:
- Push to main, or
- Manually run:
  - GitHub → Actions → Build and Deploy iOS App → Run workflow

The workflow will:
- Select Xcode 15.2
- Install dependencies
- Run Fastlane release lane from [ios/fastlane/Fastfile](../ios/fastlane/Fastfile) which:
  - setup_ci + optional temporary keychain
  - match(...) to sync certs/profiles from your private cert repo
  - build_app to produce ios/build/OnoloGas.ipa
  - pilot(api_key: ...) to upload to TestFlight using ASC key

Artifacts:
- The IPA is uploaded as artifact: ios/build/OnoloGas.ipa

--------------------------------------------------------------------------------

5) Troubleshooting

- 401/Forbidden uploading to TestFlight:
  - Ensure ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_CONTENT are correct.
  - Ensure API key role is App Manager or has sufficient permissions.

- Base64 string rejected / invalid:
  - Re-encode ensuring no whitespace:
    macOS: base64 -i file.p8 | tr -d '\n'
  - Replace the ASC_KEY_CONTENT secret with the corrected single-line value.

- Keychain prompts / codesign errors on CI:
  - We create a temporary keychain using MATCH_KEYCHAIN_PASSWORD.
  - Ensure MATCH_* secrets are set (already configured).
  - On first run, Fastlane Match will generate and push certs/profiles to your private repo.

- Xcode version mismatch:
  - Update the “Select Xcode” step in [.github/workflows/ios-build.yml](../.github/workflows/ios-build.yml).

--------------------------------------------------------------------------------

6) After success

- TestFlight should show a new build for com.onologroup.orders after processing.
- If you exposed any tokens in chat or logs, rotate them immediately in GitHub.