import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ContentSwitcher from "./ContentSwitcher.test.svelte";
import ContentSwitcherSize from "./ContentSwitcher.size.test.svelte";
import ContentSwitcherSelectedIndex from "./ContentSwitcher.selectedIndex.test.svelte";
import ContentSwitcherDisabled from "./ContentSwitcher.disabled.test.svelte";
import ContentSwitcherCustom from "./ContentSwitcher.custom.test.svelte";

describe("ContentSwitcher", () => {
  it("renders with default props", () => {
    render(ContentSwitcher);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("bx--content-switcher");
    expect(tablist).not.toHaveClass("bx--content-switcher--sm");
    expect(tablist).not.toHaveClass("bx--content-switcher--xl");

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);

    expect(tabs[0]).toHaveTextContent("Option 1");
    expect(tabs[1]).toHaveTextContent("Option 2");
    expect(tabs[2]).toHaveTextContent("Option 3");

    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");

    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");

    expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  });

  it("renders with different sizes", () => {
    render(ContentSwitcherSize);

    const tablists = screen.getAllByRole("tablist");
    expect(tablists).toHaveLength(2);

    expect(tablists[0]).toHaveClass("bx--content-switcher--sm");
    expect(tablists[0]).not.toHaveClass("bx--content-switcher--xl");

    expect(tablists[1]).toHaveClass("bx--content-switcher--xl");
    expect(tablists[1]).not.toHaveClass("bx--content-switcher--sm");

    const smallTabs = tablists[0].querySelectorAll('[role="tab"]');
    expect(smallTabs).toHaveLength(2);
    expect(smallTabs[0]).toHaveTextContent("Small 1");
    expect(smallTabs[1]).toHaveTextContent("Small 2");

    const xlTabs = tablists[1].querySelectorAll('[role="tab"]');
    expect(xlTabs).toHaveLength(2);
    expect(xlTabs[0]).toHaveTextContent("XL 1");
    expect(xlTabs[1]).toHaveTextContent("XL 2");
  });

  it("renders with selectedIndex prop", () => {
    render(ContentSwitcherSelectedIndex);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);

    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[0]).toHaveAttribute("tabindex", "-1");

    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("tabindex", "0");

    expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  });

  it("updates when selectedIndex changes", async () => {
    const { rerender } = render(ContentSwitcherSelectedIndex);

    let tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");

    await rerender({ selectedIndex: 2 });

    tabs = screen.getAllByRole("tab");
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(tabs[2]).toHaveAttribute("tabindex", "0");
  });

  it("handles click events", async () => {
    render(ContentSwitcher);

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

    await user.click(tabs[1]);
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");

    await user.click(tabs[2]);
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
  });

  it("handles keyboard navigation", async () => {
    render(ContentSwitcher);

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");

    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);

    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[1]);

    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[2]);

    await user.keyboard("{ArrowRight}");
    expect(tabs[2]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[0]);

    await user.keyboard("{ArrowLeft}");
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("respects disabled state", async () => {
    render(ContentSwitcherDisabled);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[1]).toHaveAttribute("disabled");

    await user.click(tabs[1]);
    expect(tabs[0]).toHaveClass("bx--content-switcher--selected");
    expect(tabs[1]).not.toHaveClass("bx--content-switcher--selected");

    await user.click(tabs[2]);
    expect(tabs[0]).not.toHaveClass("bx--content-switcher--selected");
    expect(tabs[2]).toHaveClass("bx--content-switcher--selected");
  });

  it("renders custom content", () => {
    render(ContentSwitcherCustom);

    const customContent = screen.getByTestId("custom-content");
    expect(customContent).toBeInTheDocument();
    expect(customContent).toHaveTextContent("Custom Content");

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[1]).toHaveTextContent("Regular Text");
  });
});
