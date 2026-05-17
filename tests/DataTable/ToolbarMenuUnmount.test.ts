import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import ToolbarMenuUnmount from "./ToolbarMenuUnmount.test.svelte";

describe("ToolbarMenu overflow cleanup", () => {
  it("resets parent Toolbar overflow when the menu unmounts while open", async () => {
    const { container, rerender } = render(ToolbarMenuUnmount, {
      props: { showMenu: true },
    });

    const toolbar = container.querySelector<HTMLElement>(".bx--table-toolbar");
    const trigger = container.querySelector(".bx--overflow-menu");
    assert(toolbar);
    assert(trigger);

    await user.click(trigger);
    expect(toolbar.style.overflow).toBe("visible");

    rerender({ showMenu: false });
    await tick();

    expect(toolbar.style.overflow).toBe("inherit");
  });
});
