import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderPanelLinkSelect from "./HeaderPanelLinkSelect.test.svelte";

const trigger = () => screen.getByRole("button", { name: "Switcher" });

describe("HeaderPanelLink closes its HeaderAction panel", () => {
  it('closes with trigger "select" and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(HeaderPanelLinkSelect, { props: { onClose } });

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    screen.getByRole("button", { name: "Switch theme" }).focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("closes when an anchor is activated", async () => {
    const onClose = vi.fn();
    render(HeaderPanelLinkSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("link", { name: "Docs" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("stays open when the click handler calls preventDefault", async () => {
    const onClose = vi.fn();
    render(HeaderPanelLinkSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Stay open" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does nothing for a link outside any panel", async () => {
    const onClose = vi.fn();
    render(HeaderPanelLinkSelect, { props: { onClose } });

    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Outside any panel" }));

    // Only the outside click closed the panel, not a select.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });
});
