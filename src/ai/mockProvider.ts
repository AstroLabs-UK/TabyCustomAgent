import type { AiMessage, AiProvider, AiProviderConfig, AiStreamChunk } from "./types";

/**
 * Mock AI — keyword intents emit tool_call chunks so the agent can drive modules offline.
 */
export class MockAiProvider implements AiProvider {
  readonly id = "mock";

  async *completeStream(
    messages: AiMessage[],
    _config: AiProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<AiStreamChunk> {
    if (signal?.aborted) {
      yield { type: "error", error: "aborted" };
      return;
    }
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = (lastUser?.content ?? "").toLowerCase();

    const tool = detectTool(text);
    if (tool) {
      yield { type: "tool_call", toolName: tool.name, toolArgs: tool.args };
      const reply = `I'll use ${tool.name}.`;
      for (const t of reply.split(/(\s+)/)) {
        yield { type: "token", text: t };
        await delay(4);
      }
      yield { type: "done" };
      return;
    }

    const reply = lastUser
      ? `Mock reply to: "${lastUser.content.slice(0, 80)}"`
      : "Mock assistant ready.";
    for (const t of reply.split(/(\s+)/)) {
      if (signal?.aborted) {
        yield { type: "error", error: "aborted" };
        return;
      }
      yield { type: "token", text: t };
      await delay(5);
    }
    yield { type: "done" };
  }
}

function detectTool(
  text: string
): { name: string; args: Record<string, unknown> } | null {
  if (/what.*(today|on my plate)|today.?s overview|overview today/i.test(text)) {
    return { name: "get_today_overview", args: {} };
  }
  if (/list tasks|show tasks|my tasks|what tasks/i.test(text)) {
    const filter = /open|todo/.test(text) ? "open" : /done|completed/.test(text) ? "done" : /today/.test(text) ? "today" : "all";
    return { name: "list_tasks", args: { filter } };
  }
  if (/list notes|show notes|my notes/i.test(text)) {
    return { name: "list_notes", args: {} };
  }
  if (/search notes|find note/i.test(text)) {
    const query = text.replace(/.*(?:search notes|find note)\s*(for)?\s*/i, "").trim() || "";
    return { name: "search_notes", args: { query } };
  }
  if (/list reminders|show reminders|my reminders/i.test(text)) {
    return { name: "list_reminders", args: {} };
  }
  if (/list habits|show habits|my habits/i.test(text)) {
    return { name: "list_habits", args: {} };
  }
  if (/what time|current time|what day|today.?s date/i.test(text)) {
    return { name: "get_current_time", args: {} };
  }
  if (/search (the )?web|look up|google\b|web search/i.test(text)) {
    const query = text.replace(/.*(?:search (?:the )?web|look up|google|web search)\s*/i, "").trim();
    return { name: "web_search", args: { query: query || text } };
  }
  if (/wikipedia|wiki\b/i.test(text)) {
    const title = text.replace(/.*(?:wikipedia|wiki)\s*/i, "").trim();
    return { name: "wiki_summary", args: { title } };
  }
  if (/update task|edit task|rename task|change task/i.test(text)) {
    return { name: "update_task", args: { title: text.replace(/update task|edit task|rename task|change task/gi, "").trim() } };
  }
  const addTask = text.match(
    /(?:add|create|new)\s+task(?:\s+to)?\s+(.+?)(?:\s+due\s+(\d{4}-\d{2}-\d{2}))?$/i
  ) || text.match(/remind me to (.+)/i);
  if (/add task|create task|new task/i.test(text)) {
    const title =
      text.replace(/.*(?:add|create|new)\s+task\s*/i, "").trim() || "New task";
    return { name: "create_task", args: { title } };
  }
  if (/complete task|mark .+ done|finish task/i.test(text)) {
    const title = text
      .replace(/complete task|mark|done|finish task/gi, "")
      .trim();
    return { name: "complete_task", args: { title } };
  }
  if (/delete task|remove task/i.test(text)) {
    const title = text.replace(/delete task|remove task/gi, "").trim();
    return { name: "delete_task", args: { title } };
  }
  if (/remind|reminder/i.test(text)) {
    const m = text.match(/in\s+(\d+)\s*m/);
    const title = text.replace(/remind(er| me)?( to)?/i, "").replace(/in\s+\d+\s*m.*/i, "").trim() || "Reminder";
    return {
      name: "schedule_reminder",
      args: { title, inMinutes: m ? Number(m[1]) : 30 },
    };
  }
  if (/start focus|focus session|pomodoro/i.test(text)) {
    const m = text.match(/(\d+)\s*m/);
    return { name: "start_focus", args: { minutes: m ? Number(m[1]) : 25 } };
  }
  if (/create habit|add habit/i.test(text)) {
    const title = text.replace(/create habit|add habit/gi, "").trim() || "Habit";
    return { name: "create_habit", args: { title } };
  }
  if (/log habit|check in habit|did my habit/i.test(text)) {
    const title = text.replace(/log habit|check in habit|did my/gi, "").trim();
    return { name: "log_habit", args: { title } };
  }
  if (/note|write down/i.test(text) && /create|add|save|write/i.test(text)) {
    const body = text.replace(/.*(?:note|write down)\s*/i, "").trim();
    return { name: "create_note", args: { title: "Note", body } };
  }
  if (addTask) {
    return { name: "create_task", args: { title: addTask[1].trim() } };
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockAi = new MockAiProvider();
