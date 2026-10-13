import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import TabsNavigation from "./TabsNavigation.test.svelte";

describe("Tabs navigation", () => {
  it("renders labelled navigation links instead of a tab list", async () => {
    render(TabsNavigation);
    await tick();

    const nav = screen.getByRole("navigation", { name: "Component" });
    expect(nav.querySelector("ul")).not.toHaveAttribute("role");
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const examples = screen.getByRole("link", { name: "Examples" });
    const api = screen.getByRole("link", { name: "API" });
    expect(examples).toHaveAttribute("href", "#examples");
    expect(examples).toHaveAttribute("aria-current", "page");
    expect(api).not.toHaveAttribute("aria-current");
    for (const link of [examples, api]) {
      expect(link).not.toHaveAttribute("aria-selected");
      expect(link).not.toHaveAttribute("tabindex");
    }
  });

  it("drops the href from a disabled link", async () => {
    render(TabsNavigation);
    await tick();

    const changelog = screen.getByText("Changelog").closest("a");
    expect(changelog).not.toHaveAttribute("href");
    expect(changelog).toHaveAttribute("aria-disabled", "true");
    expect(changelog).not.toHaveAttribute("tabindex");
  });

  it("follows the link on click and moves aria-current", async () => {
    render(TabsNavigation);
    await tick();

    const api = screen.getByRole("link", { name: "API" });
    expect(await fireEvent.click(api)).toBe(true);
    await tick();

    expect(api).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Examples" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("1");
  });

  it("leaves arrow keys and Space to the browser", async () => {
    render(TabsNavigation);
    await tick();

    const examples = screen.getByRole("link", { name: "Examples" });
    examples.focus();
    expect(await fireEvent.keyDown(examples, { key: "ArrowRight" })).toBe(true);
    expect(await fireEvent.keyDown(examples, { key: " " })).toBe(true);
    await tick();

    expect(examples).toHaveFocus();
    expect(screen.getByTestId("selected")).toHaveTextContent("0");
  });
});
