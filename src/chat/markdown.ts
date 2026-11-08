/**
 * Minimal markdown → safe HTML for chat bubbles.
 * Supports: **bold**, `code`, newlines. Escapes HTML first.
 */
export function renderBasicMarkdown(src: string): string {
  const escaped = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withCode = escaped.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );
  const withBold = withCode.replace(
    /\*\*([^*]+)\*\*/g,
    "<strong>$1</strong>"
  );
  return withBold.replace(/\n/g, "<br/>");
}
