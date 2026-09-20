import { getUnsupportedOptionWarnings } from "../../src/DatePicker/unsupported-options.js";

const base = {
  portalled: false,
  displayFormat: undefined,
  disabledDates: [],
  enabledDates: [],
};

describe("getUnsupportedOptionWarnings", () => {
  it.each([undefined, {}, { static: true }, { showMonths: 2, inline: true }])(
    "returns nothing for %j",
    (flatpickrProps) => {
      expect(getUnsupportedOptionWarnings(flatpickrProps, base)).toEqual([]);
    },
  );

  it("flags options Carbon always overrides", () => {
    const warnings = getUnsupportedOptionWarnings(
      { wrap: true, mode: "multiple" },
      base,
    );

    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/flatpickrProps\.wrap is not supported/);
    expect(warnings[1]).toMatch(
      /flatpickrProps\.mode is ignored.*datePickerType/,
    );
    for (const warning of warnings) {
      expect(warning).toMatch(/^\[carbon-components-svelte\] DatePicker: /);
    }
  });

  it("flags positioning options only where they have no effect", () => {
    const element = document.createElement("div");
    const props = { positionElement: element, appendTo: element };

    expect(getUnsupportedOptionWarnings(props, base)).toEqual([
      expect.stringMatching(/positionElement.*portalMenu/),
      expect.stringMatching(/appendTo.*portalMenu/),
    ]);
    expect(
      getUnsupportedOptionWarnings(props, { ...base, portalled: true }),
    ).toEqual([]);
  });

  it("flags options a first-class prop takes over", () => {
    expect(
      getUnsupportedOptionWarnings(
        { altInput: true, altFormat: "F j", disable: ["x"], enable: ["y"] },
        {
          ...base,
          displayFormat: "F j, Y",
          disabledDates: ["03/15/2024"],
          enabledDates: ["03/16/2024"],
        },
      ),
    ).toEqual([
      expect.stringMatching(/altInput.*displayFormat/),
      expect.stringMatching(/altFormat.*displayFormat/),
      expect.stringMatching(/disable .*disabledDates/),
      expect.stringMatching(/enable .*enabledDates/),
    ]);
    expect(
      getUnsupportedOptionWarnings({ disable: ["x"], altInput: true }, base),
    ).toEqual([]);
  });
});
