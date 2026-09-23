import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ContentSwitcherPanels from "./ContentSwitcher.panels.test.svelte";

/** Child registration flushes on a microtask (`batchStoreUpdates`). */
async function renderPanels(
  ...args: Parameters<typeof render>
): Promise<ReturnType<typeof render>> {
  const result = render(...args);
  await tick();
  await tick();
  return result;
}

function panel(id: string) {
  const element = document.getElementById(id);
  assert(element);
  return element;
}

describe("SwitchPanel", () => {
  it("links each switch and panel by position", async () => {
    await renderPanels(ContentSwitcherPanels);

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-controls", "one-panel");
    expect(tabs[1]).toHaveAttribute("aria-controls", "two-panel");

    expect(panel("one-panel")).toHaveAttribute("role", "tabpanel");
    expect(panel("one-panel")).toHaveAttribute("tabindex", "0");
    expect(panel("one-panel")).toHaveAttribute("aria-labelledby", "one-switch");
    expect(panel("two-panel")).toHaveAttribute("aria-labelledby", "two-switch");
    expect(panel("three-panel")).toHaveAttribute(
      "aria-labelledby",
      "three-switch",
    );
  });

  it("keeps an aria-controls passed to Switch", async () => {
    await renderPanels(ContentSwitcherPanels);

    expect(screen.getByRole("tab", { name: "Three" })).toHaveAttribute(
      "aria-controls",
      "custom-panel",
    );
  });

  it("shows only the selected switch's panel", async () => {
    await renderPanels(ContentSwitcherPanels);

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Content 1");
    expect(panel("two-panel")).not.toBeVisible();
    expect(panel("three-panel")).not.toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Two" }));

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Content 2");
    expect(panel("one-panel")).not.toBeVisible();
    expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
  });

  it("follows arrow-key selection", async () => {
    await renderPanels(ContentSwitcherPanels);

    await user.click(screen.getByRole("tab", { name: "One" }));
    await user.keyboard("{ArrowRight}");
    await tick();

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Content 2");
  });

  it("follows a selectedIndex set by the parent", async () => {
    const { rerender } = await renderPanels(ContentSwitcherPanels);

    await rerender({ selectedIndex: 2 });
    await tick();

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Content 3");
  });

  it("pairs panels in DOM order when one mounts late", async () => {
    const { rerender } = await renderPanels(ContentSwitcherPanels, {
      props: { showFirstPanel: false },
    });

    // Two panels for three switches: the first two switches get them.
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute(
      "aria-controls",
      "two-panel",
    );

    await rerender({ showFirstPanel: true });
    await tick();
    await tick();

    expect(panel("one-panel")).toHaveAttribute("aria-labelledby", "one-switch");
    expect(panel("two-panel")).toHaveAttribute("aria-labelledby", "two-switch");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Content 1");
  });

  it("mounts every panel's content by default", async () => {
    await renderPanels(ContentSwitcherPanels);

    expect(panel("two-panel")).toHaveTextContent("Content 2");
    expect(panel("three-panel")).toHaveTextContent("Content 3");
  });

  it("defers lazy content until its switch is first selected", async () => {
    await renderPanels(ContentSwitcherPanels, { props: { lazy: true } });

    expect(panel("one-panel")).toHaveTextContent("Content 1");
    expect(panel("two-panel")).toBeEmptyDOMElement();

    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(panel("two-panel")).toHaveTextContent("Content 2");

    await user.click(screen.getByRole("tab", { name: "One" }));
    expect(panel("two-panel")).toHaveTextContent("Content 2");
  });

  it("unmounts content on deselect with unmountOnHide", async () => {
    await renderPanels(ContentSwitcherPanels, {
      props: { unmountOnHide: true },
    });

    expect(panel("two-panel")).toBeEmptyDOMElement();

    await user.click(screen.getByRole("tab", { name: "Two" }));
    expect(panel("two-panel")).toHaveTextContent("Content 2");
    expect(panel("one-panel")).toBeEmptyDOMElement();
  });
});
