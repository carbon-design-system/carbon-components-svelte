// @vitest-environment node
import { createSlugger, rehypeSlug } from "../../docs/scripts/slug";

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

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { id?: string };
  children?: HastNode[];
};

describe("rehypeSlug", () => {
  it("slugs each heading's text, keeping ids it already has", () => {
    const text = (value: string): HastNode => ({ type: "text", value });
    const element = (
      tagName: string,
      children: HastNode[],
      id?: string,
    ): HastNode => ({
      type: "element",
      tagName,
      properties: id ? { id } : {},
      children,
    });
    const tree = {
      type: "root",
      children: [
        element("h2", [text("Usage")]),
        element("h3", [
          text("The "),
          element("code", [text("copy")]),
          text(" prop"),
        ]),
        element("h2", [text("Usage")]),
        element("h2", [text("Custom")], "kept"),
        element("p", []),
      ],
    };
    rehypeSlug()(tree);
    expect(tree.children.map((node) => node.properties?.id)).toEqual([
      "usage",
      "the-copy-prop",
      "usage-1",
      "kept",
      undefined,
    ]);
  });
});
