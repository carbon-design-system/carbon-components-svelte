import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import InlineEdit from "./InlineEdit.test.svelte";

const editButton = () => screen.getByRole("button", { name: "Edit" });
const saveButton = () => screen.getByRole("button", { name: "Save" });
const cancelButton = () => screen.getByRole("button", { name: "Cancel" });

describe("InlineEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current value in a text input", () => {
    render(InlineEdit, { value: "default" });
    expect(screen.getByDisplayValue("default")).toBeInTheDocument();
  });

  it("enters edit mode when the edit button is clicked", async () => {
    render(InlineEdit);
    await user.click(editButton());
    expect(saveButton()).toBeInTheDocument();
    expect(cancelButton()).toBeInTheDocument();
  });

  it("enters edit mode when the input is clicked", async () => {
    render(InlineEdit);
    await user.click(screen.getByDisplayValue("default"));
    expect(saveButton()).toBeInTheDocument();
  });

  it("selects the input's text on entering edit mode when selectTextOnFocus is set", async () => {
    render(InlineEdit, { value: "default", selectTextOnFocus: true });
    await user.click(editButton());

    const input = screen.getByDisplayValue<HTMLInputElement>("default");
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("default".length);
  });

  it("disables save and cancel until the value actually changes", async () => {
    render(InlineEdit);
    await user.click(editButton());
    expect(saveButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();

    const input = screen.getByDisplayValue("default");
    await user.type(input, " updated");

    expect(saveButton()).toBeEnabled();
    expect(cancelButton()).toBeEnabled();
  });

  it("treats a whitespace-only change as unchanged", async () => {
    render(InlineEdit, { value: "test" });
    await user.click(editButton());

    const input = screen.getByDisplayValue("test");
    await user.type(input, "   ");

    expect(saveButton()).toBeDisabled();
    expect(cancelButton()).toBeDisabled();
  });

  it("saves and stays in edit mode when the save button is clicked", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(InlineEdit);
    await user.click(editButton());
    await user.type(screen.getByDisplayValue("default"), " updated");
    await user.click(saveButton());

    expect(consoleLog).toHaveBeenCalledWith("save");
    expect(saveButton()).toBeInTheDocument();
    expect(cancelButton()).toBeInTheDocument();
  });

  it("cancels, reverts the value, and stays in edit mode when the cancel button is clicked", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(InlineEdit, { value: "default" });
    await user.click(editButton());
    await user.type(screen.getByDisplayValue("default"), " updated");
    await user.click(cancelButton());

    expect(consoleLog).toHaveBeenCalledWith("cancel");
    expect(screen.getByDisplayValue("default")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
  });

  it("auto-saves and exits edit mode on blur when the value changed", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(InlineEdit);
    await user.click(editButton());
    const input = screen.getByDisplayValue("default");
    await user.type(input, " updated");
    await fireEvent.focusOut(input);

    expect(consoleLog).toHaveBeenCalledWith("save");
    expect(editButton()).toBeInTheDocument();
  });

  it("auto-cancels and exits edit mode on blur when the value is unchanged", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(InlineEdit);
    await user.click(editButton());
    const input = screen.getByDisplayValue("default");
    await fireEvent.focusOut(input);

    expect(consoleLog).toHaveBeenCalledWith("cancel");
    expect(editButton()).toBeInTheDocument();
  });

  it("cancels, reverts the value, and exits edit mode on Escape", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(InlineEdit, { value: "default" });
    await user.click(editButton());
    const input = screen.getByDisplayValue("default");
    await user.type(input, " updated");
    await user.keyboard("{Escape}");

    expect(consoleLog).toHaveBeenCalledWith("cancel");
    expect(screen.getByDisplayValue("default")).toBeInTheDocument();
    expect(editButton()).toBeInTheDocument();
  });

  it("does not save on Enter when the value is unchanged", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(InlineEdit);
    await user.click(editButton());
    await user.keyboard("{Enter}");
    expect(consoleLog).not.toHaveBeenCalledWith("save");
  });

  it("saves on Enter when the value changed, and stays in edit mode", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    render(InlineEdit);
    await user.click(editButton());
    await user.type(screen.getByDisplayValue("default"), " updated");
    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("save");
    await waitFor(() => expect(saveButton()).toBeInTheDocument());
  });

  it("shows invalidText and disables save while invalid, even with a change", async () => {
    render(InlineEdit, {
      invalid: true,
      invalidText: "This field is required",
    });
    await user.click(editButton());
    await user.type(screen.getByDisplayValue("default"), " updated");

    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(cancelButton()).toBeEnabled();
  });

  it("disables the input and shows no edit affordance when disabled", () => {
    render(InlineEdit, { disabled: true });

    const input = screen.getByDisplayValue("default");
    expect(input).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit off" }),
    ).not.toBeInTheDocument();
  });

  it("suppresses invalid styling while disabled, matching TextInput", () => {
    render(InlineEdit, {
      disabled: true,
      invalid: true,
      invalidText: "This field is required",
    });

    expect(
      screen.queryByText("This field is required"),
    ).not.toBeInTheDocument();
  });

  it("renders a readonly input with a toggletip trigger in readonly mode", async () => {
    render(InlineEdit, {
      readonly: true,
      readonlyLabel: "Edit off",
      readonlyToggletipText: "This field is read-only",
    });

    const input = screen.getByDisplayValue("default");
    expect(input).toHaveAttribute("readonly");
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Edit off"));
    expect(screen.getByText("This field is read-only")).toBeInTheDocument();
  });
});
