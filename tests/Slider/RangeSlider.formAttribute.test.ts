import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import RangeSliderFormAttribute from "./RangeSlider.formAttribute.test.svelte";

describe("RangeSlider form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(RangeSliderFormAttribute);

    const formData = new FormData(getForm());
    expect(formData.get("min")).toBe("20");
    expect(formData.get("max")).toBe("80");
  });
});
