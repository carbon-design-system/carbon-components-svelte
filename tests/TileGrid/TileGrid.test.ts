import { render, screen, within } from "@testing-library/svelte";
import type TileGridComponent from "carbon-components-svelte/TileGrid/TileGrid.svelte";
import { tick } from "svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { user } from "../utils/user";
import TileGrid from "./TileGrid.test.svelte";
import TileGridGenerics from "./TileGridGenerics.test.svelte";

describe("TileGrid", () => {
  it("names the grid and gives it one tab stop", () => {
    render(TileGrid);
    const grid = screen.getByRole("group", { name: "Services" });
    const tiles = screen.getAllByRole("button");
    expect(within(grid).getByRole("list")).toContainElement(tiles[0]);
    expect(tiles.map((tile) => tile.tabIndex)).toEqual([0, -1, -1]);
    expect(tiles[1]).toHaveAccessibleName("Object Storage");
  });

  it("moves with the arrow keys and keeps the tab stop on the item when the order changes", async () => {
    const { rerender } = render(TileGrid);
    await user.click(screen.getByRole("button", { name: /Object Storage/ }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Secrets/ })).toHaveFocus();

    await rerender({
      items: [
        { id: "secrets", text: "Secrets Manager" },
        { id: "functions", text: "Cloud Functions" },
      ],
    });
    expect(screen.getAllByRole("button").map((tile) => tile.tabIndex)).toEqual([
      0, -1,
    ]);
  });

  it("dispatches click:tile with the id and item", async () => {
    const onClick = vi.fn();
    render(TileGrid, { props: { onClick } });
    await user.click(screen.getByRole("button", { name: /Cloud Functions/ }));
    expect(onClick).toHaveBeenCalledWith({
      id: "functions",
      item: { id: "functions", text: "Cloud Functions" },
    });
  });

  it("shows groups as named lists inside one named group with one tab stop", async () => {
    render(TileGrid, {
      props: {
        items: [
          { id: "functions", text: "Cloud Functions", group: "Compute" },
          { id: "storage", text: "Object Storage", group: "Storage" },
          { id: "engine", text: "Code Engine", group: "Compute" },
        ],
        props: { itemToGroup: (item) => item.group },
      },
    });
    const grid = screen.getByRole("group", { name: "Services" });
    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent?.trim()),
    ).toEqual(["Compute", "Storage"]);
    const compute = screen.getByRole("list", { name: "Compute" });
    const storage = screen.getByRole("list", { name: "Storage" });
    expect(grid).toContainElement(compute);
    // Groups keep the order they first appear in, with their items in order.
    const names = (list: HTMLElement) =>
      within(list)
        .getAllByRole("button")
        .map(
          (tile) => tile.querySelector(".bx--tile-grid__label")?.textContent,
        );
    expect(names(compute)).toEqual(["Cloud Functions", "Code Engine"]);
    expect(names(storage)).toEqual(["Object Storage"]);
    expect(screen.getAllByRole("button").map((tile) => tile.tabIndex)).toEqual([
      0, -1, -1,
    ]);

    await user.click(screen.getByRole("button", { name: /Code Engine/ }));
    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("button", { name: /Object Storage/ }),
    ).toHaveFocus();
  });

  it.each([{ grouped: false }, { grouped: true }])(
    "puts rest props on the grid element (grouped: $grouped)",
    ({ grouped }) => {
      const { container } = render(TileGrid, {
        props: {
          props: {
            class: "gallery",
            "data-testid": "grid",
            ...(grouped ? { itemToGroup: () => "All" } : {}),
          },
        },
      });
      const grid = container.querySelector(".bx--tile-grid");
      expect(screen.getByTestId("grid")).toBe(grid);
      expect(grid).toHaveClass("gallery");
    },
  );

  it("sets the group heading level", () => {
    render(TileGrid, {
      props: { props: { itemToGroup: () => "All", groupHeadingLevel: 2 } },
    });
    expect(
      screen.getByRole("heading", { level: 2, name: "All" }),
    ).toBeVisible();
  });

  it("is a group only when it has a name", () => {
    render(TileGrid, { props: { props: { labelText: "" } } });
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("moves focus to the next tile when the focused one is removed", async () => {
    const { rerender } = render(TileGrid);
    await user.click(screen.getByRole("button", { name: "Object Storage" }));
    await rerender({
      items: [
        { id: "functions", text: "Cloud Functions" },
        { id: "secrets", text: "Secrets Manager" },
      ],
    });
    await tick();
    const next = screen.getByRole("button", { name: "Secrets Manager" });
    expect(next).toHaveFocus();
    expect(next.tabIndex).toBe(0);
  });

  // "wide" is not a ratio, so the cast stands in for an untyped caller.
  it.each([
    ["16x9", "bx--aspect-ratio--16x9", ""],
    ["21x9", "bx--aspect-ratio--custom", "42.857%"],
    ["wide", "bx--aspect-ratio--1x1", ""],
  ])("shapes tiles with ratio %s", (ratio, className, custom) => {
    render(TileGrid, {
      props: { props: { ratio: ratio as `${number}x${number}` } },
    });
    const tile = screen.getAllByRole("listitem")[0];
    expect(tile).toHaveClass(className);
    expect(tile.style.getPropertyValue("--ccs-aspect-ratio")).toBe(custom);
  });

  it("renders the empty slot with no items", () => {
    render(TileGrid, { props: { items: [] } });
    expect(screen.getByText("No services")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("reads ids, labels and groups through the accessors", async () => {
    const onClick = vi.fn();
    render(TileGridGenerics, { props: { onClick } });
    expect(screen.getByRole("list", { name: "Cloud" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Data" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cloud Pak" }));
    expect(onClick).toHaveBeenCalledWith({
      id: "cloud-pak",
      item: { name: "cloud-pak", title: "Cloud Pak", category: "Cloud" },
    });
  });
});

describe("Generics", () => {
  it("types the accessors, slot and event from the item type", () => {
    type Pictogram = { name: string; title: string };
    type Props = ComponentProps<TileGridComponent<Pictogram>>;

    expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
      readonly Pictogram[]
    >();
    expectTypeOf<NonNullable<Props["itemToString"]>>()
      .parameter(0)
      .toEqualTypeOf<Pictogram>();
    type Click = ComponentEvents<TileGridComponent<Pictogram>>["click:tile"];
    expectTypeOf<Click["detail"]["item"]>().toEqualTypeOf<Pictogram>();
  });
});
