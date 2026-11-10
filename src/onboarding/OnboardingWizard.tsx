import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { AppSettings } from "../settings/types";
import { PROVIDER_PRESETS, type AiProviderId } from "../ai/types";
import { gifForAnimationId } from "../device/animationMap";

type Step = {
  id: string;
  title: string;
  body: string;
  face: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Hey — I'm Taby",
    body: "Let's get Taby Custom Agent ready in under a minute. Fun faces included.",
    face: "yeah",
  },
  {
    id: "ai",
    title: "Pick a brain",
    body: "Mock works offline. Groq / OpenClaw / Hermes / Ollama for live replies.",
    face: "working_loop",
  },
  {
    id: "key",
    title: "API key (if needed)",
    body: "Keys stay on this device only — never uploaded with the app.",
    face: "listening_loop",
  },
  {
    id: "face",
    title: "Show my face",
    body: "Keep an on-screen Taby, or use a Physical Taby when you connect one.",
    face: "thumbs_up",
  },
  {
    id: "edge",
    title: "Summon from the top",
    body: "Hover the middle of the top edge to open me. Fine-tune the zone later in Settings.",
    face: "confirmation",
  },
  {
    id: "done",
    title: "You're set!",
    body: "Open the menu, chat, manage tasks — or re-run this tour from Settings → Advanced.",
    face: "task_completed",
  },
];

export type OnboardingWizardProps = {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  onFinish: (next: AppSettings) => void;
};

export function OnboardingWizard({
  settings,
  setSettings,
  onFinish,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const faceSrc = useMemo(() => {
    const base = gifForAnimationId(current.face) ?? "/taby-faces/yeah.gif";
    return `${base}?ob=${current.id}`;
  }, [current]);

  const needsKey = PROVIDER_PRESETS[settings.ai.provider]?.needsKey === true;

  function next() {
    if (current.id === "ai" && !needsKey) {
      setStep((s) => Math.min(s + 2, STEPS.length - 1));
      return;
    }
    if (step >= STEPS.length - 1) {
      onFinish({ ...settings, onboardingCompleted: true });
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    if (step <= 0) return;
    if (STEPS[step].id === "face" && !needsKey) {
      setStep((s) => Math.max(0, s - 2));
      return;
    }
    setStep((s) => s - 1);
  }

  return (
    <div className="tc-onboard" data-testid="onboarding">
      <div className="tc-onboard__card">
        <div className="tc-onboard__face-wrap">
          <img
            key={faceSrc}
            src={faceSrc}
            alt=""
            className="tc-onboard__face"
            draggable={false}
          />
        </div>
        <div className="tc-onboard__progress" aria-hidden>
          {STEPS.map((s, i) => (
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
              placeholder="Paste key — stored locally only"
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

        {current.id === "face" && (
          <label className="tc-onboard__check">
            <input
              type="checkbox"
              checked={settings.hud.localFaceEnabled !== false}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  hud: { ...s.hud, localFaceEnabled: e.target.checked },
                }))
              }
            />
            <span>Show Taby on this screen</span>
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
            {step >= STEPS.length - 1 ? "Start using Taby" : "Continue"}
          </button>
        </div>
        {step === 0 && (
          <button
            type="button"
            className="tc-onboard__skip"
            onClick={() => onFinish({ ...settings, onboardingCompleted: true })}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
