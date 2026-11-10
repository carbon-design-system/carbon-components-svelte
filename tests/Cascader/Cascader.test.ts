import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import Cascader from "./Cascader.test.svelte";
import { columnNames, openWithKeyboard, treeItemNames } from "./helpers";
import { places } from "./nodes";

describe("Cascader single", () => {
  it("names the popup a tree of groups, one per column", async () => {
    render(Cascader, { props: { nodes: places } });

    const field = screen.getByRole("combobox", { name: "Location" });
    expect(field).toHaveAttribute("aria-haspopup", "tree");
    expect(field).toHaveAttribute("aria-expanded", "false");

    await openWithKeyboard();

    expect(field).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(columnNames("Location")).toEqual(["Europe", "Asia", "Antarctica"]);
  });

  it("describes an item by level, position and expansion", async () => {
    render(Cascader, { props: { nodes: places, value: ["eu", "fr", "lyon"] } });
    await openWithKeyboard();

    const france = screen.getByRole("treeitem", { name: "France" });
    expect(france).toHaveAttribute("aria-level", "2");
    expect(france).toHaveAttribute("aria-posinset", "1");
    expect(france).toHaveAttribute("aria-setsize", "2");
    expect(france).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("treeitem", { name: "Antarctica" }),
    ).not.toHaveAttribute("aria-expanded");
    expect(screen.getByRole("treeitem", { name: "Lyon" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("opens a column with Right, goes back with Left, and chooses a leaf with Enter", async () => {
    const onEvent = vi.fn();
    const { component } = render(Cascader, {
      props: { nodes: places, onEvent },
    });
    const field = await openWithKeyboard();

    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Europe" }).id,
    );

    await user.keyboard("{ArrowRight}");
    expect(columnNames("Europe")).toEqual(["France", "Germany"]);
    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "France" }).id,
    );

    await user.keyboard("{ArrowLeft}");
    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Europe" }).id,
    );

    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");

    expect(component.value).toEqual(["eu", "fr", "paris"]);
    expect(onEvent).toHaveBeenCalledWith("change", {
      value: ["eu", "fr", "paris"],
      nodes: [places[0], places[0].nodes?.[0], places[0].nodes?.[0].nodes?.[0]],
      text: "Europe / France / Paris",
    });
    expect(field).toHaveTextContent("Europe / France / Paris");
    expect(field).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a branch on Enter and only chooses a leaf", async () => {
    const { component } = render(Cascader, { props: { nodes: places } });
    await openWithKeyboard();
    await user.keyboard("{Enter}");

    expect(component.value).toEqual([]);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(treeItemNames()).toContain("France");
  });

  it("chooses a branch with changeOnSelect", async () => {
    const { component } = render(Cascader, {
      props: { nodes: places, changeOnSelect: true },
    });
    await openWithKeyboard();
    await user.keyboard("{Enter}");

    expect(component.value).toEqual(["eu"]);
    expect(screen.getByRole("combobox")).toHaveTextContent("Europe");
  });

  it("keeps two branches' equal ids apart", () => {
    render(Cascader, {
      props: { nodes: places, value: ["eu", "de", "paris"] },
    });
    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Europe / Germany / Paris, Texas?",
    );
  });

  it("skips a disabled item with the arrow keys", async () => {
    render(Cascader, { props: { nodes: places } });
    await openWithKeyboard();
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}{ArrowDown}");

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Tokyo" }).id,
    );
  });

  it("swaps Left and Right in a right-to-left page", async () => {
    document.documentElement.dir = "rtl";
    try {
      render(Cascader, { props: { nodes: places } });
      await openWithKeyboard();
      await user.keyboard("{ArrowLeft}");
      expect(treeItemNames()).toContain("France");
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-activedescendant",
        screen.getByRole("treeitem", { name: "Europe" }).id,
      );
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

  it("jumps to a label by typing in the column", async () => {
    render(Cascader, { props: { nodes: places } });
    await openWithKeyboard();
    await user.keyboard("an");

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Antarctica" }).id,
    );
  });

  it("closes on Escape without choosing", async () => {
    const { component } = render(Cascader, { props: { nodes: places } });
    const field = await openWithKeyboard();
    await user.keyboard("{Escape}");

    expect(field).toHaveAttribute("aria-expanded", "false");
    expect(component.value).toEqual([]);
  });

  it("opens on the column that holds the value", async () => {
    render(Cascader, {
      props: { nodes: places, value: ["as", "jp", "tokyo"] },
    });
    const field = await openWithKeyboard();

    await waitFor(() =>
      expect(field).toHaveAttribute(
        "aria-activedescendant",
        screen.getByRole("treeitem", { name: "Tokyo" }).id,
      ),
    );
    expect(columnNames("Japan")).toEqual(["Tokyo", "Osaka"]);
  });

  it("clears with the clear button", async () => {
    const { component } = render(Cascader, {
      props: { nodes: places, value: ["eu", "fr", "lyon"], clearable: true },
    });
    await user.click(screen.getByTitle("Clear selected item"));

    expect(component.value).toEqual([]);
  });
});

describe("Cascader multiple", () => {
  it("checks a leaf, shows its parents as mixed, and reports the path", async () => {
    const onEvent = vi.fn();
    const { component } = render(Cascader, {
      props: { nodes: places, multiple: true, onEvent },
    });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}{ArrowRight} ");

    expect(component.values).toEqual([["eu", "fr", "paris"]]);
    expect(screen.getByRole("treeitem", { name: "Europe" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
    expect(screen.getByRole("treeitem", { name: "Paris" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("tree")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("reports a fully checked branch as one path, or as its leaves", async () => {
    const { component, rerender } = render(Cascader, {
      props: { nodes: places, multiple: true },
    });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight} ");

    expect(component.values).toEqual([["eu", "fr"]]);

    await rerender({ showChecked: "leaf" });
    await user.keyboard("{ArrowDown} ");
    expect(component.values).toEqual([
      ["eu", "fr", "paris"],
      ["eu", "fr", "lyon"],
      ["eu", "de", "berlin"],
      ["eu", "de", "paris"],
    ]);
  });

  it("opens with checked paths from outside", () => {
    render(Cascader, {
      props: {
        nodes: places,
        multiple: true,
        values: [["eu", "de", "berlin"], ["an"]],
      },
    });

    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Europe / Germany / Berlin, Antarctica",
    );
  });

  it("submits one JSON path per checked entry", () => {
    const { container } = render(Cascader, {
      props: {
        nodes: places,
        multiple: true,
        values: [["eu", "de", "berlin"], ["an"]],
        name: "where",
      },
    });

    expect(
      [
        ...container.querySelectorAll<HTMLInputElement>('input[name="where"]'),
      ].map((input) => input.value),
    ).toEqual(['["eu","de","berlin"]', '["an"]']);
  });
});

describe("Cascader search", () => {
  it("lists paths with the match marked and chooses one with Enter", async () => {
    const { component } = render(Cascader, {
      props: { nodes: places, filterable: true },
    });
    const field = screen.getByRole("combobox");
    await user.click(field);
    await user.keyboard("par");

    expect(field).toHaveAttribute("aria-haspopup", "listbox");
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      "Europe / France / Paris",
      "Europe / Germany / Paris, Texas?",
    ]);
    expect(
      options[0].querySelector("span.bx--highlight__mark"),
    ).toHaveTextContent("Par");

    await user.keyboard("{ArrowDown}{Enter}");
    expect(component.value).toEqual(["eu", "de", "paris"]);
    expect(field).toHaveValue("Europe / Germany / Paris, Texas?");
  });

  it("matches words across levels", async () => {
    render(Cascader, { props: { nodes: places, filterable: true } });
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("asia tok");

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      "Asia / Japan / Tokyo",
    ]);
  });

  it("says when nothing matches", async () => {
    render(Cascader, { props: { nodes: places, filterable: true } });
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("zzz");

    expect(await screen.findByText("No results")).toBeInTheDocument();
  });

  it("asks a server when it is given a search function", async () => {
    const search = vi.fn(() =>
      Promise.resolve([
        [
          { id: "eng", text: "Engineering" },
          { id: "eng-1", text: "Platform" },
        ],
      ]),
    );
    const { component } = render(Cascader, {
      props: {
        nodes: [{ id: "eng", text: "Engineering", hasChildren: true }],
        filterable: true,
        search,
      },
    });
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("plat");

    const option = await screen.findByRole("option", {}, { timeout: 2000 });
    expect(option).toHaveTextContent("Engineering / Platform");
    expect(search).toHaveBeenCalledWith("plat", expect.anything());

    await user.keyboard("{Enter}");
    expect(component.value).toEqual(["eng", "eng-1"]);
  });
});

describe("Cascader lazy loading", () => {
  const roots = [
    { id: "eng", text: "Engineering", hasChildren: true },
    { id: "ops", text: "Operations" },
  ];

  it("loads a column when it opens, and keeps it", async () => {
    const loadChildren = vi.fn(() =>
      Promise.resolve([
        { id: "a", text: "Platform" },
        { id: "b", text: "Mobile" },
      ]),
    );
    const onEvent = vi.fn();
    render(Cascader, { props: { nodes: roots, loadChildren, onEvent } });
    const field = await openWithKeyboard();
    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByRole("treeitem", { name: "Platform" })).toBeVisible(),
    );
    expect(field).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("treeitem", { name: "Platform" }).id,
    );
    expect(loadChildren).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith(
      "load",
      expect.objectContaining({
        node: roots[0],
      }),
    );

    await user.keyboard("{ArrowLeft}{ArrowRight}");
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it("shows a loading column, marked busy", async () => {
    let finish: (nodes: Array<{ id: string; text: string }>) => void = () => {};
    const loadChildren = () =>
      new Promise<Array<{ id: string; text: string }>>((resolve) => {
        finish = resolve;
      });
    render(Cascader, { props: { nodes: roots, loadChildren } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tree")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    finish([{ id: "a", text: "Platform" }]);
    await screen.findByRole("treeitem", { name: "Platform" });
    expect(screen.getByRole("tree")).not.toHaveAttribute("aria-busy");
  });

  it("aborts the load of a column that was left", async () => {
    const signals: AbortSignal[] = [];
    const loadChildren = (_: unknown, { signal }: { signal: AbortSignal }) => {
      signals.push(signal);
      return new Promise<never>(() => {});
    };
    render(Cascader, {
      props: {
        nodes: [
          { id: "a", text: "Alpha", hasChildren: true },
          { id: "b", text: "Beta", hasChildren: true },
        ],
        loadChildren,
      },
    });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}{ArrowLeft}{ArrowDown}{ArrowRight}");

    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("says a load failed and loads again on retry", async () => {
    let attempts = 0;
    const loadChildren = () => {
      attempts += 1;
      if (attempts === 1) return Promise.reject(new Error("offline"));
      return Promise.resolve([{ id: "a", text: "Platform" }]);
    };
    const onEvent = vi.fn();
    render(Cascader, { props: { nodes: roots, loadChildren, onEvent } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");

    await screen.findByText("Could not load Engineering", {
      selector: "span:not(.bx--visually-hidden)",
    });
    expect(onEvent).toHaveBeenCalledWith(
      "load:error",
      expect.objectContaining({
        node: roots[0],
      }),
    );

    await user.click(screen.getByText("Try again"));
    expect(
      await screen.findByRole("treeitem", { name: "Platform" }),
    ).toBeVisible();
  });

  it("loads the chain of a value it was given", async () => {
    const loadChildren = (node: { id: string | number }) =>
      Promise.resolve(
        node.id === "eng"
          ? [{ id: "a", text: "Platform", hasChildren: true }]
          : [{ id: "x", text: "Runtime" }],
      );
    render(Cascader, {
      props: { nodes: roots, loadChildren, value: ["eng", "a", "x"] },
    });

    await waitFor(() =>
      expect(screen.getByRole("combobox")).toHaveTextContent(
        "Engineering / Platform / Runtime",
      ),
    );
  });

  it("loads a failed column again when Right is pressed on its parent", async () => {
    let attempts = 0;
    const loadChildren = () => {
      attempts += 1;
      if (attempts === 1) return Promise.reject(new Error("offline"));
      return Promise.resolve([{ id: "a", text: "Platform" }]);
    };
    render(Cascader, { props: { nodes: roots, loadChildren } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");
    await screen.findByText("Try again");

    await user.keyboard("{ArrowRight}");
    expect(
      await screen.findByRole("treeitem", { name: "Platform" }),
    ).toBeVisible();
    expect(attempts).toBe(2);
  });
});

describe("Cascader announcements", () => {
  const announced = () =>
    document.querySelector("[data-announcer]")?.textContent ?? "";

  it("says the chosen path and how many levels it has", async () => {
    render(Cascader, { props: { nodes: places } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");

    await waitFor(() =>
      expect(announced()).toContain("Paris selected, 3 levels"),
    );
  });

  it("says how many results a search found", async () => {
    render(Cascader, { props: { nodes: places, filterable: true } });
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("par");

    await waitFor(() => expect(announced()).toContain("2 results"), {
      timeout: 2000,
    });
  });

  it("says how many are checked", async () => {
    render(Cascader, { props: { nodes: places, multiple: true } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}{ArrowRight} ");

    await waitFor(() => expect(announced()).toContain("1 selected"), {
      timeout: 2000,
    });
  });

  it("says a column opened, and how many items it holds", async () => {
    render(Cascader, { props: { nodes: places } });
    await openWithKeyboard();
    await user.keyboard("{ArrowRight}");

    await waitFor(() => expect(announced()).toContain("Europe, 2 items"));
  });
});

describe("Cascader value from outside", () => {
  it("shows a path written after it mounted", async () => {
    const { rerender } = render(Cascader, { props: { nodes: places } });
    await rerender({ value: ["as", "jp", "tokyo"] });

    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Asia / Japan / Tokyo",
    );
  });

  it("formats the chosen path with the separator", () => {
    render(Cascader, {
      props: { nodes: places, value: ["as", "jp", "tokyo"], separator: " > " },
    });

    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Asia > Japan > Tokyo",
    );
  });

  it("does not open a read-only field", async () => {
    render(Cascader, { props: { nodes: places, readonly: true } });
    await openWithKeyboard();

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
