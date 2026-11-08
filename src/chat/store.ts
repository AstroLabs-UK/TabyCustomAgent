import type { Conversation, ChatMessage } from "./types";
import { newId } from "./id";

const STORAGE_KEY = "taby-custom-agent-chats";

export type ChatStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function defaultStorage(): ChatStorageLike {
  if (typeof localStorage !== "undefined") return localStorage;
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

let storage: ChatStorageLike = defaultStorage();

export function setChatStorageBackend(b: ChatStorageLike): void {
  storage = b;
}

export type ChatState = {
  conversations: Conversation[];
  activeId: string | null;
};

export function loadChatState(): ChatState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [], activeId: null };
    const parsed = JSON.parse(raw) as ChatState;
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      activeId: parsed.activeId ?? null,
    };
  } catch {
    return { conversations: [], activeId: null };
  }
}

export function saveChatState(state: ChatState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createConversation(title = "New chat"): Conversation {
  const now = Date.now();
  return {
    id: newId("conv"),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function appendMessage(
  conv: Conversation,
  role: ChatMessage["role"],
  content: string,
  attachments?: ChatMessage["attachments"]
): Conversation {
  const msg: ChatMessage = {
    id: newId("msg"),
    role,
    content,
    createdAt: Date.now(),
    attachments: attachments && attachments.length ? attachments : undefined,
  };
  return {
    ...conv,
    updatedAt: Date.now(),
    title:
      conv.messages.length === 0 && role === "user"
        ? content.slice(0, 48) || conv.title
        : conv.title,
    messages: [...conv.messages, msg],
  };
}

export function replaceAssistantTail(
  conv: Conversation,
  content: string
): Conversation {
  const messages = [...conv.messages];
  const last = messages[messages.length - 1];
  if (last && last.role === "assistant") {
    messages[messages.length - 1] = { ...last, content };
  } else {
    messages.push({
      id: newId("msg"),
      role: "assistant",
      content,
      createdAt: Date.now(),
    });
  }
  return { ...conv, updatedAt: Date.now(), messages };
}
