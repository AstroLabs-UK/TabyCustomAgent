import { useEffect, useState } from "react";
import { subscribeToasts, type Toast } from "./toasts";

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setItems), []);
  if (!items.length) return null;
  return (
    <div className="tc-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`tc-toast tc-toast--${t.kind}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
