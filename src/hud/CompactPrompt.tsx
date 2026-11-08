import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { NavToggle } from "./NavToggle";

export type CompactPromptProps = {
  connectionLabel: string;
  connectionOk: boolean;
  navExpanded: boolean;
  onToggleNav: () => void;
  onSubmit: (text: string) => void;
  onDismiss: () => void;
  onUploadClick?: () => void;
  onVoiceClick?: () => void;
};

export function CompactPrompt({
  connectionLabel,
  connectionOk,
  navExpanded,
  onToggleNav,
  onSubmit,
  onDismiss,
  onUploadClick,
  onVoiceClick,
}: CompactPromptProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!navExpanded) {
      inputRef.current?.focus();
    }
  }, [navExpanded]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
    }
  }

  return (
    <div
      className="hud-compact"
      role="dialog"
      aria-label="Taby prompt"
      onKeyDown={handleKeyDown}
    >
      <form className="hud-compact-form" onSubmit={handleSubmit}>
        <NavToggle expanded={navExpanded} onToggle={onToggleNav} />
        <span
          className={`hud-connection-dot ${connectionOk ? "ok" : "off"}`}
          title={connectionLabel}
          aria-label={connectionLabel}
        />
        <input
          ref={inputRef}
          className="hud-prompt-input"
          type="text"
          placeholder="Ask anything…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Prompt"
        />
        <button
          type="button"
          className="hud-icon-btn"
          title="Attach file (soon)"
          aria-label="Attach file"
          onClick={onUploadClick}
        >
          <UploadIcon />
        </button>
        <button
          type="button"
          className="hud-icon-btn"
          title="Voice (soon)"
          aria-label="Voice input"
          onClick={onVoiceClick}
        >
          <MicIcon />
        </button>
        <button
          type="submit"
          className="hud-send-btn"
          disabled={!value.trim()}
          aria-label="Send"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4M12 4L8 8M12 4l4 4M4 20h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
