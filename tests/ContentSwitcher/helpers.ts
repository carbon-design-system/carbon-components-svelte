import { render } from "@testing-library/svelte";
import { tick } from "svelte";

/** Child registration flushes on a microtask (`batchStoreUpdates`). */
export async function renderAndFlush(
  ...args: Parameters<typeof render>
): Promise<ReturnType<typeof render>> {
  const result = render(...args);
  await tick();
  await tick();
  return result;
}
