// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import DatePicker from "./DatePicker.test.svelte";

describe("fluid DatePicker server render", () => {
  // The cells register with the picker only after its markup is written,
  // so a read-only cell marks its own container for the read-only border.
  it("marks a read-only cell on its container", () => {
    const { document } = renderSSR(DatePicker, {
      fluid: true,
      datePickerType: "single",
      readonly: true,
    });

    expect(document.querySelector(".bx--date-picker-container")).toHaveClass(
      "bx--date-picker--fluid--readonly",
    );
  });
});
