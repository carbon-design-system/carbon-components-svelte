import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FileUploaderDropContainerSlot from "./FileUploaderDropContainer.slot.test.svelte";
import FileUploaderDropContainer from "./FileUploaderDropContainer.test.svelte";
import {
  createDragEvent,
  dropFiles,
  fileNames,
  getDropZone,
  getFileInput,
  makeFile,
  simulateFileSelection,
} from "./helpers";

describe("FileUploaderDropContainer", () => {
  it("should handle disabled state", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { disabled: true },
    });

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

  it("should handle dragover event and show drag-over state", async () => {
    const { container } = render(FileUploaderDropContainer);

    const dropDiv = getDropZone(container);

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);

    const file = makeFile("test.txt");
    const dragOverEvent = createDragEvent("dragover", [file]);

    dropDiv.dispatchEvent(dragOverEvent);

    await vi.waitFor(() => {
      expect(dropContainer).toHaveClass("bx--file__drop-container--drag-over");
    });
  });

  it("should keep drag-over state when dragleave moves onto a child element", async () => {
    const { container } = render(FileUploaderDropContainer);

    const dropDiv = getDropZone(container);

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);

    const file = makeFile("test.txt");
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

    const png = new File(["a"], "logo.PNG", { type: "image/png" });
    const jpeg = new File(["b"], "photo", { type: "image/jpeg" });
    const text = new File(["c"], "notes.txt", { type: "text/plain" });
    dropFiles(container, [png, jpeg, text]);

    await vi.waitFor(() => expect(changeHandler).toHaveBeenCalled());
    expect(changeHandler.mock.calls[0][0].detail).toEqual([png, jpeg]);
    expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
      { file: text, reason: "type" },
    ]);
  });

  it("should dispatch add and change events when files are dropped", async () => {
    const addHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { onadd: addHandler, onchange: changeHandler },
    });

    const file = makeFile("test.txt");
    dropFiles(container, [file]);

    await vi.waitFor(() => {
      expect(addHandler).toHaveBeenCalled();
    });

    const event = addHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("test.txt");

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const changeEvent = changeHandler.mock.calls[0][0];
    expect(changeEvent.detail).toHaveLength(1);
    expect(changeEvent.detail[0].name).toBe("test.txt");
  });

  it("should not include rejected files in the native input's files property", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { multiple: true, maxFileSize: 1000, onchange: changeHandler },
    });

    const input = getFileInput(container);

    const smallFile = makeFile("small.txt", 500);
    const largeFile = makeFile("large.txt", 2000);
    dropFiles(container, [smallFile, largeFile]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(input.files).toHaveLength(1);
    expect(fileNames(input)).toEqual(["small.txt"]);
  });

  it("should keep only the first valid dropped file when multiple is false", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: { maxFileSize: 10, onchange: changeHandler },
    });

    dropFiles(container, [
      makeFile("large.txt", 20),
      makeFile("a.txt", 1),
      makeFile("b.txt", 1),
    ]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });
    expect(fileNames(getFileInput(container))).toEqual(["a.txt"]);
  });

  describe("native input sync", () => {
    it("leaves files rejected from a browse pick out of the native input", async () => {
      const changeHandler = vi.fn();
      const { container } = render(FileUploaderDropContainer, {
        props: { multiple: true, maxFileSize: 1000, onchange: changeHandler },
      });
      const input = getFileInput(container);

      simulateFileSelection(input, [
        makeFile("small.txt", 500),
        makeFile("large.txt", 2000),
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
      const input = getFileInput(container);

      simulateFileSelection(input, [makeFile("a.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt"]);
      });

      simulateFileSelection(input, [makeFile("b.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt", "b.txt"]);
      });
    });

    it("combines dropped and browsed files in the native input", async () => {
      const { container } = render(FileUploaderDropContainer, {
        props: { multiple: true },
      });
      const input = getFileInput(container);

      dropFiles(container, [makeFile("a.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt"]);
      });

      simulateFileSelection(input, [makeFile("b.txt")]);
      await vi.waitFor(() => {
        expect(fileNames(input)).toEqual(["a.txt", "b.txt"]);
      });
    });

    it("empties the native input when files is cleared programmatically", async () => {
      const { container, rerender } = render(FileUploaderDropContainer, {
        props: { multiple: true },
      });
      const input = getFileInput(container);

      simulateFileSelection(input, [makeFile("a.txt")]);
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

    const dropDiv = getDropZone(container);

    const dropContainer = container.querySelector(".bx--file__drop-container");
    assert(dropContainer instanceof HTMLElement);

    const file = makeFile("test.txt");
    const dragOverEvent = createDragEvent("dragover", [file]);

    dropDiv.dispatchEvent(dragOverEvent);
    await tick();

    expect(dropContainer).not.toHaveClass(
      "bx--file__drop-container--drag-over",
    );
  });

  it("ignores a drop when disabled", async () => {
    const addHandler = vi.fn();
    const changeHandler = vi.fn();
    const { component, container } = render(FileUploaderDropContainer, {
      props: { disabled: true, onadd: addHandler, onchange: changeHandler },
    });

    const event = dropFiles(container, [makeFile("test.txt")]);
    await tick();

    expect(addHandler).not.toHaveBeenCalled();
    expect(changeHandler).not.toHaveBeenCalled();
    expect(component.files).toEqual([]);
    // The browser would otherwise navigate to the dropped file.
    expect(event.defaultPrevented).toBe(true);
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

    const smallFile = makeFile("small.txt", 500);
    const largeFile = makeFile("large.txt", 2000);
    dropFiles(container, [smallFile, largeFile]);

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

    const file = makeFile("ok.txt");
    dropFiles(container, [file]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(rejectedHandler).not.toHaveBeenCalled();
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

    const oversized = new File(["x".repeat(2000)], "big.txt", {
      type: "text/plain",
    });
    const duplicate = new File(["ok"], "kept.txt", { type: "text/plain" });
    Object.defineProperty(duplicate, "lastModified", { value: 1 });
    const skipped = new File(["x".repeat(10)], "skip-me.txt", {
      type: "text/plain",
    });
    const ok = new File(["x".repeat(10)], "ok.txt", { type: "text/plain" });

    dropFiles(container, [oversized, duplicate, skipped, ok]);

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

  it("should handle keyboard interaction to trigger file input", async () => {
    const { container } = render(FileUploaderDropContainer);

    const input = getFileInput(container);

    const clickSpy = vi.spyOn(input, "click");
    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);

    target.focus();
    await user.keyboard("{Enter}");

    expect(clickSpy).toHaveBeenCalled();
  });

  it.each(["{Enter}", " "])(
    "does not open the file picker on %j when disabled",
    async (key) => {
      const { container } = render(FileUploaderDropContainer, {
        props: { disabled: true },
      });
      const clickSpy = vi.spyOn(getFileInput(container), "click");
      const target = container.querySelector(".bx--file-browse-btn");
      assert(target instanceof HTMLElement);

      target.focus();
      await user.keyboard(key);

      expect(clickSpy).not.toHaveBeenCalled();
    },
  );

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

  it("should handle id attribute", () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { id: "custom-drop" },
    });

    const target = screen.getByRole("button");
    expect(target).toHaveAttribute("id", "custom-drop-drop-target");
    expect(getFileInput(container)).toHaveAttribute(
      "aria-labelledby",
      "custom-drop-drop-target",
    );
  });

  it("should render the drop target as a div, not a label", () => {
    const { container } = render(FileUploaderDropContainer);

    // A <label> may not take role="button".
    expect(container.querySelector("label")).toBeNull();
    expect(screen.getByRole("button").tagName).toBe("DIV");
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

  it("supports custom label slot for FileUploaderDropContainer", () => {
    render(FileUploaderDropContainerSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("should accept files under maxFiles limit", async () => {
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        multiple: true,
        maxFiles: 3,
        onrejected: rejectedHandler,
        onchange: changeHandler,
      },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    simulateFileSelection(input, [
      new File(["a"], "file1.txt", { type: "text/plain" }),
      new File(["b"], "file2.txt", { type: "text/plain" }),
      new File(["c"], "file3.txt", { type: "text/plain" }),
    ]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(3);
    expect(rejectedHandler).not.toHaveBeenCalled();
  });

  it("should reject excess files with reason count when exceeding maxFiles", async () => {
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderDropContainer, {
      props: {
        multiple: true,
        maxFiles: 3,
        onrejected: rejectedHandler,
        onchange: changeHandler,
      },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    simulateFileSelection(input, [
      new File(["a"], "file1.txt", { type: "text/plain" }),
      new File(["b"], "file2.txt", { type: "text/plain" }),
      new File(["c"], "file3.txt", { type: "text/plain" }),
      new File(["d"], "file4.txt", { type: "text/plain" }),
    ]);

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    const rejected = rejectedHandler.mock.calls[0][0].detail;
    expect(rejected).toHaveLength(1);
    expect(rejected[0].file.name).toBe("file4.txt");
    expect(rejected[0].reason).toBe("count");
    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(3);
  });

  it("should disable further picks when at maxFiles", async () => {
    const { container } = render(FileUploaderDropContainer, {
      props: { multiple: true, maxFiles: 2 },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    simulateFileSelection(input, [
      new File(["a"], "file1.txt", { type: "text/plain" }),
      new File(["b"], "file2.txt", { type: "text/plain" }),
    ]);

    await vi.waitFor(() => {
      expect(input).toBeDisabled();
    });

    const target = container.querySelector(".bx--file-browse-btn");
    assert(target instanceof HTMLElement);
    expect(target).toHaveClass("bx--file-browse-btn--disabled");
    expect(target).toHaveAttribute("aria-disabled", "true");
    expect(target).toHaveAttribute("tabindex", "-1");
  });
});
