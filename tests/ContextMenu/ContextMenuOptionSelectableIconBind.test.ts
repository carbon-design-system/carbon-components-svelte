import { render, screen } from "@testing-library/svelte";
import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
import { tick } from "svelte";
import ContextMenuOptionSelectableIconBind from "./ContextMenuOptionSelectableIconBind.test.svelte";

// Regression test: a selectable/radio ContextMenuOption used to write
// `icon = Checkmark` / `indented = true` back into the exported props,
// clobbering a consumer's `bind:icon` / `bind:indented`.
describe("ContextMenuOption does not clobber bound icon and indented props in a selectable group", () => {
  it("keeps the consumer's bound icon and indented unchanged while rendering the checkmark", async () => {
    const { component } = render(ContextMenuOptionSelectableIconBind, {
      props: { indented: false },
    });

    await tick();

    expect(component.icon).toBe(CopyFile);
    expect(component.indented).toBe(false);

    const option = screen.getByRole("menuitemcheckbox", { name: "Option 1" });
    expect(option.querySelector(".bx--menu-option__icon")).toBeInTheDocument();
  });
});
