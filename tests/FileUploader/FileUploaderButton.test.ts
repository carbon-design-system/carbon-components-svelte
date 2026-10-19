import { render, screen } from "@testing-library/svelte";
import type FileUploaderButtonComponent from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import { type ComponentProps, tick } from "svelte";
import FileUploaderButtonSlot from "./FileUploaderButton.slot.test.svelte";
import FileUploaderButton from "./FileUploaderButton.test.svelte";
import {
  emptyFileInput,
  getFileInput,
  makeFile,
  simulateFileSelection,
} from "./helpers";

describe("FileUploaderButton", () => {
  it("should handle disabled state", () => {
    render(FileUploaderButton, { props: { disabled: true } });

    expect(screen.getByRole("button")).toHaveClass("bx--btn--disabled");
  });

  it("should update label text when files are selected (single file)", async () => {
    const { container } = render(FileUploaderButton, {
      props: { labelText: "Add file" },
    });

    const input = getFileInput(container);

    const file = makeFile("test.txt");
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

    const input = getFileInput(container);

    const file1 = makeFile("file1.txt");
    const file2 = makeFile("file2.txt");
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

    const input = getFileInput(container);

    const file = makeFile("test.txt");
    simulateFileSelection(input, [file]);

    await vi.waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("test.txt");
    });

    // Clear files by resetting the input element
    emptyFileInput(input);
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

    const input = getFileInput(container);

    const file = makeFile("test.txt");
    simulateFileSelection(input, [file]);
    // Let the pick flush. A `waitFor` would pass on its first, pre-flush run.
    await tick();

    expect(screen.getByRole("button")).toHaveTextContent("Add file");
  });

  it("should dispatch change event when files are selected", async () => {
    const changeHandler = vi.fn();
    const { container } = render(FileUploaderButton, {
      props: { onchange: changeHandler },
    });

    const input = getFileInput(container);

    const file = makeFile("test.txt");
    simulateFileSelection(input, [file]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event = changeHandler.mock.calls[0][0];
    expect(event.detail).toHaveLength(1);
    expect(event.detail[0].name).toBe("test.txt");
  });

  it.each(["primary", "secondary", "tertiary", "ghost", "danger"] as const)(
    "should render the %s button kind",
    (kind) => {
      render(FileUploaderButton, { props: { kind } });

      expect(screen.getByRole("button")).toHaveClass(`bx--btn--${kind}`);
    },
  );

  it.each([
    ["small", "bx--btn--sm"],
    ["field", "bx--btn--field"],
    ["lg", "bx--btn--lg"],
    ["xl", "bx--btn--xl"],
  ] as const)("should render the %s button size", (size, className) => {
    render(FileUploaderButton, { props: { size } });

    expect(screen.getByRole("button")).toHaveClass(className);
  });

  it("sizes the button for xs", () => {
    const { container } = render(FileUploaderButton, {
      props: { size: "xs" },
    });

    expect(container.querySelector(".bx--btn")).toHaveClass("bx--btn--xs");
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

  it("should keep an icon-only button icon-only after a pick", async () => {
    const { container } = render(FileUploaderButton, {
      props: { icon: Add, iconDescription: "Add file", labelText: "" },
    });

    simulateFileSelection(getFileInput(container), [makeFile("test.txt")]);
    await tick();

    expect(screen.getByRole("button", { name: "Add file" })).toHaveClass(
      "bx--btn--icon-only",
    );
  });

  it.each([
    ["bottom", "center"],
    ["right", "end"],
  ] as const)(
    "should render icon-only button with tooltip at %s, aligned %s",
    (tooltipPosition, tooltipAlignment) => {
      render(FileUploaderButton, {
        props: {
          icon: Add,
          iconDescription: "Tooltip text",
          tooltipPosition,
          tooltipAlignment,
          labelText: "",
        },
      });

      const iconButton = screen.getByRole("button", { name: "Tooltip text" });
      expect(iconButton).toHaveClass("bx--btn--icon-only");
      expect(iconButton).toHaveClass("bx--tooltip__trigger");
      expect(iconButton).toHaveClass("bx--tooltip--a11y");
      expect(iconButton).toHaveClass(`bx--btn--icon-only--${tooltipPosition}`);
      expect(iconButton).toHaveClass(`bx--tooltip--align-${tooltipAlignment}`);
    },
  );

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

  describe("maxFileSize", () => {
    it("should clear the selection and restore the label when the only file is rejected", async () => {
      const rejectedHandler = vi.fn();
      const { container } = render(FileUploaderButton, {
        props: { maxFileSize: 4, onrejected: rejectedHandler },
      });

      const input = getFileInput(container);

      simulateFileSelection(input, [makeFile("large.txt", 8)]);

      await vi.waitFor(() => {
        expect(rejectedHandler).toHaveBeenCalledTimes(1);
      });
      expect(screen.getByRole("button")).toHaveTextContent("Add file");
    });

    it("should clear an existing selection when a later single-file pick is rejected", async () => {
      const changeHandler = vi.fn();
      const { component, container } = render(FileUploaderButton, {
        props: { maxFileSize: 4, onchange: changeHandler },
      });

      const input = getFileInput(container);

      const small = makeFile("small.txt", 2);
      simulateFileSelection(input, [small]);

      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalledTimes(1);
      });
      expect(screen.getByRole("button")).toHaveTextContent("small.txt");

      // A single-file input replaces its selection, so a rejected pick leaves
      // nothing behind. This matches `FileUploaderDropContainer`.
      simulateFileSelection(input, [makeFile("large.txt", 8)]);

      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalledTimes(2);
      });
      expect(changeHandler.mock.calls[1][0].detail).toEqual([]);
      expect(component.files).toEqual([]);
      expect(screen.getByRole("button")).toHaveTextContent("Add file");
    });
  });

  describe("maxFileSize with preventDuplicate", () => {
    it("should report size and duplicate rejections in a single event", async () => {
      const changeHandler = vi.fn();
      const rejectedHandler = vi.fn();
      const { component, container } = render(FileUploaderButton, {
        props: {
          multiple: true,
          maxFileSize: 4,
          preventDuplicate: true,
          onchange: changeHandler,
          onrejected: rejectedHandler,
        },
      });

      const input = getFileInput(container);

      const lastModified = 1700000000000;
      const props = { lastModified };
      const fileA = makeFile("a.txt", 1, props);
      simulateFileSelection(input, [fileA]);

      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalledTimes(1);
      });
      expect(rejectedHandler).not.toHaveBeenCalled();

      const fileADup = makeFile("a.txt", 1, props);
      const large = makeFile("large.txt", 8, props);
      const fileB = makeFile("b.txt", 1, props);
      simulateFileSelection(input, [fileADup, large, fileB]);

      await vi.waitFor(() => {
        expect(rejectedHandler).toHaveBeenCalledTimes(1);
      });
      expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
        { file: large, reason: "size" },
        { file: fileADup, reason: "duplicate" },
      ]);
      expect(component.files).toEqual([fileA, fileB]);
    });
  });

  describe("rejected duplicates", () => {
    it("should not dedupe in single-file mode", async () => {
      const changeHandler = vi.fn();
      const rejectedHandler = vi.fn();
      const { container } = render(FileUploaderButton, {
        props: {
          preventDuplicate: true,
          onchange: changeHandler,
          onrejected: rejectedHandler,
        },
      });

      const input = getFileInput(container);

      const lastModified = 1700000000000;
      const props = { lastModified };
      simulateFileSelection(input, [makeFile("a.txt", 1, props)]);
      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalledTimes(1);
      });

      const reselected = makeFile("a.txt", 1, props);
      simulateFileSelection(input, [reselected]);

      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalledTimes(2);
      });
      expect(changeHandler.mock.calls[1][0].detail).toEqual([reselected]);
      expect(rejectedHandler).not.toHaveBeenCalled();
    });
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = FileUploaderButtonComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = FileUploaderButtonComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });

  it("supports custom label slot for FileUploaderButton", () => {
    render(FileUploaderButtonSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });
});
