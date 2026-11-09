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
import { PROVIDER_PRESETS } from "./ai/types";
import { HudOverlay } from "./hud";
import type { NavCellId } from "./hud";
import {
  ChatView,
  loadChatState,
  saveChatState,
  createConversation,
  deleteConversation,
  appendMessage,
  replaceAssistantTail,
  fileToAttachment,
  attachmentsToPromptContext,
  DEFAULT_MAX_ATTACHMENT_BYTES,
  type Conversation,
  type ChatState,
  type ChatAttachment,
} from "./chat";
import { mockStt, reduceRecording, type RecordingPhase } from "./voice";
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
import { LocalFacePanel } from "./device/LocalFacePanel";
import { typewriterToward } from "./chat/typewriter";
import { publishFaceState, FACE_LABELS } from "./device/faceBus";
import { applyOverlayMode } from "./overlay/windowChrome";
import { ZoneVisualizer } from "./overlay/ZoneVisualizer";
import { pushEdgeZoneToRust, toRuntime, clampZone } from "./overlay/edgeZone";
import type { EdgeZone } from "./settings/types";
import { DEFAULT_EDGE_ZONE } from "./settings/types";

function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [deviceState, setDeviceState] = useState(
    mockDevice.getConnectionState()
  );
  const [activeModule, setActiveModule] = useState<NavCellId | null>(null);
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
  const [zoneViz, setZoneViz] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setChat(loadChatState());
    void applyOverlayMode("expanded"); // first paint — stay visible until user dismisses
    void pushEdgeZoneToRust(
      toRuntime(
        s.hud.edgeZone ?? DEFAULT_EDGE_ZONE,
        s.hud.dwellMs,
        s.hud.dwellBrowserMs ?? 700,
        s.hud.dwellGameMs ?? 1000
      )
    );
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const fired = tickReminders(Date.now());
      if (fired.length) {
        setStatusLine(`Reminder: ${fired[0].title}`);
        if (
          fired[0].faceNudge &&
          mockDevice.getConnectionState() === "connected"
        ) {
          void mockDevice.play("drink_water").catch(() => {
            void mockDevice.play("confirmation").catch(() => undefined);
          });
        }
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

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

  function handleSave() {
    const next = {
      ...settings,
      hud: {
        ...settings.hud,
        edgeZone: clampZone(settings.hud.edgeZone ?? DEFAULT_EDGE_ZONE),
        dwellBrowserMs: settings.hud.dwellBrowserMs ?? 700,
        dwellGameMs: settings.hud.dwellGameMs ?? 1000,
      },
    };
    saveSettings(next);
    setSettings(next);
    void pushEdgeZoneToRust(
      toRuntime(
        next.hud.edgeZone,
        next.hud.dwellMs,
        next.hud.dwellBrowserMs,
        next.hud.dwellGameMs
      )
    );
    void import("@tauri-apps/api/core")
      .then(({ invoke }) =>
        invoke("set_diagnostics_enabled", {
          enabled: next.hud.diagnosticsEnabled === true,
        })
      )
      .catch(() => undefined);
    setSaved(true);
  }

  async function handleConnectMock() {
    await mockDevice.connect();
    setDeviceState(mockDevice.getConnectionState());
    const opened = await openFaceWindow();
    setStatusLine(
      opened === "failed"
        ? "Could not open face window"
        : "Mock face window open"
    );
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
      if ((!trimmed && atts.length === 0) || streaming) return;

      setActiveModule("chat");
      let conv = activeConv ?? createConversation();
      let conversations = chat.conversations;
      if (!activeConv) conversations = [conv, ...conversations];

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
        let display = "";
        const tw = typewriterToward("", (visible) => {
          display = visible;
          const updated = replaceAssistantTail(conv, visible);
          conv = updated;
          conversations = conversations.map((c) =>
            c.id === conv.id ? updated : c
          );
          persistChat({ conversations, activeId: conv.id });
        }, { cps: 56 });
        // Stay on working_loop while typing
        if (settings.hud.faceReactionsEnabled !== false) {
          publishFaceState({
            animationId: "working_loop",
            label: FACE_LABELS.working_loop ?? "Thinking",
            at: Date.now(),
            connected: true,
          });
        }
        for await (const chunk of completeStream(forApi, settings.ai)) {
          if (chunk.type === "tool_call" && chunk.toolName) {
            const args = (chunk.toolArgs ?? {}) as Record<string, unknown>;
            const result = invokeTool(chunk.toolName, args);
            toolNotes.push(`${chunk.toolName}: ${result.message}`);
            setStatusLine(result.message);
          }
          if (chunk.type === "token" && chunk.text) {
            acc += chunk.text;
            tw.sync(acc);
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
        // Finish typewriter to full text before done animation
        if (toolNotes.length) {
          acc =
            (acc ? acc + "\n\n" : "") +
            toolNotes.map((n) => `✓ ${n}`).join("\n");
        }
        tw.sync(acc);
        // Allow typewriter to catch up
        await new Promise((r) => setTimeout(r, Math.min(4000, Math.max(80, acc.length * 12))));
        tw.flush();
        tw.dispose();
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

  function renderModule() {
    if (!activeModule) return null;
    switch (activeModule) {
      case "home":
        return <HomeView deviceLabel={connectionLabel} />;
      case "chat":
        return (
          <>
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
              onDelete={(id) => {
                persistChat(deleteConversation(chat, id));
              }}
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
                  ? `Stop (${recSeconds}s)`
                  : "Voice (mock)"}
              </button>
              {statusLine && <span className="hint">{statusLine}</span>}
            </div>
          </>
        );
      case "tasks":
        return <TasksView />;
      case "reminders":
        return <RemindersView />;
      case "notes":
        return (
          <NotesView
            onAddToChat={(text) => {
              void sendUserMessage(text, []);
            }}
          />
        );
      case "focus":
        return (
          <FocusView
            onFaceLockIn={() => {
              if (mockDevice.getConnectionState() === "connected") {
                void mockDevice
                  .play("lockin")
                  .catch(() =>
                    mockDevice.play("working_loop").catch(() => undefined)
                  );
              }
            }}
          />
        );
      case "habits":
        return <HabitsView />;
      case "today":
        return <TodayView />;
      case "this_week":
        return <ThisWeekView />;
      case "settings":
        return (
          <div className="overlay-settings">
            <h2>Settings</h2>
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
                    setSettings((s) => ({
                      ...s,
                      hud: {
                        ...s.hud,
                        dwellMs: Number(e.target.value) || 500,
                      },
                    }))
                  }
                />
              </label>
              <label className="field checkbox-field">
                <span>Face reactions</span>
                <input
                  type="checkbox"
                  checked={settings.hud.faceReactionsEnabled !== false}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      hud: {
                        ...s.hud,
                        faceReactionsEnabled: e.target.checked,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Provider</span>
                <select
                  value={settings.ai.provider}
                  onChange={(e) => {
                    const provider = e.target
                      .value as AppSettings["ai"]["provider"];
                    const preset = PROVIDER_PRESETS[provider];
                    setSettings((s) => ({
                      ...s,
                      ai: {
                        ...s.ai,
                        provider,
                        baseUrl: preset?.baseUrl || s.ai.baseUrl,
                        model: preset?.model || s.ai.model,
                      },
                    }));
                    setSaved(false);
                  }}
                >
                  <option value="mock">Mock</option>
                  <option value="groq">Groq</option>
                  <option value="openclaw">OpenClaw</option>
                  <option value="hermes">Hermes</option>
                  <option value="ollama">Ollama</option>
                  <option value="openai-compatible">OpenAI-compatible</option>
                  <option value="custom">Custom endpoint</option>
                </select>
              </label>
              <label className="field">
                <span>API endpoint</span>
                <input
                  type="url"
                  value={settings.ai.baseUrl}
                  onChange={(e) => updateAi("baseUrl", e.target.value)}
                />
              </label>
              <label className="field">
                <span>API key</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={settings.ai.apiKey}
                  onChange={(e) => updateAi("apiKey", e.target.value)}
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
              <label className="field">
                <span>Device transport</span>
                <select
                  value={settings.device.transport}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      device: {
                        ...s.device,
                        transport: e.target
                          .value as AppSettings["device"]["transport"],
                      },
                    }))
                  }
                >
                  <option value="mock">Mock</option>
                  <option value="ble">BLE</option>
                  <option value="usb">USB</option>
                  <option value="wifi">Wi-Fi</option>
                </select>
              </label>
            </div>
            <h3 style={{ marginTop: 16 }}>Activation zone</h3>
            <p className="hint">
              Top-center hot zone for opening from tray. Dwell: 0.5s apps · 0.7s
              browsers · 1s games (auto-detected).
            </p>
            <div className="form-grid">
              <label className="field">
                <span>Productivity dwell (ms)</span>
                <input
                  type="number"
                  min={200}
                  max={3000}
                  step={50}
                  value={settings.hud.dwellMs}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      hud: { ...s.hud, dwellMs: Number(e.target.value) || 500 },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Browser dwell (ms)</span>
                <input
                  type="number"
                  min={200}
                  max={3000}
                  step={50}
                  value={settings.hud.dwellBrowserMs ?? 700}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      hud: {
                        ...s.hud,
                        dwellBrowserMs: Number(e.target.value) || 700,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Game dwell (ms)</span>
                <input
                  type="number"
                  min={200}
                  max={5000}
                  step={50}
                  value={settings.hud.dwellGameMs ?? 1000}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      hud: {
                        ...s.hud,
                        dwellGameMs: Number(e.target.value) || 1000,
                      },
                    }))
                  }
                />
              </label>
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setZoneViz(true)}
              >
                Visualise / move zone
              </button>
            </div>
            <div className="row-actions">
              <button type="button" className="btn primary" onClick={handleSave}>
                Save
              </button>
              <button type="button" className="btn" onClick={handleConnectMock}>
                Connect mock device
              </button>
              {saved && <span className="hint">Saved</span>}
            </div>
            {statusLine && <p className="hint">{statusLine}</p>}
          </div>
        );
      default:
        return null;
    }
  }

  const moduleInner = renderModule();
  const modulePanel = moduleInner ? (
    <div className="hud-module-card">{moduleInner}</div>
  ) : null;

  if (zoneViz) {
    return (
      <div className="overlay-root">
        <ZoneVisualizer
          zone={settings.hud.edgeZone ?? DEFAULT_EDGE_ZONE}
          onChange={(z) =>
            setSettings((s) => ({
              ...s,
              hud: { ...s.hud, edgeZone: clampZone(z) },
            }))
          }
          onDone={() => {
            const z = clampZone(settings.hud.edgeZone ?? DEFAULT_EDGE_ZONE);
            const next = {
              ...settings,
              hud: { ...settings.hud, edgeZone: z },
            };
            setSettings(next);
            saveSettings(next);
            void pushEdgeZoneToRust(
              toRuntime(
                z,
                next.hud.dwellMs,
                next.hud.dwellBrowserMs ?? 700,
                next.hud.dwellGameMs ?? 1000
              )
            );
            setZoneViz(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="overlay-root">
      <HudOverlay
        dwellMs={settings.hud.dwellMs}
        connectionLabel={connectionLabel}
        connectionOk={connectionOk}
        showHotZoneHint={false}
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
          setActiveModule(id);
          if (id === "chat" && !chat.activeId) {
            const conv = createConversation();
            persistChat({
              conversations: [conv, ...chat.conversations],
              activeId: conv.id,
            });
          }
        }}
        modulePanel={modulePanel}
        activeModuleId={activeModule}
        onCloseModule={() => setActiveModule(null)}
        localFace={
          settings.hud.localFaceEnabled !== false ? <LocalFacePanel /> : null
        }
      />
    </div>
  );
}

export default App;
