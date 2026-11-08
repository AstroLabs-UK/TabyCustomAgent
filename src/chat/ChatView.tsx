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

  return (
    <div className="chat-glass">
      <div className="chat-toolbar">
        <button
          type="button"
          className="btn glass-btn"
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
        >
          {showHistory ? "Hide chats" : "Past chats"}
        </button>
        <button type="button" className="btn glass-btn primary" onClick={onNewChat}>
          New chat
        </button>
        {conversation && onDelete && (
          <button
            type="button"
            className="btn glass-btn danger"
            onClick={() => {
              if (confirm("Delete this chat?")) onDelete(conversation.id);
            }}
          >
            Delete
          </button>
        )}
      </div>

      {showHistory && (
        <ul className="chat-history" aria-label="Past chats">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`chat-history-item${c.id === conversation?.id ? " is-active" : ""}`}
                onClick={() => {
                  onSelect(c.id);
                  setShowHistory(false);
                }}
              >
                <span className="chat-history-title">{c.title || "Untitled"}</span>
              </button>
              {onDelete && (
                <button
                  type="button"
                  className="chat-history-del"
                  aria-label={`Delete ${c.title}`}
                  onClick={() => {
                    if (confirm("Delete this chat?")) onDelete(c.id);
                  }}
                >
                  ×
                </button>
              )}
            </li>
          ))}
          {!conversations.length && (
            <li className="hint">No past chats yet.</li>
          )}
        </ul>
      )}

      <div className="chat-thread" aria-live="polite">
        {!conversation && (
          <p className="hint chat-empty">Start a conversation from the prompt above.</p>
        )}
        {conversation?.messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble chat-bubble--${m.role}`}
          >
            <div className="chat-bubble-role">
              {m.role === "user" ? "You" : "Taby"}
            </div>
            {m.attachments && m.attachments.length > 0 && (
              <AttachmentChips items={m.attachments} />
            )}
            <div
              className="chat-bubble-body"
              dangerouslySetInnerHTML={{
                __html: renderBasicMarkdown(m.content),
              }}
            />
          </div>
        ))}
        {streaming && (
          <p className="hint chat-streaming">Thinking…</p>
        )}
      </div>
    </div>
  );
}
