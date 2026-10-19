import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TabsIconOnly from "./TabsIconOnly.test.svelte";

/** Asserts `el` has `className` when `present`, and lacks it otherwise. */
export function expectClass(
  el: Element | null,
  className: string,
  present: boolean,
) {
  if (present) {
    expect(el).toHaveClass(className);
  } else {
    expect(el).not.toHaveClass(className);
  }
}

/** Fakes the overflow geometry jsdom does not lay out on a tab list element. */
export function mockScrollMetrics(
  el: HTMLElement,
  metrics: { scrollWidth: number; clientWidth: number; scrollLeft?: number },
) {
  Object.defineProperty(el, "scrollWidth", {
    configurable: true,
    value: metrics.scrollWidth,
  });
  Object.defineProperty(el, "clientWidth", {
    configurable: true,
    value: metrics.clientWidth,
  });
  if (metrics.scrollLeft !== undefined) {
    Object.defineProperty(el, "scrollLeft", {
      configurable: true,
      writable: true,
      value: metrics.scrollLeft,
    });
  }
}

/** Renders `component` with manual activation and Tab 1 clicked; returns Tab 1 and Tab 3. */
export async function renderManual(
  component: Parameters<typeof render>[0],
  props: Record<string, unknown> = {},
) {
  render(component, { props: { activation: "manual", ...props } });

  const tab1 = screen.getByRole("tab", { name: "Tab 1" });
  const tab3 = screen.getByRole("tab", { name: "Tab 3" });
  await user.click(tab1);
  return { tab1, tab3 };
}

/** Renders the icon-only fixture and waits for the icon tabs to register. */
export async function renderIconOnly(props: Record<string, unknown> = {}) {
  const result = render(TabsIconOnly, { props });
  await tick();
  await tick();
  return result;
}
