// Who created a side effect in the preview, from the call stack: REPL code
// (blob: modules), library modules (/pkg/ccs@…, /pkg/icons@…), the Svelte
// runtime (/pkg/svelte@…) or something else. Frames from the sandbox itself
// are skipped.

const SANDBOX_FRAME = /\/sandbox\/|^Error/;
const LIBRARY_FILE =
  /\/pkg\/(?:ccs|icons)@[^/]+\/svelte@[^/]+\/((?:src|lib)\/[^:)]+)/;

/** @returns {{ kind: "user" | "library" | "svelte" | "other"; file?: string }} */
export function classifyStack(stack) {
  for (const line of String(stack ?? "").split("\n")) {
    if (!line.trim() || SANDBOX_FRAME.test(line)) continue;
    if (line.includes("blob:")) return { kind: "user" };
    const lib = LIBRARY_FILE.exec(line);
    if (lib) return { kind: "library", file: lib[1] };
    if (line.includes("/pkg/svelte@")) return { kind: "svelte" };
    return { kind: "other" };
  }
  return { kind: "other" };
}
