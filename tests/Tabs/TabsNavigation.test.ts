import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import TabsNavigation from "./TabsNavigation.test.svelte";

/** `Tabs` and `TabsVertical` render navigation the same way. */
const variants = [
  { name: "Tabs", vertical: false, next: "ArrowRight" },
  { name: "TabsVertical", vertical: true, next: "ArrowDown" },
] as const;

describe.each(variants)("$name navigation", ({ vertical, next }) => {
  it("renders labelled navigation links instead of a tab list", async () => {
    render(TabsNavigation, { props: { vertical } });
    await tick();

    const nav = screen.getByRole("navigation", { name: "Component" });
    const list = nav.querySelector("ul");
    expect(list).not.toHaveAttribute("role");
    expect(list).not.toHaveAttribute("aria-orientation");
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const examples = screen.getByRole("link", { name: "Examples" });
    const api = screen.getByRole("link", { name: "Api" });
    expect(examples).toHaveAttribute("href", "#examples");
    expect(examples).toHaveAttribute("aria-current", "page");
    expect(api).not.toHaveAttribute("aria-current");
    for (const link of [examples, api]) {
      expect(link).not.toHaveAttribute("aria-selected");
      expect(link).not.toHaveAttribute("aria-controls");
      expect(link).not.toHaveAttribute("tabindex");
    }
  });

  it("drops the href from a disabled link", async () => {
    render(TabsNavigation, { props: { vertical } });
    await tick();

    const changelog = screen.getByText("Changelog").closest("a");
    expect(changelog).not.toHaveAttribute("href");
    expect(changelog).toHaveAttribute("aria-disabled", "true");
    expect(changelog).not.toHaveAttribute("tabindex");
  });

  it("follows the link on click and moves aria-current", async () => {
    render(TabsNavigation, { props: { vertical } });
    await tick();

    const api = screen.getByRole("link", { name: "Api" });
    expect(await fireEvent.click(api)).toBe(true);
    await tick();

    expect(api).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Examples" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByTestId("page")).toHaveTextContent("Page 1");
  });

  it("leaves arrow keys and Space to the browser", async () => {
    render(TabsNavigation, { props: { vertical } });
    await tick();

    const examples = screen.getByRole("link", { name: "Examples" });
    examples.focus();
    expect(await fireEvent.keyDown(examples, { key: next })).toBe(true);
    expect(await fireEvent.keyDown(examples, { key: " " })).toBe(true);
    await tick();

    expect(examples).toHaveFocus();
    expect(screen.getByTestId("page")).toHaveTextContent("Page 0");
  });

  it("keeps aria-current on the selected link after a keyed reorder", async () => {
    const { rerender } = render(TabsNavigation, { props: { vertical } });
    await tick();

    await rerender({ items: ["changelog", "api", "examples"] });
    await tick();

    expect(screen.getByRole("link", { name: "Examples" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("page")).toHaveTextContent("Page 2");
  });
});
