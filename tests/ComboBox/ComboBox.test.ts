import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ComboBox from "./ComboBox.test.svelte";
import ComboBoxCustom from "./ComboBoxCustom.test.svelte";

describe("ComboBox", () => {
  const getClearButton = () =>
    screen.getByRole("button", { name: "Clear selected item" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(ComboBox);

    expect(screen.getByText("Contact")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Select contact method");
  });

  it("should open menu on click", async () => {
    render(ComboBox);

    const input = screen.getByRole("textbox");
    await user.click(input);

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should handle item selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboBox);

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Email"));

    expect(consoleLog).toHaveBeenCalledWith("select", {
      selectedId: "1",
      selectedItem: { id: "1", text: "Email" },
    });
    expect(screen.getByRole("textbox")).toHaveValue("Email");
  });

  it("should handle keyboard navigation", async () => {
    render(ComboBox);

    const input = screen.getByRole("textbox");
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
    expect(screen.getByRole("textbox")).toHaveValue("");
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
    expect(screen.getByRole("textbox")).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    expect(screen.getByRole("textbox")).toHaveValue("");
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
    expect(screen.getByRole("textbox")).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard(" ");

    expect(consoleLog).toHaveBeenCalledWith("clear", expect.any(String));
    expect(screen.getByRole("textbox")).toHaveValue("");
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

    expect(screen.getByRole("textbox")).toBeDisabled();
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

    expect(screen.getByRole("textbox")).toHaveClass("bx--text-input--light");
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

    const input = screen.getByRole("textbox");
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

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(consoleLog).toHaveBeenCalledWith("clear", "clear");
  });

  it("should handle disabled items", async () => {
    render(ComboBoxCustom);

    await user.click(screen.getByRole("textbox"));
    const disabledOption = screen.getByText(/Fax/).closest('[role="option"]');
    assert(disabledOption);
    expect(disabledOption).toHaveAttribute("disabled", "true");
    expect(disabledOption).toHaveAttribute("aria-disabled", "true");

    await user.click(disabledOption);
    expect(screen.getByRole("textbox")).toHaveValue("");

    // Dropdown remains open
    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();
  });

  it("should handle custom item display", async () => {
    render(ComboBoxCustom);

    await user.click(screen.getByRole("textbox"));
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

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });

  it("should programmatically clear selection", async () => {
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    const textbox = screen.getByRole("textbox");
    expect(textbox).toHaveValue("Email");
    await user.click(screen.getByText("Clear"));
    expect(textbox).toHaveValue("");
    expect(textbox).toHaveFocus();
  });

  it("should not re-focus textbox if clearOptions.focus is false", async () => {
    render(ComboBoxCustom, {
      props: {
        selectedId: "1",
        clearOptions: { focus: false },
      },
    });

    const textbox = screen.getByRole("textbox");
    expect(textbox).toHaveValue("Email");
    await user.click(screen.getByText("Clear"));
    expect(textbox).toHaveValue("");
    expect(textbox).not.toHaveFocus();
  });

  it("should close menu on Escape key", async () => {
    render(ComboBox);

    expect(screen.getByRole("textbox")).toHaveValue("");

    const input = screen.getByRole("textbox");
    await user.click(input);

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("should close menu and clear selection on Escape key", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(screen.getByRole("textbox")).toHaveValue("Email");

    const input = screen.getByRole("textbox");
    await user.click(input);

    const dropdown = screen.getAllByRole("listbox")[1];
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("textbox")).toHaveFocus();
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
    const input = screen.getByRole("textbox");
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
    const input = screen.getByRole("textbox");
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
    const input = screen.getByRole("textbox");
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
});
