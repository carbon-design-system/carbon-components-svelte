// @vitest-environment node
import { join } from "node:path";
import type { Diagnostic } from "svelte-typecheck";
import { compare, svelteErrors } from "../../scripts/lib/svelte-types";

describe("svelteErrors", () => {
  it("keeps the errors in components, relative to src/", () => {
    const src = join("/repo", "src");
    const at = (file: string, severity: Diagnostic["severity"]) => ({
      file: join(src, file),
      line: 3,
      column: 9,
      severity,
      source: "ts" as const,
      code: "TS2322",
      message: "Type 'string' is not assignable to type 'number'.\n  Detail.",
    });
    const diagnostics: Diagnostic[] = [
      at("Tag/Tag.svelte", "error"),
      at("DatePicker/calendar.js", "error"),
      at("Box/Box.svelte", "warning"),
    ];
    expect(svelteErrors(diagnostics, src)).toEqual([
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
