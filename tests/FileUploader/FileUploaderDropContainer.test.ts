import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FileUploaderDropContainer from "./FileUploaderDropContainer.test.svelte";
import { fileNames, simulateFileSelection } from "./helpers";

describe("FileUploaderDropContainer", () => {
  function createDragEvent(
    type: "dragover" | "dragleave" | "drop",
    files: File[] = [],
    relatedTarget: EventTarget | null = null,
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

    Object.defineProperty(event, "relatedTarget", {
      value: relatedTarget,
      writable: false,
      configurable: true,
    });

    return event;
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

    const target = container.querySelector(".bx--file-browse-btn");
    assert(target);
    expect(target).toHaveClass("bx--file-browse-btn--disabled");
  });

  it("should expose aria-disabled and remove from tab order when disabled", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { disabled: true },
    });

    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);
    expect(target).toHaveAttribute("aria-disabled", "true");
    expect(target).toHaveAttribute("tabindex", "-1");
  });

  it("should not expose aria-disabled when not disabled", () => {
    const { container } = render(FileUploaderDropContainer);

    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);
    expect(target).not.toHaveAttribute("aria-disabled");
  });

  it("should forward capture to the input", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { capture: "user" },
    });

    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("capture", "user");
  });

  it("should hide the native input from assistive technology", () => {
    const { container } = render(FileUploaderDropContainer);

    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("aria-hidden", "true");
  });

  it("should move aria-describedby and aria-labelledby to the drop target", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: {
        "aria-describedby": "drop-help",
        "aria-labelledby": "drop-label",
      },
    });

    const target = screen.getByRole("button");
    expect(target).toHaveAttribute("aria-describedby", "drop-help");
    expect(target).toHaveAttribute("aria-labelledby", "drop-label");

    const wrapper = container.querySelector(".bx--file");
    expect(wrapper).not.toHaveAttribute("aria-describedby");
    expect(wrapper).not.toHaveAttribute("aria-labelledby");
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

  it("should keep drag-over state when dragleave moves onto a child element", async () => {
    const { container } = render(FileUploaderDropContainer);

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    dropDiv.dispatchEvent(createDragEvent("dragover", [file]));

    await vi.waitFor(() => {
      expect(dropContainer).toHaveClass("bx--file__drop-container--drag-over");
    });

    dropDiv.dispatchEvent(createDragEvent("dragleave", [], dropContainer));
    // Let the dragleave flush. A synchronous check would pass before it.
    await tick();

    expect(dropContainer).toHaveClass("bx--file__drop-container--drag-over");

    dropDiv.dispatchEvent(createDragEvent("dragleave", [], document.body));

    await vi.waitFor(() => {
      expect(dropContainer).not.toHaveClass(
        "bx--file__drop-container--drag-over",
      );
    });
  });

  it("should reject dropped files that don't match accept", async () => {
    const changeHandler = vi.fn();
    const rejectedHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        accept: [".png", "image/jpeg"],
        multiple: true,
        onchange: changeHandler,
        onrejected: rejectedHandler,
      },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const png = new File(["a"], "logo.PNG", { type: "image/png" });
    const jpeg = new File(["b"], "photo", { type: "image/jpeg" });
    const text = new File(["c"], "notes.txt", { type: "text/plain" });
    dropDiv.dispatchEvent(createDragEvent("drop", [png, jpeg, text]));

    await vi.waitFor(() => expect(changeHandler).toHaveBeenCalled());
    expect(changeHandler.mock.calls[0][0].detail).toEqual([png, jpeg]);
    expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
      { file: text, reason: "type" },
    ]);
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

  it("should sync dropped files to the native input's files property", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { multiple: true, onchange: changeHandler },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });
    dropDiv.dispatchEvent(createDragEvent("drop", [file1, file2]));

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(input.files).toHaveLength(2);
    expect(fileNames(input)).toEqual(["file1.txt", "file2.txt"]);
  });

  it("should not include rejected files in the native input's files property", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { multiple: true, maxFileSize: 1000, onchange: changeHandler },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const smallFile = new File(["x".repeat(500)], "small.txt", {
      type: "text/plain",
    });
    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });
    dropDiv.dispatchEvent(createDragEvent("drop", [smallFile, largeFile]));

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(input.files).toHaveLength(1);
    expect(fileNames(input)).toEqual(["small.txt"]);
  });

  describe("native input sync", () => {
    const getInput = (container: HTMLElement) => {
      const input = container.querySelector('input[type="file"]');
      assert(input instanceof HTMLInputElement);
      return input;
    };
    const textFile = (name: string, size = 10) =>
      new File(["x".repeat(size)], name, { type: "text/plain" });

    it("leaves files rejected from a browse pick out of the native input", async () => {
      const changeHandler = vi.fn();
      const { container } = render(FileUploaderDropContainer, {
        props: { multiple: true, maxFileSize: 1000, onchange: changeHandler },
      });
      const input = getInput(container);

      simulateFileSelection(input, [
        textFile("small.txt", 500),
        textFile("large.txt", 2000),
      ]);

      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["small.txt"]);
      });
      expect(changeHandler).toHaveBeenCalled();
    });

    it("accumulates browse picks in the native input with multiple", async () => {
      const { container } = render(FileUploaderDropContainer, {
        props: { multiple: true },
      });
      const input = getInput(container);

      simulateFileSelection(input, [textFile("a.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt"]);
      });

      simulateFileSelection(input, [textFile("b.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt", "b.txt"]);
      });
    });

    it("combines dropped and browsed files in the native input", async () => {
      const { container } = render(FileUploaderDropContainer, {
        props: { multiple: true },
      });
      const dropDiv = container.querySelector(".bx--file");
      assert(dropDiv instanceof HTMLElement);
      const input = getInput(container);

      dropDiv.dispatchEvent(createDragEvent("drop", [textFile("a.txt")]));
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt"]);
      });

      simulateFileSelection(input, [textFile("b.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt", "b.txt"]);
      });
    });

    it("puts the current files back after a cancelled picker", async () => {
      const { container } = render(FileUploaderDropContainer, {
        props: { multiple: true },
      });
      const input = getInput(container);

      simulateFileSelection(input, [textFile("a.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt"]);
      });

      // Opening the picker clears the input; dismissing it fires `cancel`.
      Object.defineProperty(input, "files", {
        value: new DataTransfer().files,
        writable: true,
        configurable: true,
      });
      input.dispatchEvent(new Event("cancel"));

      expect(fileNames(input)).toEqual(["a.txt"]);
    });

    it("empties the native input when files is cleared programmatically", async () => {
      const { container, rerender } = render(FileUploaderDropContainer, {
        props: { multiple: true },
      });
      const input = getInput(container);

      simulateFileSelection(input, [textFile("a.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt"]);
      });

      await rerender({ multiple: true, files: [] });

      expect(input.files).toHaveLength(0);
    });
  });

  it("should not handle drag events when disabled", async () => {
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
    await tick();

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
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("small.txt");
  });

  it("should dispatch rejected event on drop when validateFiles filters files", async () => {
    const validateFiles = vi.fn((files: File[]) =>
      files.filter((f: File) => f.size < 1000),
    );
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        validateFiles,
        onrejected: rejectedHandler,
        onchange: changeHandler,
      },
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
      expect(rejectedHandler).toHaveBeenCalled();
    });

    const event = rejectedHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].file.name).toBe("large.txt");
    expect(event.detail[0].reason).toBe("invalid");
  });

  it("should not dispatch rejected event when validateFiles accepts all files", async () => {
    const validateFiles = vi.fn((files: File[]) => files);
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        validateFiles,
        onrejected: rejectedHandler,
        onchange: changeHandler,
      },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const file = new File(["content"], "ok.txt", { type: "text/plain" });
    dropDiv.dispatchEvent(createDragEvent("drop", [file]));

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(rejectedHandler).not.toHaveBeenCalled();
  });

  it("should dispatch rejected event from input change when validateFiles filters files", async () => {
    const validateFiles = vi.fn((files: File[]) =>
      files.filter((f: File) => f.size < 1000),
    );
    const rejectedHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        multiple: true,
        validateFiles,
        onrejected: rejectedHandler,
      },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);

    const smallFile = new File(["x".repeat(500)], "small.txt", {
      type: "text/plain",
    });
    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });
    simulateFileSelection(input, [smallFile, largeFile]);

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
    });

    const event = rejectedHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].file.name).toBe("large.txt");
    expect(event.detail[0].reason).toBe("invalid");
  });

  it("should reject dropped files under minFileSize", async () => {
    const rejectedHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { multiple: true, minFileSize: 1, onrejected: rejectedHandler },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);
    const empty = new File([], "empty.txt");
    dropDiv.dispatchEvent(
      createDragEvent("drop", [empty, new File(["a"], "a.txt")]),
    );

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalledTimes(1);
    });
    expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
      { file: empty, reason: "size" },
    ]);
  });

  it("should reject oversized files with reason size", async () => {
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        multiple: true,
        maxFileSize: 1000,
        onrejected: rejectedHandler,
        onchange: changeHandler,
      },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const smallFile = new File(["x".repeat(500)], "small.txt", {
      type: "text/plain",
    });
    const largeFile = new File(["x".repeat(2000)], "large.txt", {
      type: "text/plain",
    });
    dropDiv.dispatchEvent(createDragEvent("drop", [smallFile, largeFile]));

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
      { file: largeFile, reason: "size" },
    ]);
    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(1);
    expect(changeHandler.mock.calls[0][0].detail[0].name).toBe("small.txt");
  });

  it("should reject duplicate files with reason duplicate", async () => {
    const existing = new File(["content"], "dup.txt", { type: "text/plain" });
    Object.defineProperty(existing, "lastModified", { value: 100 });
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        multiple: true,
        preventDuplicate: true,
        files: [existing],
        onrejected: rejectedHandler,
        onchange: changeHandler,
      },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const duplicate = new File(["content"], "dup.txt", { type: "text/plain" });
    Object.defineProperty(duplicate, "lastModified", { value: 100 });
    const unique = new File(["other"], "new.txt", { type: "text/plain" });
    dropDiv.dispatchEvent(createDragEvent("drop", [duplicate, unique]));

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
      { file: duplicate, reason: "duplicate" },
    ]);
    const files = changeHandler.mock.calls[0][0].detail;
    expect(files).toHaveLength(2);
    expect(files.map((f: File) => f.name)).toEqual(["dup.txt", "new.txt"]);
  });

  it("should apply validateFiles after size and duplicate checks", async () => {
    const existing = new File(["ok"], "kept.txt", { type: "text/plain" });
    Object.defineProperty(existing, "lastModified", { value: 1 });
    const validateFiles = vi.fn((files: File[]) =>
      files.filter((f: File) => !f.name.startsWith("skip")),
    );
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        multiple: true,
        maxFileSize: 1000,
        preventDuplicate: true,
        files: [existing],
        validateFiles,
        onrejected: rejectedHandler,
        onchange: changeHandler,
      },
    });

    const dropDiv = container.querySelector(".bx--file");
    assert(dropDiv instanceof HTMLElement);

    const oversized = new File(["x".repeat(2000)], "big.txt", {
      type: "text/plain",
    });
    const duplicate = new File(["ok"], "kept.txt", { type: "text/plain" });
    Object.defineProperty(duplicate, "lastModified", { value: 1 });
    const skipped = new File(["x".repeat(10)], "skip-me.txt", {
      type: "text/plain",
    });
    const ok = new File(["x".repeat(10)], "ok.txt", { type: "text/plain" });

    dropDiv.dispatchEvent(
      createDragEvent("drop", [oversized, duplicate, skipped, ok]),
    );

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(validateFiles).toHaveBeenCalledWith([skipped, ok]);

    const rejected = rejectedHandler.mock.calls[0][0].detail;
    expect(rejected).toEqual([
      { file: oversized, reason: "size" },
      { file: duplicate, reason: "duplicate" },
      { file: skipped, reason: "invalid" },
    ]);
    expect(
      changeHandler.mock.calls[0][0].detail.map((f: File) => f.name),
    ).toEqual(["kept.txt", "ok.txt"]);
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
    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);

    target.focus();
    await user.keyboard("{Enter}");

    expect(clickSpy).toHaveBeenCalled();
  });

  it("should place focusable role on a single element (no duplicated button semantics)", () => {
    const { container } = render(FileUploaderDropContainer);

    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);
    // The drop target is the single focusable role="button" element and
    // carries Carbon's custom focus outline.
    expect(target).toHaveAttribute("tabindex", "0");
    expect(target).toHaveAttribute("role", "button");

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);
    // The inner container is a plain layout div with no interactive role.
    expect(dropContainer).not.toHaveAttribute("tabindex");
    expect(dropContainer).not.toHaveAttribute("role");
  });

  it("should handle role prop", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { role: "group" },
    });

    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);
    expect(target).toHaveAttribute("role", "group");
  });

  it("should handle tabindex prop", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { tabindex: "-1" },
    });

    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);
    expect(target).toHaveAttribute("tabindex", "-1");
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

    const target = screen.getByRole("button");
    expect(target).toHaveAttribute("id", "custom-drop-drop-target");
    expect(input).toHaveAttribute("aria-labelledby", "custom-drop-drop-target");
  });

  it("should render the drop target as a div, not a label", () => {
    const { container } = render(FileUploaderDropContainer);

    // A <label> may not take role="button".
    expect(container.querySelector("label")).toBeNull();
    expect(screen.getByRole("button").tagName).toBe("DIV");
  });

  it("should open the file picker on click", async () => {
    const { container } = render(FileUploaderDropContainer);

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    const clickSpy = vi.spyOn(input, "click");

    await user.click(screen.getByRole("button"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("should not open the file picker when disabled", async () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { disabled: true },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    const clickSpy = vi.spyOn(input, "click");

    await user.click(screen.getByRole("button"));

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("should keep Space from scrolling the page", () => {
    render(FileUploaderDropContainer);

    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    screen.getByRole("button").dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("should still let getByLabelText find the input", () => {
    render(FileUploaderDropContainer, {
      props: { labelText: "Drop files here" },
    });

    expect(screen.getByLabelText("Drop files here")).toHaveAttribute(
      "type",
      "file",
    );
  });
});
