import { expect, test } from "bun:test";
import { instrumentDispatcher } from "../scripts/lib/instrument.ts";

test("wraps createEventDispatcher on the same line and keeps other svelte imports", () => {
  const code = [
    "import * as $ from 'svelte/internal/client';",
    'import { createEventDispatcher, getContext } from "svelte";',
    "const dispatch = createEventDispatcher();",
  ].join("\n");
  const out = instrumentDispatcher(code, "ComboBox");
  const lines = out.split("\n");
  expect(lines).toHaveLength(3);
  expect(lines[1]).toContain('import { getContext } from "svelte";');
  expect(lines[1]).toContain(
    'import { createEventDispatcher as __svelteCreateEventDispatcher } from "svelte";',
  );
  expect(lines[1]).toContain(
    'const createEventDispatcher = () => __ccsInstrument("ComboBox", __svelteCreateEventDispatcher());',
  );
  expect(lines[2]).toBe("const dispatch = createEventDispatcher();");
});

test("leaves components without a dispatcher alone", () => {
  const code = 'import { onMount } from "svelte";\nonMount(() => {});';
  expect(instrumentDispatcher(code, "Tag")).toBe(code);
});
