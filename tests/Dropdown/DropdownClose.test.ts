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

  it('dispatches close with trigger "escape-key" on Tab', async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.keyboard("{Tab}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it("does not select the highlighted item when Tab dispatches close", async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    const button = screen.getByRole("combobox");
    await user.click(button);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Tab}");

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
    expect(button).toHaveTextContent("Slack");
  });

  it('dispatches close with trigger "escape-key" on Shift+Tab', async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Shift>}{Tab}{/Shift}");

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it("does not dispatch close when tabbing through a closed menu", async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    screen.getByRole("combobox").focus();
    await user.keyboard("{Tab}");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dispatch close when clicking the already-selected item", async () => {
    const onClose = vi.fn();
    render(DropdownClose, { props: { onClose } });

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Slack" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
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
