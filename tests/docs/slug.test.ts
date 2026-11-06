// @vitest-environment node
import { createSlugger } from "../../docs/scripts/slug";

describe("createSlugger", () => {
  it("slugs headings as github-slugger did", () => {
    const slug = createSlugger();
    expect(
      ["`copy` prop (async)", "Ünïcode — 日本語", "foo", "foo", "foo-1"].map(
        slug,
      ),
    ).toEqual([
      "copy-prop-async",
      "ünïcode--日本語",
      "foo",
      "foo-1",
      "foo-1-1",
    ]);
  });
});
