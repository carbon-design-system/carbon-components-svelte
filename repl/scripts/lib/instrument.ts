// Build-time instrumentation for the REPL's Carbon event log.

const SVELTE_IMPORT = /import\s*\{([^}]*)\}\s*from\s*"svelte";/;

/**
 * Event log hook: wrap a library component's createEventDispatcher so every
 * dispatch also reports { component, type, detail } to the preview's
 * devtools (`globalThis.__ccsDevtools`). A no-op outside the REPL preview.
 */
export function instrumentDispatcher(code: string, component: string) {
  const m = SVELTE_IMPORT.exec(code);
  if (!m) return code;
  const names = m[1]
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.includes("createEventDispatcher")) return code;
  const rest = names.filter((n) => n !== "createEventDispatcher");
  const replacement = [
    rest.length ? `import { ${rest.join(", ")} } from "svelte";` : "",
    'import { createEventDispatcher as __svelteCreateEventDispatcher } from "svelte";',
    'import { instrument as __ccsInstrument } from "carbon-components-svelte/__devtools.js";',
    `const createEventDispatcher = () => __ccsInstrument(${JSON.stringify(component)}, __svelteCreateEventDispatcher());`,
  ]
    .filter(Boolean)
    .join(" ");
  // Same line, so the module's source map stays aligned.
  return code.replace(m[0], replacement);
}

export const DEVTOOLS_MODULE = `export function instrument(component, dispatch) {
  return (type, detail, options) => {
    const result = dispatch(type, detail, options);
    globalThis.__ccsDevtools?.event?.({ component, type, detail, cancelled: result === false });
    return result;
  };
}
`;
