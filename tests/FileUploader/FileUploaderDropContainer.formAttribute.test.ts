import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import FileUploaderDropContainerFormAttribute from "./FileUploaderDropContainer.formAttribute.test.svelte";

describe("FileUploaderDropContainer form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(FileUploaderDropContainerFormAttribute);

    const input = document.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    expect(input.form).toBe(getForm());
  });
});
