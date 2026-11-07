import { useEffect, useState } from "react";
import "./styles/tokens.css";
import "./App.css";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
} from "./settings";
import { mockDevice } from "./device";
import { mockAi } from "./ai";

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [deviceState, setDeviceState] = useState(mockDevice.getConnectionState());
  const [mockReply, setMockReply] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function updateAi<K extends keyof AppSettings["ai"]>(
    key: K,
    value: AppSettings["ai"][K]
  ) {
    setSettings((s) => ({ ...s, ai: { ...s.ai, [key]: value } }));
    setSaved(false);
  }

  function updateHudDwell(ms: number) {
    setSettings((s) => ({ ...s, hud: { ...s.hud, dwellMs: ms } }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
  }

  async function handleConnectMock() {
    await mockDevice.connect();
    setDeviceState(mockDevice.getConnectionState());
  }

  async function handleTestMockAi() {
    setMockReply("");
    let acc = "";
    for await (const chunk of mockAi.completeStream(
      [{ role: "user", content: "Hello from Stage 0 shell" }],
      settings.ai
    )) {
      if (chunk.type === "token" && chunk.text) {
        acc += chunk.text;
        setMockReply(acc);
      }
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            T
          </div>
          <span>Custom Taby Agent</span>
        </div>
        <div className="status-pill">
          Device: {deviceState} · Stage 0 shell
        </div>
      </header>

      <main className="app-main">
        <section className="hero">
          <h1>Local-first desktop agent</h1>
          <p>
            Stage 0 skeleton: settings for your AI key & endpoint, mock device,
            mock AI, and a placeholder for the top-center HUD (Stage 1).
            Close the official Taby app before pairing real hardware later.
          </p>
        </section>

        <section className="card">
          <h2>AI settings</h2>
          <p className="hint" style={{ marginBottom: 16 }}>
            Keys stay on this machine only. Never commit them to git.
          </p>
          <div className="form-grid">
            <label>
              Provider
              <select
                value={settings.ai.provider}
                onChange={(e) =>
                  updateAi(
                    "provider",
                    e.target.value as AppSettings["ai"]["provider"]
                  )
                }
              >
                <option value="mock">Mock (offline)</option>
                <option value="groq">Groq</option>
                <option value="openai-compatible">OpenAI-compatible</option>
              </select>
            </label>
            <label>
              API endpoint (base URL)
              <input
                type="url"
                value={settings.ai.baseUrl}
                onChange={(e) => updateAi("baseUrl", e.target.value)}
                placeholder="https://api.groq.com/openai/v1"
              />
              <span className="hint">
                Groq default: https://api.groq.com/openai/v1
              </span>
            </label>
            <label>
              API key
              <input
                type="password"
                value={settings.ai.apiKey}
                onChange={(e) => updateAi("apiKey", e.target.value)}
                placeholder="gsk_… (stored locally)"
                autoComplete="off"
              />
            </label>
            <label>
              Model
              <input
                type="text"
                value={settings.ai.model}
                onChange={(e) => updateAi("model", e.target.value)}
                placeholder="llama-3.3-70b-versatile"
              />
            </label>
            <label>
              HUD dwell time (ms)
              <input
                type="number"
                min={200}
                max={2000}
                step={50}
                value={settings.hud.dwellMs}
                onChange={(e) => updateHudDwell(Number(e.target.value) || 500)}
              />
              <span className="hint">Default 500 — used from Stage 1</span>
            </label>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save settings
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestMockAi}
            >
              Test mock AI
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleConnectMock}
            >
              Connect mock device
            </button>
          </div>
          {saved && <div className="toast">Settings saved locally.</div>}
          {mockReply && (
            <div className="toast" style={{ marginTop: 12 }}>
              {mockReply}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Overlay host (placeholder)</h2>
          <div className="overlay-placeholder">
            Top-center hover HUD will appear here in Stage 1.
            <br />
            Compact prompt · four-box nav · pastel 2×5 grid later.
          </div>
        </section>

        <p className="footer-note">
          Visual language follows design.md and DESIGN_TOKENS.md. This main
          window is a development shell; the product UX is the always-available
          overlay. Windows .exe build path: see BUILD_WINDOWS.md.
        </p>
      </main>
    </div>
  );
}

export default App;
