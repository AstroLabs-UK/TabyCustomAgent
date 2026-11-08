# Stage 3 report — Settings + AI key path

## Automated results
- suite: **PASS** (stages 0–3 unit runners)
- notes:
  - Live config validation: empty key/url rejected in non-mock mode
  - Mock stream still returns fixed token chunks + done
  - API key stored in dedicated secure blob; public settings JSON strips key
  - `assertNoKeyInText` guards against accidental key logging
  - `completeStream` routes mock vs Groq/OpenAI-compatible HTTP SSE client

## CI — Releases page (not Tags-only)
- Publish step uses **`gh release create`** (GitHub CLI)
- Explicit `--target $GITHUB_SHA`, notes file, asset upload
- Verifies with `gh release view` JSON after create
- Deletes prior same-tag release before republish
- Why Tags-only happened: creating a git tag without a successful **Release** API
  object leaves entries on **Tags**; `gh release create` always creates a Release

## Deliverables checklist (Stage 3)

| Item | Status |
|------|--------|
| Settings form: key, model, base URL, dwell, transport | Done (existing + secure key) |
| Secure storage for API key | Done (`secureStore` localStorage façade) |
| AI client: mock + live Groq/OpenAI-compatible | Done |
| Connection status string in HUD | Done (device + AI label) |
| Tests: key not logged, mock stream, live validation | Done |

## Human review
- Settings page readability only

Reply **GO** or list **CHANGES**.
