import { render, screen } from "@testing-library/svelte";
import type ContainedListItemComponent from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import ContainedListLabelChildren from "./ContainedList.labelChildren.test.svelte";
import ContainedListSearch from "./ContainedList.search.test.svelte";
import ContainedListSearchAction from "./ContainedList.searchAction.test.svelte";
import ContainedList from "./ContainedList.test.svelte";
import ContainedListItemAction from "./ContainedListItem.action.test.svelte";
import ContainedListItemHref from "./ContainedListItem.href.test.svelte";

describe("ContainedList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(ContainedList);

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(list.closest("div")).toHaveClass("bx--contained-list");
    expect(list.closest("div")).toHaveClass("bx--contained-list--on-page");
    expect(list.closest("div")).toHaveClass("bx--contained-list--md");

    expect(screen.getByText("List title")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("should not render header when labelText is empty and no labelChildren slot", () => {
    const { container } = render(ContainedList, { props: { labelText: "" } });

    const header = container.querySelector(".bx--contained-list__header");
    expect(header).toBeNull();
  });

  it("should render with disclosed kind", () => {
    render(ContainedList, { props: { kind: "disclosed" } });

    const list = screen.getByRole("list");
    expect(list.closest("div")).toHaveClass("bx--contained-list--disclosed");
    expect(list.closest("div")).not.toHaveClass("bx--contained-list--on-page");
  });

  it("should render with small size", () => {
    render(ContainedList, { props: { size: "sm" } });
    expect(screen.getByRole("list").closest("div")).toHaveClass(
      "bx--contained-list--sm",
    );
  });

  it("should render with large size", () => {
    render(ContainedList, { props: { size: "lg" } });
    expect(screen.getByRole("list").closest("div")).toHaveClass(
      "bx--contained-list--lg",
    );
  });

  it("should render with extra-large size", () => {
    render(ContainedList, { props: { size: "xl" } });
    expect(screen.getByRole("list").closest("div")).toHaveClass(
      "bx--contained-list--xl",
    );
  });

  it("should apply layout size classes to header", () => {
    render(ContainedList, { props: { size: "sm" } });

    const header = screen
      .getByText("List title")
      .closest(".bx--contained-list__header");
    expect(header).toHaveClass("bx--layout--size-sm");
  });

  it("should render with inset rulers", () => {
    render(ContainedList, { props: { inset: true } });

    expect(screen.getByRole("list").closest("div")).toHaveClass(
      "bx--contained-list--inset-rulers",
    );
  });

  it("should associate label with list via aria-labelledby", () => {
    render(ContainedList);

    const label = screen.getByText("List title");
    const list = screen.getByRole("list");

    const labelId = label.getAttribute("id");
    expect(labelId).toBeTruthy();
    expect(list).toHaveAttribute("aria-labelledby", labelId);
  });

  it("should not set aria-labelledby when no label is provided", () => {
    render(ContainedList, { props: { labelText: "", showAction: true } });

    const list = screen.getByRole("list");
    expect(list).not.toHaveAttribute("aria-labelledby");
  });

  it("should render labelText prop", () => {
    render(ContainedList, {
      props: { labelText: "Custom Title" },
    });

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("should render labelChildren slot", () => {
    render(ContainedListLabelChildren);

    expect(screen.getByText("Custom Slot Label")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("should render action slot", () => {
    render(ContainedList, { props: { showAction: true } });

    const actionButton = screen.getByRole("button", { name: "Action" });
    expect(actionButton).toBeInTheDocument();
  });

  it("should render search in action slot", () => {
    render(ContainedList, { props: { showSearch: true } });

    const search = screen.getByRole("searchbox");
    expect(search).toBeInTheDocument();
  });

  it("should render search slot below the header", () => {
    const { container } = render(ContainedListSearch);

    const search = screen.getByRole("searchbox");
    expect(search).toBeInTheDocument();

    const searchRegion = container.querySelector(".bx--contained-list__search");
    expect(searchRegion).toBeInTheDocument();
    expect(searchRegion?.contains(search)).toBe(true);

    const list = screen.getByRole("list");
    expect(list.contains(search)).toBe(false);

    const header = container.querySelector(".bx--contained-list__header");
    expect(header?.nextElementSibling).toBe(searchRegion);
  });

  it("should render action and search slots together", () => {
    const { container } = render(ContainedListSearchAction);

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(
      container.querySelector(".bx--contained-list__action"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".bx--contained-list__search"),
    ).toBeInTheDocument();
  });

  it("should render list items", () => {
    render(ContainedList);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Item 1");
    expect(items[1]).toHaveTextContent("Item 2");
    expect(items[2]).toHaveTextContent("Item 3");
  });

  it("should render interactive list items as buttons", () => {
    render(ContainedList, { props: { interactive: true } });

    const items = screen.getAllByRole("listitem");
    const buttons = items.map((item) => item.querySelector("button"));

    for (const button of buttons) {
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bx--contained-list-item__content");
    }
  });

  it("should handle click events on interactive items", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContainedList, { props: { interactive: true } });

    const firstButton = screen
      .getAllByRole("listitem")[0]
      .querySelector("button");
    assert(firstButton);
    await user.click(firstButton);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should render disabled interactive items", () => {
    render(ContainedList, { props: { interactive: true, disabled: true } });

    const buttons = screen
      .getAllByRole("listitem")
      .map((item) => item.querySelector("button"));

    for (const button of buttons) {
      assert(button);
      expect(button).toBeDisabled();
    }
  });

  it("should render items with icons", () => {
    render(ContainedList, { props: { showIcon: true } });

    const items = screen.getAllByRole("listitem");
    for (const item of items) {
      expect(item).toHaveClass("bx--contained-list-item--with-icon");
      const iconContainer = item.querySelector(
        ".bx--contained-list-item__icon",
      );
      expect(iconContainer).toBeInTheDocument();
    }
  });

  it("should generate unique id when not provided", () => {
    render(ContainedList);

    const label = screen.getByText("List title");
    const id = label.getAttribute("id");
    expect(id).toMatch(/^label-ccs-/);
  });

  it("should use provided id", () => {
    render(ContainedList, { props: { id: "custom-id" } });

    const label = screen.getByText("List title");
    expect(label).toHaveAttribute("id", "label-custom-id");
  });

  it("should render items with action slot", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContainedListItemAction);

    const dismissButton = screen.getByRole("button", { name: "Dismiss" });
    expect(dismissButton).toBeInTheDocument();

    const item = screen.getByText("Item 1").closest("li");
    expect(item).toHaveClass("bx--contained-list-item--with-action");

    await user.click(dismissButton);
    expect(consoleLog).toHaveBeenCalledWith("action click");
  });

  it("should render href items as anchors with clickable styles", () => {
    render(ContainedListItemHref);

    const link = screen.getByRole("link", { name: "Documentation" });
    expect(link).toHaveAttribute("href", "/docs");
    expect(link).toHaveClass("bx--contained-list-item__content");
    expect(link.closest("li")).toHaveClass(
      "bx--contained-list-item--clickable",
    );
  });

  it("should prefer href over interactive and forward click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContainedListItemHref);

    const link = screen.getByRole("link", { name: "Prefer href" });
    expect(link.tagName).toBe("A");
    expect(
      screen.getByText("Prefer href").closest("li")?.querySelector("button"),
    ).toBeNull();

    await user.click(link);
    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should keep button and div when href is unset", () => {
    render(ContainedListItemHref);

    const interactiveItem = screen.getByText("Interactive").closest("li");
    assert(interactiveItem);
    expect(interactiveItem.querySelector("button")).toBeInTheDocument();
    expect(interactiveItem.querySelector("a")).toBeNull();

    const staticItem = screen.getByText("Static").closest("li");
    assert(staticItem);
    expect(
      staticItem.querySelector("div.bx--contained-list-item__content"),
    ).toBeInTheDocument();
    expect(staticItem.querySelector("button")).toBeNull();
    expect(staticItem.querySelector("a")).toBeNull();
    expect(staticItem).not.toHaveClass("bx--contained-list-item--clickable");
  });

  describe("ContainedListItem Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = ContainedListItemComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = ContainedListItemComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
