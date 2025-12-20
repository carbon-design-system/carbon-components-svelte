import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FileUploaderDropContainer from "./FileUploaderDropContainer.test.svelte";

describe("FileUploaderDropContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createDragEvent(
    type: "dragover" | "dragleave" | "drop",
    files: File[] = [],
  ) {
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      dataTransfer.items.add(file);
    }

    // Create a mock DragEvent since it may not be available in test environment
    const event = new Event(type, {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;

    Object.defineProperty(event, "dataTransfer", {
      value: dataTransfer,
      writable: false,
      configurable: true,
    });

    return event;
  }

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
    const { container } = render(FileUploaderDropContainer);

    const label = screen.getByText("Add file");
    expect(label).toBeInTheDocument();

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute("multiple");
  });

  it("should render with custom labelText", () => {
    render(FileUploaderDropContainer, {
      props: { labelText: "Drag and drop files here" },
    });

    expect(screen.getByText("Drag and drop files here")).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { disabled: true },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toBeDisabled();

    const label = container.querySelector("label");
    assert(label);
    expect(label).toHaveClass("bx--file-browse-btn--disabled");
  });

  it("should respect accept prop", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { accept: [".pdf", ".doc"] },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("accept", ".pdf,.doc");
  });

  it("should handle multiple prop", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { multiple: true },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("multiple");
  });

  it("should handle dragover event and show drag-over state", async () => {
    const { container } = render(FileUploaderDropContainer);

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const dragOverEvent = createDragEvent("dragover", [file]);

    dropDiv.dispatchEvent(dragOverEvent);

    await vi.waitFor(() => {
      expect(dropContainer).toHaveClass("bx--file__drop-container--drag-over");
    });
  });

  it("should handle dragleave event and remove drag-over state", async () => {
    const { container } = render(FileUploaderDropContainer);

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const dragOverEvent = createDragEvent("dragover", [file]);
    const dragLeaveEvent = createDragEvent("dragleave", []);

    dropDiv.dispatchEvent(dragOverEvent);

    await vi.waitFor(() => {
      expect(dropContainer).toHaveClass("bx--file__drop-container--drag-over");
    });

    dropDiv.dispatchEvent(dragLeaveEvent);

    await vi.waitFor(() => {
      expect(dropContainer).not.toHaveClass(
        "bx--file__drop-container--drag-over",
      );
    });
  });

  it("should handle drop event and add files", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { onchange: changeHandler },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const dropEvent = createDragEvent("drop", [file]);

    dropDiv.dispatchEvent(dropEvent);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event = changeHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("test.txt");
  });

  it("should dispatch add event when files are dropped", async () => {
    const addHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { onadd: addHandler },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const dropEvent = createDragEvent("drop", [file]);

    dropDiv.dispatchEvent(dropEvent);

    await vi.waitFor(() => {
      expect(addHandler).toHaveBeenCalled();
    });

    const event = addHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("test.txt");
  });

  it("should handle multiple files on drop", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { multiple: true, onchange: changeHandler },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    const dropEvent = createDragEvent("drop", [file1, file2]);

    dropDiv.dispatchEvent(dropEvent);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event = changeHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(2);
  });

  it("should not handle drag events when disabled", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { disabled: true },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const dragOverEvent = createDragEvent("dragover", [file]);

    dropDiv.dispatchEvent(dragOverEvent);
    expect(dropContainer).not.toHaveClass(
      "bx--file__drop-container--drag-over",
    );
  });

  it("should validate files using validateFiles prop", async () => {
    const validateFiles = vi.fn((files: File[]) =>
      files.filter((f: File) => f.size < 1000),
    );
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { validateFiles, onchange: changeHandler },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const smallFile = new File(["x".repeat(500)], "small.txt", {
      type: "text/plain",
    });
    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });
    const dropEvent = createDragEvent("drop", [smallFile, largeFile]);

    dropDiv.dispatchEvent(dropEvent);

    await vi.waitFor(() => {
      expect(validateFiles).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    const event = changeHandler.mock.calls[0][0];
    // Only small file should pass validation
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("small.txt");
  });

  it("should handle file input change event", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
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

  it("should handle keyboard interaction to trigger file input", async () => {
    const { container } = render(FileUploaderDropContainer);

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const clickSpy = vi.spyOn(input, "click");
    const label = container.querySelector("label");
    assert(label instanceof HTMLElement);

    label.focus();
    await user.keyboard("{Enter}");

    expect(clickSpy).toHaveBeenCalled();
  });

  it("should handle role prop", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { role: "button" },
    });

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);
    expect(dropContainer).toHaveAttribute("role", "button");
  });

  it("should handle tabindex prop", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { tabindex: "0" },
    });

    const label = container.querySelector("label");
    assert(label instanceof HTMLElement);
    expect(label).toHaveAttribute("tabindex", "0");
  });

  it("should handle name attribute", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { name: "file-drop" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("name", "file-drop");
  });

  it("should handle id attribute", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { id: "custom-drop" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("id", "custom-drop");

    const label = container.querySelector("label");
    assert(label);
    expect(label).toHaveAttribute("for", "custom-drop");
  });
});
