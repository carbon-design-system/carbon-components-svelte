import { screen } from "@testing-library/svelte";
import { createItems } from "../../utils/create-items";
import { user } from "../../utils/user";
import { caseRows, field, renderCase } from "./cases";

/**
 * Offsets across the windowing threshold, both scroll alignments, the identity
 * of the options a height was measured on, wrapping being the only thing that
 * turns measuring on, and what a close forgets are all asserted against
 * `createMenuWindow` in tests/ListBox/menu-window.test.ts. What is left here is
 * that each component is connected to it: the wrapping prop reaches the menu,
 * and options are stamped for measurement only when heights are being
 * measured. The wrapping itself is unobservable in jsdom, which has no layout
 * engine, so it is asserted in e2e/reflow.test.ts. Each component's own
 * collection checks stay in its `*MenuWindow.test.ts`.
 */

// The suite's ResizeObserver stub reports 100px for every element it observes,
// so a measured list renders 100px rows against a 40px assumption. A scroll
// height built from 100 rather than 40 is one built from measured heights.
const MEASURED_HEIGHT = 100;
const WINDOWED_COUNT = 120;
const UNWINDOWED_COUNT = 10;

const windowed = { threshold: 1, itemHeight: 40, containerHeight: 200 };

function menu() {
  return screen.getByRole("listbox");
}

describe.each(caseRows)("%s menu window wiring", (_, c) => {
  const open = async (fields: Record<string, unknown>) => {
    const result = renderCase(c, fields);
    await user.click(field());
    return result;
  };

  it("marks the menu so the option wrap styles reach its options", async () => {
    await open({ items: createItems(UNWINDOWED_COUNT), wrapOptions: true });

    expect(menu()).toHaveClass("bx--list-box__menu--wrap-options");
  });

  it("marks a portaled menu, which a class on the component root could not reach", async () => {
    await open({
      items: createItems(UNWINDOWED_COUNT),
      wrapOptions: true,
      portalMenu: true,
    });

    const portaled = menu();
    expect(portaled.closest("[data-floating-portal]")).toBeInTheDocument();
    expect(portaled).toHaveClass("bx--list-box__menu--wrap-options");
  });

  it("renders the menu as it does today when the prop is not set", async () => {
    await open({ items: createItems(UNWINDOWED_COUNT) });

    expect(menu()).not.toHaveClass("bx--list-box__menu--wrap-options");
    expect(screen.getAllByRole("option")[0]).not.toHaveAttribute(
      "data-virtual-index",
    );
  });

  it("puts a list it windows itself on the measured path under the prop", async () => {
    await open({ items: createItems(WINDOWED_COUNT), wrapOptions: true });

    // The prop reaches the menu window, not just the stylesheet: the offsets
    // are built from what the options measured rather than from the seed.
    await expect
      .poll(
        () => menu().querySelector<HTMLElement>(":scope > div")?.style.height,
      )
      .toBe(`${WINDOWED_COUNT * MEASURED_HEIGHT}px`);
  });

  it("marks options with their item index only when wrapping measures them", async () => {
    const items = createItems(UNWINDOWED_COUNT);
    const { unmount } = await open({
      items,
      virtualize: windowed,
      wrapOptions: true,
    });

    const measuredOptions = screen.getAllByRole("option");
    expect(measuredOptions[0]).toHaveAttribute("data-virtual-index", "0");
    expect(measuredOptions[1]).toHaveAttribute("data-virtual-index", "1");
    unmount();

    await open({ items, virtualize: windowed });

    expect(screen.getAllByRole("option")[0]).not.toHaveAttribute(
      "data-virtual-index",
    );
  });

  // A `virtualize` object resolves a config below the threshold too, so the
  // menu scrolls within `containerHeight` while rendering whole. Bringing an
  // option into view there is the one path that reads the DOM back, by this
  // attribute, so leaving those options unstamped strands the keyboard
  // highlight off screen.
  it("marks options of a measured list too short to window", async () => {
    await open({
      items: createItems(UNWINDOWED_COUNT),
      virtualize: { ...windowed, threshold: UNWINDOWED_COUNT + 1 },
      wrapOptions: true,
    });

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(UNWINDOWED_COUNT);
    expect(options[0]).toHaveAttribute("data-virtual-index", "0");
    expect(options.at(-1)).toHaveAttribute(
      "data-virtual-index",
      String(UNWINDOWED_COUNT - 1),
    );
  });
});
