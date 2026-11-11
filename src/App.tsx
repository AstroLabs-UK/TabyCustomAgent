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
  usbDevice,
  bleDevice,
  wifiDevice,
} from "./device";
import { completeStream, aiStatusLabel, aiStatusOk } from "./ai";
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
import {
  resolveFaceAnimationForReminder,
  tickAllReminders,
} from "./modules/reminders";
import { invokeToolAsync, SYSTEM_TOOL_PROMPT } from "./tools/registry";
import { LocalFacePanel } from "./device/LocalFacePanel";
import { typewriterToward } from "./chat/typewriter";
import { publishFaceState, FACE_LABELS } from "./device/faceBus";
import { applyOverlayMode, fitOverlayToContent } from "./overlay/windowChrome";
import { OnboardingWizard } from "./onboarding/OnboardingWizard";
import { SettingsPanel } from "./settings/SettingsPanel";
import { ZoneVisualizer } from "./overlay/ZoneVisualizer";
import {
  clampZone,
  pushEdgeZoneToRust,
  toRuntime,
} from "./overlay/edgeZone";
import { DEFAULT_EDGE_ZONE } from "./settings/types";
import { PROVIDER_PRESETS } from "./ai/types";

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
  const [provisionStatus, setProvisionStatus] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    ChatAttachment[]
  >([]);
  const [voicePhase, setVoicePhase] = useState<RecordingPhase>("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [zoneViz, setZoneViz] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setChat(loadChatState());
    void applyOverlayMode("compact"); // first paint shows HUD-sized window
  }, []);

  // Push hover activation area to the native edge watcher (when window is hidden).
  useEffect(() => {
    const area = settings.hud.hoverActivationArea ?? "center";
    void (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_hover_activation_area", { area });
      } catch {
        // Browser / non-Tauri: no-op
      }
    })();
  }, [settings.hud.hoverActivationArea]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const fired = tickAllReminders(Date.now());
      if (fired.length) {
        setStatusLine(`Reminder: ${fired[0].title}`);
        if (mockDevice.getConnectionState() === "connected") {
          const anim =
            resolveFaceAnimationForReminder(fired[0]) ?? "confirmation";
          void mockDevice.play(anim).catch(() => {
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
    saveSettings(settings);
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

  async function handleProvisionUsb() {
    setProvisionStatus("Detecting USB…");
    const wifiSsid = (settings.device.wifiSsid ?? "").trim();
    const result = await usbDevice.provision(
      wifiSsid ? { ssid: wifiSsid, password: "" } : undefined,
      {
        onPhase: (phase, detail) => {
          setProvisionStatus(
            detail ? `${phase}: ${detail}` : String(phase)
          );
        },
      }
    );
    if (result.ok && result.identity) {
      setSettings((s) => ({
        ...s,
        device: {
          ...s.device,
          transport: "ble",
          preferredId: result.identity!.bleMac,
          serial: result.identity!.serial,
          wifiSsid: wifiSsid || s.device.wifiSsid,
        },
        hasPhysicalTaby: true,
      }));
      setDeviceState("connected");
      setProvisionStatus(result.message);
      setStatusLine(result.message);
      setSaved(false);
    } else {
      setProvisionStatus(result.message);
      setStatusLine(result.message);
    }
  }

  async function handleConnectTransport() {
    const t = settings.device.transport;
    try {
      if (t === "ble") {
        await bleDevice.connect(settings.device.preferredId || undefined);
        setDeviceState(bleDevice.getConnectionState());
        setStatusLine(
          `BLE connected${settings.device.preferredId ? ` · ${settings.device.preferredId}` : ""}`
        );
      } else if (t === "wifi") {
        const addr = settings.device.wifiAddress || settings.device.preferredId;
        wifiDevice.configure({ baseUrl: addr?.startsWith("http") ? addr : `http://${addr || "127.0.0.1"}` });
        await wifiDevice.connect(addr);
        setDeviceState(wifiDevice.getConnectionState());
        setStatusLine(`Wi‑Fi connected · ${addr}`);
      } else if (t === "usb") {
        await usbDevice.connect();
        setDeviceState(usbDevice.getConnectionState());
        setStatusLine("USB connected");
      } else {
        await handleConnectMock();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatusLine(msg);
      setDeviceState("error");
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
        // Build initial API message list (skip the empty assistant placeholder)
        type ApiMsg = {
          role: "system" | "user" | "assistant" | "tool";
          content: string;
          name?: string;
          tool_call_id?: string;
          tool_calls?: Array<{
            id: string;
            type: "function";
            function: { name: string; arguments: string };
          }>;
        };
        const history: ApiMsg[] = conv.messages
          .filter(
            (m) =>
              m.role === "user" ||
              (m.role === "assistant" && m.content.length > 0)
          )
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
        let apiMessages: ApiMsg[] = [
          { role: "system", content: SYSTEM_TOOL_PROMPT },
          ...history,
        ];

        let acc = "";
        let playedForcedReaction = false;
        const MAX_TOOL_STEPS = 6;
        const activityLines: string[] = [];

        const pushActivity = (line: string) => {
          activityLines.push(line);
          // Show a Grok/ChatGPT-style thinking strip
          setStatusLine(activityLines.slice(-3).join(" · "));
        };

        if (settings.hud.faceReactionsEnabled !== false) {
          publishFaceState({
            animationId: "working_loop",
            label: FACE_LABELS.working_loop ?? "Thinking",
            at: Date.now(),
            connected: true,
          });
        }

        pushActivity("Thinking…");

        for (let step = 0; step < MAX_TOOL_STEPS; step++) {
          let stepText = "";
          const pendingTools: Array<{
            id: string;
            name: string;
            args: Record<string, unknown>;
          }> = [];

          for await (const chunk of completeStream(apiMessages, settings.ai)) {
            if (chunk.type === "tool_call" && chunk.toolName) {
              pendingTools.push({
                id:
                  chunk.toolCallId ||
                  `call_${chunk.toolName}_${Date.now()}_${pendingTools.length}`,
                name: chunk.toolName,
                args: (chunk.toolArgs ?? {}) as Record<string, unknown>,
              });
            }
            if (chunk.type === "token" && chunk.text) {
              stepText += chunk.text;
              acc = stepText;
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

          // No tools → final answer already streamed
          if (pendingTools.length === 0) {
            break;
          }

          // Append assistant message that requested the tools
          const toolCallsPayload = pendingTools.map((t) => ({
            id: t.id,
            type: "function" as const,
            function: {
              name: t.name,
              arguments: JSON.stringify(t.args ?? {}),
            },
          }));
          apiMessages.push({
            role: "assistant",
            content: stepText || "",
            tool_calls: toolCallsPayload,
          });

          // Run each tool and feed results back
          for (const t of pendingTools) {
            pushActivity(`Running ${t.name}…`);
            const result = await invokeToolAsync(t.name, t.args);
            const resultPayload = JSON.stringify({
              ok: result.ok,
              message: result.message,
              data: result.data ?? null,
            });
            apiMessages.push({
              role: "tool",
              content: resultPayload,
              tool_call_id: t.id,
              name: t.name,
            });

            if (
              t.name === "play_reaction" ||
              t.name === "list_reactions"
            ) {
              playedForcedReaction = true;
            } else {
              pushActivity(
                result.ok
                  ? `✓ ${t.name}: ${result.message}`
                  : `✗ ${t.name}: ${result.message}`
              );
            }
          }

          // Reset accumulator for the next model turn (the written reply)
          acc = "";
          stepText = "";
          const cleared = replaceAssistantTail(conv, "");
          conv = cleared;
          conversations = conversations.map((c) =>
            c.id === conv.id ? cleared : c
          );
          persistChat({ conversations, activeId: conv.id });
          pushActivity("Writing reply…");
        }

        // Ensure final text is persisted
        if (acc) {
          const updated = replaceAssistantTail(conv, acc);
          conv = updated;
          conversations = conversations.map((c) =>
            c.id === conv.id ? updated : c
          );
          persistChat({ conversations, activeId: conv.id });
        }

        if (!playedForcedReaction) {
          await orch.onTurnDone();
        }
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
  /** On-screen face hides only for a real Physical Taby, not the mock. */
  const physicalDeviceConnected =
    deviceOk && settings.device.transport !== "mock";
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
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            saved={saved}
            onSave={handleSave}
            onConnectMock={() => void handleConnectMock()}
            onVisualizeZone={() => setZoneViz(true)}
            onReplayOnboarding={() => setForceOnboarding(true)}
            onProvisionUsb={() => void handleProvisionUsb()}
            provisionStatus={provisionStatus}
            onConnectTransport={() => void handleConnectTransport()}
          />
        );
      default:
        return null;
    }
  }

  const moduleInner = renderModule();
  const modulePanel = moduleInner ? (
    <div className="hud-module-card">{moduleInner}</div>
  ) : null;

  const showOnboarding =
    forceOnboarding || settings.onboardingCompleted === false;

  // Onboarding / zone viz need a real visible window, not tray
  useEffect(() => {
    if (showOnboarding || zoneViz) {
      void applyOverlayMode("compact");
      // Fit after paint
      const id = window.setTimeout(() => {
        const root = document.querySelector(".overlay-root") as HTMLElement | null;
        if (root) {
          const r = root.getBoundingClientRect();
          void fitOverlayToContent(r.height, Math.max(r.width, 400));
        }
      }, 50);
      return () => clearTimeout(id);
    }
  }, [showOnboarding, zoneViz]);

  if (showOnboarding && !zoneViz) {
    return (
      <div className="overlay-root tc-shell">
        <OnboardingWizard
          settings={settings}
          setSettings={setSettings}
          onFinish={(next) => {
            saveSettings(next);
            setSettings(next);
            setForceOnboarding(false);
          }}
        />
      </div>
    );
  }

  if (zoneViz) {
    return (
      <div className="overlay-root">
        <ZoneVisualizer
          zone={settings.hud.edgeZone ?? DEFAULT_EDGE_ZONE}
          dwellMs={settings.hud.dwellMs}
          dwellBrowserMs={settings.hud.dwellBrowserMs ?? 700}
          dwellGameMs={settings.hud.dwellGameMs ?? 1000}
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
    <div className="overlay-root tc-shell">
      <HudOverlay
        dwellMs={settings.hud.dwellMs}
        leaveHideMs={settings.hud.leaveHideMs ?? 3000}
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
          settings.hud.localFaceEnabled !== false &&
          !(deviceState === "connected" && settings.device.transport !== "mock") ? (
            <LocalFacePanel />
          ) : null
        }
      />
    </div>
  );
}

export default App;
