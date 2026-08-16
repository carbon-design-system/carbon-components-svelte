import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComposedModalOverflowMenu from "./ComposedModalOverflowMenu.test.svelte";

describe.each([
  ["non-portalled", false],
  ["portalled", true],
])("OverflowMenu (%s) inside a ComposedModal", (_label, portalMenu) => {
  it("closes the menu on the first Escape and the modal on the second", async () => {
    const onclose = vi.fn();
    render(ComposedModalOverflowMenu, { props: { onclose, portalMenu } });

    const menuButton = screen.getByRole("button", { name: "menu" });
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(onclose).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
