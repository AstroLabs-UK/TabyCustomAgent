import { useCallback, useEffect, useState } from "react";
import "./styles/tokens.css";
import "./App.css";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
} from "./settings";
import {
  mockDevice,
  ChatDeviceOrchestrator,
  getDevice,
  openFaceWindow,
} from "./device";
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
  fileToAttachment,
  attachmentsToPromptContext,
  DEFAULT_MAX_ATTACHMENT_BYTES,
  type Conversation,
  type ChatState,
  type ChatAttachment,
} from "./chat";
import {
  mockStt,
  reduceRecording,
  type RecordingPhase,
} from "./voice";
import {
  HomeView,
  TasksView,
  RemindersView,
  NotesView,
  FocusView,
  HabitsView,
  TodayView,
  ThisWeekView,
} from "./modules/ModuleViews";
import { tickReminders } from "./modules/reminders";
import { invokeTool, SYSTEM_TOOL_PROMPT } from "./tools/registry";

type RouteId = NavCellId | "shell";

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [deviceState, setDeviceState] = useState(
    mockDevice.getConnectionState()
  );
  const [showHotZoneHint, setShowHotZoneHint] = useState(true);
  const [route, setRoute] = useState<RouteId>("home");
  const [chat, setChat] = useState<ChatState>({
    conversations: [],
    activeId: null,
  });
  const [streaming, setStreaming] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    ChatAttachment[]
  >([]);
  const [voicePhase, setVoicePhase] = useState<RecordingPhase>("idle");
  const [recSeconds, setRecSeconds] = useState(0);

  useEffect(() => {
    setSettings(loadSettings());
    setChat(loadChatState());
  }, []);

  // Reminder ticker
  useEffect(() => {
    const id = window.setInterval(() => {
      const fired = tickReminders(Date.now());
      if (fired.length) {
        setStatusLine(`Reminder: ${fired[0].title}`);
        if (fired[0].faceNudge && mockDevice.getConnectionState() === "connected") {
          void mockDevice.play("drink_water").catch(() => {
            void mockDevice.play("confirmation").catch(() => undefined);
          });
        }
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Voice recording timer
  useEffect(() => {
    if (voicePhase !== "recording") return;
    setRecSeconds(0);
    const id = window.setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [voicePhase]);

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
    const opened = await openFaceWindow();
    if (opened === "failed") {
      setStatusLine("Could not open face window — allow popups or use Tauri");
    } else {
      setStatusLine("Mock face window open");
    }
  }

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    const next: ChatAttachment[] = [];
    for (const f of list) {
      next.push(await fileToAttachment(f, DEFAULT_MAX_ATTACHMENT_BYTES));
    }
    setPendingAttachments((prev) => [...prev, ...next]);
  }, []);

  const sendUserMessage = useCallback(
    async (text: string, attachments: ChatAttachment[] = []) => {
      const trimmed = text.trim();
      const atts = attachments.filter((a) => !a.error);
      const failed = attachments.filter((a) => a.error);
      if ((!trimmed && atts.length === 0) || streaming) return;
      if (failed.length && !atts.length && !trimmed) {
        setStatusLine(failed[0].error ?? "Attachment error");
        return;
      }

      setRoute("chat");
      let conv = activeConv ?? createConversation();
      let conversations = chat.conversations;
      if (!activeConv) {
        conversations = [conv, ...conversations];
      }

      const context = attachmentsToPromptContext(atts);
      const userContent =
        context && trimmed && trimmed !== "(attachment)"
          ? `${trimmed}\n\n${context}`
          : context || trimmed;

      conv = appendMessage(
        conv,
        "user",
        userContent,
        atts.length ? atts : undefined
      );
      setPendingAttachments([]);
      conversations = conversations.map((c) => (c.id === conv.id ? conv : c));
      if (!conversations.find((c) => c.id === conv.id)) {
        conversations = [conv, ...conversations];
      }
      persistChat({ conversations, activeId: conv.id });

      setStreaming(true);
      setStatusLine("Thinking…");
      const device = getDevice(settings.device.transport);
      const orch = new ChatDeviceOrchestrator(device);
      orch.setEnabled(settings.hud.faceReactionsEnabled !== false);
      try {
        if (
          device.getConnectionState() !== "connected" &&
          settings.device.transport === "mock"
        ) {
          await mockDevice.connect();
          setDeviceState(mockDevice.getConnectionState());
        }
      } catch {
        /* offline ok */
      }
      await orch.onUserListening();
      await orch.onAssistantBusy();
      conv = appendMessage(conv, "assistant", "");
      conversations = conversations.map((c) => (c.id === conv.id ? conv : c));
      persistChat({ conversations, activeId: conv.id });

      try {
        const history = conv.messages
          .filter((m) => m.content.length > 0 || m.role === "user")
          .map((m) => ({
            role: m.role as "user" | "assistant" | "system" | "tool",
            content: m.content,
          }));
        const forApi = [
          { role: "system" as const, content: SYSTEM_TOOL_PROMPT },
          ...history.filter(
            (m, i) =>
              !(
                i === history.length - 1 &&
                m.role === "assistant" &&
                !m.content
              )
          ),
        ];

        let acc = "";
        const toolNotes: string[] = [];
        for await (const chunk of completeStream(forApi, settings.ai)) {
          if (chunk.type === "tool_call" && chunk.toolName) {
            const args = (chunk.toolArgs ?? {}) as Record<string, unknown>;
            const result = invokeTool(chunk.toolName, args);
            toolNotes.push(`${chunk.toolName}: ${result.message}`);
            setStatusLine(result.message);
          }
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
            await orch.onTurnError(chunk.error);
            return;
          }
        }
        if (toolNotes.length) {
          const summary =
            (acc ? acc + "\n\n" : "") +
            toolNotes.map((n) => `✓ ${n}`).join("\n");
          const updated = replaceAssistantTail(conv, summary.trim());
          conv = updated;
          conversations = conversations.map((c) =>
            c.id === conv.id ? updated : c
          );
          persistChat({ conversations, activeId: conv.id });
        }
        await orch.onTurnDone();
        setStatusLine("");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await orch.onTurnError(msg);
        setStatusLine(msg);
      } finally {
        setStreaming(false);
      }
    },
    [
      activeConv,
      chat.conversations,
      persistChat,
      settings.ai,
      settings.device.transport,
      settings.hud.faceReactionsEnabled,
      streaming,
    ]
  );

  async function handleVoiceClick() {
    if (voicePhase === "idle" || voicePhase === "error") {
      setVoicePhase((p) => reduceRecording(p, { type: "start" }));
      if (mockDevice.getConnectionState() === "connected") {
        void mockDevice.play("listening_loop").catch(() => undefined);
      }
      return;
    }
    if (voicePhase === "recording") {
      setVoicePhase((p) => reduceRecording(p, { type: "stop" }));
      try {
        // Mock blob — real MediaRecorder wires in later
        const blob = new Blob(["mock-audio"], { type: "audio/webm" });
        const result = await mockStt.transcribe(blob);
        setVoicePhase((p) => reduceRecording(p, { type: "transcript_ok" }));
        await sendUserMessage(result.transcript, []);
      } catch (e) {
        setVoicePhase((p) =>
          reduceRecording(p, {
            type: "fail",
            message: e instanceof Error ? e.message : String(e),
          })
        );
      }
    }
  }

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
        pendingAttachments={pendingAttachments}
        onFilesSelected={(files) => {
          void addFiles(files);
        }}
        onRemoveAttachment={(id) =>
          setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
        }
        onPromptSubmit={(text, attachments) => {
          void sendUserMessage(text, attachments);
        }}
        onVoiceClick={() => {
          void handleVoiceClick();
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
          {route} · Stage 15
          {statusLine ? ` · ${statusLine}` : ""}
          {voicePhase === "recording" ? ` · rec ${recSeconds}s` : ""}
        </div>
      </header>

      <main className="app-main">
        {route === "home" && (
          <HomeView deviceLabel={connectionLabel} />
        )}
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
            <div
              className={`voice-bar${voicePhase === "recording" ? " is-recording" : ""}`}
            >
              <button
                type="button"
                className="btn"
                onClick={() => void handleVoiceClick()}
              >
                {voicePhase === "recording"
                  ? "Stop & send transcript"
                  : voicePhase === "processing"
                    ? "Processing…"
                    : "Voice (mock STT)"}
              </button>
              <span className="hint">
                Stage 8 — mock STT; real mic path later
              </span>
            </div>
          </section>
        )}
        {route === "tasks" && <TasksView />}
        {route === "reminders" && <RemindersView />}
        {route === "notes" && (
          <NotesView
            onAddToChat={(text) => {
              void sendUserMessage(text, []);
            }}
          />
        )}
        {route === "focus" && (
          <FocusView
            onFaceLockIn={() => {
              if (mockDevice.getConnectionState() === "connected") {
                void mockDevice.play("lockin").catch(() =>
                  mockDevice.play("working_loop").catch(() => undefined)
                );
              }
            }}
          />
        )}
        {route === "habits" && <HabitsView />}
        {route === "today" && <TodayView />}
        {route === "this_week" && <ThisWeekView />}
        {route === "feedback" && (
          <section className="card">
            <h2>Feedback</h2>
            <p className="hint">
              Placeholder — tell us what to improve. Wire to GitHub issues later.
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
                <label className="field checkbox-field">
                  <span>Face reactions on chat</span>
                  <input
                    type="checkbox"
                    checked={settings.hud.faceReactionsEnabled !== false}
                    onChange={(e) => {
                      setSettings((s) => ({
                        ...s,
                        hud: {
                          ...s.hud,
                          faceReactionsEnabled: e.target.checked,
                        },
                      }));
                      setSaved(false);
                    }}
                  />
                </label>
              </div>
            </section>
            <section className="card">
              <h2>AI settings</h2>
              <p className="hint" style={{ marginBottom: 16 }}>
                Keys stay on this machine only (secure store). Never commit
                them.
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
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleSave}
                >
                  Save settings
                </button>
                {saved && <span className="hint">Saved locally</span>}
              </div>
            </section>
            <section className="card">
              <h2>Device</h2>
              <div className="form-grid">
                <label className="field">
                  <span>Transport</span>
                  <select
                    value={settings.device.transport}
                    onChange={(e) => {
                      const transport = e.target
                        .value as AppSettings["device"]["transport"];
                      setSettings((s) => ({
                        ...s,
                        device: { ...s.device, transport },
                      }));
                      setSaved(false);
                    }}
                  >
                    <option value="mock">Mock (simulator)</option>
                    <option value="ble">BLE (hardware)</option>
                    <option value="usb">USB (stub)</option>
                    <option value="wifi">Wi-Fi (later)</option>
                  </select>
                </label>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={handleConnectMock}
                >
                  Connect mock device
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const r = invokeTool("create_task", {
                      title: "Smoke test task",
                    });
                    setStatusLine(r.message);
                  }}
                >
                  Test tool: create_task
                </button>
              </div>
              <p className="hint" style={{ marginTop: 12 }}>
                BLE/USB real I/O is PENDING_HARDWARE. Mock records
                play/text/choice for CI.
              </p>
            </section>
          </>
        )}

        <p className="footer-note">
          Stages 8–15 — voice mock, tasks, reminders, notes, today/week,
          focus, habits, home dashboard.
        </p>
      </main>
    </div>
  );
}

export default App;
