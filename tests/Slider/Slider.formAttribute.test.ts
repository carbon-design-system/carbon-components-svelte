import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import SliderFormAttribute from "./Slider.formAttribute.test.svelte";

describe("Slider form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(SliderFormAttribute);

    expect(new FormData(getForm()).get("volume")).toBe("40");
  });
});
