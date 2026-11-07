import { render, screen } from "@testing-library/svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import { user } from "../utils/user";
import CodeSnippetLinesSlot from "./CodeSnippetLinesSlot.test.svelte";
import { mockClipboard } from "./helpers";

const code = "const a = 1;\n\n  return a;\n";
const diff = " keep\n-gone\n+came\n keep too";

const lines = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>(".bx--snippet__line"),
];

describe("CodeSnippet lines", () => {
  it("renders the plain snippet when no line feature is set", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "multi", code },
    });
    expect(container.querySelector(".bx--snippet__line")).toBeNull();
    expect(container.querySelector(".bx--snippet--lines")).toBeNull();
  });

  it("keeps the code's text exactly, with the numbers outside it", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "multi", code, lineNumbers: true },
    });
    expect(container.querySelector("pre")?.textContent).toBe(code);
    expect(lines(container).map((line) => line.dataset.gutter)).toEqual([
      " 1  ",
      " 2  ",
      " 3  ",
    ]);
  });

  it("copies the code, not the gutter", async () => {
    const writeText = mockClipboard();
    render(CodeSnippet, {
      props: { type: "multi", code, lineNumbers: true, highlightLines: "1" },
    });
    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(writeText).toHaveBeenCalledWith(code);
  });

  it.each([
    ["diff", diff],
    ["result", "keep\ncame\nkeep too"],
  ] as const)("copies a diff as %s", async (diffCopy, expected) => {
    const writeText = mockClipboard();
    render(CodeSnippet, {
      props: { type: "multi", code: diff, diff: true, diffCopy },
    });
    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(writeText).toHaveBeenCalledWith(expected);
  });

  it("marks the changed lines by class and gutter marker", () => {
    const { container } = render(CodeSnippet, {
      props: { type: "multi", code: diff, diff: true },
    });
    expect(
      lines(container).map((line) => [
        line.classList.contains("bx--snippet__line--added"),
        line.classList.contains("bx--snippet__line--removed"),
        line.dataset.gutter,
      ]),
    ).toEqual([
      [false, false, "    "],
      [false, true, " -  "],
      [true, false, " +  "],
      [false, false, "    "],
    ]);
    expect(container.querySelector("pre")?.textContent).toBe(
      "keep\ngone\ncame\nkeep too",
    );
  });

  it("describes the highlighted and changed lines to assistive tech", () => {
    const { container } = render(CodeSnippet, {
      props: {
        type: "multi",
        code: diff,
        diff: true,
        highlightLines: "1,3-4",
        "aria-describedby": "mine",
      },
    });
    const textbox = screen.getByRole("textbox");
    const description = container.querySelector(`[id$="-lines"]`);
    expect(description).toHaveTextContent(
      "Lines 1, 3 to 4 highlighted. Line 3 added. Line 2 removed.",
    );
    expect(textbox.getAttribute("aria-describedby")).toBe(
      `${description?.id} mine`,
    );
  });

  it("takes a translated description", () => {
    const { container } = render(CodeSnippet, {
      props: {
        type: "multi",
        code,
        highlightLines: "2",
        linesDescription: (kind: string, runs: number[][]) =>
          `${kind}:${runs.map((run) => run.join("-"))}`,
      },
    });
    expect(container.querySelector(`[id$="-lines"]`)).toHaveTextContent(
      "highlighted:2-2",
    );
  });

  it("leaves the default slot's content as it was", () => {
    const { container } = render(CodeSnippetLinesSlot);
    expect(container.querySelector(".bx--snippet__line")).toBeNull();
    expect(container.querySelector("pre")).toHaveTextContent("from the slot");
  });
});
