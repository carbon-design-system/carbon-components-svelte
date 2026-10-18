import { screen } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { treeItemById } from "../utils/tree-item-by-id";

/** The checkbox wrapper of a row, the click target that toggles it. */
export function checkboxFor(id: string): HTMLElement {
  const el = treeItemById(id).querySelector(".bx--checkbox-wrapper");
  assert(el instanceof HTMLElement);
  return el;
}

/** Every expanded treeitem; throws when none is expanded. */
export const getAllExpandedItems = () =>
  screen.getAllByRole("treeitem", { expanded: true });

/**
 * Runs `fn`, then asserts exactly one unhandled rejection with `message`
 * surfaced. Swaps out vitest's `unhandledRejection` listeners meanwhile so
 * the collector doesn't fail the run on the deliberate consumer throw.
 */
export async function expectOneUnhandledRejection(
  message: string,
  fn: () => Promise<void>,
) {
  const priorListeners = process.listeners("unhandledRejection");
  process.removeAllListeners("unhandledRejection");

  const rejections: unknown[] = [];
  const capture = (reason: unknown) => rejections.push(reason);
  process.on("unhandledRejection", capture);

  try {
    await fn();
    // Let Node emit the rejection from the deferred microtask.
    await flushMacrotask();
    expect(rejections).toHaveLength(1);
    assert(rejections[0] instanceof Error);
    expect(rejections[0].message).toBe(message);
  } finally {
    process.removeListener("unhandledRejection", capture);
    for (const listener of priorListeners) {
      process.on("unhandledRejection", listener);
    }
  }
}
