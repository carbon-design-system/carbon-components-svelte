import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import RadioButtonFormAttribute from "./RadioButton.formAttribute.test.svelte";

describe("RadioButton form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(RadioButtonFormAttribute);

    expect(new FormData(getForm()).get("plan")).toBe("pro");
  });
});
