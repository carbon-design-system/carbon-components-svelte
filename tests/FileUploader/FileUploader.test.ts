import { render, screen } from "@testing-library/svelte";
import FileUploaderComponent from "carbon-components-svelte/FileUploader/FileUploader.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FileUploaderDescriptionSlot from "./FileUploader.descriptionSlot.test.svelte";
import FileUploaderPerFileStatusDemo from "./FileUploader.perFileStatus.test.svelte";
import FileUploader from "./FileUploader.test.svelte";
import {
  fileNames,
  getFileInput,
  getRefInput,
  makeFile,
  removeButtons,
  selectFiles,
  simulateFileSelection,
} from "./helpers";

type RejectionRow = {
  title: string;
  props: Record<string, unknown>;
  /** Picked (and accepted) before `files`, as `[name, size]`. */
  first?: Array<[string, number]>;
  /** Picked last, as `[name, size]`. */
  files: Array<[string, number]>;
  /** Names of the rows left on screen, in order. */
  rows: string[];
  rejected: Array<{ name: string; reason: string }>;
};

type Uploader = {
  files: ReadonlyArray<File> | undefined;
  fileUploader: { clearFiles(): void } | undefined;
};

const clearMethods = [
  [
    "files = []",
    (component: Uploader) => {
      component.files = [];
    },
  ],
  [
    "clearFiles()",
    (component: Uploader) => {
      assert(component.fileUploader);
      component.fileUploader.clearFiles();
    },
  ],
] as const;

describe("FileUploader", () => {
  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1785
  it("should synchronize input.files when files are removed programmatically", async () => {
    const { component } = render(FileUploader);

    const input = await selectFiles(component, [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
      makeFile("file3.txt"),
    ]);
    expect(fileNames(input)).toEqual(["file1.txt", "file2.txt", "file3.txt"]);

    await user.click(removeButtons()[1]);

    await vi.waitFor(() => {
      expect(screen.queryAllByText(/file\d\.txt/)).toHaveLength(2);
    });

    expect(fileNames(input)).toEqual(["file1.txt", "file3.txt"]);
  });

  it("should dispatch remove with only the deleted middle file (not shifted neighbors)", async () => {
    const addHandler = vi.fn();
    const removeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onAdd: addHandler, onRemove: removeHandler, multiple: true },
    });

    await selectFiles(component, [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
      makeFile("file3.txt"),
    ]);

    addHandler.mockClear();
    removeHandler.mockClear();

    expect(removeButtons()).toHaveLength(3);
    await user.click(removeButtons()[1]);

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

    await selectFiles(component, [makeFile("a.txt")]);

    addHandler.mockClear();
    removeHandler.mockClear();

    await selectFiles(component, [makeFile("b.txt")]);

    expect(removeHandler).not.toHaveBeenCalled();
    expect(addHandler).toHaveBeenCalledTimes(1);
    const added = addHandler.mock.calls[0][0].detail;
    expect(added).toHaveLength(1);
    expect(added[0].name).toBe("b.txt");
  });

  it("should clear input.files when all files are removed", async () => {
    const { component } = render(FileUploader);

    const input = await selectFiles(component, [makeFile("test-file.txt")]);
    expect(fileNames(input)).toEqual(["test-file.txt"]);

    await user.click(removeButtons()[0]);

    await vi.waitFor(() => {
      expect(screen.queryByText("test-file.txt")).not.toBeInTheDocument();
    });

    expect(fileNames(input)).toEqual([]);
    expect(input.value).toBe("");
  });

  it.each(clearMethods)("should clear all files using %s", async (_, clear) => {
    const { component } = render(FileUploader);

    const input = await selectFiles(component, [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
    ]);
    expect(fileNames(input)).toHaveLength(2);

    clear(component);

    await vi.waitFor(() => {
      expect(screen.queryAllByText(/file\d\.txt/)).toHaveLength(0);
    });

    expect(fileNames(input)).toEqual([]);
    expect(input.value).toBe("");
  });

  it("should dispatch add event when files are added", async () => {
    const addHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onAdd: addHandler },
    });

    simulateFileSelection(getRefInput(component), [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
    ]);

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

    component.files = [makeFile("file1.txt"), makeFile("file2.txt")];

    await vi.waitFor(() => {
      expect(addHandler).toHaveBeenCalled();
    });

    const added = addHandler.mock.calls[0][0].detail;
    expect(added).toHaveLength(2);
    expect(added[0].name).toBe("file1.txt");
    expect(added[1].name).toBe("file2.txt");
  });

  it("should handle disabled state", () => {
    const { container } = render(FileUploader, {
      props: { disabled: true },
    });

    expect(getFileInput(container)).toBeDisabled();

    const button = container.querySelector("button");
    assert(button);
    expect(button).toHaveClass("bx--btn--disabled");
  });

  it.each([
    ["capture", "environment", "capture", "environment"],
    ["accept", [".jpg", ".png"], "accept", ".jpg,.png"],
    ["name", "file-upload", "name", "file-upload"],
  ])("should forward %s to the input", (prop, value, attr, expected) => {
    const { container } = render(FileUploader, {
      props: { [prop]: value },
    });

    expect(getFileInput(container)).toHaveAttribute(attr, expected);
  });

  it("should show each file's folder path when directory is set", async () => {
    const { component } = render(FileUploader, {
      props: { directory: true },
    });
    assert(component.ref instanceof HTMLInputElement);
    expect(component.ref).toHaveAttribute("webkitdirectory");

    const file = new File(["a"], "index.html");
    Object.defineProperty(file, "webkitRelativePath", {
      value: "site/blog/index.html",
    });
    simulateFileSelection(component.ref, [file]);

    expect(await screen.findByText("site/blog/index.html")).toBeInTheDocument();
  });

  it("should disable each row's remove button when disabled", async () => {
    const { container } = render(FileUploader, {
      props: { disabled: true, files: [makeFile("a.txt")] },
    });

    const remove = await screen.findByRole("button", { name: /remove file/i });
    expect(remove).toBeDisabled();
    expect(container.querySelector(".bx--file__selected-file")).toHaveClass(
      "bx--file__selected-file--disabled",
    );
  });

  it("should replace the selection when multiple is false", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: false },
    });

    const input = getRefInput(component);
    expect(input).not.toHaveAttribute("multiple");

    // A native single-file picker hands over one file per pick and replaces
    // the previous selection.
    simulateFileSelection(input, [makeFile("file1.txt")]);
    await vi.waitFor(() => {
      expect(screen.getAllByText(/file\d\.txt/)).toHaveLength(1);
    });
    expect(screen.getByText("file1.txt")).toBeInTheDocument();

    simulateFileSelection(input, [makeFile("file2.txt")]);
    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
    });
    expect(screen.getAllByText(/file\d\.txt/)).toHaveLength(1);
    expect(screen.getByText("file2.txt")).toBeInTheDocument();
    expect(fileNames(input)).toEqual(["file2.txt"]);
  });

  it("emits remove for the old file and add for the new one when replacing", async () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const { component } = render(FileUploader, {
      props: { multiple: false, onAdd, onRemove },
    });
    const first = makeFile("file1.txt");
    const second = makeFile("file2.txt");

    const input = await selectFiles(component, [first]);
    await vi.waitFor(() => {
      expect(onAdd).toHaveBeenCalledTimes(1);
    });
    expect(onRemove).not.toHaveBeenCalled();

    simulateFileSelection(input, [second]);
    await vi.waitFor(() => {
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    expect(onRemove.mock.calls[0][0].detail).toEqual([first]);
    expect(onAdd).toHaveBeenCalledTimes(2);
    expect(onAdd.mock.calls[1][0].detail).toEqual([second]);
  });

  it("should handle multiple file selection when multiple is true", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: true },
    });

    expect(getRefInput(component)).toHaveAttribute("multiple");

    await selectFiles(component, [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
    ]);

    expect(screen.queryAllByText(/file\d\.txt/)).toHaveLength(2);
  });

  it("should render labelTitle prop", () => {
    render(FileUploader, {
      props: { labelTitle: "Upload Files" },
    });

    expect(screen.getByText("Upload Files")).toBeInTheDocument();
  });

  it("should describe the add button with labelDescription", () => {
    render(FileUploader, {
      props: { labelDescription: "Max file size is 500 kB." },
    });

    expect(
      screen.getByRole("button", { name: "Add files" }),
    ).toHaveAccessibleDescription("Max file size is 500 kB.");
  });

  it("should describe the add button with the labelDescription slot", () => {
    render(FileUploaderDescriptionSlot);

    expect(
      screen.getByRole("button", { name: "Add files" }),
    ).toHaveAccessibleDescription("Max file size is 500 kB.");
  });

  it("should not describe the add button without a description", () => {
    render(FileUploader);

    expect(
      screen.getByRole("button", { name: "Add files" }),
    ).not.toHaveAttribute("aria-describedby");
  });

  it("should join a consumer aria-describedby with labelDescription", () => {
    const { container } = render(FileUploaderComponent, {
      props: {
        id: "resume",
        buttonLabel: "Add files",
        labelDescription: "Max file size is 500 kB.",
        "aria-describedby": "resume-error",
      },
    });

    expect(screen.getByRole("button", { name: "Add files" })).toHaveAttribute(
      "aria-describedby",
      "resume-description resume-error",
    );
    expect(container.querySelector(".bx--form-item")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("should move aria-labelledby to the add button", () => {
    const { container } = render(FileUploaderComponent, {
      props: { "aria-labelledby": "resume-label" },
    });

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-labelledby",
      "resume-label",
    );
    expect(container.querySelector(".bx--form-item")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it.each([
    ["uploading", ".bx--loading"],
    ["edit", "button.bx--file-close"],
    ["complete", ".bx--file-complete"],
  ] as const)(
    "should render the %s status icon on each row",
    (status, selector) => {
      const statusIcons = [
        ".bx--loading",
        "button.bx--file-close",
        ".bx--file-complete",
      ];
      const { container } = render(FileUploader, {
        props: { status, files: [makeFile("test.txt")] },
      });

      const stateContainer = container.querySelector(
        ".bx--file__selected-file .bx--file__state-container",
      );
      assert(stateContainer);
      for (const icon of statusIcons) {
        if (icon === selector) {
          expect(stateContainer.querySelector(icon)).toBeInTheDocument();
        } else {
          expect(stateContainer.querySelector(icon)).toBeNull();
        }
      }
    },
  );

  it("associates the control with the form named by `form`", () => {
    const outerForm = document.createElement("form");
    outerForm.id = "outer-form";
    document.body.append(outerForm);

    try {
      render(FileUploaderComponent, {
        props: { form: "outer-form", name: "files" },
      });

      expect(getFileInput(document).form).toBe(outerForm);
    } finally {
      outerForm.remove();
    }
  });

  it("derives the file input id from the id", () => {
    const { container } = render(FileUploaderComponent, {
      props: { id: "docs", labelTitle: "Upload", buttonLabel: "Add file" },
    });

    expect(container.querySelector(".bx--form-item")).toHaveAttribute(
      "id",
      "docs",
    );
    expect(getFileInput(container)).toHaveAttribute("id", "docs-input");
  });

  it("should dispatch click once per row removal", async () => {
    const onClick = vi.fn();
    const { component } = render(FileUploader, { props: { onClick } });

    await selectFiles(component, [makeFile("file1.txt")]);
    await user.click(removeButtons()[0]);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should remove file on keyboard interaction", async () => {
    const { component } = render(FileUploader);

    await selectFiles(component, [makeFile("file1.txt")]);

    removeButtons()[0].focus();
    await user.keyboard("{Enter}");

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
    });
  });

  it.each(["{Enter}", " "])(
    "should keep the row when a keydown handler prevents %s",
    async (key) => {
      const { component } = render(FileUploader, {
        props: { onKeydown: (e: KeyboardEvent) => e.preventDefault() },
      });

      await selectFiles(component, [makeFile("file1.txt")]);
      removeButtons()[0].focus();
      await user.keyboard(key);
      await tick();

      expect(screen.getByText("file1.txt")).toBeInTheDocument();
    },
  );

  // `target` indexes the remove buttons, then the add button.
  it.each([
    { row: "middle", count: 3, remove: 1, target: 2 },
    { row: "last", count: 3, remove: 2, target: 1 },
    { row: "only", count: 1, remove: 0, target: 1 },
  ])(
    "should move focus after removing the $row row with the keyboard",
    async ({ count, remove, target }) => {
      const { component } = render(FileUploader);

      await selectFiles(
        component,
        Array.from({ length: count }, (_, i) => makeFile(`file${i}.txt`)),
      );
      const targets = [
        ...removeButtons(),
        screen.getByRole("button", { name: "Add files" }),
      ];
      targets[remove].focus();
      await user.keyboard("{Enter}");

      await vi.waitFor(() => {
        expect(document.activeElement).toBe(targets[target]);
      });
    },
  );

  it.each<RejectionRow>([
    {
      title: "rejects files under minFileSize",
      props: { minFileSize: 1 },
      files: [
        ["empty.txt", 0],
        ["a.txt", 1],
      ],
      rows: ["a.txt"],
      rejected: [{ name: "empty.txt", reason: "size" }],
    },
    {
      title: "rejects only the oversized files of a mixed pick",
      props: { maxFileSize: 1000 },
      files: [
        ["small1.txt", 500],
        ["large.txt", 2000],
        ["small2.txt", 300],
      ],
      rows: ["small1.txt", "small2.txt"],
      rejected: [{ name: "large.txt", reason: "size" }],
    },
    {
      title: "rejects a lone oversized file",
      props: { maxFileSize: 1000 },
      files: [["large.txt", 2000]],
      rows: [],
      rejected: [{ name: "large.txt", reason: "size" }],
    },
    {
      title: "accepts a file at exactly maxFileSize",
      props: { maxFileSize: 1000 },
      files: [["exact.txt", 1000]],
      rows: ["exact.txt"],
      rejected: [],
    },
    {
      title: "rejects a duplicate when preventDuplicate is true",
      props: { preventDuplicate: true },
      first: [["file1.txt", 8]],
      files: [["file1.txt", 8]],
      rows: ["file1.txt"],
      rejected: [{ name: "file1.txt", reason: "duplicate" }],
    },
    {
      title: "keeps a duplicate when preventDuplicate is false (default)",
      props: {},
      first: [["file1.txt", 8]],
      files: [["file1.txt", 8]],
      rows: ["file1.txt", "file1.txt"],
      rejected: [],
    },
  ])("$title", async ({ props, first, files, rows, rejected }) => {
    const onRejected = vi.fn();
    const onChange = vi.fn();
    const { component } = render(FileUploader, {
      props: { multiple: true, onRejected, onChange, ...props },
    });
    const input = getRefInput(component);
    const pick = (specs: Array<[string, number]>) =>
      simulateFileSelection(
        input,
        specs.map(([name, size]) =>
          makeFile(name, size, { lastModified: 1000 }),
        ),
      );

    if (first) {
      pick(first);
      await vi.waitFor(() => {
        expect(screen.queryByText(first[0][0])).toBeInTheDocument();
      });
      onChange.mockClear();
    }
    pick(files);

    await vi.waitFor(() => {
      expect(rejected.length > 0 ? onRejected : onChange).toHaveBeenCalled();
    });
    await vi.waitFor(() => {
      expect(
        screen.queryAllByText(/\.txt$/).map((el) => el.textContent),
      ).toEqual(rows);
    });

    expect(fileNames(input)).toEqual(rows);
    expect(
      onChange.mock.calls[0][0].detail.map((file: File) => file.name),
    ).toEqual(rows);
    if (rejected.length > 0) {
      expect(
        onRejected.mock.calls[0][0].detail.map(
          ({ file, reason }: { file: File; reason: string }) => ({
            name: file.name,
            reason,
          }),
        ),
      ).toEqual(rejected);
    } else {
      expect(onRejected).not.toHaveBeenCalled();
    }
  });

  it("should dispatch change event with filtered files when maxFileSize is set", async () => {
    const changeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { maxFileSize: 1000, multiple: false, onChange: changeHandler },
    });

    const input = getRefInput(component);
    simulateFileSelection(input, [makeFile("small.txt", 500)]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event1 = changeHandler.mock.calls[0][0];
    expect(event1.detail).toHaveLength(1);
    expect(event1.detail[0].name).toBe("small.txt");

    changeHandler.mockClear();

    simulateFileSelection(input, [makeFile("large.txt", 2000)]);

    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalled();
    });

    const event2 = changeHandler.mock.calls[0][0];
    expect(event2.detail).toHaveLength(0);
  });

  it.each(clearMethods)(
    "should dispatch remove, change, and clear when %s empties multiple files",
    async (_, clear) => {
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

      await selectFiles(component, [
        makeFile("file1.txt"),
        makeFile("file2.txt"),
      ]);

      changeHandler.mockClear();
      clearHandler.mockClear();
      removeHandler.mockClear();
      clear(component);

      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalled();
        expect(clearHandler).toHaveBeenCalled();
        expect(removeHandler).toHaveBeenCalled();
      });

      expect(changeHandler.mock.calls[0][0].detail).toHaveLength(0);
      expect(removeHandler.mock.calls[0][0].detail).toHaveLength(2);
      expect(removeHandler.mock.calls[0][0].detail[0].name).toBe("file1.txt");
      expect(removeHandler.mock.calls[0][0].detail[1].name).toBe("file2.txt");
    },
  );

  it("should not dispatch clear when only some files are removed via row close", async () => {
    const clearHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onClear: clearHandler, multiple: true },
    });

    await selectFiles(component, [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
    ]);

    await user.click(removeButtons()[0]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
    });

    expect(clearHandler).not.toHaveBeenCalled();
  });

  it("should dispatch remove then change with the remaining files via row close", async () => {
    const events: string[] = [];
    const log = (type: string) => (e: CustomEvent<ReadonlyArray<File>>) =>
      events.push(`${type}:${e.detail.map((f) => f.name).join(",")}`);
    const { component } = render(FileUploader, {
      props: { onRemove: log("remove"), onChange: log("change") },
    });

    await selectFiles(component, [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
    ]);
    events.length = 0;

    await user.click(removeButtons()[0]);

    await vi.waitFor(() => {
      expect(events).toEqual(["remove:file1.txt", "change:file2.txt"]);
    });
  });

  it("should dispatch change and clear when the last file is removed via row close", async () => {
    const changeHandler = vi.fn();
    const clearHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { onChange: changeHandler, onClear: clearHandler },
    });

    await selectFiles(component, [makeFile("file1.txt")]);

    changeHandler.mockClear();
    await user.click(removeButtons()[0]);

    await vi.waitFor(() => {
      expect(clearHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(0);
  });

  it("should prepend new files when orderFiles is 'prepend'", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: true, orderFiles: "prepend" },
    });

    await selectFiles(component, [makeFile("a.txt")]);
    await selectFiles(component, [makeFile("b.txt")]);

    const names = screen.queryAllByText(/\.txt$/).map((el) => el.textContent);
    expect(names).toEqual(["b.txt", "a.txt"]);
  });

  it("should append new files by default (orderFiles='append')", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: true },
    });

    await selectFiles(component, [makeFile("a.txt")]);
    await selectFiles(component, [makeFile("b.txt")]);

    const names = screen.queryAllByText(/\.txt$/).map((el) => el.textContent);
    expect(names).toEqual(["a.txt", "b.txt"]);
  });

  it("should support a custom orderFiles function", async () => {
    const orderFiles = (
      existing: ReadonlyArray<File>,
      added: ReadonlyArray<File>,
    ) => [...existing, ...added].sort((a, b) => a.name.localeCompare(b.name));

    const { component } = render(FileUploader, {
      props: { multiple: true, orderFiles },
    });

    await selectFiles(component, [makeFile("banana.txt", 1)]);
    await selectFiles(component, [makeFile("apple.txt", 1)]);

    const names = screen.queryAllByText(/\.txt$/).map((el) => el.textContent);
    expect(names).toEqual(["apple.txt", "banana.txt"]);
  });

  it("should use per-file labels when iconDescription is a function", async () => {
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

    await selectFiles(component, [
      makeFile("file1.txt"),
      makeFile("file2.txt"),
    ]);

    const closeButtons = removeButtons();
    expect(closeButtons).toHaveLength(2);
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
    const { container } = render(FileUploader, {
      props: {
        multiple: true,
        status: "edit",
        files: [
          makeFile("file1.txt"),
          makeFile("file2.txt"),
          makeFile("file3.txt"),
        ],
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

  it("demo-style fileStatus transitions uploading to complete", async () => {
    const { container } = render(FileUploaderPerFileStatusDemo, {
      props: { delay: 50 },
    });

    simulateFileSelection(getFileInput(container), [makeFile("a.txt")]);

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
    const file = makeFile("file1.txt");
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

  it("should render per-file invalid state and error copy", () => {
    const { container } = render(FileUploader, {
      props: {
        multiple: true,
        status: "edit",
        files: [makeFile("ok.txt"), makeFile("bad.txt")],
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
    const alert = screen.getByRole("alert");
    expect(rows[1]).toContainElement(alert);
    expect(alert).toHaveTextContent("Upload failed Please try again.");
    expect(rows[1].querySelector(".bx--file-invalid")).toBeInTheDocument();
  });

  it("hides the error copy for a row that is not invalid", () => {
    render(FileUploader, {
      props: {
        files: [makeFile("ok.txt")],
        fileInvalid: () => false,
        fileErrorSubject: () => "Upload failed",
        fileErrorBody: () => "Please try again.",
      },
    });

    expect(screen.getByText("ok.txt")).toBeInTheDocument();
    expect(screen.queryByText("Upload failed")).not.toBeInTheDocument();
    expect(screen.queryByText("Please try again.")).not.toBeInTheDocument();
  });

  it("should not render file sizes by default", () => {
    const file = new File([new Uint8Array(2048)], "big.txt", {
      type: "text/plain",
    });

    const { container } = render(FileUploader, { props: { files: [file] } });

    expect(container.querySelector(".bx--file-size")).not.toBeInTheDocument();
  });

  it("should render a decimal file size when fileSize is true", () => {
    const file = new File([new Uint8Array(1500)], "big.txt", {
      type: "text/plain",
    });

    render(FileUploader, { props: { files: [file], fileSize: true } });

    expect(screen.getByText("1.5 kB")).toBeInTheDocument();
  });

  it("should render a binary file size when fileSize is binary", () => {
    const file = new File([new Uint8Array(1536)], "big.txt", {
      type: "text/plain",
    });

    render(FileUploader, { props: { files: [file], fileSize: "binary" } });

    expect(screen.getByText("1.5 KiB")).toBeInTheDocument();
  });

  it("should render custom file size text from a function", () => {
    const file = new File([new Uint8Array(2048)], "big.txt", {
      type: "text/plain",
    });

    render(FileUploader, {
      props: {
        files: [file],
        fileSize: (f: File, index: number) => `${f.size} octets (#${index})`,
      },
    });

    expect(screen.getByText("2048 octets (#0)")).toBeInTheDocument();
  });

  it("should give each remove button a distinct name by default", async () => {
    const { component } = render(FileUploader, {
      props: { multiple: true, status: "edit" },
    });

    await selectFiles(component, [makeFile("a.txt"), makeFile("b.txt")]);

    expect(
      screen.getByRole("button", { name: "Remove file a.txt" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove file b.txt" }),
    ).toBeInTheDocument();
  });

  it("should describe an invalid row's remove button with its error message", async () => {
    const { component } = render(FileUploader, {
      props: {
        multiple: true,
        status: "edit",
        fileInvalid: (file: File) => file.name === "bad.txt",
        fileErrorSubject: (file: File) => `${file.name} is too large`,
        fileErrorBody: () => "Select a smaller file.",
      },
    });

    await selectFiles(component, [makeFile("good.txt"), makeFile("bad.txt")]);

    expect(
      screen.getByRole("button", { name: "Remove file bad.txt" }),
    ).toHaveAccessibleDescription(
      "bad.txt is too large Select a smaller file.",
    );
    expect(
      screen.getByRole("button", { name: "Remove file good.txt" }),
    ).not.toHaveAttribute("aria-describedby");
  });

  it("should keep an invalid row's alert when another file is added", async () => {
    const { component } = render(FileUploader, {
      props: {
        multiple: true,
        status: "edit",
        fileInvalid: (file: File) => file.name === "bad.txt",
        fileErrorSubject: () => "Upload failed",
      },
    });

    await selectFiles(component, [makeFile("bad.txt")]);
    const alert = screen.getByRole("alert");

    await selectFiles(component, [makeFile("good.txt")]);
    expect(screen.getAllByRole("alert")).toEqual([alert]);
  });

  describe("long file names", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should set a title on a truncated file name", async () => {
      vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(10);
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(
        100,
      );
      render(FileUploader, {
        props: { files: [makeFile("quarterly-report-final.pdf")] },
      });

      const name = await screen.findByText("quarterly-report-final.pdf");
      await vi.waitFor(() => {
        expect(name).toHaveAttribute("title", "quarterly-report-final.pdf");
      });
    });

    it("should not set a title on a file name that fits", async () => {
      render(FileUploader, { props: { files: [makeFile("a.txt")] } });

      const name = await screen.findByText("a.txt");
      await tick();
      expect(name).not.toHaveAttribute("title");
    });
  });

  it("should accept files under maxFiles limit", async () => {
    const rejectedHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { multiple: true, maxFiles: 3, onRejected: rejectedHandler },
    });

    const files = [
      new File(["a"], "file1.txt", { type: "text/plain" }),
      new File(["b"], "file2.txt", { type: "text/plain" }),
      new File(["c"], "file3.txt", { type: "text/plain" }),
    ];

    assert(component.ref instanceof HTMLInputElement);
    simulateFileSelection(component.ref, files);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
      expect(screen.queryByText("file2.txt")).toBeInTheDocument();
      expect(screen.queryByText("file3.txt")).toBeInTheDocument();
    });

    expect(rejectedHandler).not.toHaveBeenCalled();
  });

  it("should reject excess files with reason count when exceeding maxFiles", async () => {
    const rejectedHandler = vi.fn();
    const changeHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: {
        multiple: true,
        maxFiles: 3,
        onRejected: rejectedHandler,
        onChange: changeHandler,
      },
    });

    const files = [
      new File(["a"], "file1.txt", { type: "text/plain" }),
      new File(["b"], "file2.txt", { type: "text/plain" }),
      new File(["c"], "file3.txt", { type: "text/plain" }),
      new File(["d"], "file4.txt", { type: "text/plain" }),
    ];

    assert(component.ref instanceof HTMLInputElement);
    simulateFileSelection(component.ref, files);

    await vi.waitFor(() => {
      expect(rejectedHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    const rejected = rejectedHandler.mock.calls[0][0].detail;
    expect(rejected).toHaveLength(1);
    expect(rejected[0].file.name).toBe("file4.txt");
    expect(rejected[0].reason).toBe("count");

    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(3);
    expect(screen.queryByText("file4.txt")).not.toBeInTheDocument();
  });

  it("should reject additional picks when already at maxFiles", async () => {
    const rejectedHandler = vi.fn();
    const { component } = render(FileUploader, {
      props: { multiple: true, maxFiles: 2, onRejected: rejectedHandler },
    });

    assert(component.ref instanceof HTMLInputElement);
    const input = component.ref;
    simulateFileSelection(input, [
      new File(["a"], "file1.txt", { type: "text/plain" }),
      new File(["b"], "file2.txt", { type: "text/plain" }),
    ]);

    await vi.waitFor(() => {
      expect(screen.queryByText("file1.txt")).toBeInTheDocument();
      expect(screen.queryByText("file2.txt")).toBeInTheDocument();
    });

    expect(input).toBeDisabled();
    const button = document.querySelector("button");
    assert(button);
    expect(button).toHaveClass("bx--btn--disabled");
  });
});
