// @vitest-environment node
import { compare, parseErrors } from "../../scripts/lib/svelte-types";

describe("parseErrors", () => {
  it("reads .svelte errors from svelte-check's machine output", () => {
    const output = [
      '1793012718195 START "/repo/src"',
      "1793012718195 ERROR \"Tag/Tag.svelte\" 3:9 \"Type 'string' is not assignable to type 'number'.\\n  Detail.\"",
      '1793012718195 ERROR "DatePicker/calendar.js" 18:42 "Not a component."',
      "1793012718202 COMPLETED 950 FILES 2 ERRORS 0 WARNINGS 2 FILES_WITH_PROBLEMS",
    ].join("\n");
    expect(parseErrors(output)).toEqual([
      {
        file: "Tag/Tag.svelte",
        line: 3,
        column: 9,
        message: "Type 'string' is not assignable to type 'number'.\n  Detail.",
      },
    ]);
  });
});

describe("compare", () => {
  it("flags a new error and a stale baseline entry", () => {
    const baseline = { "Box/Box.svelte": 2, "Tag/Tag.svelte": 1 };
    const current = {
      "Box/Box.svelte": 1,
      "Tag/Tag.svelte": 1,
      "Link/Link.svelte": 1,
    };
    expect(compare(baseline, current)).toEqual({
      regressed: [{ file: "Link/Link.svelte", was: 0, now: 1 }],
      improved: [{ file: "Box/Box.svelte", was: 2, now: 1 }],
    });
  });
});
