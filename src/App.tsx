import { useCallback, useEffect, useState } from "react";
import "./styles/tokens.css";
import "./App.css";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
} from "./settings";
import { mockDevice } from "./device";
import { completeStream, aiStatusLabel, aiStatusOk } from "./ai";
import { HudOverlay } from "./hud";
import type { NavCellId } from "./hud";
import {
  ChatView,
  loadChatState,
  saveChatState,
  createConversation,
  appendMessage,
  replaceAssistantTail,
  type Conversation,
  type ChatState,
} from "./chat";

type RouteId = NavCellId | "shell";

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [deviceState, setDeviceState] = useState(mockDevice.getConnectionState());
  const [showHotZoneHint, setShowHotZoneHint] = useState(true);
  const [route, setRoute] = useState<RouteId>("chat");
  const [chat, setChat] = useState<ChatState>({ conversations: [], activeId: null });
  const [streaming, setStreaming] = useState(false);
  const [statusLine, setStatusLine] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
    setChat(loadChatState());
  }, []);

  const persistChat = useCallback((next: ChatState) => {
    setChat(next);
    saveChatState(next);
  }, []);

  const activeConv =
    chat.conversations.find((c) => c.id === chat.activeId) ?? null;

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

  const ensureActiveConversation = useCallback((): Conversation => {
    if (activeConv) return activeConv;
    const conv = createConversation();
    const next: ChatState = {
      conversations: [conv, ...chat.conversations],
      activeId: conv.id,
    };
    persistChat(next);
    return conv;
  }, [activeConv, chat.conversations, persistChat]);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setRoute("chat");
      let conv = activeConv ?? createConversation();
      let conversations = chat.conversations;
      if (!activeConv) {
        conversations = [conv, ...conversations];
      }

      conv = appendMessage(conv, "user", trimmed);
      conversations = conversations.map((c) => (c.id === conv.id ? conv : c));
      if (!conversations.find((c) => c.id === conv.id)) {
        conversations = [conv, ...conversations];
      }
      persistChat({ conversations, activeId: conv.id });

      setStreaming(true);
      setStatusLine("Thinking…");
      conv = appendMessage(conv, "assistant", "");
      conversations = conversations.map((c) => (c.id === conv.id ? conv : c));
      persistChat({ conversations, activeId: conv.id });

      try {
        const history = conv.messages
          .filter((m) => m.content.length > 0 || m.role === "user")
          .map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));
        // Last assistant is empty placeholder — drop it for the request
        const forApi = history.filter(
          (m, i) => !(i === history.length - 1 && m.role === "assistant" && !m.content)
        );

        let acc = "";
        for await (const chunk of completeStream(forApi, settings.ai)) {
          if (chunk.type === "token" && chunk.text) {
            acc += chunk.text;
            const updated = replaceAssistantTail(conv, acc);
            conv = updated;
            conversations = conversations.map((c) =>
              c.id === conv.id ? updated : c
            );
            persistChat({ conversations, activeId: conv.id });
          }
          if (chunk.type === "error") {
            const errText = acc
              ? `${acc}\n\n_(${chunk.error})_`
              : `Error: ${chunk.error}`;
            const updated = replaceAssistantTail(conv, errText);
            conv = updated;
            conversations = conversations.map((c) =>
              c.id === conv.id ? updated : c
            );
            persistChat({ conversations, activeId: conv.id });
            setStatusLine(chunk.error ?? "error");
            break;
          }
        }
        setStatusLine("");
      } finally {
        setStreaming(false);
      }
    },
    [activeConv, chat.conversations, persistChat, settings.ai, streaming]
  );

  const deviceOk = deviceState === "connected";
  const aiOk = aiStatusOk(settings.ai);
  const connectionOk = deviceOk || aiOk;
  const connectionLabel = `${deviceOk ? "Device connected" : "Device offline"} · ${aiStatusLabel(settings.ai)}`;

  return (
    <div className="app-shell">
      <HudOverlay
        dwellMs={settings.hud.dwellMs}
        connectionLabel={connectionLabel}
        connectionOk={connectionOk}
        showHotZoneHint={showHotZoneHint}
        onPromptSubmit={(text) => {
          void sendUserMessage(text);
        }}
        onNavigate={(id) => {
          setRoute(id);
          if (id === "chat" && !chat.activeId) {
            const conv = createConversation();
            persistChat({
              conversations: [conv, ...chat.conversations],
              activeId: conv.id,
            });
          }
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
          {route} · Stage 4 chat
          {statusLine ? ` · ${statusLine}` : ""}
        </div>
      </header>

      <main className="app-main">
        {route === "chat" && (
          <section className="card">
            <h2>Chat</h2>
            <ChatView
              conversation={activeConv}
              streaming={streaming}
              conversations={chat.conversations}
              onNewChat={() => {
                const conv = createConversation();
                persistChat({
                  conversations: [conv, ...chat.conversations],
                  activeId: conv.id,
                });
              }}
              onSelect={(id) => persistChat({ ...chat, activeId: id })}
            />
            <p className="hint" style={{ marginTop: 12 }}>
              Tip: use the top HUD prompt — messages land in this chat.
            </p>
          </section>
        )}

        {route === "settings" && (
          <>
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
                    onChange={(e) =>
                      updateHudDwell(Number(e.target.value) || 500)
                    }
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
            </section>
            <section className="card">
              <h2>AI settings</h2>
              <p className="hint" style={{ marginBottom: 16 }}>
                Keys stay on this machine only (secure store). Never commit them.
              </p>
              <div className="form-grid">
                <label className="field">
                  <span>Provider</span>
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
              <h2>Device</h2>
              <div className="row-actions">
                <button type="button" className="btn" onClick={handleConnectMock}>
                  Connect mock device
                </button>
              </div>
            </section>
          </>
        )}

        {route !== "chat" && route !== "settings" && (
          <section className="card">
            <h2>{route.replace("_", " ")}</h2>
            <p className="hint">Placeholder module — content arrives in a later stage.</p>
          </section>
        )}

        <p className="footer-note">
          Stage 4 — chat with streaming, local history, HUD → chat handoff.
          Nav pastels cycle by cell order (not by column). Releases use{" "}
          <code>gh release create</code>.
        </p>
      </main>
    </div>
  );
}

export default App;
