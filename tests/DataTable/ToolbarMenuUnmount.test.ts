import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarMenuTest from "./ToolbarMenu.test.svelte";

describe("ToolbarMenu overflow cleanup", () => {
  it("resets parent Toolbar overflow when the menu unmounts while open", async () => {
    const { container, rerender } = render(ToolbarMenuTest, {
      props: { testComponent: "ToolbarMenu", slotContent: "Item" },
    });

    const toolbar = container.querySelector<HTMLElement>(".bx--table-toolbar");
    const trigger = container.querySelector(".bx--overflow-menu");
    assert(toolbar);
    assert(trigger);

    await user.click(trigger);
    expect(toolbar.style.overflow).toBe("visible");

    await rerender({ showMenu: false });

    expect(toolbar.style.overflow).toBe("inherit");
  });
});
