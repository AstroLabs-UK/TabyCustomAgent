# Development & delivery workflow

This project is built so a **coding agent can work without your Physical Taby and without your mouse**, while **you** validate look-and-feel and hardware on your own PC.

## Target platforms

| Platform | Support |
|----------|---------|
| **Windows 10/11** | Primary for v1; produce **`.exe`** (installer or portable) |
| **Linux** | First-class for core, tests, and agent CI; ship binary when practical |
| macOS | Later stretch; do not block Windows/Linux |

Cross-platform stack preference for iteration 1:

- **Tauri 2** (Rust + web UI) **or** Electron if Tauri tooling blocks the agent — prefer Tauri for a smaller Windows `.exe`.
- Shared TypeScript/Rust logic tested on Linux and Windows.
- No OS-specific UI frameworks that cannot build on both.

The coding agent **does not** change the user’s operating system. It only targets Windows and Linux in build scripts.

## Who does what

| Task | Coding agent (Linux/cloud OK) | You (Windows or Linux PC) |
|------|-------------------------------|---------------------------|
| Implement roadmap stages | Yes | Review only |
| Unit / integration tests + device mocks | Yes | — |
| Compile Windows `.exe` in CI or via documented script | Yes when tooling allows | Run locally if CI cannot sign/build |
| Hover HUD / pastel nav **visual** check | No | **Yes** |
| Real BLE / USB to Physical Taby | No | **Yes** when you have hardware |
| Upload repo to GitHub | Prepares **zip of full git repo** | You upload |

## Iteration 1 deliverable

At the end of each **GO**-approved stage that produces runnable UI (from Stage 1 onward), and mandatorily at the end of a release slice:

1. Full **git repository** state (source, configs, tests, docs).
2. Packaged as a **single `.zip`** suitable to upload to GitHub (initialize git history if needed; include `.gitignore`; **never** include API keys).
3. Windows build path that produces an **`.exe`** (e.g. `npm run tauri build` → `src-tauri/target/release/*.exe` or NSIS installer).
4. Short `BUILD_WINDOWS.md` / `BUILD_LINUX.md` with exact commands.
5. Stage report + screenshots notes for visual GO.

### Zip contents checklist

- [ ] Application source
- [ ] `TABY_*.md` requirements / roadmap / design tokens
- [ ] Tests and mocks
- [ ] Scripts: `package-windows`, `package-linux`, `test`
- [ ] `.gitignore` (secrets, `target/`, `node_modules/`, dist artifacts optional)
- [ ] No `.env` with real keys

## Design system

Visual language follows:

- `design.md` (Hey Taby–inspired tokens, type, spacing, motion)
- Pastel **nav row colours** in `DESIGN_TOKENS.md` (5 pastels; **no yellow** — peach/orange from reference instead)

Menus, expanded 2×5 dropdown cells, and soft surfaces use these pastels. Primary actions still use accent-strong sparingly per `design.md`.

## Testing split

**Automated (agent):**

- Grid model 2×5 order and shared row colours
- Dwell timer with fake clock
- Mock AI stream
- Mock device command log
- DB CRUD
- Build scripts dry-run where possible

**Human (you):**

- “Does the HUD / pastel menu look good?”
- Dwell timing feel
- Optional real device animation

Agent asks **only** those visual questions before the next roadmap stage.

## Suggested agent loop

```
1. Read TABY_ROADMAP.md current stage
2. Implement on a branch
3. Run automated tests (Linux)
4. Attempt Windows .exe build instructions validation
5. Write STAGE_REPORT.md
6. Produce repo zip artifact path for the user
7. Ask user visual GO / CHANGES
8. On GO → update PROGRESS.md → next stage
```

## Secrets

- API keys entered only on the user’s machine in Settings / OS keychain.
- Agent may use placeholder env vars in docs (`GROQ_API_KEY=`).
- Never commit live keys into the zip.
