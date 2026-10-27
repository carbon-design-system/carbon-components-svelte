// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import DatePickerTime from "./DatePickerTime.test.svelte";

describe("DatePicker time row server render", () => {
  it("derives the input pattern from dateFormat with the time", () => {
    const { document } = renderSSR(DatePickerTime);
    const pattern = document.querySelector("input")?.getAttribute("pattern");

    expect(new RegExp(`^(?:${pattern})$`, "v").test("10/15/2026 9:00 AM")).toBe(
      true,
    );
  });
});
