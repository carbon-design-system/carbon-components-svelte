import { createHash } from "node:crypto";
import type { WebView } from "bun";

/** Browser handle used by release-screenshot recipes. */
export type View = WebView;

export type Recipe = {
  /** `#app` width in CSS px. Default 420. */
  width?: number;
  /** Capture the whole viewport at this size instead of `#app` (fixed overlays). */
  viewport?: { width: number; height: number };
  /** Never cached, for shots that depend on the clock. */
  volatile?: boolean;
  /** Runs after mount, before capture. */
  act?: (view: View) => Promise<void>;
};

const MARKER = /<!--\s*(?:screenshot|video):\s*([\w-]+)\s*[—-]/g;
const SVELTE_FENCE = /```svelte\n([\s\S]*?)```/g;

/**
 * Pair each `<!-- screenshot|video: name — text -->` marker in a release body
 * with the last ```svelte fence before it. GitHub returns CRLF, which is
 * normalized first. Markers with no fence come back in `skipped`.
 */
export function extractSnippets(notes: string): {
  snippets: Map<string, string>;
  skipped: string[];
} {
  const text = notes.replaceAll("\r\n", "\n");
  const snippets = new Map<string, string>();
  const skipped: string[] = [];
  for (const marker of text.matchAll(MARKER)) {
    const fence = [...text.slice(0, marker.index).matchAll(SVELTE_FENCE)].at(
      -1,
    );
    if (fence) snippets.set(marker[1], fence[1]);
    else skipped.push(marker[1]);
  }
  return { snippets, skipped };
}

const UNSAFE_IN_LITERAL = /[<\u2028\u2029]/g;

/**
 * Embed a value in page-evaluated code as a JS literal. `JSON.stringify`
 * alone leaves `<` and the U+2028/U+2029 line separators raw, which are not
 * safe in every context code can end up in.
 */
export function literal(value: unknown): string {
  return JSON.stringify(value).replace(
    UNSAFE_IN_LITERAL,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

/** Short content hash of JSON-serializable parts, for cache keys. */
export function fingerprint(parts: unknown[]): string {
  return createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 24);
}

/** Evaluate JS in the page. */
export function ev<T = unknown>(view: View, js: string): Promise<T> {
  return view.evaluate(js) as Promise<T>;
}

/** Inject a stylesheet. Use it to reserve room for popups. */
export function css(view: View, text: string): Promise<unknown> {
  return ev(
    view,
    `document.head.append(Object.assign(document.createElement("style"), { textContent: ${literal(text)} }))`,
  );
}

/** Wait for fonts, running animations, and two frames. */
export function settle(view: View): Promise<unknown> {
  return ev(
    view,
    "Promise.all([document.fonts.ready, ...document.getAnimations().map((a) => a.finished)]).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))",
  );
}

/** Resolve once `selector` matches. */
export function waitFor(view: View, selector: string): Promise<unknown> {
  return ev(
    view,
    `new Promise((r) => { const t = setInterval(() => document.querySelector(${literal(selector)}) && (clearInterval(t), r()), 10) })`,
  );
}

/**
 * Find the nth element matching `selector` whose text, `aria-label`, or
 * `title` matches `pattern`, and return a selector `view.click` can use.
 */
export async function tag(
  view: View,
  selector: string,
  pattern: RegExp,
  nth = 0,
): Promise<string> {
  const id = `t${Math.random().toString(36).slice(2)}`;
  const found = await ev<boolean>(
    view,
    `(() => {
      const el = [...document.querySelectorAll(${literal(selector)})]
        .filter((e) => ${pattern}.test(e.textContent + " " + (e.getAttribute("aria-label") ?? "") + " " + (e.getAttribute("title") ?? "")))[${nth}];
      if (!el) return false;
      el.setAttribute("data-t", ${literal(id)});
      return true;
    })()`,
  );
  if (!found) throw new Error(`No element for ${selector} ${pattern}`);
  return `[data-t="${id}"]`;
}

/** Move the mouse away, and drop the focus ring unless `blur` is false. */
export async function quiet(view: View, blur = true): Promise<void> {
  if (blur) await ev(view, "document.activeElement?.blur()");
  await view.cdp("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: 0,
    y: 0,
  });
}
