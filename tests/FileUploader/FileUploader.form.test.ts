import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { resetForm } from "../utils/reset-form";
import FileUploaderForm from "./FileUploader.form.test.svelte";
import { getFileInput, makeFile, simulateFileSelection } from "./helpers";

const receipt = () => makeFile("receipt.pdf", 1, { type: "application/pdf" });

describe("FileUploader form reset", () => {
  it("clears files and restores the label for FileUploaderButton, without change", async () => {
    const onChange = vi.fn();
    render(FileUploaderForm, { props: { onChange } });

    simulateFileSelection(getFileInput(screen.getByTestId("button")), [
      receipt(),
    ]);
    await tick();
    expect(getBoundText("bound-button")).toBe("1");
    expect(screen.getByTestId("button")).toHaveTextContent("receipt.pdf");
    onChange.mockClear();

    await resetForm();

    expect(getBoundText("bound-button")).toBe("0");
    expect(screen.getByTestId("button")).toHaveTextContent("Add files");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears files for FileUploaderDropContainer, without change", async () => {
    const onChange = vi.fn();
    render(FileUploaderForm, { props: { onChange } });

    simulateFileSelection(getFileInput(screen.getByTestId("drop")), [
      receipt(),
    ]);
    await tick();
    expect(getBoundText("bound-drop")).toBe("1");
    onChange.mockClear();

    await resetForm();

    expect(getBoundText("bound-drop")).toBe("0");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the FileUploader file list", async () => {
    render(FileUploaderForm);

    simulateFileSelection(getFileInput(screen.getByTestId("uploader")), [
      receipt(),
    ]);
    await tick();
    expect(getBoundText("bound-uploader")).toBe("1");
    expect(screen.getByTestId("uploader")).toHaveTextContent("receipt.pdf");

    await resetForm();

    expect(getBoundText("bound-uploader")).toBe("0");
    expect(screen.getByTestId("uploader")).not.toHaveTextContent("receipt.pdf");
  });

  it("emits remove, change and clear when it clears the FileUploader file list", async () => {
    const onUploaderRemove = vi.fn();
    const onUploaderChange = vi.fn();
    const onUploaderClear = vi.fn();
    render(FileUploaderForm, {
      props: { onUploaderRemove, onUploaderChange, onUploaderClear },
    });
    const file = receipt();

    simulateFileSelection(getFileInput(screen.getByTestId("uploader")), [file]);
    await tick();
    await vi.waitFor(() => {
      expect(onUploaderChange).toHaveBeenCalledTimes(1);
    });
    expect(onUploaderRemove).not.toHaveBeenCalled();
    expect(onUploaderClear).not.toHaveBeenCalled();

    await resetForm();

    await vi.waitFor(() => {
      expect(onUploaderClear).toHaveBeenCalledTimes(1);
    });
    expect(onUploaderRemove).toHaveBeenCalledTimes(1);
    expect(onUploaderRemove.mock.calls[0][0].detail).toEqual([file]);
    expect(onUploaderChange).toHaveBeenCalledTimes(2);
    expect(onUploaderChange.mock.calls[1][0].detail).toEqual([]);
  });
});

describe("FileUploader form-level change", () => {
  it.each(["button", "uploader"])(
    "lets a form listener see a file pick in the %s input",
    async (testId) => {
      render(FileUploaderForm);
      const onFormChange = vi.fn();
      screen.getByTestId("form").addEventListener("change", onFormChange);

      simulateFileSelection(getFileInput(screen.getByTestId(testId)), [
        receipt(),
      ]);
      await tick();

      expect(onFormChange).toHaveBeenCalledTimes(1);
    },
  );
});
