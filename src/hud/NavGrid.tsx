import { useEffect, useState } from "react";
import {
  NAV_COLS,
  NAV_GRID,
  NAV_ROWS,
  moveFocus,
  type NavCellId,
} from "./navModel";
import { NavIcon } from "./NavIcons";

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
      className="hud-nav-panel hud-nav-panel--official"
      data-testid="hud-nav-grid"
      role="menu"
      aria-label="Features"
    >
      <div
        className="hud-nav-grid hud-nav-grid--official"
        style={{
          gridTemplateColumns: `repeat(${NAV_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${NAV_ROWS}, auto)`,
        }}
      >
        {NAV_GRID.map((cell) => {
          const focused = cell.id === focusId;
          const alone =
            cell.id === "settings" && cell.col === 0 && !cellAtRight(cell.row);
          return (
            <button
              key={cell.id}
              type="button"
              role="menuitem"
              className={`hud-nav-cell hud-nav-cell--official${focused ? " is-focused" : ""}${alone ? " is-alone" : ""}`}
              data-nav-id={cell.id}
              data-row={cell.row}
              data-col={cell.col}
              onMouseEnter={() => setFocusId(cell.id)}
              onClick={() => onActivate(cell.id)}
            >
              <span className="hud-nav-icon" aria-hidden>
                <NavIcon name={cell.icon} />
              </span>
              <span className="hud-nav-label">{cell.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function cellAtRight(row: number): boolean {
  return NAV_GRID.some((c) => c.row === row && c.col === 1);
}
