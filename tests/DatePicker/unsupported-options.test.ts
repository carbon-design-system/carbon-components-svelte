import {
  getPropWarnings,
  getShortWarning,
} from "../../src/DatePicker/unsupported-options.js";

describe("getPropWarnings", () => {
  const base = { datePickerType: "single", months: 1, portalled: false };

  it("flags props that have no effect in the combination given", () => {
    const anchor = document.createElement("div");

    expect(getPropWarnings({ ...base, anchor: undefined })).toEqual([]);
    expect(
      getPropWarnings({ ...base, datePickerType: "week", months: 2, anchor }),
    ).toEqual([
      expect.stringMatching(/months.*datePickerType="week"/),
      expect.stringMatching(/anchor.*portalMenu/),
    ]);
    expect(
      getPropWarnings({ ...base, months: 2, anchor, portalled: true }),
    ).toEqual([]);
  });
});

it("flags a time row outside the single type and an uneven minuteStep", () => {
  const base = { months: 1, anchor: undefined, portalled: false };

  expect(
    getPropWarnings({
      ...base,
      datePickerType: "week",
      timeGranularity: "minute",
    }),
  ).toEqual([expect.stringMatching(/timeGranularity.*"single" or "range"/)]);
  expect(
    getPropWarnings({
      ...base,
      datePickerType: "single",
      timeGranularity: "minute",
      minuteStep: 7,
    }),
  ).toEqual([expect.stringMatching(/minuteStep must divide 60/)]);
});

describe("getShortWarning", () => {
  it("returns nothing for a simple picker", () => {
    expect(getShortWarning("simple")).toBeUndefined();
  });

  it("names the type short has no effect on", () => {
    expect(getShortWarning("range")).toBe(
      '[carbon-components-svelte] DatePicker: short only applies to datePickerType="simple"; it has no effect on "range".',
    );
  });
});
