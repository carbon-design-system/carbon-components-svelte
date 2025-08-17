import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ComboBox from "./ComboBox.test.svelte";
import ComboBoxCustom from "./ComboBoxCustom.test.svelte";

describe("ComboBox", () => {
  const getInput = () => screen.getByRole("combobox");
  const getClearButton = () =>
    screen.getByRole("button", { name: "Clear selected item" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(ComboBox);

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(getInput()).toHaveAttribute("placeholder", "Select contact method");
  });

  it("should open menu on click", async () => {
    render(ComboBox);

    await user.click(getInput());

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should handle item selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox);

    await user.click(getInput());
    await user.click(screen.getByText("Email"));

    expect(consoleLog).toHaveBeenCalledWith("select", {
      selectedId: "1",
      selectedItem: { id: "1", text: "Email" },
    });
    expect(getInput()).toHaveValue("Email");
  });

  it("should handle keyboard navigation", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("Slack");
  });

  it("should handle clear selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    await user.click(getClearButton());

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    expect(getInput()).toHaveValue("");
  });

  it("should handle clear selection via keyboard navigation (Enter)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(consoleLog).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    expect(getInput()).toHaveValue("");
  });

  it("should handle clear selection via keyboard navigation (Space)", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(consoleLog).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard(" ");

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    expect(getInput()).toHaveValue("");
  });

  it("should use custom translations when translateWithId is provided", () => {
    const customTranslations = {
      clearSelection: "Remove selected item",
      clearAll: "Remove all items",
    } as const;

    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
        translateWithIdSelection: (id) => customTranslations[id],
      },
    });

    const clearButton = screen.getByRole("button", {
      name: "Remove selected item",
    });
    expect(clearButton).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    render(ComboBox, { props: { disabled: true } });

    expect(getInput()).toBeDisabled();
    expect(screen.getByText("Contact")).toHaveClass("bx--label--disabled");
  });

  it("should handle hidden label", () => {
    render(ComboBox, {
      props: {
        titleText: "Hidden Label",
        hideLabel: true,
      },
    });

    expect(screen.getByText("Hidden Label")).toHaveClass("bx--visually-hidden");
  });

  it("should handle invalid state", () => {
    render(ComboBox, {
      props: {
        invalid: true,
        invalidText: "Invalid selection",
      },
    });

    expect(screen.getByRole("listbox")).toHaveAttribute("data-invalid", "true");
    expect(screen.getByText("Invalid selection")).toBeInTheDocument();
  });

  it("should handle warning state", () => {
    render(ComboBox, {
      props: {
        warn: true,
        warnText: "Warning message",
      },
    });

    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("should handle helper text", () => {
    render(ComboBox, { props: { helperText: "Helper message" } });

    expect(screen.getByText("Helper message")).toBeInTheDocument();
  });

  it("should handle light variant", () => {
    render(ComboBox, { props: { light: true } });

    expect(getInput()).toHaveClass("bx--text-input--light");
  });

  test.each([
    ["sm", "bx--list-box--sm"],
    ["xl", "bx--list-box--xl"],
  ] as const)("should handle size variants", (size, className) => {
    render(ComboBox, { props: { size } });
    expect(screen.getByRole("listbox")).toHaveClass(className);
  });

  it("should handle filtering items", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.type(input, "em");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Email");

    await user.clear(input);
    expect(input).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(3);

    await user.click(document.body);
    expect(input).not.toHaveFocus();

    await user.keyboard("{Tab}");
    expect(input).toHaveFocus();

    await user.type(input, "a");
    await user.click(screen.getAllByRole("option")[1]);
    expect(input).toHaveValue("Email");

    await user.click(document.body);
    expect(input).not.toHaveFocus();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("should clear input when clicking clear button", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox, { props: { selectedId: "1" } });

    expect(consoleLog).not.toBeCalled();
    await user.click(getClearButton());

    expect(getInput()).toHaveValue("");
    expect(consoleLog).toHaveBeenCalledWith("clear", "clear");
  });

  it("should handle disabled items", async () => {
    render(ComboBoxCustom);

    await user.click(getInput());
    const disabledOption = screen.getByText(/Fax/).closest('[role="option"]');
    assert(disabledOption);
    expect(disabledOption).toHaveAttribute("disabled", "true");
    expect(disabledOption).toHaveAttribute("aria-disabled", "true");

    await user.click(disabledOption);
    expect(getInput()).toHaveValue("");

    // Dropdown remains open
    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should handle custom item display", async () => {
    render(ComboBoxCustom);

    await user.click(getInput());
    const options = screen.getAllByRole("option");

    expect(options[0]).toHaveTextContent("Item Slack");
    expect(options[1]).toHaveTextContent("Item Email");
    expect(options[2]).toHaveTextContent("Item Fax");
  });

  it("should handle top direction", async () => {
    render(ComboBoxCustom, { props: { direction: "top" } });

    await user.click(screen.getAllByRole("button")[0]);
    expect(screen.getByRole("listbox")).toHaveClass("bx--list-box--up");
  });

  it("should clear filter on selection clear", async () => {
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    await user.click(getClearButton());
    expect(getInput()).toHaveValue("");
  });

  it("should programmatically clear selection", async () => {
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("should not re-focus textbox if clearOptions.focus is false", async () => {
    render(ComboBoxCustom, {
      props: {
        selectedId: "1",
        clearOptions: { focus: false },
      },
    });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(input).not.toHaveFocus();
  });

  it("should close menu on Escape key", async () => {
    render(ComboBox);

    expect(getInput()).toHaveValue("");

    const input = getInput();
    await user.click(input);

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveFocus();
  });

  it("should close menu and clear selection on Escape key", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(getInput()).toHaveValue("Email");

    const input = getInput();
    await user.click(input);

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveFocus();
  });

  it("should use custom shouldFilterItem function", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Apple" },
          { id: "2", text: "Banana" },
          { id: "3", text: "Cherry" },
        ],
        shouldFilterItem: (item: { text: string }, value: string) =>
          item.text.startsWith(value),
      },
    });
    const input = getInput();
    await user.click(input);
    await user.type(input, "B");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
  });

  it("should use custom itemToString function", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Apple" },
          { id: "2", text: "Banana" },
        ],
        itemToString: (item: { text: string }) => `Item ${item.text}`,
      },
    });
    const input = getInput();
    await user.click(input);
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Item Apple");
    await user.click(options[1]);
    expect(input).toHaveValue("Item Banana");
  });

  it("should open menu if open prop is true on mount", () => {
    render(ComboBox, { props: { open: true } });
    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should skip disabled items during keyboard navigation", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "A" },
          { id: "2", text: "B", disabled: true },
          { id: "3", text: "C" },
        ],
      },
    });
    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}"); // should highlight A
    await user.keyboard("{ArrowDown}"); // should skip B and highlight C
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("C");
  });

  it("should not show helper text if warn is true", () => {
    render(ComboBox, { props: { helperText: "Help", warn: true } });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("should not show helper text if invalid is true", () => {
    render(ComboBox, { props: { helperText: "Help", invalid: true } });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("should not open menu when input is focused via keyboard", async () => {
    render(ComboBox);

    await user.keyboard("{Tab}");
    expect(getInput()).toHaveFocus();

    const dropdown = screen.queryAllByRole("listbox")[1];
    expect(dropdown).toBeUndefined();
  });
});
