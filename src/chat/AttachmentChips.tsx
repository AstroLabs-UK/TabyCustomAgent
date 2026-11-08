import type { ChatAttachment } from "./attachments";
import { formatBytes } from "./attachments";

export function AttachmentChips({
  items,
  onRemove,
}: {
  items: ChatAttachment[];
  onRemove?: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <ul className="attach-chips" aria-label="Attachments">
      {items.map((a) => (
        <li
          key={a.id}
          className={`attach-chip${a.error ? " is-error" : ""}`}
          title={a.error || a.name}
        >
          {a.previewUrl ? (
            <img src={a.previewUrl} alt="" className="attach-thumb" />
          ) : (
            <span className="attach-kind">{a.kind}</span>
          )}
          <span className="attach-name">{a.name}</span>
          <span className="attach-size">{formatBytes(a.size)}</span>
          {a.error && <span className="attach-err">{a.error}</span>}
          {onRemove && (
            <button
              type="button"
              className="attach-remove"
              aria-label={`Remove ${a.name}`}
              onClick={() => onRemove(a.id)}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
