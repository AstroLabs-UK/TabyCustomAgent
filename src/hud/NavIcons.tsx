/** Simple line icons matching official HUD (white strokes). */
export function NavIcon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1z" />
        </svg>
      );
    case "tasks":
      return (
        <svg {...common}>
          <path d="M9 11l2 2 4-4" />
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      );
    case "notes":
      return (
        <svg {...common}>
          <path d="M7 4h8l4 4v12a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" />
          <path d="M15 4v4h4M9 13h6M9 17h4" />
        </svg>
      );
    case "reminders":
      return (
        <svg {...common}>
          <path d="M12 6v6l4 2" />
          <path d="M18 8a6 6 0 10-1.2 3.6L20 18" />
          <path d="M9 21h6" />
        </svg>
      );
    case "habits":
      return (
        <svg {...common}>
          <path d="M12 3c2 3 2 5 0 8 2 0 5 2 5 5a5 5 0 11-10 0c0-2 1.5-3.5 3-4-2-1-3-3-1-6 1 1 2 1 3-1z" />
        </svg>
      );
    case "today":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case "week":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16M9 14h2M13 14h2M9 17h2" />
        </svg>
      );
    case "focus":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="7" />
          <path d="M12 6V3M12 10v3" />
        </svg>
      );
    case "feedback":
      return (
        <svg {...common}>
          <path d="M4 10v4a2 2 0 002 2h1v4l4-4h7a2 2 0 002-2v-4" />
          <path d="M8 6h12a2 2 0 012 2v2" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
