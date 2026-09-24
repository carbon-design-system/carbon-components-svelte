import { tick } from "svelte";
import { flushMacrotask } from "./flush-macrotask";

/**
 * `use:formReset` calls back on the next macrotask, once the form has
 * restored its controls. Wait that macrotask for the callback to run, then
 * a tick for the bound values it writes to reach the DOM.
 */
export const flushFormReset = async () => {
  await flushMacrotask();
  await tick();
};
