import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SearchRecent from "./SearchRecent.test.svelte";
import SearchRecentAction from "./SearchRecentAction.test.svelte";

describe("SearchRecent", () => {
  it("renders a button per query, newest first", () => {
    render(SearchRecent, { props: { queries: ["b", "a"] } });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("b");
    expect(buttons[1]).toHaveTextContent("a");
  });

  it("dispatches select with the clicked query", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SearchRecent, { props: { queries: ["b", "a"] } });

    await user.click(screen.getByRole("button", { name: "b" }));

    expect(consoleLog).toHaveBeenCalledWith("select", "b");
  });

  it("dispatches remove without dispatching select", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SearchRecent, {
      props: { queries: ["b", "a"], removable: true },
    });

    await user.click(screen.getByRole("button", { name: "Remove b" }));

    expect(consoleLog).toHaveBeenCalledWith("remove", "b");
    expect(consoleLog).not.toHaveBeenCalledWith("select", "b");
  });

  it("does not render a remove button unless removable is true", () => {
    render(SearchRecent, { props: { queries: ["b", "a"] } });

    expect(screen.queryByRole("button", { name: "Remove b" })).toBeNull();
  });

  it("renders nothing when queries is empty", () => {
    render(SearchRecent, { props: { queries: [] } });

    expect(screen.queryByRole("list")).toBeNull();
  });

  it("associates the label with the list via aria-labelledby", () => {
    render(SearchRecent, { props: { queries: ["b", "a"] } });

    const list = screen.getByRole("list");
    const label = screen.getByText("Recent searches");
    expect(list).toHaveAttribute("aria-labelledby", label.id);
  });

  it("hides the label visually when hideLabel is true", () => {
    render(SearchRecent, {
      props: { queries: ["b", "a"], hideLabel: true },
    });

    expect(screen.getByText("Recent searches")).toHaveClass(
      "bx--visually-hidden",
    );
  });

  it("does not render the header row when hideLabel is set and there is no action", () => {
    render(SearchRecent, {
      props: { queries: ["b", "a"], hideLabel: true },
    });

    expect(document.querySelector(".bx--search-recent__header")).toBeNull();
  });

  it("renders the action slot alongside the label", () => {
    render(SearchRecentAction, { props: { queries: ["b", "a"] } });

    expect(
      screen.getByRole("button", { name: "Clear all" }),
    ).toBeInTheDocument();
  });

  it("does not render the header when queries is empty", () => {
    render(SearchRecentAction, { props: { queries: [] } });

    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("still renders the header for the action when hideLabel hides the label", () => {
    render(SearchRecentAction, {
      props: { queries: ["b", "a"], hideLabel: true },
    });

    const header = document.querySelector(".bx--search-recent__header");
    expect(header).toHaveClass("bx--search-recent__header--action-only");
    expect(
      screen.getByRole("button", { name: "Clear all" }),
    ).toBeInTheDocument();
  });

  it("defaults to the inline variant", () => {
    render(SearchRecent, { props: { queries: ["b", "a"] } });

    expect(document.querySelector(".bx--search-recent__list")).toHaveClass(
      "bx--search-recent__list--inline",
    );
  });

  it("renders the list variant without the inline modifier", () => {
    render(SearchRecent, {
      props: { queries: ["b", "a"], variant: "list" },
    });

    expect(document.querySelector(".bx--search-recent__list")).not.toHaveClass(
      "bx--search-recent__list--inline",
    );
  });

  it("does not render an icon by default", () => {
    render(SearchRecent, { props: { queries: ["b", "a"] } });

    expect(document.querySelector(".bx--search-recent__item-icon")).toBeNull();
  });

  it("renders an icon per row when icon is set", () => {
    render(SearchRecent, { props: { queries: ["b", "a"], withIcon: true } });

    expect(
      document.querySelectorAll(".bx--search-recent__item-icon"),
    ).toHaveLength(2);
  });
});
