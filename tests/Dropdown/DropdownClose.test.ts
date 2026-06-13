import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DropdownClose from "./DropdownClose.test.svelte";

describe("Dropdown close event", () => {
  it('dispatches close with trigger "escape-key" on Escape', async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    const button = screen.getByRole("combobox");
    await user.click(button);
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it('dispatches close with trigger "select" when selecting an item', async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    await user.click(screen.getByRole("combobox"));

    const menuItem = screen
      .getByText("Email")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).not.toBeNull();
    await user.click(menuItem as Element);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("does not dispatch close when the menu is already closed", async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    // Menu starts closed; Escape and outside clicks must be no-ops.
    const button = screen.getByRole("combobox");
    button.focus();
    await user.keyboard("{Escape}");
    await user.click(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });
});
