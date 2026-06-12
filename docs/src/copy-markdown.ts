/** 1 token ≈ 4 characters; 1 kB (1,000 bytes) ≈ 250 tokens. */
const BYTES_PER_TOKEN = 4;

/** Shared across pages so a component's Markdown is fetched at most once per session. */
const markdownCache = new Map<string, string>();

function formatFileSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} kB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function formatTokenEstimate(bytes: number): string {
  const tokens = bytes / BYTES_PER_TOKEN;
  if (tokens < 1000) return `~${Math.round(tokens)} tokens`;
  const k = tokens / 1000;
  const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
  return `~${rounded}k tokens`;
}

export function formatCopyIconDescription(
  copied: boolean,
  bytes: number,
): string {
  const label = copied ? "Copied!" : "Copy Markdown";
  if (bytes <= 0) return label;
  return `${label}\n${formatFileSize(bytes)} (${formatTokenEstimate(bytes)})`;
}

/**
 * Fetch a component's Markdown (cached) and write it to the clipboard.
 * Returns `true` when the clipboard write succeeded.
 */
export async function copyComponentMarkdown(
  name: string,
  href: string,
): Promise<boolean> {
  let markdown = markdownCache.get(name);

  if (!markdown) {
    const response = await fetch(href);
    if (response.ok) {
      markdown = await response.text();
      markdownCache.set(name, markdown);
    }
  }

  if (!markdown) return false;

  await navigator.clipboard.writeText(markdown);
  return true;
}
