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
import { HudOverlay } from "./hud";

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [deviceState, setDeviceState] = useState(mockDevice.getConnectionState());
  const [mockReply, setMockReply] = useState("");
  const [showHotZoneHint, setShowHotZoneHint] = useState(true);

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

  function updateAlwaysOnTop(v: boolean) {
    setSettings((s) => ({ ...s, hud: { ...s.hud, alwaysOnTop: v } }));
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
      [{ role: "user", content: "Hello from Stage 1 HUD" }],
      settings.ai
    )) {
      if (chunk.type === "token" && chunk.text) {
        acc += chunk.text;
        setMockReply(acc);
      }
    }
  }

  const connectionOk = deviceState === "connected";
  const connectionLabel = connectionOk
    ? "Mock device connected"
    : "Device offline (mock)";

  return (
    <div className="app-shell">
      <HudOverlay
        dwellMs={settings.hud.dwellMs}
        connectionLabel={connectionLabel}
        connectionOk={connectionOk}
        showHotZoneHint={showHotZoneHint}
        onPromptSubmit={(text) => {
          void (async () => {
            setMockReply("");
            let acc = "";
            for await (const chunk of mockAi.completeStream(
              [{ role: "user", content: text }],
              settings.ai
            )) {
              if (chunk.type === "token" && chunk.text) {
                acc += chunk.text;
                setMockReply(acc);
              }
            }
          })();
        }}
      />

      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            T
          </div>
          <span>Custom Taby Agent</span>
        </div>
        <div className="status-pill">
          Device: {deviceState} · Stage 1 HUD
        </div>
      </header>

      <main className="app-main">
        <section className="hero">
          <h1>Top-center HUD</h1>
          <p>
            Hover the top-center edge for{" "}
            <strong>{settings.hud.dwellMs} ms</strong> to open the compact
            prompt. Press <kbd>Esc</kbd> or click outside to dismiss. Nav grid
            arrives in Stage 2.
          </p>
        </section>

        <section className="card">
          <h2>HUD settings</h2>
          <div className="form-grid">
            <label className="field">
              <span>Dwell (ms)</span>
              <input
                type="number"
                min={100}
                max={3000}
                step={50}
                value={settings.hud.dwellMs}
                onChange={(e) => updateHudDwell(Number(e.target.value) || 500)}
              />
            </label>
            <label className="field checkbox-field">
              <span>Always on top (flag)</span>
              <input
                type="checkbox"
                checked={settings.hud.alwaysOnTop}
                onChange={(e) => updateAlwaysOnTop(e.target.checked)}
              />
            </label>
            <label className="field checkbox-field">
              <span>Show hot-zone hint</span>
              <input
                type="checkbox"
                checked={showHotZoneHint}
                onChange={(e) => setShowHotZoneHint(e.target.checked)}
              />
            </label>
          </div>
          <div className="row-actions">
            <button type="button" className="btn primary" onClick={handleSave}>
              Save settings
            </button>
            {saved && <span className="hint">Saved locally</span>}
          </div>
        </section>

        <section className="card">
          <h2>AI settings</h2>
          <p className="hint" style={{ marginBottom: 16 }}>
            Keys stay on this machine only. Never commit them to git.
          </p>
          <div className="form-grid">
            <label className="field">
              <span>Provider</span>
              <select
                value={settings.ai.provider}
                onChange={(e) =>
                  updateAi("provider", e.target.value as AppSettings["ai"]["provider"])
                }
              >
                <option value="mock">Mock (offline)</option>
                <option value="groq">Groq</option>
                <option value="openai_compatible">OpenAI-compatible</option>
              </select>
            </label>
            <label className="field">
              <span>API endpoint (base URL)</span>
              <input
                type="url"
                value={settings.ai.baseUrl}
                onChange={(e) => updateAi("baseUrl", e.target.value)}
                placeholder="https://api.groq.com/openai/v1"
              />
            </label>
            <label className="field">
              <span>API key</span>
              <input
                type="password"
                autoComplete="off"
                value={settings.ai.apiKey}
                onChange={(e) => updateAi("apiKey", e.target.value)}
                placeholder="Stored locally only"
              />
            </label>
            <label className="field">
              <span>Model</span>
              <input
                type="text"
                value={settings.ai.model}
                onChange={(e) => updateAi("model", e.target.value)}
              />
            </label>
          </div>
          <div className="row-actions">
            <button type="button" className="btn primary" onClick={handleSave}>
              Save settings
            </button>
            {saved && <span className="hint">Saved locally</span>}
          </div>
        </section>

        <section className="card">
          <h2>Mocks</h2>
          <div className="row-actions">
            <button type="button" className="btn" onClick={handleConnectMock}>
              Connect mock device
            </button>
            <button type="button" className="btn" onClick={handleTestMockAi}>
              Test mock AI
            </button>
          </div>
          {mockReply && (
            <p className="hint" style={{ marginTop: 12 }}>
              {mockReply}
            </p>
          )}
        </section>

        <p className="footer-note">
          Stage 1 — top HUD only. Physical Taby / real mouse HUD validation is
          on your machine. CI builds the Windows installer on push to main.
        </p>
      </main>
    </div>
  );
}

export default App;
