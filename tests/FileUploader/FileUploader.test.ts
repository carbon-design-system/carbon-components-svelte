import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FileUploader from "./FileUploader.test.svelte";

describe("FileUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function simulateFileSelection(input: HTMLInputElement, files: File[]) {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));

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
});
