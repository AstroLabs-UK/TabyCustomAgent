/**
 * Assemble streaming token chunks into a single assistant message body.
 */
export function createStreamAssembler(onUpdate: (text: string) => void) {
  let acc = "";
  return {
    pushToken(text: string) {
      acc += text;
      onUpdate(acc);
    },
    get text() {
      return acc;
    },
    reset() {
      acc = "";
      onUpdate(acc);
    },
  };
}

export async function collectStream(
  stream: AsyncIterable<{ type: string; text?: string; error?: string }>
): Promise<{ text: string; error?: string }> {
  let text = "";
  for await (const chunk of stream) {
    if (chunk.type === "token" && chunk.text) text += chunk.text;
    if (chunk.type === "error") return { text, error: chunk.error ?? "error" };
  }
  return { text };
}
