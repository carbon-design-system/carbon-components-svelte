import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import CheckboxFormAttribute from "./Checkbox.formAttribute.test.svelte";

describe("Checkbox form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(CheckboxFormAttribute);

    expect(new FormData(getForm()).get("agree")).toBe("yes");
  });
});
