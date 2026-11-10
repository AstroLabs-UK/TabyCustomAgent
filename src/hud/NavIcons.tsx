/**
 * Nav icons from Physical Taby firmware LVGL A4 assets
 * (TRIIIS-LABS/firmware-taby assets/amoled-1.64/icons), converted to PNG.
 */

const ICON_SRC: Record<string, string> = {
  chat: "/icons/png/message-circle.png",
  home: "/icons/png/house.png",
  tasks: "/icons/png/clipboard-list.png",
  notes: "/icons/png/notebook-pen.png",
  reminders: "/icons/png/bell.png",
  habits: "/icons/png/refresh-cw.png",
  today: "/icons/png/calendar.png",
  week: "/icons/png/calendar-range.png",
  focus: "/icons/png/focus.png",
  settings: "/icons/png/settings.png",
  mic: "/icons/png/mic.png",
  sparkles: "/icons/png/sparkles.png",
};

export function NavIcon({ name, size = 20 }: { name: string; size?: number }) {
  const src = ICON_SRC[name];
  if (src) {
    return (
      <img
        className="nav-a4-icon"
        src={src}
        width={size}
        height={size}
        alt=""
        draggable={false}
        aria-hidden
      />
    );
  }
  // Minimal fallback
  return (
    <span
      className="nav-a4-fallback"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export { ICON_SRC };
