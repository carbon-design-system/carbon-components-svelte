import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import FileUploaderDropContainerFormAttribute from "./FileUploaderDropContainer.formAttribute.test.svelte";
import { getFileInput } from "./helpers";

describe("FileUploaderDropContainer form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(FileUploaderDropContainerFormAttribute);

    expect(getFileInput(document).form).toBe(getForm());
  });
});
