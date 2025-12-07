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
      await user.click(closeButtons[1] as HTMLElement);
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
});
