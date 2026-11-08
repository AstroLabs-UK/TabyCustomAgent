export function NavToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`hud-nav-toggle${expanded ? " is-expanded" : ""}`}
      aria-label={expanded ? "Close menu" : "Open menu"}
      aria-expanded={expanded}
      onClick={onToggle}
    >
      {expanded ? (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M7 7l10 10M17 7L7 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <rect x="5" y="5" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="14" y="5" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="5" y="14" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="14" y="14" width="5" height="5" rx="1" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
