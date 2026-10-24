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

  // The picker's `--invalid` and `--warn` also come from the cells, so the
  // server's picker is `--neutral` beside an invalid or warn cell. The fluid
  // stylesheet outlines such a cell's container, and keeps the next cell's
  // divider off, on exactly this pairing (`_fluid-date-picker.scss`).
  it.each([
    ["invalid", { invalid: true, invalidText: "Required" }],
    ["warn", { warn: true, warnText: "Check this" }],
  ])(
    "marks a %s cell on its container, beside a neutral picker",
    (status, props) => {
      const { document } = renderSSR(DatePicker, {
        fluid: true,
        datePickerType: "single",
        ...props,
      });

      expect(document.querySelector(".bx--date-picker--fluid")).toHaveClass(
        "bx--date-picker--fluid--neutral",
      );
      expect(document.querySelector(".bx--date-picker--fluid")).not.toHaveClass(
        `bx--date-picker--fluid--${status}`,
      );
      expect(document.querySelector(".bx--date-picker-container")).toHaveClass(
        `bx--date-picker--fluid--${status}`,
      );
    },
  );
});
