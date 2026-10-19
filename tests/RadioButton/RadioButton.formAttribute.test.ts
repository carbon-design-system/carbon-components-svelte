import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import RadioButtonFormAttribute from "./RadioButton.formAttribute.test.svelte";
import RadioButtonGroupFormAttribute from "./RadioButtonGroup.formAttribute.test.svelte";

describe.each([
  ["RadioButton", RadioButtonFormAttribute],
  ["RadioButtonGroup", RadioButtonGroupFormAttribute],
])("%s form attribute", (_name, Fixture) => {
  it("associates the control with the form named by `form`", () => {
    render(Fixture);

    expect(new FormData(getForm()).get("plan")).toBe("pro");
  });
});
