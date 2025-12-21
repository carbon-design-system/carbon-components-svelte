import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ContainedListLabelChildren from "./ContainedList.labelChildren.test.svelte";
import ContainedList from "./ContainedList.test.svelte";
import ContainedListItemAction from "./ContainedListItem.action.test.svelte";

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
});
