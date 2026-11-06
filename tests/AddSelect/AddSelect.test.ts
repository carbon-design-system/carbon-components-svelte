import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type {
  AddSelectItem,
  AddSelectPage,
} from "carbon-components-svelte/AddSelect/AddSelect.svelte";
import { tick } from "svelte";
import AddSelectHost from "./AddSelect.test.svelte";

// jsdom measures nothing, so the list would window to a single row.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return 640;
    },
  });
});

const catalog: AddSelectItem[] = [
  { id: "fin", title: "Finance", hasChildren: true, childCount: 3 },
  { id: "hr", title: "People", hasChildren: true, childCount: 1 },
  { id: "rev", title: "Revenue", parentId: "fin", hasChildren: true },
  {
    id: "tax",
    title: "Tax filings",
    parentId: "fin",
    attributes: { type: "view" },
  },
  {
    id: "bud",
    title: "Budget",
    parentId: "fin",
    attributes: { type: "table" },
  },
  {
    id: "q1",
    title: "Q1 revenue",
    parentId: "rev",
    attributes: { type: "table" },
  },
  {
    id: "q2",
    title: "Q2 revenue",
    parentId: "rev",
    attributes: { type: "table" },
  },
  {
    id: "q3",
    title: "Q3 revenue",
    parentId: "rev",
    attributes: { type: "view" },
  },
  {
    id: "head",
    title: "Headcount",
    parentId: "hr",
    attributes: { type: "table" },
  },
];

const getList = () => screen.getByRole("listbox", { name: /Datasets/ });
const key = (name: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(getList(), { key: name, ...init });
const titles = () =>
  screen
    .queryAllByRole("option")
    .map(
      (option) => option.querySelector(".bx--add-select__title")?.textContent,
    );
const output = (id: string) => screen.getByTestId(id).textContent;
const cursor = () => {
  const id = getList().getAttribute("aria-activedescendant");
  return id
    ? document.getElementById(id)?.querySelector(".bx--add-select__title")
        ?.textContent
    : undefined;
};

describe("AddSelect", () => {
  it("shows the top level and opens a level with Right Arrow, then goes back with Left Arrow", async () => {
    render(AddSelectHost, { props: { items: catalog } });
    expect(titles()).toEqual(["Finance", "People"]);
    expect(cursor()).toBe("Finance");

    getList().focus();
    await key("ArrowRight");
    expect(titles()).toEqual(["Revenue", "Tax filings", "Budget"]);
    expect(output("path")).toBe("Finance");
    expect(
      screen.getByRole("navigation", { name: "Levels" }),
    ).toHaveTextContent("All items");

    await key("ArrowDown");
    await key("ArrowRight");
    expect(titles()).toEqual(["Revenue", "Tax filings", "Budget"]);

    await key("ArrowLeft");
    expect(titles()).toEqual(["Finance", "People"]);
    expect(output("path")).toBe("");
    expect(cursor()).toBe("Finance");
  });

  it("opens a level from a breadcrumb", async () => {
    render(AddSelectHost, {
      props: { items: catalog, path: [{ id: "fin", title: "Finance" }] },
    });
    await tick();
    expect(titles()).toEqual(["Revenue", "Tax filings", "Budget"]);
    await fireEvent.click(screen.getByRole("button", { name: "All items" }));
    expect(titles()).toEqual(["Finance", "People"]);
  });

  it("keeps an item that can be opened out of the selection unless asked", async () => {
    render(AddSelectHost, { props: { items: catalog } });
    getList().focus();
    await key(" ");
    expect(screen.getByTestId("events")).toHaveTextContent("");
    expect(screen.queryAllByRole("option", { selected: true })).toHaveLength(0);
    expect(screen.getAllByRole("option")[0]).not.toHaveAttribute(
      "aria-selected",
    );
  });
});

describe("MultiAddSelect", () => {
  async function openFinance() {
    const view = render(AddSelectHost, {
      props: { items: catalog, path: [{ id: "fin", title: "Finance" }] },
    });
    await tick();
    getList().focus();
    return view;
  }

  it("chooses with Space and extends a range with Shift+Arrow", async () => {
    await openFinance();
    await key("ArrowDown");
    expect(cursor()).toBe("Tax filings");
    await key(" ");
    expect(screen.getByRole("option", { name: /Tax filings/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await key("ArrowDown", { shiftKey: true });
    expect(screen.getByRole("option", { name: /Budget/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("lists the chosen items with where they were chosen from, and removes one", async () => {
    await openFinance();
    await key("ArrowDown");
    await key(" ");
    const chosen = screen.getByRole("complementary", { name: /Selected/ });
    expect(within(chosen).getByText("Tax filings")).toBeInTheDocument();
    expect(within(chosen).getByText("Finance")).toBeInTheDocument();

    await fireEvent.click(
      within(chosen).getByRole("button", { name: "Remove Tax filings" }),
    );
    expect(within(chosen).queryByText("Tax filings")).toBeNull();
  });

  it("keeps a choice made in one level while another is open", async () => {
    await openFinance();
    await key("ArrowDown");
    await key(" ");
    await fireEvent.click(screen.getByRole("button", { name: "All items" }));
    expect(titles()).toEqual(["Finance", "People"]);
    const chosen = screen.getByRole("complementary", { name: /Selected/ });
    expect(within(chosen).getByText("Tax filings")).toBeInTheDocument();
    expect(within(chosen).getByText("1")).toBeInTheDocument();
  });

  it("changes `value` only on confirm, and Cancel goes back to it", async () => {
    await openFinance();
    await key("ArrowDown");
    await key(" ");
    expect(output("value")).toBe("[]");
    expect(screen.getByTestId("events")).toHaveTextContent("change");

    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryAllByRole("option", { selected: true })).toHaveLength(0);
    expect(output("events")).toBe("change,cancel");

    await key(" ");
    await fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(output("value")).toBe('["tax"]');
    expect(output("events")).toContain("confirm");
  });

  it("follows every change with commit=change and has no footer", async () => {
    render(AddSelectHost, {
      props: {
        items: catalog,
        commit: "change",
        path: [{ id: "fin", title: "Finance" }],
      },
    });
    await tick();
    getList().focus();
    await key("ArrowDown");
    await key(" ");
    expect(output("value")).toBe('["tax"]');
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
  });

  it("lets an item that can be opened be chosen with selectParents", async () => {
    render(AddSelectHost, {
      props: {
        items: catalog,
        selectParents: true,
        path: [{ id: "fin", title: "Finance" }],
      },
    });
    await tick();
    getList().focus();
    await key(" ");
    expect(screen.getByRole("option", { name: /Revenue/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("selects the whole level with Ctrl+A and clears with the button", async () => {
    await openFinance();
    await key("a", { ctrlKey: true });
    expect(screen.queryAllByRole("option", { selected: true })).toHaveLength(2);
    await fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.queryAllByRole("option", { selected: true })).toHaveLength(0);
  });
});

describe("search and filters", () => {
  it("searches the open level, and every level on request", async () => {
    render(AddSelectHost, {
      props: { items: catalog, path: [{ id: "fin", title: "Finance" }] },
    });
    await tick();
    const search = screen.getByRole("searchbox");
    await fireEvent.input(search, { target: { value: "revenue" } });
    await vi.waitFor(() => expect(titles()).toEqual(["Revenue"]));

    await fireEvent.click(
      screen.getByRole("button", { name: "Search all levels" }),
    );
    await vi.waitFor(() =>
      expect(titles()).toEqual([
        "Revenue",
        "Q1 revenue",
        "Q2 revenue",
        "Q3 revenue",
      ]),
    );
    const row = screen.getByRole("option", { name: /Q1 revenue/ });
    expect(row).toHaveTextContent("Finance / Revenue");
  });

  it("filters leaves with chips", async () => {
    render(AddSelectHost, {
      props: {
        items: catalog,
        path: [
          { id: "fin", title: "Finance" },
          { id: "rev", title: "Revenue" },
        ],
        filters: [
          {
            id: "type",
            labelText: "Type",
            options: [
              { id: "table", labelText: "Table" },
              { id: "view", labelText: "View" },
            ],
          },
        ],
      },
    });
    await tick();
    expect(titles()).toEqual(["Q1 revenue", "Q2 revenue", "Q3 revenue"]);
    await fireEvent.click(screen.getByRole("button", { name: "View" }));
    await tick();
    expect(titles()).toEqual(["Q3 revenue"]);
    await fireEvent.click(
      screen.getByRole("button", { name: "Clear filters" }),
    );
    await tick();
    expect(titles()).toHaveLength(3);
  });

  it("says when nothing matches", async () => {
    render(AddSelectHost, { props: { items: catalog } });
    await fireEvent.input(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    });
    await vi.waitFor(() =>
      expect(screen.getByText("No results match.")).toBeInTheDocument(),
    );
  });
});

describe("async source", () => {
  it("asks for the next page with the cursor", async () => {
    const calls: { query: string; cursor?: number | null }[] = [];
    const resolvers: (() => void)[] = [];
    const pages = (q: string) =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `${q}-${i}`,
        title: `${q} ${i}`,
      }));
    const source = (
      request: { query: string },
      context: { cursor?: number | null },
    ) =>
      new Promise<AddSelectPage>((resolve) => {
        calls.push({ query: request.query, cursor: context.cursor });
        resolvers.push(() =>
          resolve({
            items: pages(request.query || "all").slice(0, 2),
            nextCursor: (context.cursor ?? 0) === 0 ? 2 : null,
            total: 4,
          }),
        );
      });
    render(AddSelectHost, { props: { source } });
    await tick();
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    resolvers[0]();
    await vi.waitFor(() => expect(titles()).toEqual(["all 0", "all 1"]));
    expect(screen.getByRole("listbox")).not.toHaveAttribute("aria-busy");

    await fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(calls[1].cursor).toBe(2);
  });

  it("shows an error with a retry that asks again", async () => {
    let fail = true;
    const source = () => {
      if (fail) return Promise.reject(new Error("down"));
      return Promise.resolve({
        items: [{ id: 1, title: "Back" }],
        nextCursor: null,
        total: 1,
      });
    };
    render(AddSelectHost, { props: { source } });
    await vi.waitFor(() =>
      expect(
        screen.getByText("The items could not be loaded."),
      ).toBeInTheDocument(),
    );
    fail = false;
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await vi.waitFor(() => expect(titles()).toEqual(["Back"]));
  });
});

describe("AddSelect single", () => {
  it("replaces the choice and has no chosen column", async () => {
    render(AddSelectHost, {
      props: {
        multi: false,
        items: catalog,
        path: [{ id: "fin", title: "Finance" }],
      },
    });
    await tick();
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(getList()).not.toHaveAttribute("aria-multiselectable");
    getList().focus();
    await key("ArrowDown");
    await key(" ");
    await key("ArrowDown");
    await key(" ");
    expect(screen.queryAllByRole("option", { selected: true })).toHaveLength(1);
    await fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(output("value")).toBe('"bud"');
  });
});
