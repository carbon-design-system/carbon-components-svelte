import { render, screen } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import MenuTooltipEscape from "./MenuTooltipEscape.test.svelte";

describe("Menu and the tooltip of its trigger", () => {
  it("Escape closes a menu opened after the tooltip on the first key", async () => {
    const onclose = vi.fn();
    render(MenuTooltipEscape, { props: { onclose } });
    // Focus from the keyboard shows the trigger's tooltip.
    const trigger = screen.getAllByRole("button")[0];
    trigger.focus();
    await user.keyboard("{Enter}");
    await flushDismiss();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onclose).toHaveBeenCalledWith("escape-key");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
