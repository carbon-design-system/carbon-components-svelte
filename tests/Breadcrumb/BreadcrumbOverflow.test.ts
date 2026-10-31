import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import BreadcrumbOverflowFixture from "./BreadcrumbOverflow.test.svelte";

/** Stub `offsetWidth` on an element (jsdom has no real layout). */
function stubWidth(el: Element, width: number) {
  Object.defineProperty(el, "offsetWidth", {
    configurable: true,
    value: width,
  });
}

/**
 * Give the `<ol>` a fixed `availableWidth` and every breadcrumb item
 * (including the overflow trigger, which is also a `.bx--breadcrumb-item`)
 * a fixed width, so the next ResizeObserver -> rafThrottle pass recomputes
 * which items overflow.
 */
function stubMeasurements(
  container: HTMLElement,
  availableWidth: number,
  itemWidth: number,
) {
  const list = container.querySelector(".bx--breadcrumb");
  expect.assert(list instanceof HTMLElement);
  stubWidth(list, availableWidth);

  const items = Array.from(container.querySelectorAll(".bx--breadcrumb-item"));
  for (const el of items) stubWidth(el, itemWidth);
}

/** Labels of items actually shown (not pulled out via `data-overflow`, and not the trigger itself). */
function visibleItemLabels(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll(
      '.bx--breadcrumb-item:not([data-overflow="true"]):not(.bx--breadcrumb-item--overflow)',
    ),
  ).map((el) => el.textContent?.trim() ?? "");
}

describe("Breadcrumb overflow", () => {
  it("renders every item and an empty overflow trigger when everything fits", () => {
    const { container } = render(BreadcrumbOverflowFixture);

    expect(visibleItemLabels(container)).toEqual([
      "Home",
      "Level 1",
      "Level 2",
      "Level 3",
      "Current",
    ]);
    expect(
      container.querySelector(".bx--breadcrumb-item--overflow-empty"),
    ).not.toBeNull();
  });

  it("collapses the middle items into an overflow menu once they no longer fit, keeping the first and last items", async () => {
    const { container } = render(BreadcrumbOverflowFixture);

    stubMeasurements(container, 140, 50);

    await waitFor(() => {
      expect(container.querySelector('[data-overflow="true"]')).not.toBeNull();
    });

    expect(visibleItemLabels(container)).toEqual(["Home", "Current"]);
    expect(
      container.querySelector(".bx--breadcrumb-item--overflow-empty"),
    ).toBeNull();

    const hidden = container.querySelectorAll('[data-overflow="true"]');
    expect(Array.from(hidden).map((el) => el.textContent?.trim())).toEqual([
      "Level 1",
      "Level 2",
      "Level 3",
    ]);
  });

  it("lists the hidden items in the overflow menu with their original hrefs", async () => {
    const { container } = render(BreadcrumbOverflowFixture);

    stubMeasurements(container, 140, 50);
    await waitFor(() => {
      expect(container.querySelector('[data-overflow="true"]')).not.toBeNull();
    });

    await user.click(screen.getByRole("button"));

    const level1 = screen.getByRole("menuitem", { name: "Level 1" });
    expect(level1).toHaveAttribute("href", "/level-1");

    const level2 = screen.getByRole("menuitem", { name: "Level 2" });
    expect(level2).toHaveAttribute("href", "/level-1/level-2");

    const level3 = screen.getByRole("menuitem", { name: "Level 3" });
    expect(level3).toHaveAttribute("href", "/level-1/level-2/level-3");

    expect(
      screen.queryByRole("menuitem", { name: "Home" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Current" }),
    ).not.toBeInTheDocument();
  });
});
