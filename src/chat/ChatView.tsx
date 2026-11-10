import { useState } from "react";
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
};

export function ChatView({
  conversation,
  streaming,
  conversations,
  onNewChat,
  onSelect,
  onDelete,
}: ChatViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function requestDelete(id: string) {
    setPendingDeleteId(id);
  }

  function confirmDelete() {
    if (pendingDeleteId && onDelete) {
      onDelete(pendingDeleteId);
    }
    setPendingDeleteId(null);
  }

  function cancelDelete() {
    setPendingDeleteId(null);
  }

  return (
    <div className="chat-panel">
      <header className="chat-panel-header">
        <div className="chat-panel-title-row">
          <h2 className="chat-panel-title">Chat</h2>
          <span className="chat-panel-subtitle">
            {conversation?.title?.trim() || "New conversation"}
          </span>
        </div>
        <div className="chat-panel-actions">
          <button
            type="button"
            className={`chat-action-btn${showHistory ? " is-active" : ""}`}
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
          >
            {showHistory ? "Hide history" : "History"}
          </button>
          <button
            type="button"
            className="chat-action-btn chat-action-btn--accent"
            onClick={onNewChat}
          >
            New
          </button>
          {conversation && onDelete && (
            <button
              type="button"
              className="chat-action-btn chat-action-btn--danger"
              onClick={() => requestDelete(conversation.id)}
            >
              Delete
            </button>
          )}
        </div>
      </header>

      {pendingDeleteId && (
        <div className="chat-confirm" role="alertdialog" aria-label="Confirm delete">
          <p className="chat-confirm-text">Delete this chat permanently?</p>
          <div className="chat-confirm-actions">
            <button
              type="button"
              className="chat-action-btn"
              onClick={cancelDelete}
            >
              Cancel
            </button>
            <button
              type="button"
              className="chat-action-btn chat-action-btn--danger"
              onClick={confirmDelete}
            >
              Delete chat
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="chat-history-wrap">
          <ul className="chat-history" aria-label="Past chats">
            {conversations.map((c) => (
              <li key={c.id} className="chat-history-row">
                <button
                  type="button"
                  className={`chat-history-item${
                    c.id === conversation?.id ? " is-active" : ""
                  }`}
                  onClick={() => {
                    onSelect(c.id);
                    setShowHistory(false);
                    setPendingDeleteId(null);
                  }}
                >
                  <span className="chat-history-title">
                    {c.title || "Untitled"}
                  </span>
                  <span className="chat-history-meta">
                    {c.messages.length} msg
                  </span>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    className="chat-history-delete"
                    aria-label={`Delete ${c.title || "chat"}`}
                    onClick={() => requestDelete(c.id)}
                  >
                    <span aria-hidden>×</span>
                  </button>
                )}
              </li>
            ))}
            {!conversations.length && (
              <li className="chat-history-empty">No past chats yet.</li>
            )}
          </ul>
        </div>
      )}

      <div className="chat-thread-wrap">
        <div className="chat-thread" aria-live="polite">
          {!conversation && (
            <div className="chat-empty">
              <p>Start a conversation from the prompt above.</p>
            </div>
          )}
          {conversation?.messages.map((m) => (
            <div
              key={m.id}
              className={`chat-msg chat-msg--${m.role}`}
            >
              <div className="chat-msg-label">
                {m.role === "user" ? "You" : "Taby"}
              </div>
              {m.attachments && m.attachments.length > 0 && (
                <AttachmentChips items={m.attachments} />
              )}
              <div
                className="chat-msg-body"
                dangerouslySetInnerHTML={{
                  __html: renderBasicMarkdown(m.content),
                }}
              />
            </div>
          ))}
          {streaming && (
            <div className="chat-msg chat-msg--assistant chat-msg--streaming">
              <div className="chat-msg-label">Taby</div>
              <div className="chat-msg-body chat-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
