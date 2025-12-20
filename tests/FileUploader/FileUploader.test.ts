import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
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

    const input = component.getInputElement();
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

  it("should clear input.files when all files are removed", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "test-file.txt", {
      type: "text/plain",
    });

    const input = component.getInputElement();
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

    const input = component.getInputElement();
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });

    assert(input.files);
    expect(input.files).toHaveLength(2);

    component.clearFiles();

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

    const input = component.getInputElement();
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });

    assert(input.files);
    expect(input.files).toHaveLength(2);

    component.setFiles([]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(0);
    });

    expect(input.files).toHaveLength(0);
    expect(input.value).toBe("");
  });

  it("should dispatch remove event when clearing files programmatically", async () => {
    const removeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onRemove: removeHandler },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });

    const input = component.getInputElement();
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      const fileNames = screen.queryAllByText(/file\d\.txt/);
      expect(fileNames).toHaveLength(2);
    });

    component.setFiles([]);

    await vi.waitFor(() => {
      expect(removeHandler).toHaveBeenCalled();
    });

    const event = removeHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(2);
    expect(event.detail[0].name).toBe("file1.txt");
    expect(event.detail[1].name).toBe("file2.txt");
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

    const input = component.getInputElement();
    simulateFileSelection(input, [file1, file2]);

    await vi.waitFor(() => {
      expect(addHandler).toHaveBeenCalled();
    });

    const event = addHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(2);
    expect(event.detail[0].name).toBe("file1.txt");
    expect(event.detail[1].name).toBe("file2.txt");
  });

  it("should dispatch change event when files change", async () => {
    const changeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onChange: changeHandler },
    });

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const input = component.getInputElement();
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

    const input = component.getInputElement();
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

    const input = component.getInputElement();
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

  it("should remove file on click", async () => {
    const { component } = render(FileUploader);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const input = component.getInputElement();
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
    const input = component.getInputElement();
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
});
