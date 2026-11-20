import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import JsonViewer from "./JsonViewer.test.svelte";

/** The mounted rows as `level:text`, with `+` and `-` for collapsed and open. */
function rows() {
  return screen.queryAllByRole("treeitem").map((row) => {
    const expanded = row.getAttribute("aria-expanded");
    const mark = expanded === null ? "" : expanded === "true" ? "-" : "+";
    const text = [
      ...(row.querySelector(".bx--json-viewer__content")?.children ?? []),
    ]
      .filter((child) => !child.classList.contains("bx--visually-hidden"))
      .map((child) => child.textContent)
      .join("");
    return `${row.getAttribute("aria-level")}${mark}:${text}`;
  });
}

const row = (text: string) => {
  const found = screen
    .getAllByRole("treeitem")
    .find((item) => item.textContent?.trim().startsWith(text));
  assert(found, `no row starts with ${text}`);
  return found;
};

describe("JsonViewer", () => {
  it("shows the root and its children, each with its place in the tree", () => {
    render(JsonViewer);

    expect(rows()).toEqual([
      "1-:$:{4 keys}",
      '2:name:"carbon"',
      "2+:tags:[3 items]",
      "2+:nested:{1 key}",
      "2:count:3",
    ]);
    const tags = row("tags");
    expect(tags).toHaveAttribute("aria-posinset", "2");
    expect(tags).toHaveAttribute("aria-setsize", "4");
    expect(screen.getByRole("tree", { name: "Data" })).toBeInTheDocument();
  });

  it.each([
    [0, 1],
    [1, 5],
    [2, 9],
    [Number.POSITIVE_INFINITY, 10],
  ])("starts %s levels expanded", (expandDepth, count) => {
    render(JsonViewer, { props: { options: { expandDepth } } });

    expect(screen.getAllByRole("treeitem")).toHaveLength(count);
  });

  it("expands and collapses with the toggle and with double click", async () => {
    render(JsonViewer);

    const toggle = row("tags").querySelector(".bx--json-viewer__toggle");
    assert(toggle);
    await user.click(toggle);
    expect(rows()).toContain("2-:tags:[3 items]");
    expect(rows()).toContain('3:0:"a"');

    await user.dblClick(row("tags"));
    expect(rows()).toContain("2+:tags:[3 items]");
  });

  it("moves with the arrow keys the way TreeView does", async () => {
    render(JsonViewer);
    row("$").focus();

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(row("tags")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(row("tags")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(row("0")).toHaveFocus());
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(row("tags")).toHaveFocus());
    await user.keyboard("{ArrowLeft}");
    expect(row("tags")).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{End}");
    await waitFor(() => expect(row("count")).toHaveFocus());
    await user.keyboard("{Home}");
    await waitFor(() => expect(row("$")).toHaveFocus());
  });

  it("swaps Left and Right in RTL", async () => {
    render(JsonViewer, { props: { dir: "rtl" } });
    row("tags").focus();

    await user.keyboard("{ArrowLeft}");
    expect(row("tags")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowRight}");
    expect(row("tags")).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a key and its value together, left to right, in RTL", () => {
    render(JsonViewer, { props: { dir: "rtl" } });

    const content = row("name").querySelector(".bx--json-viewer__content");
    expect(content).toHaveAttribute("dir", "ltr");
    expect(content).toContainElement(
      row("name").querySelector(".bx--json-viewer__key"),
    );
    expect(content).toContainElement(
      row("name").querySelector(".bx--json-viewer__value"),
    );
  });

  it("jumps to a row by typing its key", async () => {
    render(JsonViewer);
    row("$").focus();

    await user.keyboard("nes");
    await waitFor(() => expect(row("nested")).toHaveFocus());
  });

  it("gives one row the tab stop", () => {
    render(JsonViewer);

    const stops = screen
      .getAllByRole("treeitem")
      .filter((item) => item.getAttribute("tabindex") === "0");
    expect(stops).toHaveLength(1);
  });

  it("renders only the rows near the viewport of a large tree", async () => {
    const value = Array.from({ length: 5000 }, (_, i) => ({ i }));
    render(JsonViewer, { props: { value, options: { height: 240 } } });
    // A tree this wide opens over more than one time slice on a busy machine.
    await waitFor(() => expect(rows().length).toBeGreaterThan(1));

    // 240px / 24px rows, plus the overscan below.
    const rendered = screen.getAllByRole("treeitem");
    expect(rendered.length).toBeGreaterThan(9);
    expect(rendered.length).toBeLessThan(30);
    expect(rendered[1]).toHaveAttribute("aria-setsize", "5000");
  });

  it("shows another row of a large tree after the tree scrolls", async () => {
    const value = Array.from({ length: 5000 }, (_, i) => `row ${i}`);
    render(JsonViewer, { props: { value, options: { height: 240 } } });
    await waitFor(() => expect(rows().length).toBeGreaterThan(1));
    const tree = screen.getByRole("tree");

    // jsdom has no layout: place the first spacer 48000px above the tree.
    const spacer = tree.firstElementChild;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        return rect({ top: this === spacer ? -24 * 2000 : 0 });
      },
    );
    tree.scrollTop = 24 * 2000;
    await fireEvent.scroll(tree);

    expect(row("1999")).toHaveAttribute("aria-posinset", "2000");
    expect(screen.queryByText("row 5")).not.toBeInTheDocument();
  });

  it("shows a circular reference as a leaf with its target", () => {
    const value: Record<string, unknown> = { name: "loop" };
    value.me = value;
    render(JsonViewer, { props: { value } });

    const me = row("me");
    expect(me).not.toHaveAttribute("aria-expanded");
    expect(me).toHaveTextContent("[Circular → $]");
  });

  it.each([
    ["jsonpath", "$.users[0]['first-name']"],
    ["js", 'data.users[0]["first-name"]'],
  ] as const)(
    "writes the path of the active row as %s",
    async (pathFormat, text) => {
      render(JsonViewer, {
        props: {
          value: { users: [{ "first-name": "Ada" }] },
          options: { expandDepth: 4, pathFormat },
        },
      });

      await user.click(row("first-name"));
      expect(
        document.querySelector(".bx--json-viewer__path-text"),
      ).toHaveTextContent(text);
    },
  );

  it("dispatches select with the path and the value", async () => {
    const onSelect = vi.fn();
    render(JsonViewer, { props: { onSelect } });

    await user.click(row("count"));
    expect(onSelect).toHaveBeenLastCalledWith({
      path: "$.count",
      segments: [{ type: "key", key: "count" }],
      type: "number",
      value: 3,
    });
  });

  it("dispatches toggle with the path and the new state", async () => {
    const onToggle = vi.fn();
    render(JsonViewer, { props: { onToggle } });

    row("nested").focus();
    await user.keyboard("{Enter}");
    expect(onToggle).toHaveBeenLastCalledWith({
      path: "$.nested",
      expanded: true,
    });
  });

  it("expands and collapses every row with the toolbar", async () => {
    render(JsonViewer);

    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByRole("treeitem")).toHaveLength(10);

    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.getAllByRole("treeitem")).toHaveLength(5);
  });

  it("expands what lies below the active row with *", async () => {
    render(JsonViewer);
    row("nested").focus();

    await user.keyboard("*");
    await waitFor(() => expect(rows()).toContain('4:deeper:"needle"'));
    expect(rows()).not.toContain('3:0:"a"');
  });

  it("exposes the viewer's methods", async () => {
    let viewer:
      { reveal: (keys: Array<string | number>) => boolean } | undefined;
    render(JsonViewer, {
      props: { onViewer: (instance: typeof viewer) => (viewer = instance) },
    });
    await tick();

    expect(viewer?.reveal(["nested", "deep", "deeper"])).toBe(true);
    await tick();
    expect(rows()).toContain('4:deeper:"needle"');
    expect(viewer?.reveal(["missing"])).toBe(false);
  });
});

describe("JsonViewer search", () => {
  it("highlights matches and opens the rows that hold them", async () => {
    render(JsonViewer, { props: { query: "needle" } });
    await flushMacrotask();

    expect(rows()).toContain('4:deeper:"needle"');
    const marks = document.querySelectorAll(".bx--json-viewer__mark");
    expect([...marks].map((mark) => mark.textContent)).toEqual(["needle"]);
  });

  it("counts the matches and steps through them, wrapping at the ends", async () => {
    render(JsonViewer, {
      props: { value: { a: "x1", b: { c: "x2" }, d: ["x3"] }, query: "x" },
    });
    await flushMacrotask();
    const status = () =>
      document.querySelector(".bx--json-viewer__status")?.textContent;
    const current = () =>
      document.querySelector("[aria-current=true]")?.textContent;

    expect(status()).toBe("1 of 3");
    expect(current()).toContain("x1");

    await user.click(screen.getByRole("button", { name: "Next match" }));
    expect(status()).toBe("2 of 3");
    expect(current()).toContain("x2");

    await user.click(screen.getByRole("button", { name: "Next match" }));
    await user.click(screen.getByRole("button", { name: "Next match" }));
    expect(status()).toBe("1 of 3");

    await user.click(screen.getByRole("button", { name: "Previous match" }));
    expect(status()).toBe("3 of 3");
    expect(current()).toContain("x3");
  });

  it("steps with Enter and Shift+Enter in the field", async () => {
    render(JsonViewer, {
      props: { value: { a: "hit", b: "hit" }, query: "hit" },
    });
    await flushMacrotask();

    await user.click(screen.getByRole("searchbox"));
    await user.keyboard("{Enter}");
    expect(document.querySelector("[aria-current=true]")).toHaveTextContent(
      "b",
    );
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(document.querySelector("[aria-current=true]")).toHaveTextContent(
      "a",
    );
  });

  it("folds back what the search opened when it clears", async () => {
    render(JsonViewer);
    const search = screen.getByRole("searchbox");

    await user.type(search, "needle");
    await flushMacrotask();
    expect(screen.getAllByRole("treeitem")).toHaveLength(7);

    await user.clear(search);
    await flushMacrotask();
    expect(screen.getAllByRole("treeitem")).toHaveLength(5);
  });

  it("says when nothing matches", async () => {
    render(JsonViewer, { props: { query: "zzz" } });
    await flushMacrotask();

    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next match" })).toBeDisabled();
  });
});

describe("JsonViewer copy", () => {
  it("copies the active value from a plain copy, and the path from the button", async () => {
    const onCopy = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(JsonViewer, { props: { onCopy } });

    await user.click(row("tags"));
    const data = new Map<string, string>();
    const event = new Event("copy", { bubbles: true, cancelable: true });
    Object.assign(event, {
      clipboardData: {
        setData: (type: string, text: string) => data.set(type, text),
      },
    });
    row("tags").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(JSON.parse(data.get("text/plain") ?? "")).toEqual(["a", "b", "c"]);
    expect(onCopy).toHaveBeenLastCalledWith({
      kind: "value",
      text: data.get("text/plain"),
    });

    await user.click(screen.getByRole("button", { name: "Copy path" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("$.tags"));
    expect(onCopy).toHaveBeenLastCalledWith({ kind: "path", text: "$.tags" });
  });
});

describe("JsonViewer long strings", () => {
  const text = "0123456789".repeat(25);

  it("truncates a long string and expands it into rows", async () => {
    render(JsonViewer, {
      props: { value: { text }, options: { maxStringLength: 100 } },
    });

    expect(row("text")).toHaveTextContent(`"${text.slice(0, 100)}…"`);
    expect(row("text")).toHaveTextContent("250 chars");

    await user.click(row("text"));
    await user.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("treeitem")).toHaveLength(5);
    expect(row("text")).toHaveAttribute("aria-expanded", "true");
  });

  it("copies the whole string", async () => {
    render(JsonViewer, {
      props: { value: { text }, options: { maxStringLength: 100 } },
    });
    await user.click(row("text"));
    const data = new Map<string, string>();
    const event = new Event("copy", { bubbles: true, cancelable: true });
    Object.assign(event, {
      clipboardData: {
        setData: (type: string, value: string) => data.set(type, value),
      },
    });

    row("text").dispatchEvent(event);
    expect(data.get("text/plain")).toBe(text);
  });
});

describe("JsonViewer labels", () => {
  it("names the tree from aria-label, and shows types on request", () => {
    render(JsonViewer, {
      props: {
        options: { "aria-label": "Response", labelText: "", showTypes: true },
      },
    });

    expect(screen.getByRole("tree", { name: "Response" })).toBeInTheDocument();
    expect(
      row("count").querySelector(".bx--json-viewer__type"),
    ).toHaveTextContent("number");
  });

  it("hides the toolbar and the path bar", () => {
    render(JsonViewer, { props: { options: { toolbar: false } } });

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Path")).not.toBeInTheDocument();
  });
});
