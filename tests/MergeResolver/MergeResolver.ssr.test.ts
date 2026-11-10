// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import MergeResolver from "./MergeResolver.test.svelte";

const lines = (...rows: string[]) => `${rows.join("\n")}\n`;

describe("MergeResolver server render", () => {
  const props = {
    base: lines("a", "b", "c"),
    ours: lines("a", "ours", "c"),
    theirs: lines("a", "theirs", "c"),
  };

  it("renders the merged text, the first rows of each pane and the conflict count", () => {
    const { document } = renderSSR(MergeResolver, props);

    expect(document.querySelector("textarea")?.textContent).toBe(
      lines("a", "<<<<<<<", "ours", "=======", "theirs", ">>>>>>>", "c"),
    );
    expect(
      document.querySelector(".bx--merge-resolver__status")?.textContent,
    ).toMatch(/Conflict 1 of 1\s*1 conflict remaining/);
    expect(document.querySelectorAll(".bx--merge-resolver__head")).toHaveLength(
      2,
    );
    expect(
      [
        ...document.querySelectorAll(
          ".bx--merge-resolver__pane--ours .bx--merge-resolver__code",
        ),
      ].map((row) => row.textContent),
    ).toEqual(["a", "ours", "c"]);
  });

  it("starts in the columns layout, which the client may change once it has a width", () => {
    const { document } = renderSSR(MergeResolver, { ...props, layout: "auto" });

    expect(document.querySelector(".bx--merge-resolver")?.className).toContain(
      "bx--merge-resolver--columns",
    );
  });

  it("renders a file with no conflicts and an empty file", () => {
    const clean = renderSSR(MergeResolver, {
      base: "a\n",
      ours: "a\n",
      theirs: "a\n",
    });
    expect(
      clean.document
        .querySelector(".bx--merge-resolver__status")
        ?.textContent?.trim(),
    ).toBe("No conflicts");
    const empty = renderSSR(MergeResolver, {});
    expect(empty.document.querySelector("textarea")?.textContent).toBe("");
  });
});
