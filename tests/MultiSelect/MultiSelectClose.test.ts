import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectClose from "./MultiSelectClose.test.svelte";

describe("MultiSelect close event", () => {
  it('dispatches close with trigger "escape-key" on Escape', async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    expect(combobox).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it('dispatches close with trigger "escape-key" on Alt+ArrowUp', async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    expect(combobox).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    expect(combobox).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("does not dispatch close when selecting an item (menu stays open)", async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    expect(combobox).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("option", { name: "Email" }));
    expect(combobox).toHaveAttribute("aria-expanded", "true");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dispatch close on outside clicks while collapsed", async () => {
    const onClose = vi.fn();
    render(MultiSelectClose, { props: { onClose } });

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
