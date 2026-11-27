import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import BreadcrumbOverflow from "./BreadcrumbOverflow.test.svelte";

/** jsdom has no layout: give the list and each item a width. */
function stubWidths(container: HTMLElement, list: number, item: number) {
  const ol = container.querySelector("ol");
  expect.assert(ol instanceof HTMLElement);
  Object.defineProperty(ol, "clientWidth", { configurable: true, value: list });
  for (const li of ol.children) {
    Object.defineProperty(li, "offsetWidth", {
      configurable: true,
      value: item,
    });
  }
}

const shownLabels = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll(
      "ol > li:not(.bx--breadcrumb-item--hidden):not(.bx--breadcrumb-item--overflow)",
    ),
  ).map((li) => li.textContent?.trim());

describe('Breadcrumb overflow="menu"', () => {
  it("hides the middle items that don't fit, keeping the first and last", async () => {
    const { container } = render(BreadcrumbOverflow);
    stubWidths(container, 160, 50);

    await waitFor(() => {
      expect(shownLabels(container)).toEqual(["Home", "Level 3", "Current"]);
    });

    // The menu button follows the first item, so focus order matches the
    // visual order.
    const items = container.querySelectorAll("ol > li");
    expect(items[1]).toHaveClass("bx--breadcrumb-item--overflow");
  });

  it("lists the hidden items with their links and aria-current", async () => {
    const { container } = render(BreadcrumbOverflow);
    stubWidths(container, 160, 50);

    // The menu button renders before the measurement that settles which
    // items it holds, so wait for that one.
    await waitFor(() => {
      expect(shownLabels(container)).toEqual(["Home", "Level 3", "Current"]);
    });
    await user.click(
      await screen.findByRole("button", {
        name: "Show hidden breadcrumb items",
      }),
    );

    const level1 = screen.getByRole("menuitem", { name: "Level 1" });
    expect(level1).toHaveAttribute("href", "/a");
    expect(level1).not.toHaveAttribute("aria-current");
    const level2 = screen.getByRole("menuitem", { name: "Level 2" });
    expect(level2).toHaveAttribute("href", "/a/b");
    expect(level2).toHaveAttribute("aria-current", "location");
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });

  it("hides nothing with the default overflow", async () => {
    const { container } = render(BreadcrumbOverflow, {
      props: { overflow: "wrap" },
    });
    stubWidths(container, 160, 50);

    await new Promise(requestAnimationFrame);
    expect(
      container.querySelector(
        ".bx--breadcrumb-item--hidden, .bx--breadcrumb-item--overflow",
      ),
    ).not.toBeInTheDocument();
  });
});
