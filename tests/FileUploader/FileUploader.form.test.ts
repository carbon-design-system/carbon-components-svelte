import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { resetForm } from "../utils/reset-form";
import FileUploaderForm from "./FileUploader.form.test.svelte";
import { simulateFileSelection } from "./helpers";

const getFileInput = (testId: string) => {
  const input = screen
    .getByTestId(testId)
    .querySelector<HTMLInputElement>('input[type="file"]');
  assert(input);
  return input;
};

const receipt = () =>
  new File(["x"], "receipt.pdf", { type: "application/pdf" });

describe("FileUploader form reset", () => {
  it("clears files and restores the label for FileUploaderButton, without change", async () => {
    const onChange = vi.fn();
    render(FileUploaderForm, { props: { onChange } });

    simulateFileSelection(getFileInput("button"), [receipt()]);
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

    simulateFileSelection(getFileInput("drop"), [receipt()]);
    await tick();
    expect(getBoundText("bound-drop")).toBe("1");
    onChange.mockClear();

    await resetForm();

    expect(getBoundText("bound-drop")).toBe("0");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the FileUploader file list", async () => {
    render(FileUploaderForm);

    simulateFileSelection(getFileInput("uploader"), [receipt()]);
    await tick();
    expect(getBoundText("bound-uploader")).toBe("1");
    expect(screen.getByTestId("uploader")).toHaveTextContent("receipt.pdf");

    await resetForm();

    expect(getBoundText("bound-uploader")).toBe("0");
    expect(screen.getByTestId("uploader")).not.toHaveTextContent("receipt.pdf");
  });
});
