import { graphemeCount } from "../../src/utils/graphemeCount.js";

describe("graphemeCount", () => {
  test("counts plain ASCII characters", () => {
    expect(graphemeCount("hello")).toBe(5);
    expect(graphemeCount("")).toBe(0);
  });

  test("counts a family emoji (ZWJ sequence) as one character", () => {
    expect(graphemeCount("👨‍👩‍👧")).toBe(1);
  });

  test("counts a single-codepoint emoji as one character", () => {
    expect(graphemeCount("😀")).toBe(1);
  });
});
