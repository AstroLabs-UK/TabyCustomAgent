import { useEffect, useRef } from "react";
import type { Conversation } from "./types";
import { renderBasicMarkdown } from "./markdown";
import { AttachmentChips } from "./AttachmentChips";

export type ChatViewProps = {
  conversation: Conversation | null;
  streaming: boolean;
  onNewChat: () => void;
  conversations: Conversation[];
  onSelect: (id: string) => void;
};

export function ChatView({
  conversation,
  streaming,
  onNewChat,
  conversations,
  onSelect,
}: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streaming]);

  return (
    <div className="chat-layout" data-testid="chat-view">
      <aside className="chat-sidebar">
        <button type="button" className="btn primary chat-new" onClick={onNewChat}>
          New chat
        </button>
        <ul className="chat-list">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`chat-list-item${c.id === conversation?.id ? " is-active" : ""}`}
                onClick={() => onSelect(c.id)}
              >
                {c.title || "Untitled"}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="chat-thread">
        {!conversation && (
          <p className="hint">Start a chat from here or the top HUD prompt.</p>
        )}
        {conversation?.messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble chat-bubble--${m.role}`}
            data-role={m.role}
          >
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
        {streaming && <p className="chat-streaming-hint">Streaming…</p>}
        <div ref={bottomRef} />
      </section>
    </div>
  );
}
