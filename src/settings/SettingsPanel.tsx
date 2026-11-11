import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { AppSettings } from "./types";
import { PROVIDER_PRESETS, type AiProviderId } from "../ai/types";
import type { DeviceTransport } from "../device/types";

export type SettingsPanelProps = {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  saved: boolean;
  onSave: () => void;
  onConnectMock: () => void;
  onVisualizeZone: () => void;
  onReplayOnboarding: () => void;
  /** USB wiped-device provision (sim or hardware) */
  onProvisionUsb?: () => void;
  provisionStatus?: string;
  onConnectTransport?: () => void;
};

type SectionId = "ai" | "face" | "activation" | "device" | "advanced";

const SECTIONS: {
  id: SectionId;
  title: string;
  blurb: string;
  keywords: string;
}[] = [
  {
    id: "ai",
    title: "AI brain",
    blurb: "Provider, model, and API key",
    keywords: "ai provider groq openclaw hermes ollama openai key model endpoint url",
  },
  {
    id: "face",
    title: "Taby face",
    blurb: "On-screen face and reactions",
    keywords: "face gif physical reactions local on-screen animation",
  },
  {
    id: "activation",
    title: "Open from top edge",
    blurb: "Where and how long to hover",
    keywords: "dwell zone edge activation hover browser game productivity visualise",
  },
  {
    id: "device",
    title: "Device",
    blurb: "Mock or Physical Taby transport",
    keywords: "device ble usb wifi mock connect hardware",
  },
  {
    id: "advanced",
    title: "Advanced",
    blurb: "Diagnostics and setup again",
    keywords: "diagnostics logs onboarding setup tutorial help advanced",
  },
];

export function SettingsPanel({
  settings,
  setSettings,
  saved,
  onSave,
  onConnectMock,
  onVisualizeZone,
  onReplayOnboarding,
  onProvisionUsb,
  provisionStatus,
  onConnectTransport,
}: SettingsPanelProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<SectionId | null>("ai");

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!q) return SECTIONS;
    return SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.blurb.toLowerCase().includes(q) ||
        s.keywords.includes(q)
    );
  }, [q]);

  function patchHud(partial: Partial<AppSettings["hud"]>) {
    setSettings((s) => ({ ...s, hud: { ...s.hud, ...partial } }));
  }
  function patchAi(partial: Partial<AppSettings["ai"]>) {
    setSettings((s) => ({ ...s, ai: { ...s.ai, ...partial } }));
  }
  function patchDevice(partial: Partial<AppSettings["device"]>) {
    setSettings((s) => ({ ...s, device: { ...s.device, ...partial } }));
  }

  function pickProvider(provider: AiProviderId) {
    const preset = PROVIDER_PRESETS[provider];
    patchAi({
      provider,
      baseUrl: preset?.baseUrl || settings.ai.baseUrl,
      model: preset?.model || settings.ai.model,
    });
  }

  return (
    <div className="tc-settings" data-testid="settings-panel">
      <header className="tc-settings__head">
        <h2 className="tc-settings__title">Settings</h2>
        <p className="tc-settings__sub">Search, open a section, save when done.</p>
        <label className="tc-settings__search">
          <span className="tc-settings__search-icon" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search settings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </header>

      <div className="tc-settings__sections">
        {visible.map((sec) => {
          const isOpen = open === sec.id || (q.length > 0 && visible.length <= 2);
          return (
            <section
              key={sec.id}
              className={`tc-settings__sec${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="tc-settings__sec-btn"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen && !q ? null : sec.id)}
              >
                <span>
                  <span className="tc-settings__sec-title">{sec.title}</span>
                  <span className="tc-settings__sec-blurb">{sec.blurb}</span>
                </span>
                <span className="tc-settings__chev" aria-hidden>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              {isOpen && (
                <div className="tc-settings__body">
                  {sec.id === "ai" && (
                    <>
                      <label className="tc-settings__field">
                        <span>Provider</span>
                        <select
                          value={settings.ai.provider}
                          onChange={(e) =>
                            pickProvider(e.target.value as AiProviderId)
                          }
                        >
                          {(Object.keys(PROVIDER_PRESETS) as AiProviderId[]).map(
                            (id) => (
                              <option key={id} value={id}>
                                {PROVIDER_PRESETS[id].label}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                      {PROVIDER_PRESETS[settings.ai.provider]?.needsKey && (
                        <label className="tc-settings__field">
                          <span>API key</span>
                          <input
                            type="password"
                            autoComplete="off"
                            placeholder="Stored only on this device"
                            value={settings.ai.apiKey}
                            onChange={(e) => patchAi({ apiKey: e.target.value })}
                          />
                        </label>
                      )}
                      <label className="tc-settings__field">
                        <span>Endpoint</span>
                        <input
                          type="url"
                          value={settings.ai.baseUrl}
                          onChange={(e) => patchAi({ baseUrl: e.target.value })}
                        />
                      </label>
                      <label className="tc-settings__field">
                        <span>Model</span>
                        <input
                          type="text"
                          value={settings.ai.model}
                          onChange={(e) => patchAi({ model: e.target.value })}
                        />
                      </label>
                    </>
                  )}

                  {sec.id === "face" && (
                    <>
                      <label className="tc-settings__check">
                        <input
                          type="checkbox"
                          checked={settings.hud.localFaceEnabled !== false}
                          onChange={(e) =>
                            patchHud({ localFaceEnabled: e.target.checked })
                          }
                        />
                        <span>Show Taby on screen (no Physical Taby needed)</span>
                      </label>
                      <label className="tc-settings__check">
                        <input
                          type="checkbox"
                          checked={settings.hud.faceReactionsEnabled !== false}
                          onChange={(e) =>
                            patchHud({ faceReactionsEnabled: e.target.checked })
                          }
                        />
                        <span>Face reacts while chatting</span>
                      </label>
                      <p className="tc-settings__hint">
                        On-screen face hides automatically when a Physical Taby is
                        connected.
                      </p>
                    </>
                  )}

                  {sec.id === "activation" && (
                    <>
                      <div className="tc-settings__row3">
                        <label className="tc-settings__field">
                          <span>Apps (ms)</span>
                          <input
                            type="number"
                            min={200}
                            max={3000}
                            step={50}
                            value={settings.hud.dwellMs}
                            onChange={(e) =>
                              patchHud({ dwellMs: Number(e.target.value) || 500 })
                            }
                          />
                        </label>
                        <label className="tc-settings__field">
                          <span>Browsers</span>
                          <input
                            type="number"
                            min={200}
                            max={3000}
                            step={50}
                            value={settings.hud.dwellBrowserMs ?? 700}
                            onChange={(e) =>
                              patchHud({
                                dwellBrowserMs: Number(e.target.value) || 700,
                              })
                            }
                          />
                        </label>
                        <label className="tc-settings__field">
                          <span>Games</span>
                          <input
                            type="number"
                            min={200}
                            max={5000}
                            step={50}
                            value={settings.hud.dwellGameMs ?? 1000}
                            onChange={(e) =>
                              patchHud({
                                dwellGameMs: Number(e.target.value) || 1000,
                              })
                            }
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="tc-settings__btn"
                        onClick={onVisualizeZone}
                      >
                        Visualise / move activation zone
                      </button>
                    </>
                  )}

                  {sec.id === "device" && (
                    <>
                      <label className="tc-settings__field">
                        <span>Transport</span>
                        <select
                          value={settings.device.transport}
                          onChange={(e) =>
                            patchDevice({
                              transport: e.target.value as DeviceTransport,
                            })
                          }
                        >
                          <option value="mock">Mock (software)</option>
                          <option value="ble">BLE (day-to-day)</option>
                          <option value="usb">USB (setup / recovery)</option>
                          <option value="wifi">Wi‑Fi</option>
                        </select>
                      </label>
                      {settings.device.transport === "mock" && (
                        <button
                          type="button"
                          className="tc-settings__btn"
                          onClick={onConnectMock}
                        >
                          Connect mock device
                        </button>
                      )}
                      {settings.device.transport === "ble" && (
                        <label className="tc-settings__field">
                          <span>BLE MAC / id</span>
                          <input
                            type="text"
                            placeholder="AA:BB:CC:DD:EE:FF"
                            value={settings.device.preferredId}
                            onChange={(e) =>
                              patchDevice({ preferredId: e.target.value })
                            }
                          />
                        </label>
                      )}
                      {settings.device.transport === "wifi" && (
                        <label className="tc-settings__field">
                          <span>Device IP or URL</span>
                          <input
                            type="text"
                            placeholder="192.168.1.50 or http://…"
                            value={settings.device.wifiAddress ?? ""}
                            onChange={(e) =>
                              patchDevice({ wifiAddress: e.target.value })
                            }
                          />
                        </label>
                      )}
                      {settings.device.transport === "usb" && (
                        <>
                          <p className="tc-settings__hint">
                            First setup: plug a wiped Taby in by USB. We push
                            firmware, read the BLE MAC, and write Wi‑Fi from this
                            PC — nothing to type on the screen.
                          </p>
                          <label className="tc-settings__field">
                            <span>Wi‑Fi SSID (written to device)</span>
                            <input
                              type="text"
                              placeholder="HomeNetwork"
                              value={settings.device.wifiSsid ?? ""}
                              onChange={(e) =>
                                patchDevice({ wifiSsid: e.target.value })
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className="tc-settings__btn tc-settings__btn--accent"
                            onClick={() => onProvisionUsb?.()}
                          >
                            Run USB setup
                          </button>
                        </>
                      )}
                      {settings.device.transport !== "mock" &&
                        settings.device.transport !== "usb" && (
                          <button
                            type="button"
                            className="tc-settings__btn"
                            onClick={() => onConnectTransport?.()}
                          >
                            Connect
                          </button>
                        )}
                      {settings.device.serial ? (
                        <p className="tc-settings__hint">
                          Serial {settings.device.serial}
                          {settings.device.preferredId
                            ? ` · BLE ${settings.device.preferredId}`
                            : ""}
                        </p>
                      ) : null}
                      {provisionStatus ? (
                        <p className="tc-settings__hint">{provisionStatus}</p>
                      ) : null}
                    </>
                  )}

                  {sec.id === "advanced" && (
                    <>
                      <label className="tc-settings__check">
                        <input
                          type="checkbox"
                          checked={settings.hud.diagnosticsEnabled === true}
                          onChange={(e) => {
                            const on = e.target.checked;
                            patchHud({ diagnosticsEnabled: on });
                            void import("@tauri-apps/api/core")
                              .then(({ invoke }) =>
                                invoke("set_diagnostics_enabled", {
                                  enabled: on,
                                })
                              )
                              .catch(() => undefined);
                          }}
                        />
                        <span>Diagnostics logging (auto-purge 30 days)</span>
                      </label>
                      <label className="tc-settings__check">
                        <input
                          type="checkbox"
                          checked={settings.hud.reducedMotion === true}
                          onChange={(e) =>
                            patchHud({ reducedMotion: e.target.checked })
                          }
                        />
                        <span>Reduced motion</span>
                      </label>
                      <label className="tc-settings__check">
                        <input
                          type="checkbox"
                          checked={settings.hud.globalHotkeyEnabled === true}
                          onChange={(e) =>
                            patchHud({ globalHotkeyEnabled: e.target.checked })
                          }
                        />
                        <span>Global hotkey (show HUD)</span>
                      </label>
                      {settings.hud.globalHotkeyEnabled && (
                        <label className="tc-settings__field">
                          <span>Hotkey</span>
                          <input
                            type="text"
                            value={
                              settings.hud.globalHotkey ??
                              "CommandOrControl+Shift+Space"
                            }
                            onChange={(e) =>
                              patchHud({ globalHotkey: e.target.value })
                            }
                          />
                        </label>
                      )}
                      <button
                        type="button"
                        className="tc-settings__btn tc-settings__btn--accent"
                        onClick={onReplayOnboarding}
                      >
                        Run setup wizard again
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>
          );
        })}
        {!visible.length && (
          <p className="tc-settings__empty">No settings match “{query}”.</p>
        )}
      </div>

      <footer className="tc-settings__foot">
        <button type="button" className="tc-settings__btn tc-settings__btn--accent" onClick={onSave}>
          Save
        </button>
        {saved && <span className="tc-settings__saved">Saved</span>}
      </footer>
    </div>
  );
}
