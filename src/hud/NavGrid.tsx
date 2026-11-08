import { useEffect, useState } from "react";
import {
  NAV_GRID,
  NAV_COLS,
  NAV_ROWS,
  moveFocus,
  type NavCellId,
} from "./navModel";

export type NavGridProps = {
  onActivate: (id: NavCellId) => void;
  onCollapse: () => void;
};

export function NavGrid({ onActivate, onCollapse }: NavGridProps) {
  const [focusId, setFocusId] = useState<NavCellId>("chat");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusId((id) => moveFocus(id, "up"));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusId((id) => moveFocus(id, "down"));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusId((id) => moveFocus(id, "left"));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusId((id) => moveFocus(id, "right"));
      } else if (e.key === "Enter") {
        e.preventDefault();
        onActivate(focusId);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCollapse();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId, onActivate, onCollapse]);

  return (
    <div
      className="hud-nav-panel"
      data-testid="hud-nav-grid"
      role="menu"
      aria-label="Features"
    >
      <div
        className="hud-nav-grid"
        style={{
          gridTemplateColumns: `repeat(${NAV_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${NAV_ROWS}, 1fr)`,
        }}
      >
        {NAV_GRID.map((cell) => {
          const focused = cell.id === focusId;
          return (
            <button
              key={cell.id}
              type="button"
              role="menuitem"
              className={`hud-nav-cell${focused ? " is-focused" : ""}`}
              data-nav-id={cell.id}
              data-row={cell.row}
              data-col={cell.col}
              style={{ background: `var(${cell.pastelVar})` }}
              onMouseEnter={() => setFocusId(cell.id)}
              onClick={() => onActivate(cell.id)}
            >
              <span className="hud-nav-label">{cell.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
