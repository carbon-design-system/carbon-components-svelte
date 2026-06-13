import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboBoxClose from "./ComboBoxClose.test.svelte";

describe("ComboBox close event", () => {
  const getInput = () => {
    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    return input;
  };

  it('dispatches close with trigger "escape-key" on Escape', async () => {
    const onClose = vi.fn();
    render(ComboBoxClose, { props: { onClose } });

    await user.click(getInput());
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });

  it('dispatches close with trigger "outside-click" when clicking outside', async () => {
    const onClose = vi.fn();
    render(ComboBoxClose, { props: { onClose } });

    await user.click(getInput());
    expect(screen.getByRole("listbox")).toBeVisible();

    await user.click(screen.getByText("Outside"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it('dispatches close with trigger "select" when clicking an item', async () => {
    const onClose = vi.fn();
    render(ComboBoxClose, { props: { onClose } });

    await user.click(getInput());
    await user.click(screen.getByText("Email"));

    expect(getInput()).toHaveValue("Email");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it('dispatches close with trigger "select" when selecting via Enter', async () => {
    const onClose = vi.fn();
    render(ComboBoxClose, { props: { onClose } });

    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(input).toHaveValue("Slack");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("does not dispatch close when the menu is already closed", async () => {
    const onClose = vi.fn();
    render(ComboBoxClose, { props: { onClose } });

    // Escape while collapsed clears state but must not surface a close.
    getInput().focus();
    await user.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("restores the value on close without a selection and still dispatches close", async () => {
    const onClose = vi.fn();
    render(ComboBoxClose, {
      props: {
        onClose,
        clearFilterOnOpen: true,
        selectedId: "1",
        value: "Email",
      },
    });

    const input = getInput();
    expect(input).toHaveValue("Email");

    // Opening with clearFilterOnOpen blanks the filter to show all items.
    await user.click(input);
    expect(input).toHaveValue("");

    // Closing without a new selection restores the previous value.
    await user.click(screen.getByText("Outside"));
    expect(input).toHaveValue("Email");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });
});
