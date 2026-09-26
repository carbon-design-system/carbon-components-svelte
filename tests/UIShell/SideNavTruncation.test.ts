import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import SideNavTruncation from "./SideNavTruncation.test.svelte";

const TEXT = "A very long label that should be truncated";

function mockSize(node: Element, offsetWidth: number, scrollWidth: number) {
  Object.defineProperty(node, "offsetWidth", {
    configurable: true,
    value: offsetWidth,
  });
  Object.defineProperty(node, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
}

const rows = [
  {
    name: "SideNavLink",
    testId: "link",
    triggerSelector: "a",
    textSelector: ".bx--side-nav__link-text",
  },
  {
    name: "SideNavMenuItem",
    testId: "menu-item",
    triggerSelector: "a",
    textSelector: ".bx--side-nav__link-text",
  },
  {
    name: "SideNavMenu",
    testId: "menu",
    triggerSelector: "button",
    textSelector: ".bx--side-nav__submenu-title",
  },
] as const;

function getRow(container: HTMLElement, testId: string) {
  const root = container.querySelector(`[data-testid="${testId}"]`);
  assert(root);
  return root;
}

describe("SideNav truncated label title", () => {
  it.each(rows)(
    "$name: sets title to the full text once the label is truncated and hovered",
    async ({ testId, triggerSelector, textSelector }) => {
      const { container } = render(SideNavTruncation, { text: TEXT });
      const root = getRow(container, testId);
      const textEl = root.querySelector(textSelector);
      assert(textEl);
      mockSize(textEl, 10, 100);

      const trigger = root.querySelector(triggerSelector);
      assert(trigger);
      expect(trigger.hasAttribute("title")).toBe(false);

      await user.hover(trigger);
      expect(trigger.getAttribute("title")).toBe(TEXT);
    },
  );

  it.each(rows)(
    "$name: has no title once hovered when the label fits",
    async ({ testId, triggerSelector, textSelector }) => {
      const { container } = render(SideNavTruncation, { text: TEXT });
      const root = getRow(container, testId);
      const textEl = root.querySelector(textSelector);
      assert(textEl);
      mockSize(textEl, 100, 100);

      const trigger = root.querySelector(triggerSelector);
      assert(trigger);

      await user.hover(trigger);
      expect(trigger.hasAttribute("title")).toBe(false);
    },
  );

  it.each(rows)(
    "$name: a consumer title wins even when the label is truncated",
    async ({ testId, triggerSelector, textSelector }) => {
      const { container } = render(SideNavTruncation, {
        text: TEXT,
        title: "Custom title",
      });
      const root = getRow(container, testId);
      const textEl = root.querySelector(textSelector);
      assert(textEl);
      mockSize(textEl, 10, 100);

      const trigger = root.querySelector(triggerSelector);
      assert(trigger);
      expect(trigger.getAttribute("title")).toBe("Custom title");

      await user.hover(trigger);
      expect(trigger.getAttribute("title")).toBe("Custom title");
    },
  );
});
