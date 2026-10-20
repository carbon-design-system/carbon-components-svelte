import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SearchMenu from "./SearchMenu.test.svelte";

/** Renders a SearchMenu fixture, clicks its input to open the menu, and returns the input. */
export async function openMenu(
  Component: Parameters<typeof render>[0] = SearchMenu,
  props: Record<string, unknown> = {},
) {
  render(Component, { props });
  const input = screen.getByRole("combobox");
  await user.click(input);
  return input;
}
