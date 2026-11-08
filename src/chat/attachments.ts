export type AttachmentKind = "text" | "markdown" | "pdf" | "image" | "other";

export type ChatAttachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: AttachmentKind;
  /** Extracted text for txt/md (and pdf when available) */
  text?: string;
  /** data URL for image previews */
  previewUrl?: string;
  error?: string;
};

export const DEFAULT_MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export function kindFromFile(file: File): AttachmentKind {
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime === "text/plain" || name.endsWith(".txt")) return "text";
  if (
    mime === "text/markdown" ||
    name.endsWith(".md") ||
    name.endsWith(".markdown")
  )
    return "markdown";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  return "other";
}

export function validateAttachmentSize(
  file: File,
  maxBytes = DEFAULT_MAX_ATTACHMENT_BYTES
): { ok: true } | { ok: false; reason: string } {
  if (file.size > maxBytes) {
    return {
      ok: false,
      reason: `File too large (${formatBytes(file.size)} > ${formatBytes(maxBytes)})`,
    };
  }
  return { ok: true };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export async function extractTextFromFile(
  file: File
): Promise<{ text?: string; error?: string }> {
  const kind = kindFromFile(file);
  if (kind === "text" || kind === "markdown") {
    try {
      const text = await file.text();
      return { text };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }
  if (kind === "pdf") {
    // MVP: no full PDF parser in browser bundle — surface clear limitation
    return {
      text: undefined,
      error: "PDF text extract MVP: attach as file; full parse in a later pass",
    };
  }
  if (kind === "image") {
    return { text: undefined };
  }
  return { error: "Unsupported type for text extract" };
}

export async function fileToAttachment(
  file: File,
  maxBytes = DEFAULT_MAX_ATTACHMENT_BYTES
): Promise<ChatAttachment> {
  const id = `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const kind = kindFromFile(file);
  const sizeCheck = validateAttachmentSize(file, maxBytes);
  if (!sizeCheck.ok) {
    return {
      id,
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      kind,
      error: sizeCheck.reason,
    };
  }

  let text: string | undefined;
  let previewUrl: string | undefined;
  let error: string | undefined;

  if (kind === "image") {
    previewUrl = await readAsDataUrl(file);
  } else {
    const extracted = await extractTextFromFile(file);
    text = extracted.text;
    error = extracted.error;
  }

  return {
    id,
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    kind,
    text,
    previewUrl,
    error,
  };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsDataURL(file);
  });
}

/** Build prompt augmentation from attachments for the AI request. */
export function attachmentsToPromptContext(atts: ChatAttachment[]): string {
  if (!atts.length) return "";
  const parts: string[] = [];
  for (const a of atts) {
    if (a.error && !a.text) {
      parts.push(`[Attachment: ${a.name} — ${a.error}]`);
      continue;
    }
    if (a.kind === "image") {
      parts.push(`[Image attached: ${a.name}]`);
      continue;
    }
    if (a.text) {
      parts.push(
        `--- file: ${a.name} ---\n${a.text.slice(0, 50_000)}\n--- end ---`
      );
    } else {
      parts.push(`[Attachment: ${a.name} (${a.mime})]`);
    }
  }
  return parts.join("\n\n");
}
