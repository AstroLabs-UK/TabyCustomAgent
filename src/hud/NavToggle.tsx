export type NavToggleProps = {
  expanded: boolean;
  onToggle: () => void;
};

/**
 * Four-box icon → X when expanded.
 * Expanded: filled with accent-strong, logo/mark white.
 */
export function NavToggle({ expanded, onToggle }: NavToggleProps) {
  return (
    <button
      type="button"
      className={`hud-nav-toggle${expanded ? " is-open" : ""}`}
      aria-expanded={expanded}
      aria-label={expanded ? "Close menu" : "Open menu"}
      data-testid="hud-nav-toggle"
      onClick={onToggle}
    >
      {expanded ? <XIcon /> : <GridIcon />}
    </button>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
