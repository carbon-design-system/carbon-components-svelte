import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FileUploaderPerFileStatusDemo from "./FileUploader.perFileStatus.test.svelte";
import FileUploader from "./FileUploader.test.svelte";
import FileUploaderButtonSlot from "./FileUploaderButton.slot.test.svelte";
import FileUploaderDropContainerSlot from "./FileUploaderDropContainer.slot.test.svelte";

describe("FileUploader", () => {
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

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1785
  it("should synchronize input.files when files are removed programmatically", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    const file3 = new File(["content3"], "file3.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2, file3]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(3);
    });

    assert(input.files);
    expect(input.files).toHaveLength(3);
    expect(input.files[0].name).toBe("file1.txt");
    expect(input.files[1].name).toBe("file2.txt");
    expect(input.files[2].name).toBe("file3.txt");

    const closeButtons = document.querySelectorAll(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );

    if (closeButtons.length >= 2) {
      const closeButton = closeButtons[1];
      assert(closeButton instanceof HTMLElement);
      await user.click(closeButton);
    }

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });

    // After removing file2.txt, input.files should only contain file1.txt and file3.txt
    expect(input.files).toHaveLength(2);
    expect(input.files[0].name).toBe("file1.txt");
    expect(input.files[1].name).toBe("file3.txt");
  });

  it("should remove the middle file and keep first and third", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    const file3 = new File(["content3"], "file3.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2, file3]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(3);
    });

    // Click the close button for the middle file (file2.txt)
    const closeButtons = document.querySelectorAll(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    expect(closeButtons.length).toBe(3);
    const middleCloseButton = closeButtons[1];
    assert(middleCloseButton instanceof HTMLElement);
    await user.click(middleCloseButton);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });

    // Verify the remaining files are the first and third
    expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    expect(screen.queryByText("file2.txt")).not.toBeInTheDocument();
    expect(screen.queryByText("file3.txt")).toBeInTheDocument();
  });

  it("should dispatch remove with only the deleted middle file (not shifted neighbors)", async () => {
    const addHandler = vi.fn();
    const removeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onAdd: addHandler, onRemove: removeHandler, multiple: true },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    const file3 = new File(["content3"], "file3.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2, file3]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(3);
    });

    addHandler.mockClear();
    removeHandler.mockClear();

    const closeButtons = document.querySelectorAll(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    expect(closeButtons.length).toBe(3);
    const middleCloseButton = closeButtons[1];
    assert(middleCloseButton instanceof HTMLElement);
    await user.click(middleCloseButton);

    await vi.waitFor(() => {
      expect(screen.queryByText("file2.txt")).not.toBeInTheDocument();
    });

    expect(addHandler).not.toHaveBeenCalled();
    expect(removeHandler).toHaveBeenCalledTimes(1);
    const removed = removeHandler.mock.calls[0][0].detail;
    expect(removed).toHaveLength(1);
    expect(removed[0].name).toBe("file2.txt");
  });

  it("should not dispatch spurious add/remove when new files are prepended", async () => {
    const addHandler = vi.fn();
    const removeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: {
        onAdd: addHandler,
        onRemove: removeHandler,
        multiple: true,
        orderFiles: "prepend",
      },
    });

    const fileA = new File(["a"], "a.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [fileA]);

    await vi.waitFor(() => {
      expect(screen.queryByText("a.txt")).toBeInTheDocument();
    });

    addHandler.mockClear();
    removeHandler.mockClear();

    const fileB = new File(["b"], "b.txt", { type: "text/plain" });
    simulateFileSelection(input, [fileB]);

    await vi.waitFor(() => {
      expect(screen.queryByText("b.txt")).toBeInTheDocument();
    });

    expect(removeHandler).not.toHaveBeenCalled();
    expect(addHandler).toHaveBeenCalledTimes(1);
    const added = addHandler.mock.calls[0][0].detail;
    expect(added).toHaveLength(1);
    expect(added[0].name).toBe("b.txt");
  });

  it("should clear input.files when all files are removed", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "test-file.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1]);

    await vi.waitFor(() => {
      expect(screen.queryByText("test-file.txt")).toBeInTheDocument();
    });

    assert(input.files, "input.files should exist");
    expect(input.files).toHaveLength(1);
    expect(input.files[0].name).toBe("test-file.txt");

    const closeButton = document.querySelector(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    assert(closeButton);
    await user.click(closeButton);

    await vi.waitFor(() => {
      expect(screen.queryByText("test-file.txt")).not.toBeInTheDocument();
    });

    assert(input.files);
    expect(input.files).toHaveLength(0);
    expect(input.value).toBe("");
  });

  it("should clear all files using clearFiles() method", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });

    assert(input.files);
    expect(input.files).toHaveLength(2);

    assert(component.fileUploader);
    component.fileUploader.clearFiles();

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(0);
    });

    expect(input.files).toHaveLength(0);
    expect(input.value).toBe("");
  });

  it("should clear all files using two-way binding (files = [])", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });

    assert(input.files);
    expect(input.files).toHaveLength(2);

    component.files = [];

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(0);
    });

    expect(input.files).toHaveLength(0);
    expect(input.value).toBe("");
  });

  it("supports custom label slot for FileUploaderButton", () => {
    render(FileUploaderButtonSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("supports custom label slot for FileUploaderDropContainer", () => {
    render(FileUploaderDropContainerSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("should dispatch add event when files are added", async () => {
    const addHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onAdd: addHandler },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      expect(addHandler).toHaveBeenCalled();
    });

    const event = addHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(2);
    expect(event.detail[0].name).toBe("file1.txt");
    expect(event.detail[1].name).toBe("file2.txt");
  });

  it("dispatches add when files are set programmatically via two-way binding", async () => {
    const addHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onAdd: addHandler, multiple: true },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    component.files = [file1, file2];

    await vi.waitFor(() => {
      expect(addHandler).toHaveBeenCalled();
    });

    const added = addHandler.mock.calls[0][0].detail;
    expect(added).toHaveLength(2);
    expect(added[0].name).toBe("file1.txt");
    expect(added[1].name).toBe("file2.txt");
  });

  it("should dispatch change event when files change", async () => {
    const changeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onChange: changeHandler },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event = changeHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("file1.txt");
  });

  it("should handle disabled state", () => {
    const { container } = render(FileUploader, {
      props: { disabled: true },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toBeDisabled();

    const button = container.querySelector("button");
    assert(button);
    expect(button).toHaveClass("bx--btn--disabled");
  });

  it("should respect accept prop", () => {
    const { container } = render(FileUploader, {
      props: { accept: [".jpg", ".png"] },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("accept", ".jpg,.png");
  });

  it("should handle single file selection when multiple is false", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: false },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    expect(input).not.toHaveAttribute("multiple");

    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      // When multiple is false, only one file should be selected
      expect(fileNames.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should handle multiple file selection when multiple is true", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: true },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    expect(input).toHaveAttribute("multiple");

    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });
  });

  it("should render labelTitle prop", () => {
    render(FileUploader, {
      props: { labelTitle: "Upload Files" },
    });

    expect(screen.getByText("Upload Files")).toBeInTheDocument();
  });

  it("should render labelDescription prop", () => {
    render(FileUploader, {
      props: { labelDescription: "Select files to upload" },
    });

    expect(screen.getByText("Select files to upload")).toBeInTheDocument();
  });

  it("should render different status values", () => {
    const { container: container1 } = render(FileUploader, {
      props: {
        status: "uploading",
        files: [new File(["content"], "test.txt")],
      },
    });

    const { container: container2 } = render(FileUploader, {
      props: { status: "edit", files: [new File(["content"], "test.txt")] },
    });

    const { container: container3 } = render(FileUploader, {
      props: { status: "complete", files: [new File(["content"], "test.txt")] },
    });

    // Check that components render with different statuses
    expect(container1.querySelector(".bx--file-container")).toBeInTheDocument();
    expect(container2.querySelector(".bx--file-container")).toBeInTheDocument();
    expect(container3.querySelector(".bx--file-container")).toBeInTheDocument();
  });

  it("should handle buttonLabel prop", () => {
    render(FileUploader, {
      props: { buttonLabel: "Choose Files" },
    });

    const button = screen.getByText("Choose Files");
    expect(button).toBeInTheDocument();
  });

  it("should handle name attribute", () => {
    const { container } = render(FileUploader, {
      props: { name: "file-upload" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input).toHaveAttribute("name", "file-upload");
  });

  it("should expose ref to the inner input element", () => {
    const { component } = render(FileUploader);

    assert(component.ref instanceof HTMLInputElement);
    expect(component.ref.type).toBe("file");
  });

  it("should remove file on click", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    const closeButton = document.querySelector(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    assert(closeButton);
    await user.click(closeButton);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
    });
  });

  it("should remove file on keyboard interaction", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    const closeButton = document.querySelector(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    assert(closeButton instanceof HTMLElement);
    closeButton.focus();
    await user.keyboard("{Enter}");

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
    });
  });

  it("should manage focus after removing a file with the keyboard", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    simulateFileSelection(component.ref, [file1, file2]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
      expect(screen.queryByText("file2.txt")).toBeInTheDocument();
    });

    const closeButtons = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          ".bx--file__state-container .bx--file-close",
        ),
      );

    closeButtons()[0].focus();
    await user.keyboard("{Enter}");

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
    });

    // Focus moves to the remaining file's remove button.
    expect(closeButtons()).toHaveLength(1);
    expect(closeButtons()[0]).toHaveFocus();

    await user.keyboard("{Enter}");

    await vi.waitFor(() => {
      expect(screen.queryByText("file2.txt")).not.toBeInTheDocument();
    });

    // Focus moves to the upload trigger once the list is empty.
    expect(screen.getByRole("button", { name: "Add files" })).toHaveFocus();
  });

  it("should accept files under maxFileSize limit", async () => {
    const { component } = render(FileUploader, {
      props: { maxFileSize: 1000 },
    });

    const smallFile = new File(["x".repeat(500)], "small.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [smallFile]);

    await vi.waitFor(() => {
      expect(screen.queryByText("small.txt")).toBeInTheDocument();
    });

    assert(input.files);
    expect(input.files).toHaveLength(1);
    expect(input.files[0].name).toBe("small.txt");
  });

  it("should filter out files exceeding maxFileSize limit", async () => {
    const { component } = render(FileUploader, {
      props: { maxFileSize: 1000 },
    });

    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [largeFile]);

    await vi.waitFor(() => {
      expect(screen.queryByText("large.txt")).not.toBeInTheDocument();
    });

    assert(input.files);
    expect(input.files).toHaveLength(0);
  });

  it("should filter files when multiple files are selected and some exceed limit", async () => {
    const { component } = render(FileUploader, {
      props: { maxFileSize: 1000, multiple: true },
    });

    const smallFile1 = new File(["x".repeat(500)], "small1.txt", {
      type: "text/plain",
    });
    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });
    const smallFile2 = new File(["x".repeat(300)], "small2.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [smallFile1, largeFile, smallFile2]);

    await vi.waitFor(() => {
      expect(screen.queryByText("small1.txt")).toBeInTheDocument();
      expect(screen.queryByText("small2.txt")).toBeInTheDocument();
      expect(screen.queryByText("large.txt")).not.toBeInTheDocument();
    });

    assert(input.files);
    expect(input.files).toHaveLength(2);
    expect(input.files[0].name).toBe("small1.txt");
    expect(input.files[1].name).toBe("small2.txt");
  });

  it("should accept files at exactly maxFileSize limit", async () => {
    const { component } = render(FileUploader, {
      props: { maxFileSize: 1000 },
    });

    const exactSizeFile = new File(["x".repeat(1000)], "exact.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [exactSizeFile]);

    await vi.waitFor(() => {
      expect(screen.queryByText("exact.txt")).toBeInTheDocument();
    });

    assert(input.files);
    expect(input.files).toHaveLength(1);
    expect(input.files[0].name).toBe("exact.txt");
  });

  it("should not filter files when maxFileSize is undefined", async () => {
    const { component } = render(FileUploader, {
      props: { maxFileSize: undefined },
    });

    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [largeFile]);

    await vi.waitFor(() => {
      expect(screen.queryByText("large.txt")).toBeInTheDocument();
    });

    assert(input.files);
    expect(input.files).toHaveLength(1);
    expect(input.files[0].name).toBe("large.txt");
  });

  it("should dispatch change event with filtered files when maxFileSize is set", async () => {
    const changeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { maxFileSize: 1000, multiple: false, onChange: changeHandler },
    });

    const smallFile = new File(["x".repeat(500)], "small.txt", {
      type: "text/plain",
    });
    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [smallFile]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event1 = changeHandler.mock.calls[0][0];
    expect(event1.detail).toHaveLength(1);
    expect(event1.detail[0].name).toBe("small.txt");

    changeHandler.mockClear();

    simulateFileSelection(input, [largeFile]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event2 = changeHandler.mock.calls[0][0];
    expect(event2.detail).toHaveLength(0);
  });

  it("should dispatch remove, change, and clear when files are cleared via two-way binding", async () => {
    const changeHandler = vi.fn();
    const clearHandler = vi.fn();
    const removeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: {
        onChange: changeHandler,
        onClear: clearHandler,
        onRemove: removeHandler,
        multiple: true,
      },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    changeHandler.mockClear();
    clearHandler.mockClear();
    removeHandler.mockClear();
    component.files = [];

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
      expect(clearHandler).toHaveBeenCalled();
      expect(removeHandler).toHaveBeenCalled();
    });

    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(0);
    expect(removeHandler.mock.calls[0][0].detail).toHaveLength(2);
    expect(removeHandler.mock.calls[0][0].detail[0].name).toBe("file1.txt");
    expect(removeHandler.mock.calls[0][0].detail[1].name).toBe("file2.txt");
  });

  it("should dispatch remove, change, and clear when clearFiles() empties multiple files", async () => {
    const changeHandler = vi.fn();
    const clearHandler = vi.fn();
    const removeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: {
        onChange: changeHandler,
        onClear: clearHandler,
        onRemove: removeHandler,
        multiple: true,
      },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    changeHandler.mockClear();
    clearHandler.mockClear();
    removeHandler.mockClear();
    assert(component.fileUploader);
    component.fileUploader.clearFiles();

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
      expect(clearHandler).toHaveBeenCalled();
      expect(removeHandler).toHaveBeenCalled();
    });

    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(0);
    expect(removeHandler.mock.calls[0][0].detail).toHaveLength(2);
    expect(removeHandler.mock.calls[0][0].detail[0].name).toBe("file1.txt");
    expect(removeHandler.mock.calls[0][0].detail[1].name).toBe("file2.txt");
  });

  it("should not dispatch clear when only some files are removed via row close", async () => {
    const clearHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onClear: clearHandler, multiple: true },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    const closeButtons = document.querySelectorAll(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    assert(closeButtons[0] instanceof HTMLElement);
    await user.click(closeButtons[0]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
    });

    expect(clearHandler).not.toHaveBeenCalled();
  });

  it("should dispatch change and clear when the last file is removed via row close", async () => {
    const changeHandler = vi.fn();
    const clearHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onChange: changeHandler, onClear: clearHandler },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    changeHandler.mockClear();
    const closeButton = document.querySelector(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    assert(closeButton instanceof HTMLElement);
    await user.click(closeButton);

    await vi.waitFor(() => {
      expect(clearHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(0);
  });

  it("should dispatch rejected event when files exceed maxFileSize", async () => {
    const rejectedHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { maxFileSize: 1000, onRejected: rejectedHandler },
    });

    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [largeFile]);

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
    });

    const event = rejectedHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].file.name).toBe("large.txt");
    expect(event.detail[0].reason).toBe("size");
  });

  it("should dispatch rejected with only oversized files when some exceed maxFileSize", async () => {
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: {
        maxFileSize: 1000,
        multiple: true,
        onRejected: rejectedHandler,
        onChange: changeHandler,
      },
    });

    const smallFile1 = new File(["x".repeat(500)], "small1.txt", {
      type: "text/plain",
    });
    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });
    const smallFile2 = new File(["x".repeat(300)], "small2.txt", {
      type: "text/plain",
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [smallFile1, largeFile, smallFile2]);

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    // Only the large file should be rejected
    const rejectedEvent = rejectedHandler.mock.calls[0][0];
    expect(rejectedEvent.detail).toHaveLength(1);
    expect(rejectedEvent.detail[0].file.name).toBe("large.txt");
    expect(rejectedEvent.detail[0].reason).toBe("size");

    // The two small files should be accepted
    const changeEvent = changeHandler.mock.calls[0][0];
    expect(changeEvent.detail).toHaveLength(2);
    expect(changeEvent.detail[0].name).toBe("small1.txt");
    expect(changeEvent.detail[1].name).toBe("small2.txt");
  });

  it("should reject duplicate files when preventDuplicate is true", async () => {
    const rejectedHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: {
        preventDuplicate: true,
        multiple: true,
        onRejected: rejectedHandler,
      },
    });

    const file1 = new File(["content1"], "file1.txt", {
      type: "text/plain",
      lastModified: 1000,
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    // Select the same file again.
    const duplicate = new File(["content1"], "file1.txt", {
      type: "text/plain",
      lastModified: 1000,
    });
    simulateFileSelection(input, [duplicate]);

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
    });

    const event = rejectedHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].file.name).toBe("file1.txt");
    expect(event.detail[0].reason).toBe("duplicate");

    // Only the original file should remain.
    const fileNames = screen.queryAllByText("file1.txt");
    expect(fileNames).toHaveLength(1);
  });

  it("should allow duplicate files when preventDuplicate is false (default)", async () => {
    const rejectedHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: {
        multiple: true,
        onRejected: rejectedHandler,
      },
    });

    const file1 = new File(["content1"], "file1.txt", {
      type: "text/plain",
      lastModified: 1000,
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
    });

    const duplicate = new File(["content1"], "file1.txt", {
      type: "text/plain",
      lastModified: 1000,
    });
    simulateFileSelection(input, [duplicate]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText("file1.txt");
      expect(fileNames).toHaveLength(2);
    });

    expect(rejectedHandler).not.toHaveBeenCalled();
  });

  it("should prepend new files when orderFiles is 'prepend'", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: true, orderFiles: "prepend" },
    });

    const fileA = new File(["a"], "a.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [fileA]);

    await vi.waitFor(() => {
      expect(screen.queryByText("a.txt")).toBeInTheDocument();
    });

    const fileB = new File(["b"], "b.txt", { type: "text/plain" });
    simulateFileSelection(input, [fileB]);

    await vi.waitFor(() => {
      expect(screen.queryByText("b.txt")).toBeInTheDocument();
    });

    const fileNames = screen
      .queryAllByText(/\.txt$/)
      .map((el) => el.textContent);
    expect(fileNames).toEqual(["b.txt", "a.txt"]);
  });

  it("should append new files by default (orderFiles='append')", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: true },
    });

    const fileA = new File(["a"], "a.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [fileA]);

    await vi.waitFor(() => {
      expect(screen.queryByText("a.txt")).toBeInTheDocument();
    });

    const fileB = new File(["b"], "b.txt", { type: "text/plain" });
    simulateFileSelection(input, [fileB]);

    await vi.waitFor(() => {
      expect(screen.queryByText("b.txt")).toBeInTheDocument();
    });

    const fileNames = screen
      .queryAllByText(/\.txt$/)
      .map((el) => el.textContent);
    expect(fileNames).toEqual(["a.txt", "b.txt"]);
  });

  it("should support a custom orderFiles function", async () => {
    const orderFiles = (
      existing: ReadonlyArray<File>,
      added: ReadonlyArray<File>,
    ) => [...existing, ...added].sort((a, b) => a.name.localeCompare(b.name));

    const { component } = render(FileUploader, {
      props: { multiple: true, orderFiles },
    });

    const fileB = new File(["b"], "banana.txt", { type: "text/plain" });
    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [fileB]);

    await vi.waitFor(() => {
      expect(screen.queryByText("banana.txt")).toBeInTheDocument();
    });

    const fileA = new File(["a"], "apple.txt", { type: "text/plain" });
    simulateFileSelection(input, [fileA]);

    await vi.waitFor(() => {
      expect(screen.queryByText("apple.txt")).toBeInTheDocument();
    });

    const fileNames = screen
      .queryAllByText(/\.txt$/)
      .map((el) => el.textContent);
    expect(fileNames).toEqual(["apple.txt", "banana.txt"]);
  });

  it("should use per-file labels when iconDescription is a function", async () => {
    const file1 = new File(["a"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["b"], "file2.txt", { type: "text/plain" });
    const iconDescription = vi.fn(
      (ctx: {
        file?: File;
        fileName: string;
        status: string;
        invalid: boolean;
      }) => `Remove ${ctx.fileName}`,
    );

    const { component } = render(FileUploader, {
      props: {
        multiple: true,
        status: "edit",
        iconDescription,
      },
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("file2.txt")).toBeInTheDocument();
    });

    const closeButtons = document.querySelectorAll(
      ".bx--file__state-container button, .bx--file__state-container .bx--file-close",
    );
    expect(closeButtons).toHaveLength(2);
    assert(closeButtons[0] instanceof HTMLElement);
    assert(closeButtons[1] instanceof HTMLElement);
    expect(closeButtons[0]).toHaveAttribute("aria-label", "Remove file1.txt");
    expect(closeButtons[1]).toHaveAttribute("aria-label", "Remove file2.txt");

    expect(iconDescription).toHaveBeenCalled();
    const contexts = iconDescription.mock.calls.map((c) => c[0]);
    const names = contexts.map((ctx) => ctx.fileName).sort();
    expect(names).toEqual(["file1.txt", "file2.txt"]);
    for (const ctx of contexts) {
      assert(ctx.file instanceof File);
      expect(ctx.file.name).toBe(ctx.fileName);
    }
  });

  it("should apply per-file status via fileStatus, overriding global status", () => {
    const file1 = new File(["a"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["b"], "file2.txt", { type: "text/plain" });
    const file3 = new File(["c"], "file3.txt", { type: "text/plain" });

    const { container } = render(FileUploader, {
      props: {
        multiple: true,
        status: "edit",
        files: [file1, file2, file3],
        fileStatus: (_file: File, index: number) =>
          (["uploading", "edit", "complete"] as const)[index],
      },
    });

    const rows = container.querySelectorAll(".bx--file__selected-file");
    expect(rows).toHaveLength(3);

    expect(rows[0].querySelector(".bx--loading")).toBeInTheDocument();
    expect(rows[0].querySelector(".bx--file-close")).not.toBeInTheDocument();
    expect(rows[0].querySelector(".bx--file-complete")).not.toBeInTheDocument();

    expect(rows[1].querySelector(".bx--file-close")).toBeInTheDocument();
    expect(rows[1].querySelector(".bx--loading")).not.toBeInTheDocument();
    expect(rows[1].querySelector(".bx--file-complete")).not.toBeInTheDocument();

    expect(rows[2].querySelector(".bx--file-complete")).toBeInTheDocument();
    expect(rows[2].querySelector(".bx--loading")).not.toBeInTheDocument();
    expect(rows[2].querySelector(".bx--file-close")).not.toBeInTheDocument();
  });

  it("should fall back to global status when fileStatus is unset", () => {
    const file1 = new File(["a"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["b"], "file2.txt", { type: "text/plain" });

    const { container } = render(FileUploader, {
      props: {
        multiple: true,
        status: "complete",
        files: [file1, file2],
      },
    });

    const rows = container.querySelectorAll(".bx--file__selected-file");
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector(".bx--file-complete")).toBeInTheDocument();
    expect(rows[1].querySelector(".bx--file-complete")).toBeInTheDocument();
    expect(container.querySelector(".bx--loading")).not.toBeInTheDocument();
    expect(container.querySelector(".bx--file-close")).not.toBeInTheDocument();
  });

  it("demo-style fileStatus transitions uploading to complete", async () => {
    const { container } = render(FileUploaderPerFileStatusDemo, {
      props: { delay: 50 },
    });

    const input = container.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    const file = new File(["a"], "a.txt", { type: "text/plain" });
    simulateFileSelection(input, [file]);

    await vi.waitFor(() => {
      expect(container.querySelector(".bx--loading")).toBeInTheDocument();
    });

    await vi.waitFor(
      () => {
        expect(
          container.querySelector(".bx--file-complete"),
        ).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
    expect(container.querySelector(".bx--loading")).not.toBeInTheDocument();
  });

  it("should update row status when fileStatus callback identity changes", async () => {
    const file = new File(["a"], "file1.txt", { type: "text/plain" });
    let current: "uploading" | "complete" = "uploading";

    const { rerender, container } = render(FileUploader, {
      props: {
        files: [file],
        status: "edit",
        fileStatus: () => current,
      },
    });

    expect(container.querySelector(".bx--loading")).toBeInTheDocument();

    current = "complete";
    await rerender({
      files: [file],
      status: "edit",
      fileStatus: () => current,
    });
    await tick();

    expect(container.querySelector(".bx--loading")).not.toBeInTheDocument();
    expect(container.querySelector(".bx--file-complete")).toBeInTheDocument();
  });

  it("should NOT update when fileStatus reference is stable but closure data changes", async () => {
    const file = new File(["a"], "file1.txt", { type: "text/plain" });
    const state = { status: "uploading" as "uploading" | "complete" };
    const fileStatus = () => state.status;

    const { container } = render(FileUploader, {
      props: {
        files: [file],
        status: "edit",
        fileStatus,
      },
    });

    expect(container.querySelector(".bx--loading")).toBeInTheDocument();

    state.status = "complete";
    await tick();

    // Stable callback: child has no signal to re-resolve.
    expect(container.querySelector(".bx--loading")).toBeInTheDocument();
  });

  it("should render per-file invalid state and error copy", () => {
    const file1 = new File(["a"], "ok.txt", { type: "text/plain" });
    const file2 = new File(["b"], "bad.txt", { type: "text/plain" });

    const { container } = render(FileUploader, {
      props: {
        multiple: true,
        status: "edit",
        files: [file1, file2],
        fileInvalid: (file: File) => file.name === "bad.txt",
        fileErrorSubject: (file: File) =>
          file.name === "bad.txt" ? "Upload failed" : "",
        fileErrorBody: (file: File) =>
          file.name === "bad.txt" ? "Please try again." : "",
      },
    });

    const rows = container.querySelectorAll(".bx--file__selected-file");
    expect(rows).toHaveLength(2);
    expect(rows[0]).not.toHaveClass("bx--file__selected-file--invalid");
    expect(rows[1]).toHaveClass("bx--file__selected-file--invalid");
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
    expect(screen.getByText("Please try again.")).toBeInTheDocument();
    expect(rows[1].querySelector(".bx--file-invalid")).toBeInTheDocument();
  });
});
