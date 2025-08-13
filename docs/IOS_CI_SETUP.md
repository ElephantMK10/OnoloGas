# iOS CI Setup: Fastlane Match + TestFlight via GitHub Actions

This guide completes the setup needed for your updated Fastlane lanes in [ios/fastlane/Fastfile](ios/fastlane/Fastfile) and your CI workflow in [.github/workflows/ios-build.yml](.github/workflows/ios-build.yml) to build and upload to TestFlight without interactive prompts.

Prerequisites:
- Apple Developer Program access to the team containing the app ID: com.onologroup.orders
- GitHub repository admin access (to create secrets)
- macOS if you want to base64-encode a .p8 key locally (instructions provided below)

Files already configured:
- Fastlane lanes: [ios/fastlane/Fastfile](../ios/fastlane/Fastfile)
- GitHub Actions workflow: [.github/workflows/ios-build.yml](../.github/workflows/ios-build.yml)

Why these steps are required
- Using App Store Connect API key avoids 2FA prompts on CI.
- Using a dedicated Match certificates repo avoids .gitignore issues and keeps secrets out of your app repo.
- Creating a temporary keychain on CI prevents code signing UI popups.

--------------------------------------------------------------------------------

1) Create a PRIVATE certificates repository (recommended)
- Create a new private repo on GitHub, for example:
  - Name: kikionolo-ios-certificates
  - Visibility: Private
- Create a GitHub token with “repo” write access:
  - GitHub > Settings > Developer settings > Personal access tokens (classic) or fine-grained token with contents:read/write on the certificates repo.
- Compose your MATCH_GIT_URL using the token:
  - Format:
    https://x-access-token:YOUR_TOKEN@github.com/OWNER/REPO.git
  - Example:
    https://x-access-token:ghp_XXXXXXXXXXXXXXXXXXXX@github.com/KKNMAL003/kikionolo-ios-certificates.git
- Decide your branch name (commonly “main”):
  - MATCH_GIT_BRANCH = main

Notes:
- The token must have write access so fastlane match can push generated certs/profiles to this repo on first run.
- Do NOT use your app repo for certificates unless you fully understand the implications.

--------------------------------------------------------------------------------

2) Create an App Store Connect API key
- Log into App Store Connect with admin or app manager rights:
  - App Store Connect > Users and Access > Keys > API Keys
- Click “Generate API Key”:
  - Enter a name
  - Roles: App Manager (or appropriate role that allows TestFlight upload and certificate/profile read)
- After creation:
  - Download the .p8 file (only once – keep it safe)
  - Copy the Key ID (e.g., ABCDE12345)
  - Copy the Issuer ID (UUID)

Base64-encode the .p8 for CI secret:
- On macOS:
  - base64 -i AuthKey_ABCDE12345.p8 | pbcopy
  - This puts the base64 string on your clipboard.
- Alternatively:
  - base64 -i AuthKey_ABCDE12345.p8 > asc_key_base64.txt
  - Open asc_key_base64.txt and copy the entire single-line string.

--------------------------------------------------------------------------------

3) Add required GitHub Actions secrets
In your app repository:
- Go to GitHub > Repo > Settings > Secrets and variables > Actions > New repository secret

Add these secrets:
- APPLE_ID
  - Your Apple ID email (the workflow and Fastlane may reference this; API key removes most interactive prompts)
- APPLE_TEAM_ID
  - Your 10-character Apple Team ID (e.g., LUHV7R927U)
- MATCH_GIT_URL
  - e.g., https://x-access-token:YOUR_TOKEN@github.com/KKNMAL003/kikionolo-ios-certificates.git
- MATCH_GIT_BRANCH
  - e.g., main
- MATCH_KEYCHAIN_PASSWORD
  - Any strong random string (used for creating/unlocking the temporary CI keychain)
- ASC_KEY_ID
  - API key’s Key ID (e.g., ABCDE12345)
- ASC_ISSUER_ID
  - API key’s Issuer ID (UUID)
- ASC_KEY_CONTENT
  - Entire base64-encoded contents of the .p8 file (single line)

Optional (if you later need them locally rather than CI):
- MATCH_KEYCHAIN_NAME
  - If you prefer a custom keychain name on local runs

--------------------------------------------------------------------------------

4) How the CI workflow uses your secrets
- The workflow step “Build and upload to TestFlight” passes the above env vars to Fastlane:
  - MATCH_GIT_URL / MATCH_GIT_BRANCH tell match where to store/fetch certs/profiles.
  - MATCH_KEYCHAIN_PASSWORD allows Fastlane to create/unlock a temporary keychain on CI.
  - ASC_KEY_* allows Fastlane to authenticate to App Store Connect without 2FA.
- The lanes in [ios/fastlane/Fastfile](../ios/fastlane/Fastfile) do:
  - setup_ci + create_keychain (if name/password provided)
  - match(... api_key: app_store_connect_api_key(...)) to sync certs/profiles
  - build_app to produce OnoloGas.ipa
  - pilot(api_key: ...) to upload to TestFlight

--------------------------------------------------------------------------------

5) Trigger a run
Two options:
- Push to “main” branch
- Manually run the workflow:
  - GitHub > Actions > Build and Deploy iOS App > Run workflow

Artifacts and upload:
- The built IPA path is ios/build/OnoloGas.ipa and is uploaded as an artifact.
- TestFlight upload occurs via pilot in the “release” lane.

--------------------------------------------------------------------------------

6) Troubleshooting
- Error: “The following paths are ignored by one of your .gitignore files: certs/...p12”
  - Cause: Match is pushing into your app repo and your .gitignore blocks it.
  - Fix: Ensure MATCH_GIT_URL is set to a dedicated private certificates repo as described above.
- Error: “SecKeychainItemSetAccessWithPassword: The user name or passphrase you entered is not correct.”
  - Cause: No keychain password set or mismatch.
  - Fix: Ensure MATCH_KEYCHAIN_PASSWORD is set in GitHub Actions secrets. On local runs, export MATCH_KEYCHAIN_PASSWORD in your shell if needed.
- App Store Connect authentication prompts
  - Ensure ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_CONTENT are set correctly.
  - ASC_KEY_CONTENT must be a single line with no extra whitespace; re-encode if needed.
- Xcode version mismatch
  - The workflow pins Xcode 15.2. If your project requires a different version, change the “Select Xcode” step.

--------------------------------------------------------------------------------

7) Local validation (optional)
If you want to run Fastlane locally (not required for CI):
- Export environment variables in your shell:
  export MATCH_GIT_URL="https://x-access-token:YOUR_TOKEN@github.com/OWNER/REPO.git"
  export MATCH_GIT_BRANCH="main"
  export MATCH_KEYCHAIN_PASSWORD="your-strong-password"
  export ASC_KEY_ID="ABCDE12345"
  export ASC_ISSUER_ID="YOUR-ISSUER-UUID"
  export ASC_KEY_CONTENT="YOUR_BASE64_P8_STRING"
  export APPLE_TEAM_ID="LUHV7R927U"

- Then:
  cd ios
  bundle exec fastlane ios release
  or
  fastlane ios release

Note: You may need Ruby and Fastlane installed locally. CI already handles this automatically.

--------------------------------------------------------------------------------

Verification checklist
- [ ] Created a private certificates repo (recommended)
- [ ] Created a GitHub token with repo write access
- [ ] Added MATCH_GIT_URL (using the token URL) and MATCH_GIT_BRANCH secrets
- [ ] Added MATCH_KEYCHAIN_PASSWORD secret (strong random string)
- [ ] Generated App Store Connect API key and downloaded the .p8
- [ ] Base64-encoded the .p8 and added ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_CONTENT secrets
- [ ] Confirmed APPLE_ID and APPLE_TEAM_ID secrets are set
- [ ] Triggered the GitHub Actions workflow (push to main or workflow_dispatch)