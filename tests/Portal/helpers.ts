import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import FloatingPortalTest from "./FloatingPortal.test.svelte";
import PortalTest from "./Portal.test.svelte";

/** Renders the FloatingPortal fixture open and returns the render result with its portal element. */
export async function renderOpen(
  props: Partial<ComponentProps<FloatingPortalTest>> = {},
) {
  const result = render(FloatingPortalTest, {
    props: { open: true, ...props },
  });
  const content = await screen.findByText("Floating content");
  const portal = content.closest("[data-floating-portal]");
  assert(portal instanceof HTMLElement);
  return { ...result, content, portal };
}

/** Renders the Portal fixture and returns the render result with its portal element. */
export async function renderPortal(
  props: Partial<ComponentProps<PortalTest>> = {},
) {
  const result = render(PortalTest, { props });
  const content = await screen.findByText(
    props.portalContent ?? "Portal content",
  );
  const portal = content.closest("[data-portal]");
  assert(portal instanceof HTMLElement);
  return { ...result, content, portal };
}

/** Appends a div to the body for use as a portal target, removed when the test finishes. */
export function createTarget() {
  const target = document.createElement("div");
  document.body.appendChild(target);
  onTestFinished(() => target.remove());
  return target;
}

/** Counts the calls to an add/removeEventListener spy for one event type. */
export function countCalls(spy: ReturnType<typeof vi.spyOn>, type: string) {
  return spy.mock.calls.filter(([event]: unknown[]) => event === type).length;
}

/** Appends a visible `.bx--modal` containing an element to the body and returns both. */
export function makeVisibleModal() {
  const modal = document.createElement("div");
  modal.classList.add("bx--modal", "is-visible");
  const element = document.createElement("div");
  modal.appendChild(element);
  document.body.appendChild(modal);
  return { modal, element };
}
