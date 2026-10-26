import { render } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ListBoxHost from "../ListBox/family/ListBoxHost.test.svelte";
import { contacts } from "../ListBox/family/cases";
import { user } from "../utils/user";
import { getInput } from "./helpers";

/**
 * Close triggers every list box shares are in tests/ListBox/family/close.test.ts.
 * What is left is how a close interacts with the typed value.
 */
describe("ComboBox close event", () => {
  const setup = (fieldProps: Record<string, unknown> = {}) => {
    const onClose = vi.fn();
    render(ListBoxHost, {
      props: {
        component: ComboBox,
        fieldProps: { items: contacts, labelText: "Contact", ...fieldProps },
        onClose,
      },
    });
    return onClose;
  };

  it('dispatches close with trigger "select" when selecting via Enter', async () => {
    const onClose = setup();

    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(input).toHaveValue("Slack");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
  });

  it("restores the value on close without a selection and still dispatches close", async () => {
    const onClose = setup({
      clearFilterOnOpen: true,
      selectedId: "1",
      value: "Email",
    });

    const input = getInput();
    expect(input).toHaveValue("Email");

    // Opening with clearFilterOnOpen blanks the filter to show all items.
    await user.click(input);
    expect(input).toHaveValue("");

    // Closing without a new selection restores the previous value.
    await user.click(document.body);
    expect(input).toHaveValue("Email");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it('dispatches close with trigger "escape-key" on Tab when the text is already the selection', async () => {
    const onClose = setup({ selectedId: "1", value: "Email" });

    await user.click(getInput());
    await user.keyboard("{Tab}");

    // Nothing new was selected, so Tab must not report a selection.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
  });
});
