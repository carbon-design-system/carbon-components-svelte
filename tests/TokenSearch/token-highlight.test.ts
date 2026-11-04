// @vitest-environment node
import { highlightRuns } from "../../src/TokenSearch/token-highlight.js";
import {
  parseQuery,
  type TokenKey,
} from "../../src/TokenSearch/token-query.js";

const keys: TokenKey[] = [
  { key: "is", type: "enum", values: ["open", "closed"] },
  { key: "label", type: "enum", values: ["bug", "ui"] },
  { key: "created", type: "date" },
];

function runs(text: string) {
  return highlightRuns(text, parseQuery(text, { keys }).errors);
}

const joined = (text: string) =>
  runs(text)
    .map((run) =>
      run.type === "qualifier"
        ? run.parts.map((part) => part.text).join("")
        : run.text,
    )
    .join("");

describe("highlightRuns", () => {
  it("keeps the text exactly, for any text", () => {
    const samples = [
      "",
      "   ",
      'is:open label:bug,ui -label:"x y" created:>=2026-01-01 "exact phrase" tail  ',
      'unclosed "quote label:',
      "label:bug, , ui",
      "שלום label:bug עולם",
      "-",
      "a:b:c ::",
      'label:"a"b,c',
    ];
    for (const sample of samples) expect(joined(sample)).toBe(sample);
  });

  it("makes a run of each qualifier and keeps words plain", () => {
    const result = runs('free is:open "a phrase" text');
    expect(result.map((run) => run.type)).toEqual([
      "text",
      "qualifier",
      "text",
      "phrase",
      "text",
    ]);
  });

  it("splits a qualifier into sign, key, values and commas", () => {
    const [run] = runs("-label:bug,ui");
    if (run.type !== "qualifier") throw new Error("not a qualifier");
    expect(run.negated).toBe(true);
    expect(run.parts.map((part) => [part.kind, part.text])).toEqual([
      ["sign", "-"],
      ["key", "label:"],
      ["value", "bug"],
      ["separator", ","],
      ["value", "ui"],
    ]);
  });

  it("marks the part that has the error", () => {
    const [unknown] = runs("nope:1");
    const [invalid] = runs("is:merged");
    if (unknown.type !== "qualifier" || invalid.type !== "qualifier")
      throw new Error("not qualifiers");
    expect(unknown.parts.map((part) => part.error)).toEqual([true, false]);
    expect(invalid.parts.map((part) => part.error)).toEqual([false, true]);
    expect(invalid.error).toBe(true);
    expect(runs("is:open")[0]).toMatchObject({ error: false });
  });

  it("marks a phrase whose quote never closes", () => {
    expect(runs('"abc')[0]).toMatchObject({ type: "phrase", error: true });
  });
});
