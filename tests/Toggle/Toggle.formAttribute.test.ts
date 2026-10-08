import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import ToggleFormAttribute from "./Toggle.formAttribute.test.svelte";

describe("Toggle form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(ToggleFormAttribute);

    expect(new FormData(getForm()).get("notify")).toBe("on");
  });
});
