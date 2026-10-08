import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import RadioButtonGroupFormAttribute from "./RadioButtonGroup.formAttribute.test.svelte";

describe("RadioButtonGroup form attribute", () => {
  it("associates its inputs with the form named by `form`", () => {
    render(RadioButtonGroupFormAttribute);

    expect(new FormData(getForm()).get("plan")).toBe("pro");
  });
});
