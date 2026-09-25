import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.test.svelte";
import { getInput } from "./helpers";

describe("ComboBox", () => {
  it("should preserve custom value when allowCustomValue is true and user clicks away", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Custom Value");
    await user.click(document.body);
    expect(input).toHaveValue("Custom Value");
  });

  it("should not dispatch select with an empty selectedId on blur when allowCustomValue input is empty", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.click(document.body);

    expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());
  });

  it("should not dispatch select with an empty selectedId after clearing a prior selection then blurring", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.click(screen.getByText("Email"));
    consoleLog.mockClear();

    await user.click(input);
    await user.clear(input);
    await user.click(document.body);

    const calls = consoleLog.mock.calls.filter(([type]) => type === "select");
    for (const [, detail] of calls) {
      expect(detail.selectedId).not.toBe("");
    }
  });

  it("should preserve custom value when allowCustomValue is true and menu closes", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "My Custom Text");
    await user.keyboard("{Tab}");
    expect(input).toHaveValue("My Custom Text");
  });

  it("should clear custom value when allowCustomValue is false (default behavior)", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.type(input, "Custom Value");
    await user.click(document.body);
    expect(input).toHaveValue("");
  });

  it("should keep an externally-updated selection after the menu closes", async () => {
    const { rerender } = render(ComboBox, { props: { selectedId: "0" } });

    const input = getInput();
    expect(input).toHaveValue("Slack");

    // Simulate a parent updating selectedId from outside this ComboBox.
    await rerender({ selectedId: "2" });
    expect(input).toHaveValue("Fax");

    // Open then dismiss the menu without making a new selection.
    await user.click(input);
    await user.click(document.body);

    expect(input).toHaveValue("Fax");
  });

  it("should restore the initial controlled selection's label on blur with a non-matching value", async () => {
    render(ComboBox, { props: { selectedId: "1", allowCustomValue: false } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(input);
    await user.clear(input);
    await user.type(input, "no-match");
    await user.keyboard("{Tab}");

    expect(input).toHaveValue("Email");
  });

  it("should preserve custom value when allowCustomValue is true and Enter is pressed", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "New Custom Entry");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("New Custom Entry");
  });

  it("should still allow selecting items from list when allowCustomValue is true", async () => {
    render(ComboBox, { props: { allowCustomValue: true } });

    const input = getInput();
    await user.click(input);
    await user.click(screen.getByText("Email"));
    expect(input).toHaveValue("Email");
  });

  it("should show all items when reopening after selection when clearFilterOnOpen is true", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: true } });

    const input = getInput();
    await user.click(input);
    await user.click(screen.getByText("Email"));
    expect(input).toHaveValue("Email");

    await user.click(document.body);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.click(input);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Slack");
    expect(options[1]).toHaveTextContent("Email");
    expect(options[2]).toHaveTextContent("Fax");
  });

  it("should retain filter when reopening by default (clearFilterOnOpen is false)", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: false } });

    const input = getInput();
    await user.click(input);
    await user.click(screen.getByText("Email"));
    expect(input).toHaveValue("Email");

    await user.click(document.body);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.click(input);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Email");
  });

  it("should clear filter on open but restore value on close without selection", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: true, selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(input);
    expect(input).toHaveValue("");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);

    await user.click(document.body);
    expect(input).toHaveValue("Email");
  });

  it("should restore value when closing via chevron with clearFilterOnOpen", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: true, selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    // Open via chevron
    const openChevron = screen.getByTitle("Open menu");
    await user.click(openChevron);
    expect(input).toHaveValue("");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);

    // Close via chevron (input may still have focus)
    const closeChevron = screen.getByTitle("Close menu");
    await user.click(closeChevron);
    expect(input).toHaveValue("Email");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2579
  it("should restore value when closing with clearFilterOnOpen after typing filter text", async () => {
    render(ComboBox, { props: { clearFilterOnOpen: true, selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(input);
    expect(input).toHaveValue("");

    await user.type(input, "Sl");
    expect(input).toHaveValue("Sl");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Slack");

    const closeChevron = screen.getByTitle("Close menu");
    await user.click(closeChevron);

    expect(input).toHaveValue("Email");
  });

  it("should reset value when menu closes with no selectedItem, input not focused, and allowCustomValue is false", async () => {
    render(ComboBox, { props: { allowCustomValue: false } });

    const input = getInput();
    await user.click(input);
    await user.type(input, "Custom Text");

    await user.click(document.body);
    expect(input).not.toHaveFocus();

    // Value should be reset when:
    // - no selectedItem
    // - input is not focused (ref.contains(document.activeElement) is false)
    // - allowCustomValue is false
    expect(input).toHaveValue("");
  });

  it("should clear input display when items clear but selectedId is preserved", async () => {
    const items = [
      { id: "0", text: "Slack", price: 100 },
      { id: "1", text: "Email", price: 200 },
    ];
    const { rerender } = render(ComboBox, {
      props: {
        items,
        selectedId: "1",
        value: "Email",
      },
    });

    const input = getInput();
    expect(input).toHaveValue("Email");

    rerender({ items: [], selectedId: "1" });
    await tick();

    expect(input).toHaveValue("");
  });
});
