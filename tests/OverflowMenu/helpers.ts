import { screen } from "@testing-library/svelte";
import { user } from "../utils/user";

/** Clicks the overflow menu trigger (the only button by default) and returns it with the rendered menu items. */
export async function openMenu(
  menuButton: HTMLElement = screen.getByRole("button"),
) {
  await user.click(menuButton);
  return { menuButton, items: screen.getAllByRole("menuitem") };
}

/** The `detail` of each `close` event a fixture's `onClose` mock received. */
export function closeDetails(onClose: ReturnType<typeof vi.fn>) {
  return onClose.mock.calls.map(([e]) => (e as CustomEvent).detail);
}
