import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { AppSettings } from "../settings/types";
import { PROVIDER_PRESETS, type AiProviderId } from "../ai/types";
import { gifForAnimationId } from "../device/animationMap";
import { DEFAULT_EDGE_ZONE } from "../settings/types";

type StepId =
  | "welcome"
  | "ai"
  | "key"
  | "device_kind"
  | "usb_setup"
  | "face"
  | "edge_size"
  | "practice"
  | "done";

type Step = { id: StepId; title: string; body: string; face: string };

const BASE_STEPS: Step[] = [
  {
    id: "welcome",
    title: "Hey — I'm Taby",
    body: "Quick setup: brain, optional Physical Taby, then practice opening me from the top edge.",
    face: "f1_car",
  },
  {
    id: "ai",
    title: "Pick a brain",
    body: "Mock works offline. Groq / OpenClaw / Hermes / Ollama for live replies.",
    face: "working_laptop_excited_loop",
  },
  {
    id: "key",
    title: "API key (if needed)",
    body: "Keys stay on this device only — never uploaded with the app.",
    face: "searching_loop",
  },
  {
    id: "device_kind",
    title: "Physical Taby?",
    body: "Use an on-screen face only, or set up a Physical Taby (USB first).",
    face: "hello_annoyed",
  },
  {
    id: "usb_setup",
    title: "USB first setup",
    body: "Plug a wiped Taby in by cable. We'll push firmware, read the BLE MAC, and write Wi‑Fi from this PC — nothing to type on the screen.",
    face: "codex_loop",
  },
  {
    id: "face",
    title: "Show my face",
    body: "Keep an on-screen Taby for reactions even without hardware.",
    face: "basketball_dunk",
  },
  {
    id: "edge_size",
    title: "Activation zone",
    body: "Choose how wide the top-edge hover zone is. You can fine-tune later in Settings.",
    face: "calendar_loop",
  },
  {
    id: "practice",
    title: "Try summoning me",
    body: "Move your pointer to the top edge (center), wait a moment, and open the HUD. Click Continue when you've done it once — or skip if you're in a hurry.",
    face: "listening_loop",
  },
  {
    id: "done",
    title: "You're set!",
    body: "Chat, tasks, and the menu are ready. Re-run this tour anytime from Settings → Advanced.",
    face: "yeah",
  },
];

export type OnboardingWizardProps = {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  onFinish: (next: AppSettings) => void;
  onProvisionUsb?: () => Promise<void> | void;
  provisionStatus?: string;
};

export function OnboardingWizard({
  settings,
  setSettings,
  onFinish,
  onProvisionUsb,
  provisionStatus,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [practiced, setPracticed] = useState(false);
  const [wifiSsid, setWifiSsid] = useState(settings.device.wifiSsid ?? "");

  const steps = useMemo(() => {
    const hasPhysical = settings.hasPhysicalTaby === true;
    return BASE_STEPS.filter((s) => {
      if (s.id === "usb_setup" && !hasPhysical) return false;
      return true;
    });
  }, [settings.hasPhysicalTaby]);

  const current = steps[Math.min(step, steps.length - 1)];
  const faceSrc = useMemo(() => {
    const base = gifForAnimationId(current.face) ?? "/taby-faces/yeah.gif";
    return `${base}?ob=${current.id}`;
  }, [current]);

  const needsKey = PROVIDER_PRESETS[settings.ai.provider]?.needsKey === true;

  function patchHud(partial: Partial<AppSettings["hud"]>) {
    setSettings((s) => ({ ...s, hud: { ...s.hud, ...partial } }));
  }
  function patchDevice(partial: Partial<AppSettings["device"]>) {
    setSettings((s) => ({ ...s, device: { ...s.device, ...partial } }));
  }

  function next() {
    if (current.id === "ai" && !needsKey) {
      // skip key
      const idx = steps.findIndex((s) => s.id === "key");
      if (idx >= 0 && step === steps.findIndex((s) => s.id === "ai")) {
        setStep(idx + 1);
        return;
      }
    }
    if (step >= steps.length - 1) {
      onFinish({
        ...settings,
        onboardingCompleted: true,
        device: {
          ...settings.device,
          wifiSsid: wifiSsid || settings.device.wifiSsid,
        },
      });
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    if (step <= 0) return;
    const prev = steps[step - 1];
    if (prev?.id === "key" && !needsKey) {
      setStep(Math.max(0, step - 2));
      return;
    }
    setStep((s) => s - 1);
  }

  const widthPct = Math.round((settings.hud.edgeZone?.widthFrac ?? 0.36) * 100);

  return (
    <div className="tc-onboard" data-testid="onboarding">
      <div className="tc-onboard__card">
        <div className="tc-onboard__face-wrap">
          <img
            key={faceSrc}
            src={faceSrc}
            alt=""
            className="tc-onboard__face"
          />
        </div>
        <div className="tc-onboard__progress" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`tc-onboard__dot${i === step ? " is-on" : ""}${
                i < step ? " is-done" : ""
              }`}
            />
          ))}
        </div>
        <h1 className="tc-onboard__title">{current.title}</h1>
        <p className="tc-onboard__body">{current.body}</p>

        {current.id === "ai" && (
          <label className="tc-onboard__field">
            <span>Provider</span>
            <select
              value={settings.ai.provider}
              onChange={(e) => {
                const provider = e.target.value as AiProviderId;
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
              }}
            >
              {(Object.keys(PROVIDER_PRESETS) as AiProviderId[]).map((id) => (
                <option key={id} value={id}>
                  {PROVIDER_PRESETS[id].label}
                </option>
              ))}
            </select>
          </label>
        )}

        {current.id === "key" && needsKey && (
          <label className="tc-onboard__field">
            <span>API key</span>
            <input
              type="password"
              autoComplete="off"
              placeholder="Stored only on this device"
              value={settings.ai.apiKey}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  ai: { ...s.ai, apiKey: e.target.value },
                }))
              }
            />
          </label>
        )}

        {current.id === "device_kind" && (
          <div className="tc-onboard__choices">
            <label className="tc-onboard__check">
              <input
                type="radio"
                name="phys"
                checked={!settings.hasPhysicalTaby}
                onChange={() =>
                  setSettings((s) => ({
                    ...s,
                    hasPhysicalTaby: false,
                    device: { ...s.device, transport: "mock" },
                  }))
                }
              />
              <span>On-screen face only</span>
            </label>
            <label className="tc-onboard__check">
              <input
                type="radio"
                name="phys"
                checked={!!settings.hasPhysicalTaby}
                onChange={() =>
                  setSettings((s) => ({
                    ...s,
                    hasPhysicalTaby: true,
                    device: { ...s.device, transport: "usb" },
                  }))
                }
              />
              <span>I have a Physical Taby</span>
            </label>
          </div>
        )}

        {current.id === "usb_setup" && (
          <>
            <label className="tc-onboard__field">
              <span>Wi‑Fi name (SSID) for the device</span>
              <input
                type="text"
                placeholder="HomeNetwork"
                value={wifiSsid}
                onChange={(e) => {
                  setWifiSsid(e.target.value);
                  patchDevice({ wifiSsid: e.target.value });
                }}
              />
            </label>
            <p className="tc-onboard__body" style={{ fontSize: "0.85rem" }}>
              Password can be set later in Settings if your firmware needs it.
              Plug the cable, then run setup.
            </p>
            <button
              type="button"
              className="tc-onboard__btn tc-onboard__btn--primary"
              onClick={() => void onProvisionUsb?.()}
            >
              Run USB setup now
            </button>
            {provisionStatus ? (
              <p className="tc-onboard__body" style={{ fontSize: "0.85rem" }}>
                {provisionStatus}
              </p>
            ) : null}
            {settings.device.preferredId ? (
              <p className="tc-onboard__body" style={{ fontSize: "0.85rem" }}>
                Saved BLE {settings.device.preferredId}
                {settings.device.serial ? ` · ${settings.device.serial}` : ""}
              </p>
            ) : null}
          </>
        )}

        {current.id === "face" && (
          <label className="tc-onboard__check">
            <input
              type="checkbox"
              checked={settings.hud.localFaceEnabled !== false}
              onChange={(e) => patchHud({ localFaceEnabled: e.target.checked })}
            />
            <span>Show on-screen face</span>
          </label>
        )}

        {current.id === "edge_size" && (
          <>
            <label className="tc-onboard__field">
              <span>Zone width ({widthPct}% of screen)</span>
              <input
                type="range"
                min={15}
                max={80}
                value={widthPct}
                onChange={(e) => {
                  const widthFrac = Number(e.target.value) / 100;
                  patchHud({
                    edgeZone: {
                      ...(settings.hud.edgeZone ?? DEFAULT_EDGE_ZONE),
                      widthFrac,
                    },
                  });
                }}
              />
            </label>
            <label className="tc-onboard__field">
              <span>Hover area</span>
              <select
                value={settings.hud.hoverActivationArea ?? "center"}
                onChange={(e) =>
                  patchHud({
                    hoverActivationArea: e.target.value as
                      | "center"
                      | "full"
                      | "left"
                      | "right",
                  })
                }
              >
                <option value="center">Center</option>
                <option value="full">Full top edge</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
          </>
        )}

        {current.id === "practice" && (
          <label className="tc-onboard__check">
            <input
              type="checkbox"
              checked={practiced}
              onChange={(e) => setPracticed(e.target.checked)}
            />
            <span>I opened Taby from the top edge</span>
          </label>
        )}

        <div className="tc-onboard__actions">
          {step > 0 && (
            <button type="button" className="tc-onboard__btn" onClick={back}>
              Back
            </button>
          )}
          <button
            type="button"
            className="tc-onboard__btn tc-onboard__btn--primary"
            onClick={next}
          >
            {step >= steps.length - 1 ? "Start using Taby" : "Continue"}
          </button>
        </div>
        {step === 0 && (
          <button
            type="button"
            className="tc-onboard__skip"
            onClick={() =>
              onFinish({ ...settings, onboardingCompleted: true })
            }
          >
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
