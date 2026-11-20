import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
// svelte-check's Svelte 4 compat pass can't resolve this fixture's
// declaration file, for reasons independent of its content. @ts-expect-error
// would itself fail under Svelte 5, where this import has no real error.
// biome-ignore lint/suspicious/noTsIgnore: see comment above
// @ts-ignore
import DiffViewer from "./DiffViewer.test.svelte";

const numbered = (count: number, edit: Record<number, string> = {}) =>
  Array.from({ length: count }, (_, i) => edit[i + 1] ?? `line ${i + 1}`).join(
    "\n",
  );

const OLD = numbered(40);
const NEW = numbered(40, { 5: "line five", 30: "line thirty" });

const rows = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>(".bx--diff-viewer__row"),
];
const codeOf = (element: Element) =>
  element.querySelector(".bx--diff-viewer__code")?.textContent;

describe("DiffViewer", () => {
  it("shows the old line beside the new one in the split view", () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, toolbar: false },
    });

    const changed = rows(container).find((row) =>
      row.querySelector(".bx--diff-viewer__cell--delete"),
    );
    const cells = changed?.querySelectorAll(".bx--diff-viewer__cell") ?? [];
    expect(codeOf(cells[0])).toBe("line 5");
    expect(codeOf(cells[1])).toBe("line five");
    expect(
      cells[0].querySelector(".bx--diff-viewer__marker")?.textContent,
    ).toBe("-");
    expect(
      cells[1].querySelector(".bx--diff-viewer__marker")?.textContent,
    ).toBe("+");
  });

  it("lists removed lines above added ones in the unified view", () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, view: "unified", toolbar: false },
    });

    const lines = rows(container).filter((row) =>
      row.matches(
        ".bx--diff-viewer__row--delete, .bx--diff-viewer__row--insert",
      ),
    );
    expect(lines.map(codeOf)).toEqual([
      "line 5",
      "line five",
      "line 30",
      "line thirty",
    ]);
    const numbers = [...lines[0].querySelectorAll(".bx--diff-viewer__number")];
    expect(numbers.map((n) => n.textContent)).toEqual(["5", ""]);
  });

  it("says added and removed for assistive technology, not by color", () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, view: "unified", toolbar: false },
    });

    const spoken = [...container.querySelectorAll(".bx--diff-viewer__sr")].map(
      (el) => el.textContent,
    );
    expect(spoken).toEqual([
      "Removed line 5",
      "Added line 5",
      "Removed line 30",
      "Added line 30",
    ]);
    for (const el of container.querySelectorAll(".bx--diff-viewer__sr")) {
      expect(el).toHaveClass("bx--visually-hidden");
    }
    for (const el of container.querySelectorAll(
      ".bx--diff-viewer__marker, .bx--diff-viewer__number",
    )) {
      expect(el).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("marks the words that changed inside a changed line", () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, view: "unified", toolbar: false },
    });

    const marked = [
      ...container.querySelectorAll(".bx--diff-viewer__word"),
    ].map((el) => el.textContent);
    expect(marked).toEqual(["5", "five", "30", "thirty"]);
  });

  it("folds unchanged lines and shows them on request", async () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, view: "unified", toolbar: false },
    });

    const folds = screen.getAllByRole("button", { name: /hidden lines/ });
    expect(folds.map((button) => button.textContent?.trim())).toEqual([
      "Show 18 hidden lines",
      "Show 7 hidden lines",
    ]);
    expect(container.textContent).not.toContain("line 20");

    folds[0].focus();
    await user.keyboard("{Enter}");

    expect(container.textContent).toContain("line 20");
    expect(screen.getByRole("group")).toHaveFocus();
    expect(
      container.querySelector(".bx--diff-viewer__status"),
    ).toHaveTextContent("18 lines shown");
    expect(
      screen.getAllByRole("button", { name: /hidden lines/ }),
    ).toHaveLength(1);
  });

  it("shows every line without folding when collapseUnchanged is off", () => {
    const { container } = render(DiffViewer, {
      props: {
        oldText: OLD,
        newText: NEW,
        view: "unified",
        toolbar: false,
        collapseUnchanged: false,
      },
    });

    expect(screen.queryByRole("button", { name: /hidden/ })).toBeNull();
    expect(container.textContent).toContain("line 20");
  });

  it("writes the hunk header, and hides it on request", async () => {
    const { container, rerender } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, toolbar: false },
    });
    expect(
      [...container.querySelectorAll(".bx--diff-viewer__header")].map(
        (el) => el.textContent,
      ),
    ).toEqual(["@@ -1,8 +1,8 @@", "@@ -27,7 +27,7 @@"]);

    await rerender({ hunkHeaders: false });
    expect(container.querySelector(".bx--diff-viewer__header")).toBeNull();
  });

  it("keeps code text exact, with its whitespace", () => {
    const { container } = render(DiffViewer, {
      props: {
        oldText: "if (a) {\n\treturn  1;\n}",
        newText: "if (a) {\n\treturn  2;\n}",
        view: "unified",
        toolbar: false,
      },
    });

    const kept = rows(container).filter((row) => codeOf(row));
    expect(kept.map(codeOf)).toEqual([
      "if (a) {",
      "\treturn  1;",
      "\treturn  2;",
      "}",
    ]);
  });

  it("names the diff and gives it one tab stop", async () => {
    render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, labelText: "Config changes" },
    });

    const group = screen.getByRole("group", { name: "Config changes" });
    expect(group).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("list")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")[0]).toHaveAttribute(
        "aria-posinset",
        "1",
      ),
    );
  });

  it("hides line numbers when asked", () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW, lineNumbers: false },
    });

    expect(container.querySelector(".bx--diff-viewer__number")).toBeNull();
  });

  it("says so when nothing changed", () => {
    render(DiffViewer, { props: { oldText: OLD, newText: OLD } });

    expect(document.querySelector(".bx--diff-viewer__empty")?.textContent).toBe(
      "No changes",
    );
    expect(
      screen.getByRole("button", { name: "Previous change" }),
    ).toBeDisabled();
  });

  it("shows a patch, and says the lines it leaves out can't be shown", () => {
    const patch = `--- a/f.js
+++ b/f.js
@@ -10,3 +10,3 @@ function a() {
 ten
-eleven
+ELEVEN
 twelve
@@ -40,2 +40,3 @@ function b() {
 forty
+forty and a bit
 forty-one
`;
    const { container } = render(DiffViewer, {
      props: { patch, view: "unified", toolbar: false },
    });

    expect(
      [...container.querySelectorAll(".bx--diff-viewer__header")].map(
        (el) => el.textContent,
      ),
    ).toEqual([
      "@@ -10,3 +10,3 @@ function a() {",
      "@@ -40,2 +40,3 @@ function b() {",
    ]);
    expect(
      container.querySelector(".bx--diff-viewer__omitted")?.textContent?.trim(),
    ).toBe("9 lines are not in the patch");
    expect(screen.queryByRole("button", { name: /hidden/ })).toBeNull();
  });

  it("colors code with the tokenizer it is given, whole side at a time", () => {
    const seen: string[] = [];
    const { container } = render(DiffViewer, {
      props: {
        oldText: "let a = 1;",
        newText: "let a = 2;",
        view: "unified",
        toolbar: false,
        language: "js",
        tokenize: (code: string, language: string) => {
          seen.push(`${language}:${code}`);
          return code
            .split(/(let)/)
            .filter(Boolean)
            .map((text) => ({
              type: text === "let" ? "keyword" : null,
              text,
            }));
        },
      },
    });

    expect(seen).toEqual(["js:let a = 1;", "js:let a = 2;"]);
    expect(container.querySelectorAll(".tok-keyword")).toHaveLength(2);
    expect(rows(container).map(codeOf).filter(Boolean)).toEqual([
      "let a = 1;",
      "let a = 2;",
    ]);
  });
});

describe("DiffViewer navigation", () => {
  const props = { oldText: OLD, newText: NEW, view: "unified" as const };

  it("moves to the next and previous change with the buttons", async () => {
    const { container } = render(DiffViewer, { props });

    expect(screen.getByTestId("current")).toHaveTextContent("-1");
    await user.click(screen.getByRole("button", { name: "Next change" }));
    expect(screen.getByTestId("current")).toHaveTextContent("0");
    expect(
      container.querySelector(".bx--diff-viewer__status"),
    ).toHaveTextContent("Change 1 of 2");

    await user.click(screen.getByRole("button", { name: "Next change" }));
    expect(screen.getByTestId("current")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Next change" }));
    expect(screen.getByTestId("current")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: "Previous change" }));
    expect(screen.getByTestId("current")).toHaveTextContent("1");
  });

  it("tells the parent which change it moved to", async () => {
    render(DiffViewer, { props });

    await user.click(screen.getByRole("button", { name: "Next change" }));

    expect(screen.getByTestId("moved")).toHaveTextContent(
      '{"index":0,"total":2}',
    );
  });

  it("marks the rows of the current change", async () => {
    const { container } = render(DiffViewer, { props });

    await user.click(screen.getByRole("button", { name: "Next change" }));

    const current = [
      ...container.querySelectorAll(".bx--diff-viewer__row--current"),
    ];
    expect(current.map(codeOf)).toEqual(["line 5", "line five"]);
  });

  it("jumps with F7 and Shift+F7 when the diff has focus", async () => {
    render(DiffViewer, { props });

    screen.getByRole("group").focus();
    await user.keyboard("{F7}");
    expect(screen.getByTestId("current")).toHaveTextContent("0");
    await user.keyboard("{F7}");
    expect(screen.getByTestId("current")).toHaveTextContent("1");
    await user.keyboard("{Shift>}{F7}{/Shift}");
    expect(screen.getByTestId("current")).toHaveTextContent("0");
    await user.keyboard("n");
    expect(screen.getByTestId("current")).toHaveTextContent("1");
    await user.keyboard("p");
    expect(screen.getByTestId("current")).toHaveTextContent("0");
  });

  it("scrolls the change into view", async () => {
    const { container } = render(DiffViewer, { props });
    const scroller = container.querySelector<HTMLElement>(
      ".bx--diff-viewer__scroller",
    );

    await user.click(screen.getByRole("button", { name: "Next change" }));
    await user.click(screen.getByRole("button", { name: "Next change" }));

    // Row 12 of the unified rows, 20px each, a third of the way down.
    expect(scroller?.scrollTop).toBeGreaterThan(0);
  });

  it("starts over when the texts change", async () => {
    const { rerender } = render(DiffViewer, { props });
    await user.click(screen.getByRole("button", { name: "Next change" }));
    expect(screen.getByTestId("current")).toHaveTextContent("0");

    await rerender({ newText: NEW.replace("line thirty", "line 30!") });
    expect(screen.getByTestId("current")).toHaveTextContent("-1");
  });
});

describe("DiffViewer toolbar", () => {
  it("switches the view", async () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW },
    });
    expect(container.querySelector(".bx--diff-viewer--split")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Unified" }));

    expect(screen.getByTestId("view")).toHaveTextContent("unified");
    expect(container.querySelector(".bx--diff-viewer--unified")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Unified" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("sums up the change for screen readers", () => {
    const { container } = render(DiffViewer, {
      props: { oldText: OLD, newText: NEW },
    });

    expect(
      container.querySelector(".bx--diff-viewer__summary .bx--visually-hidden")
        ?.textContent,
    ).toBe("2 lines added, 2 lines removed");
  });

  it("copies the diff as a patch", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(DiffViewer, {
      props: {
        oldText: "a\nb\nc",
        newText: "a\nB\nc",
        paths: { old: "a/x.txt", new: "b/x.txt" },
      },
    });

    await user.click(screen.getByRole("button", { name: "Copy diff" }));

    expect(writeText).toHaveBeenCalledWith(
      "--- a/x.txt\n+++ b/x.txt\n@@ -1,3 +1,3 @@\n a\n-b\n+B\n c\n",
    );
  });
});
