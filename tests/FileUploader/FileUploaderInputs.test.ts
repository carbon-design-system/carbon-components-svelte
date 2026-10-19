import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FileUploaderButton from "./FileUploaderButton.test.svelte";
import FileUploaderDropContainer from "./FileUploaderDropContainer.test.svelte";
import {
  emptyFileInput,
  fileNames,
  getFileInput,
  makeFile,
  simulateFileSelection,
} from "./helpers";

// FileUploaderButton and FileUploaderDropContainer wrap the same hidden file
// input and share one pipeline for picked files. Their common behavior is
// asserted once here; button-only and drop-only behavior lives in each
// component's own file.
const components = [
  ["FileUploaderButton", FileUploaderButton],
  ["FileUploaderDropContainer", FileUploaderDropContainer],
] as const;

describe.each(components)("%s (shared)", (_, Component) => {
  it.each([
    ["accept", [".jpg", "image/*"], "accept", ".jpg,image/*"],
    ["accept", ".png,.jpg", "accept", ".png,.jpg"],
    ["multiple", true, "multiple", ""],
    ["capture", "environment", "capture", "environment"],
    ["disabled", true, "disabled", ""],
    ["name", "uploads", "name", "uploads"],
    ["id", "custom-id", "id", "custom-id"],
  ])("forwards %s to the input", (prop, value, attr, expected) => {
    const { container } = render(Component, { props: { [prop]: value } });

    expect(getFileInput(container)).toHaveAttribute(attr, expected);
  });

  it("puts the current files back into the native input after a cancelled picker", async () => {
    const { container } = render(Component);
    const input = getFileInput(container);

    simulateFileSelection(input, [makeFile("a.txt")]);
    await vi.waitFor(() => {
      expect(fileNames(input)).toEqual(["a.txt"]);
    });

    // Opening the picker clears the input; dismissing it fires `cancel`.
    emptyFileInput(input);
    input.dispatchEvent(new Event("cancel"));

    expect(fileNames(input)).toEqual(["a.txt"]);
  });

  it("names the input by labelText", () => {
    render(Component, { props: { labelText: "Upload here" } });

    expect(screen.getByLabelText("Upload here")).toHaveAttribute(
      "type",
      "file",
    );
  });

  it.each([
    ["minFileSize", 1, makeFile("empty.txt", 0), makeFile("report.txt", 1)],
    ["maxFileSize", 4, makeFile("large.txt", 8), makeFile("small.txt", 2)],
  ])(
    "rejects files by %s with reason size",
    async (prop, limit, rejected, kept) => {
      const changeHandler = vi.fn();
      const rejectedHandler = vi.fn();
      const { component, container } = render(Component, {
        props: {
          multiple: true,
          [prop]: limit,
          onchange: changeHandler,
          onrejected: rejectedHandler,
        },
      });

      simulateFileSelection(getFileInput(container), [rejected, kept]);

      await vi.waitFor(() => {
        expect(changeHandler).toHaveBeenCalledTimes(1);
      });
      expect(changeHandler.mock.calls[0][0].detail).toEqual([kept]);
      expect(component.files).toEqual([kept]);
      expect(rejectedHandler).toHaveBeenCalledTimes(1);
      expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
        { file: rejected, reason: "size" },
      ]);
    },
  );

  it("dedupes re-picked files with preventDuplicate and multiple", async () => {
    const changeHandler = vi.fn();
    const rejectedHandler = vi.fn();
    const { container } = render(Component, {
      props: {
        multiple: true,
        preventDuplicate: true,
        onchange: changeHandler,
        onrejected: rejectedHandler,
      },
    });
    const input = getFileInput(container);

    const lastModified = 1700000000000;
    simulateFileSelection(input, [makeFile("a.txt", 1, { lastModified })]);
    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalledTimes(1);
    });
    expect(changeHandler.mock.calls[0][0].detail).toHaveLength(1);
    expect(rejectedHandler).not.toHaveBeenCalled();

    const duplicate = makeFile("a.txt", 1, { lastModified });
    simulateFileSelection(input, [duplicate, makeFile("b.txt", 1)]);
    await vi.waitFor(() => {
      expect(changeHandler).toHaveBeenCalledTimes(2);
    });
    expect(
      changeHandler.mock.calls[1][0].detail.map((f: File) => f.name),
    ).toEqual(["a.txt", "b.txt"]);
    expect(rejectedHandler.mock.calls[0][0].detail).toEqual([
      { file: duplicate, reason: "duplicate" },
    ]);
  });

  it("opens the file picker on click", async () => {
    const { container } = render(Component);
    const clickSpy = vi.spyOn(getFileInput(container), "click");

    await user.click(screen.getByRole("button"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("does not open the file picker when disabled", async () => {
    const { container } = render(Component, { props: { disabled: true } });
    const clickSpy = vi.spyOn(getFileInput(container), "click");

    await user.click(screen.getByRole("button"));

    expect(clickSpy).not.toHaveBeenCalled();
  });
});
