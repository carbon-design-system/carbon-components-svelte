import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import FileUploaderFormAttribute from "./FileUploader.formAttribute.test.svelte";

describe("FileUploader form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(FileUploaderFormAttribute);

    const input = document.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input.form).toBe(getForm());
  });
});
