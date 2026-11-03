// @vitest-environment node
import { compare, parseErrors } from "../../scripts/lib/svelte-types";

describe("parseErrors", () => {
  it("reads .svelte errors from scripts/typecheck's machine output", () => {
    const output = [
      "ERROR \"Tag/Tag.svelte\" 3:9 \"Type 'string' is not assignable to type 'number'.\\n  Detail.\" TS2322",
      'ERROR "DatePicker/calendar.js" 18:42 "Not a component." TS2339',
      "398 components, 2 errors [emit 210 ms, bun 350 ms]",
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
