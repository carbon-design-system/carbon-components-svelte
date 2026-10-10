import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import TimePickerSelectFormAttribute from "./TimePickerSelect.formAttribute.test.svelte";

describe("TimePickerSelect form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(TimePickerSelectFormAttribute);

    expect(new FormData(getForm()).get("period")).toBe("pm");
  });
});
