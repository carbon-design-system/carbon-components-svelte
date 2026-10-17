import { render, screen } from "@testing-library/svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import { contacts } from "../ListBox/family/cases";
import ListBoxHost from "../ListBox/family/ListBoxHost.test.svelte";
import { user } from "../utils/user";

/**
 * Close triggers every list box shares are in tests/ListBox/family/close.test.ts.
 * What is left is how a close treats the current selection.
 */
describe("Dropdown close event", () => {
  const setup = () => {
    const onClose = vi.fn();
    render(ListBoxHost, {
      props: {
        component: Dropdown,
        fieldProps: { items: contacts, labelText: "Contact", selectedId: "0" },
        onClose,
      },
    });
    return onClose;
  };

  it("toggles closed on a second click without dispatching open again", async () => {
    const onOpen = vi.fn();
    render(ListBoxHost, {
      props: {
        component: Dropdown,
        fieldProps: { items: contacts, labelText: "Contact" },
        onOpen,
      },
    });

    const field = screen.getByRole("combobox");
    await user.click(field);
    await user.click(field);
    expect(field).toHaveAttribute("aria-expanded", "false");

    await user.click(field);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("does not select the highlighted item when Tab dispatches close", async () => {
    const onClose = setup();

    const button = screen.getByRole("combobox");
    await user.click(button);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Tab}");

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
    expect(button).toHaveTextContent("Slack");
  });

  it("does not dispatch close when clicking the already-selected item", async () => {
    const onClose = setup();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Slack" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
