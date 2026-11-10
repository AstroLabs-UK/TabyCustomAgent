import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Conversation } from "./types";
import { renderBasicMarkdown } from "./markdown";
import { AttachmentChips } from "./AttachmentChips";

export type ChatViewProps = {
  conversation: Conversation | null;
  streaming: boolean;
  conversations: Conversation[];
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Optional voice control slot rendered inside the themed shell */
  footer?: ReactNode;
};

/**
 * Fully self-contained chat UI — dark glass theme, custom scroll, no parent theme bleed.
 */
export function ChatView({
  conversation,
  streaming,
  conversations,
  onNewChat,
  onSelect,
  onDelete,
  footer,
}: ChatViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [conversation?.messages, streaming, conversation?.id]);

  return (
    <div className="tc-chat" data-testid="tc-chat">
      <div className="tc-chat__chrome">
        <div className="tc-chat__head">
          <div className="tc-chat__head-text">
            <div className="tc-chat__eyebrow">Messages</div>
            <div className="tc-chat__title">
              {conversation?.title?.trim() || "New chat"}
            </div>
          </div>
          <div className="tc-chat__tools">
            <button
              type="button"
              className={`tc-chat__btn${showHistory ? " tc-chat__btn--on" : ""}`}
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? "Hide" : "History"}
            </button>
            <button
              type="button"
              className="tc-chat__btn tc-chat__btn--accent"
              onClick={onNewChat}
            >
              New
            </button>
            {conversation && onDelete && (
              <button
                type="button"
                className="tc-chat__btn tc-chat__btn--danger"
                onClick={() => setPendingDeleteId(conversation.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {pendingDeleteId && (
          <div className="tc-chat__confirm">
            <span>Delete this chat?</span>
            <div className="tc-chat__confirm-actions">
              <button
                type="button"
                className="tc-chat__btn"
                onClick={() => setPendingDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tc-chat__btn tc-chat__btn--danger"
                onClick={() => {
                  onDelete?.(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="tc-chat__history-shell">
            <ul className="tc-chat__history">
              {conversations.map((c) => (
                <li key={c.id} className="tc-chat__history-row">
                  <button
                    type="button"
                    className={`tc-chat__history-item${
                      c.id === conversation?.id ? " is-active" : ""
                    }`}
                    onClick={() => {
                      onSelect(c.id);
                      setShowHistory(false);
                    }}
                  >
                    <span className="tc-chat__history-title">
                      {c.title || "Untitled"}
                    </span>
                    <span className="tc-chat__history-count">
                      {c.messages.length}
                    </span>
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      className="tc-chat__icon-del"
                      aria-label="Delete chat"
                      onClick={() => setPendingDeleteId(c.id)}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
              {!conversations.length && (
                <li className="tc-chat__history-empty">No chats yet</li>
              )}
            </ul>
          </div>
        )}

        <div className="tc-chat__thread-shell">
          <div className="tc-chat__thread" ref={threadRef}>
            {!conversation && (
              <div className="tc-chat__empty">
                Type in the prompt above to start talking to Taby.
              </div>
            )}
            {conversation?.messages.map((m) => (
              <article
                key={m.id}
                className={`tc-chat__bubble tc-chat__bubble--${m.role}`}
              >
                <header className="tc-chat__bubble-who">
                  {m.role === "user" ? "You" : "Taby"}
                </header>
                {m.attachments && m.attachments.length > 0 && (
                  <AttachmentChips items={m.attachments} />
                )}
                <div
                  className="tc-chat__bubble-text"
                  dangerouslySetInnerHTML={{
                    __html: renderBasicMarkdown(m.content),
                  }}
                />
              </article>
            ))}
            {streaming && (
              <article className="tc-chat__bubble tc-chat__bubble--assistant">
                <header className="tc-chat__bubble-who">Taby</header>
                <div className="tc-chat__dots" aria-label="Typing">
                  <i /><i /><i />
                </div>
              </article>
            )}
          </div>
        </div>

        {footer && <div className="tc-chat__footer">{footer}</div>}
      </div>
    </div>
  );
}
