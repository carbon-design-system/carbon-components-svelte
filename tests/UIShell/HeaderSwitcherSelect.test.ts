import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderSwitcherSelect from "./HeaderSwitcherSelect.test.svelte";

const trigger = () => screen.getByRole("button", { name: "Acme" });

describe("ProfileMenuItem closes its HeaderSwitcher", () => {
  it('closes with trigger "select" and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(HeaderSwitcherSelect, { props: { onClose } });

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    screen.getByRole("button", { name: "Initech" }).focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("closes when an anchor is activated", async () => {
    const onClose = vi.fn();
    render(HeaderSwitcherSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("link", { name: "Globex" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("stays open when the click handler calls preventDefault", async () => {
    const onClose = vi.fn();
    render(HeaderSwitcherSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Stay open" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(onClose).not.toHaveBeenCalled();
  });
});
