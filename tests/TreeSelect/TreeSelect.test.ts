import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import TreeSelect from "./TreeSelect.test.svelte";
import { openWithKeyboard, treeItemNames } from "./helpers";
import { tree } from "./nodes";

describe("TreeSelect single", () => {
  it("names the popup a tree and opens it from the keyboard", async () => {
    render(TreeSelect, { props: { nodes: tree } });

    const field = screen.getByRole("combobox", { name: "Location" });
    expect(field).toHaveAttribute("aria-haspopup", "tree");
    expect(field).toHaveAttribute("aria-expanded", "false");

    await openWithKeyboard();

    expect(field).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(treeItemNames()).toEqual(["Europe", "North America", "Antarctica"]);
  });

  it("describes each row by level, position and expansion", async () => {
    render(TreeSelect, { props: { nodes: tree, expandedIds: ["eu"] } });
    await openWithKeyboard();

    const germany = screen.getByRole("treeitem", { name: "Germany" });
    expect(germany).toHaveAttribute("aria-level", "2");
    expect(germany).toHaveAttribute("aria-posinset", "1");
    expect(germany).toHaveAttribute("aria-setsize", "2");
    expect(germany).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("treeitem", { name: "Antarctica" }),
    ).not.toHaveAttribute("aria-expanded");
  });

  it("walks the tree with the arrow keys and selects with Enter", async () => {
    const onEvent = vi.fn();
    const { component } = render(TreeSelect, {
      props: { nodes: tree, onEvent },
    });
    const field = await openWithKeyboard();

    // Opening highlights the first row.
    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Europe" }).id,
    );

    await user.keyboard("{ArrowRight}");
    expect(treeItemNames()).toContain("Germany");
    await user.keyboard("{ArrowRight}");
    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Germany" }).id,
    );
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");

    expect(onEvent).toHaveBeenCalledWith("select", {
      selectedId: "berlin",
      selectedNode: tree[0].nodes?.[0].nodes?.[0],
    });
    expect(component.selectedId).toBe("berlin");
    expect(field).toHaveTextContent("Berlin");
    expect(field).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses a branch and steps to the parent with ArrowLeft", async () => {
    render(TreeSelect, { props: { nodes: tree, expandedIds: ["eu"] } });
    const field = await openWithKeyboard();
    await user.keyboard("{ArrowDown}");
    // Germany is highlighted: a collapsed branch moves to its parent.
    await user.keyboard("{ArrowLeft}");
    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Europe" }).id,
    );
    await user.keyboard("{ArrowLeft}");
    expect(treeItemNames()).toEqual(["Europe", "North America", "Antarctica"]);
  });

  it("reveals and highlights the selected node when it opens", async () => {
    render(TreeSelect, { props: { nodes: tree, selectedId: "paris" } });
    const field = await openWithKeyboard();

    await waitFor(() =>
      expect(field).toHaveAttribute(
        "aria-activedescendant",
        screen.getByRole("treeitem", { name: "Paris" }).id,
      ),
    );
    expect(treeItemNames()).toContain("France");
    expect(screen.getByRole("treeitem", { name: "Paris" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("only expands a parent when selectable is leaf", async () => {
    const { component } = render(TreeSelect, {
      props: { nodes: tree, selectable: "leaf" },
    });
    await openWithKeyboard();
    await user.keyboard("{Enter}");

    expect(component.selectedId).toBeUndefined();
    expect(treeItemNames()).toContain("Germany");
  });

  it("does not select a disabled node", async () => {
    const { component } = render(TreeSelect, {
      props: { nodes: tree, expandedIds: ["na"] },
    });
    await openWithKeyboard();
    await user.click(screen.getByRole("treeitem", { name: "Canada" }));

    expect(component.selectedId).toBeUndefined();
  });

  it("submits the selected id under name", () => {
    const { container } = render(TreeSelect, {
      props: { nodes: tree, selectedId: "an", name: "continent" },
    });

    expect(
      container.querySelector<HTMLInputElement>('input[name="continent"]'),
    ).toHaveValue("an");
  });
});

describe("TreeSelect checkbox", () => {
  it("checks every descendant and shows a partly checked parent as mixed", async () => {
    const onEvent = vi.fn();
    const { component } = render(TreeSelect, {
      props: {
        nodes: tree,
        selectionMode: "checkbox",
        expandedIds: ["eu", "de"],
        onEvent,
      },
    });
    await openWithKeyboard();
    expect(screen.getByRole("tree")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );

    await user.click(screen.getByRole("treeitem", { name: "Germany" }));

    expect(component.checkedIds).toEqual(["de", "berlin", "munich"]);
    expect(screen.getByRole("treeitem", { name: "Germany" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("treeitem", { name: "Europe" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
    expect(component.indeterminateIds).toEqual(["eu"]);
    expect(onEvent).toHaveBeenCalledWith("check:change", {
      checkedIds: ["de", "berlin", "munich"],
      added: ["de", "berlin", "munich"],
      removed: [],
      indeterminateIds: ["eu"],
    });
  });

  it("keeps the menu open and unchecks with Space from the keyboard", async () => {
    const { component } = render(TreeSelect, {
      props: {
        nodes: tree,
        selectionMode: "checkbox",
        checkedIds: ["an"],
      },
    });
    const field = await openWithKeyboard();
    await user.keyboard("{ArrowDown}{ArrowDown} ");

    expect(component.checkedIds).toEqual([]);
    expect(field).toHaveAttribute("aria-expanded", "true");
  });

  it("reports a fully checked branch as one entry unless asked for each", async () => {
    const { component, rerender } = render(TreeSelect, {
      props: {
        nodes: tree,
        selectionMode: "checkbox",
        checkedIds: ["eu"],
      },
    });
    const field = screen.getByRole("combobox");

    expect(field).toHaveTextContent("Europe");
    expect(field).not.toHaveTextContent("Berlin");

    await rerender({ showChecked: "leaf" });
    expect(field).toHaveTextContent("Berlin, Munich, Paris");

    await rerender({ checkMode: "node", checkedIds: ["eu"] });
    expect(component.checkedIds).toEqual(["eu"]);
    expect(field).toHaveTextContent("Europe");
  });

  it("lists each reported entry as a dismissible tag", async () => {
    const { component } = render(TreeSelect, {
      props: {
        nodes: tree,
        selectionMode: "checkbox",
        selectionDisplay: "tags",
        checkedIds: ["de", "an"],
      },
    });

    await user.click(
      screen.getByRole("button", { name: /Remove.*Antarctica/ }),
    );

    expect(component.checkedIds).toEqual(["de", "berlin", "munich"]);
  });

  it("mounts at most tagLimit tags and counts the rest in one", () => {
    const nodes = Array.from({ length: 12 }, (_, id) => ({
      id,
      text: `Node ${id}`,
    }));
    const { component } = render(TreeSelect, {
      props: {
        nodes,
        selectionMode: "checkbox",
        selectionDisplay: "tags",
        tagLimit: 5,
        checkedIds: nodes.map((node) => node.id),
      },
    });

    expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(5);
    expect(screen.getByText("+7 more")).toBeInTheDocument();
    expect(component.checkedIds).toHaveLength(12);
  });

  it("submits one value per reported entry", () => {
    const { container } = render(TreeSelect, {
      props: {
        nodes: tree,
        selectionMode: "checkbox",
        checkedIds: ["de", "an"],
        name: "places",
      },
    });

    const values = [
      ...container.querySelectorAll<HTMLInputElement>('input[name="places"]'),
    ].map((input) => input.value);
    expect(values).toEqual(["de", "an"]);
  });
});

describe("TreeSelect search", () => {
  it("keeps the ancestors of a match and holds them open", async () => {
    render(TreeSelect, { props: { nodes: tree, filterable: true } });
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("ber");

    expect(treeItemNames()).toEqual(["Europe", "Germany", "Berlin"]);
    expect(screen.getByRole("treeitem", { name: "Europe" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("shows the empty text when nothing matches", async () => {
    render(TreeSelect, { props: { nodes: tree, filterable: true } });
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("zzz");

    expect(screen.queryAllByRole("treeitem")).toHaveLength(0);
    expect(screen.getAllByText("No results").length).toBeGreaterThan(0);
  });

  it("selects a match and puts its label in the field", async () => {
    const { component } = render(TreeSelect, {
      props: { nodes: tree, filterable: true },
    });
    const field = screen.getByRole("combobox");
    await user.click(field);
    await user.keyboard("paris{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");

    expect(component.selectedId).toBe("paris");
    expect(field).toHaveValue("Paris");
  });

  it("keeps the caret keys for the text while a search is typed", async () => {
    render(TreeSelect, { props: { nodes: tree, filterable: true } });
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("a{ArrowDown}{ArrowLeft}");

    // Plain ArrowLeft did not collapse or move the highlight.
    expect(screen.getByRole("combobox")).toHaveValue("a");
  });
});

describe("TreeSelect lazy children", () => {
  const lazy = [
    { id: "root", text: "Root", hasChildren: true },
    { id: "leaf", text: "Leaf" },
  ];

  it("loads children once, the first time a parent expands", async () => {
    const loadChildren = vi.fn(async () => [{ id: "kid", text: "Kid" }]);
    const onEvent = vi.fn();
    render(TreeSelect, { props: { nodes: lazy, loadChildren, onEvent } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(treeItemNames()).toContain("Kid"));
    expect(loadChildren).toHaveBeenCalledTimes(1);
    expect(loadChildren).toHaveBeenCalledWith(lazy[0]);
    expect(onEvent).toHaveBeenCalledWith("load", {
      node: lazy[0],
      nodes: [{ id: "kid", text: "Kid" }],
    });

    await user.keyboard("{ArrowLeft}{ArrowRight}");
    expect(loadChildren).toHaveBeenCalledTimes(1);
    expect(lazy[0]).not.toHaveProperty("nodes");
  });

  it("collapses a node that fails to load and retries when expanded again", async () => {
    const loadChildren = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([{ id: "kid", text: "Kid" }]);
    const onEvent = vi.fn();
    render(TreeSelect, { props: { nodes: lazy, loadChildren, onEvent } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(onEvent).toHaveBeenCalledWith("load:error", {
        node: lazy[0],
        error: expect.any(Error),
      }),
    );
    expect(treeItemNames()).toEqual(["Root", "Leaf"]);

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(treeItemNames()).toContain("Kid"));
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });

  it("gives children of a checked unloaded parent its check once they load", async () => {
    const loadChildren = vi.fn(async () => [
      { id: "kid", text: "Kid" },
      { id: "kin", text: "Kin" },
    ]);
    const { component } = render(TreeSelect, {
      props: {
        nodes: lazy,
        loadChildren,
        selectionMode: "checkbox",
        checkedIds: ["root"],
      },
    });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(component.checkedIds).toEqual(["root", "kid", "kin"]),
    );
  });

  it("keeps a saved check on a node that has not loaded, and submits it", async () => {
    const loadChildren = vi.fn(async () => [
      { id: "kid", text: "Kid" },
      { id: "kin", text: "Kin" },
    ]);
    const onEvent = vi.fn();
    const { component, container } = render(TreeSelect, {
      props: {
        nodes: lazy,
        loadChildren,
        selectionMode: "checkbox",
        checkedIds: ["kin"],
        name: "places",
        onEvent,
      },
    });

    expect(component.checkedIds).toEqual(["kin"]);
    expect(onEvent).not.toHaveBeenCalledWith("check:change", expect.anything());
    const submitted = () =>
      [...container.querySelectorAll("input[type=hidden]")].map(
        (input) => (input as HTMLInputElement).value,
      );
    expect(submitted()).toEqual(["kin"]);

    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("treeitem", { name: "Kin" })).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    );
    expect(component.checkedIds).toEqual(["kin"]);
    expect(component.indeterminateIds).toEqual(["root"]);
  });

  it("drops an unknown id once no parent is left to load", () => {
    const { component } = render(TreeSelect, {
      props: {
        nodes: [{ id: "leaf", text: "Leaf" }],
        selectionMode: "checkbox",
        checkedIds: ["gone", "leaf"],
      },
    });
    expect(component.checkedIds).toEqual(["leaf"]);
  });

  it("submits a selected id whose node has not loaded", () => {
    const { container } = render(TreeSelect, {
      props: { nodes: lazy, selectedId: "kin", name: "place" },
    });
    const input = container.querySelector("input[type=hidden]");
    expect(input).toHaveValue("kin");
  });
});

describe("TreeSelect windowing", () => {
  it("renders only the rows in view for a large tree", async () => {
    const nodes = Array.from({ length: 5000 }, (_, index) => ({
      id: index,
      text: `Node ${index}`,
    }));
    render(TreeSelect, { props: { nodes } });
    await openWithKeyboard();

    const items = screen.getAllByRole("treeitem");
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThan(30);
    expect(items[0]).toHaveAttribute("aria-setsize", "5000");
  });
});
