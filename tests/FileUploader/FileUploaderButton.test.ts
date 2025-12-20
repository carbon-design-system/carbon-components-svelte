import { render, screen } from "@testing-library/svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import DocumentAdd from "carbon-icons-svelte/lib/DocumentAdd.svelte";
import { user } from "../setup-tests";
import FileUploaderButton from "./FileUploaderButton.test.svelte";

describe("FileUploaderButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function simulateFileSelection(input: HTMLInputElement, files: File[]) {
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      dataTransfer.items.add(file);
    }

    Object.defineProperty(input, "files", {
      value: dataTransfer.files,
      writable: true,
      configurable: true,
    });

    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  it("should render with default props", () => {
    const { container } = render(FileUploaderButton);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Add file");

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute("multiple");
  });

  it("should render with custom labelText", () => {
    render(FileUploaderButton, {
      props: { labelText: "Choose File" },
    });

    const button = screen.getByText("Choose File");
    expect(button).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    const { container } = render(FileUploaderButton, {
      props: { disabled: true },
    });

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bx--btn--disabled");

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toBeDisabled();
  });

  it("should respect accept prop", () => {
    const { container } = render(FileUploaderButton, {
      props: { accept: [".jpg", ".png", "image/*"] },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("accept", ".jpg,.png,image/*");
  });

  it("should handle multiple prop", () => {
    const { container } = render(FileUploaderButton, {
      props: { multiple: true },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("multiple");
  });

  it("should update label text when files are selected (single file)", async () => {
    const { container } = render(FileUploaderButton, {
      props: { labelText: "Add file" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    simulateFileSelection(input, [file]);

    await vi.waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("test.txt");
    });
  });

  it("should update label text when multiple files are selected", async () => {
    const { container } = render(FileUploaderButton, {
      props: { labelText: "Add file", multiple: true },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("2 files");
    });
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2436
  it("should reset label text when files are cleared", async () => {
    const { container } = render(FileUploaderButton, {
      props: { labelText: "Add file" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    simulateFileSelection(input, [file]);

    await vi.waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("test.txt");
    });

    // Clear files by resetting the input element
    const emptyDataTransfer = new DataTransfer();
    Object.defineProperty(input, "files", {
      value: emptyDataTransfer.files,
      writable: true,
      configurable: true,
    });
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Add file");
    });
  });

  it("should not change label when disableLabelChanges is true", async () => {
    const { container } = render(FileUploaderButton, {
      props: { labelText: "Add file", disableLabelChanges: true },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    simulateFileSelection(input, [file]);

    await vi.waitFor(() => {
      const button = screen.getByRole("button");
      // Label should remain unchanged
      expect(button).toHaveTextContent("Add file");
    });
  });

  it("should dispatch change event when files are selected", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderButton, {
      props: { onchange: changeHandler },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    simulateFileSelection(input, [file]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event = changeHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("test.txt");
  });

  it("should handle different button kinds", () => {
    const { container: container1 } = render(FileUploaderButton, {
      props: { kind: "primary" },
    });
    const { container: container2 } = render(FileUploaderButton, {
      props: { kind: "secondary" },
    });
    const { container: container3 } = render(FileUploaderButton, {
      props: { kind: "tertiary" },
    });
    const { container: container4 } = render(FileUploaderButton, {
      props: { kind: "ghost" },
    });
    const { container: container5 } = render(FileUploaderButton, {
      props: { kind: "danger" },
    });

    const button1 = container1.querySelector("button");
    const button2 = container2.querySelector("button");
    const button3 = container3.querySelector("button");
    const button4 = container4.querySelector("button");
    const button5 = container5.querySelector("button");

    assert(button1);
    assert(button2);
    assert(button3);
    assert(button4);
    assert(button5);

    expect(button1).toHaveClass("bx--btn--primary");
    expect(button2).toHaveClass("bx--btn--secondary");
    expect(button3).toHaveClass("bx--btn--tertiary");
    expect(button4).toHaveClass("bx--btn--ghost");
    expect(button5).toHaveClass("bx--btn--danger");
  });

  it("should handle different button sizes", () => {
    const { container: container1 } = render(FileUploaderButton, {
      props: { size: "small" },
    });
    const { container: container2 } = render(FileUploaderButton, {
      props: { size: "field" },
    });
    const { container: container3 } = render(FileUploaderButton, {
      props: { size: "default" },
    });
    const { container: container4 } = render(FileUploaderButton, {
      props: { size: "lg" },
    });
    const { container: container5 } = render(FileUploaderButton, {
      props: { size: "xl" },
    });

    const button1 = container1.querySelector("button");
    const button2 = container2.querySelector("button");
    const button3 = container3.querySelector("button");
    const button4 = container4.querySelector("button");
    const button5 = container5.querySelector("button");

    assert(button1);
    assert(button2);
    assert(button3);
    assert(button4);
    assert(button5);

    expect(button1).toHaveClass("bx--btn--sm");
    expect(button2).toHaveClass("bx--btn--field");
    expect(button3).not.toHaveClass("bx--btn--sm");
    expect(button3).not.toHaveClass("bx--btn--field");
    expect(button4).toHaveClass("bx--btn--lg");
    expect(button5).toHaveClass("bx--btn--xl");
  });

  it("should handle name attribute", () => {
    const { container } = render(FileUploaderButton, {
      props: { name: "file-input" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("name", "file-input");
  });

  it("should handle id attribute", () => {
    const { container } = render(FileUploaderButton, {
      props: { id: "custom-file-input" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("id", "custom-file-input");
  });

  it("should trigger file input when button is clicked", async () => {
    const { container } = render(FileUploaderButton);

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const clickSpy = vi.spyOn(input, "click");
    const button = screen.getByRole("button");

    await user.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });

  it("should handle keyboard interaction on button", async () => {
    const { container } = render(FileUploaderButton);

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const _clickSpy = vi.spyOn(input, "click");
    const button = screen.getByRole("button");

    button.focus();
    await user.keyboard("{Enter}");

    // Button should be focusable and handle keyboard events
    expect(button).toHaveFocus();
  });

  it("should render button with icon and text", () => {
    render(FileUploaderButton, {
      props: {
        icon: Add,
        labelText: "Add file with icon",
      },
    });

    const button = screen.getByRole("button", { name: "Add file with icon" });
    expect(button).not.toHaveClass("bx--btn--icon-only");
    expect(button.textContent).toContain("Add file with icon");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("should render icon-only button", () => {
    render(FileUploaderButton, {
      props: {
        icon: Add,
        iconDescription: "Add file icon only",
        labelText: "",
      },
    });

    const iconButton = screen.getByRole("button", {
      name: "Add file icon only",
    });
    expect(iconButton).toHaveClass("bx--btn--icon-only");
    expect(iconButton.querySelector("svg")).toBeInTheDocument();
  });

  it("should render icon-only button with tooltip", () => {
    render(FileUploaderButton, {
      props: {
        icon: Add,
        iconDescription: "Tooltip text",
        tooltipPosition: "bottom",
        tooltipAlignment: "center",
        labelText: "",
      },
    });

    const iconButton = screen.getByRole("button", { name: "Tooltip text" });
    expect(iconButton).toHaveClass("bx--btn--icon-only");
    expect(iconButton).toHaveClass("bx--tooltip__trigger");
    expect(iconButton).toHaveClass("bx--tooltip--a11y");
    expect(iconButton).toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).toHaveClass("bx--tooltip--align-center");
  });

  it("should hide tooltip but keep accessibility when hideTooltip is true", () => {
    render(FileUploaderButton, {
      props: {
        icon: Add,
        hideTooltip: true,
        iconDescription: "Add item hidden tooltip",
        labelText: "",
      },
    });

    const iconButton = screen.getByRole("button", {
      name: "Add item hidden tooltip",
    });
    expect(iconButton).toHaveClass("bx--btn--icon-only");

    expect(iconButton).not.toHaveClass("bx--tooltip__trigger");
    expect(iconButton).not.toHaveClass("bx--tooltip--a11y");
    expect(iconButton).not.toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).not.toHaveClass("bx--tooltip--align-center");

    const assistiveText = iconButton.querySelector(".bx--assistive-text");
    assert(assistiveText);
    expect(assistiveText).toHaveTextContent("Add item hidden tooltip");
  });

  it("should support icon prop on icon-only button", () => {
    render(FileUploaderButton, {
      props: {
        icon: DocumentAdd,
        iconDescription: "Upload document",
        labelText: "",
      },
    });

    const buttonWithIcon = screen.getByRole("button", {
      name: "Upload document",
    });
    expect(buttonWithIcon).toHaveClass("bx--btn--icon-only");
    const assistiveText = buttonWithIcon.querySelector(".bx--assistive-text");
    expect(assistiveText).toHaveTextContent("Upload document");
    expect(buttonWithIcon.querySelector("svg")).toBeInTheDocument();
  });

  it("should support custom tooltip position and alignment", () => {
    render(FileUploaderButton, {
      props: {
        icon: Add,
        iconDescription: "Add file tooltip right",
        tooltipPosition: "right",
        tooltipAlignment: "end",
        labelText: "",
      },
    });

    const iconButton = screen.getByRole("button", {
      name: "Add file tooltip right",
    });
    expect(iconButton).toHaveClass("bx--btn--icon-only--right");
    expect(iconButton).toHaveClass("bx--tooltip--align-end");
  });

  it("should trigger file input when button with icon is clicked", async () => {
    render(FileUploaderButton, {
      props: {
        icon: Add,
        labelText: "Upload file",
      },
    });

    const button = screen.getByRole("button", { name: "Upload file" });
    const fileInput = screen.getByLabelText("Upload file");
    assert(fileInput instanceof HTMLInputElement);

    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(button);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should trigger file input when icon-only button is clicked", async () => {
    const { container } = render(FileUploaderButton, {
      props: {
        icon: Add,
        iconDescription: "Add file icon only",
        labelText: "",
      },
    });

    const button = screen.getByRole("button", { name: "Add file icon only" });
    assert(button);

    const fileInput = container.querySelector('input[type="file"]');
    assert(fileInput instanceof HTMLInputElement);
    assert(fileInput.type === "file");

    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(button);
    expect(clickSpy).toHaveBeenCalled();
  });
});
