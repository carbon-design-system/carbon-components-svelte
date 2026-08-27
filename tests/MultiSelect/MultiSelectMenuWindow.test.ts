import { render, screen, waitFor } from "@testing-library/svelte";
import { stubPerOptionResizeObserver } from "../utils/stubPerOptionResizeObserver";
import { user } from "../utils/user";
import MultiSelect from "./MultiSelect.test.svelte";
import MeasuredMultiSelect from "./MultiSelectMeasured.test.svelte";

/**
 * What is left of this component's measured-menu coverage once the behaviour
 * lives in one place.
 *
 * Offsets across the windowing threshold, both scroll alignments, the identity
 * of the options a height was measured on, wrapping being the only thing that
 * turns measuring on, and what a close forgets are all asserted against
 * `createMenuWindow` in tests/ListBox/menuWindow.test.ts. What is left
 * here is that this component is connected to it: the wrapping prop reaches
 * the menu, options are stamped for measurement only when heights are being
 * measured, and the identity key it supplies is the one its collection needs,
 * every check rebuilding those options. The wrapping itself, the checkbox
 * staying with the first line of its label, and the select-all separator
 * surviving are asserted in e2e/reflow.test.ts.
 */

// The suite's ResizeObserver stub reports 100px for every element it observes,
// so a measured list renders 100px rows against a 40px assumption. A scroll
// height built from 100 rather than 40 is one built from measured heights.
const MEASURED_HEIGHT = 100;
const WINDOWED_COUNT = 120;
const UNWINDOWED_COUNT = 10;

const ITEM_HEIGHT = 40;
const CONTAINER_HEIGHT = 200;
const windowed = {
  threshold: 1,
  itemHeight: ITEM_HEIGHT,
  containerHeight: CONTAINER_HEIGHT,
};

function makeItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    text: `Item ${index + 1}`,
  }));
}

/**
 * A list whose select-all row is far taller than every other option, so a
 * scroll position just past it lands somewhere no single assumed height would
 * have put it. What is on screen there is evidence about the offsets
 * themselves, which a total taken over the same heights would not be.
 */
const UNEVEN_TALL = 400;
const UNEVEN_SHORT = 40;
const unevenItems = [
  { id: "all", text: "Select all", height: UNEVEN_TALL, isSelectAll: true },
  ...Array.from({ length: 10 }, (_, index) => ({
    id: String(index),
    text: `Item ${index + 1}`,
    height: UNEVEN_SHORT,
  })),
];

/**
 * Narrow enough that only the options on screen are ever measured, wide enough
 * that the select-all row stays rendered from a scroll position below it.
 */
const partlyWindowed = { ...windowed, overscan: 1 };

function field() {
  return screen.getByRole("combobox");
}

function menu() {
  return screen.getByRole("listbox");
}

function menuScrollSpacer() {
  return menu().querySelector<HTMLElement>(":scope > div");
}

/** The spacer's height is the menu's whole scrollable length. */
function menuScrollHeight() {
  return menuScrollSpacer()?.style.height;
}

/**
 * Wait until the menu's length stops moving. Measurement arrives in batches
 * and each batch can sharpen the offsets, so a reading taken on the first one
 * is not yet the settled one.
 */
async function waitForSettledOffsets() {
  let previous: string | undefined;
  await waitFor(() => {
    const current = menuScrollHeight();
    const settled = current !== undefined && current === previous;
    previous = current;
    expect(settled).toBe(true);
  });
}

/** Option text in rendered order, trimmed of any surrounding whitespace. */
function optionTexts() {
  return screen
    .queryAllByRole("option")
    .map((option) => option.textContent?.trim() ?? "");
}

describe("MultiSelect menu window wiring", () => {
  it("marks the menu so the option wrap styles reach its options", async () => {
    render(MultiSelect, {
      props: {
        items: makeItems(UNWINDOWED_COUNT),
        labelText: "Items",
        wrapOptions: true,
      },
    });

    await user.click(field());

    expect(menu()).toHaveClass("bx--list-box__menu--wrap-options");
  });

  it("marks a portaled menu, which a class on the component root could not reach", async () => {
    render(MultiSelect, {
      props: {
        items: makeItems(UNWINDOWED_COUNT),
        labelText: "Items",
        wrapOptions: true,
        portalMenu: true,
      },
    });

    await user.click(field());

    const portaled = menu();
    expect(portaled.closest("[data-floating-portal]")).toBeInTheDocument();
    expect(portaled).toHaveClass("bx--list-box__menu--wrap-options");
  });

  it("renders the menu as it does today when the prop is not set", async () => {
    render(MultiSelect, {
      props: { items: makeItems(UNWINDOWED_COUNT), labelText: "Items" },
    });

    await user.click(field());

    expect(menu()).not.toHaveClass("bx--list-box__menu--wrap-options");
    expect(screen.getAllByRole("option")[0]).not.toHaveAttribute(
      "data-virtual-index",
    );
  });

  it("puts a list it windows itself on the measured path under the prop", async () => {
    render(MultiSelect, {
      props: {
        items: makeItems(WINDOWED_COUNT),
        labelText: "Items",
        wrapOptions: true,
      },
    });

    await user.click(field());

    // The prop reaches the menu window, not just the stylesheet: the offsets
    // are built from what the options measured rather than from the seed.
    await expect
      .poll(() => menuScrollSpacer()?.style.height)
      .toBe(`${WINDOWED_COUNT * MEASURED_HEIGHT}px`);
  });

  it("marks options with their item index only when wrapping measures them", async () => {
    const items = makeItems(UNWINDOWED_COUNT);
    const { unmount } = render(MultiSelect, {
      props: {
        items,
        labelText: "Items",
        virtualize: windowed,
        wrapOptions: true,
      },
    });

    await user.click(field());
    const measuredOptions = screen.getAllByRole("option");
    expect(measuredOptions[0]).toHaveAttribute("data-virtual-index", "0");
    expect(measuredOptions[1]).toHaveAttribute("data-virtual-index", "1");
    unmount();

    render(MultiSelect, {
      props: {
        items,
        labelText: "Items",
        virtualize: windowed,
      },
    });
    await user.click(field());

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
    render(MultiSelect, {
      props: {
        items: makeItems(UNWINDOWED_COUNT),
        labelText: "Items",
        virtualize: { ...windowed, threshold: UNWINDOWED_COUNT + 1 },
        wrapOptions: true,
      },
    });

    await user.click(field());

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(UNWINDOWED_COUNT);
    expect(options[0]).toHaveAttribute("data-virtual-index", "0");
    expect(options.at(-1)).toHaveAttribute(
      "data-virtual-index",
      String(UNWINDOWED_COUNT - 1),
    );
  });

  describe("the collection the menu window measures", () => {
    beforeEach(() => {
      stubPerOptionResizeObserver();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("supplies the identity key its rebuilt collection needs", async () => {
      render(MeasuredMultiSelect, {
        props: {
          items: unevenItems,
          virtualize: partlyWindowed,
          wrapOptions: true,
        },
      });

      await user.click(field());
      await waitFor(() => {
        expect(optionTexts().length).toBeGreaterThan(1);
      });
      // Before scrolling, not only before reading: a position is only "past
      // the select-all row" once the row has been measured, and a batch is
      // reported on the frame after the observer sees it. Scrolling against
      // the seed instead would land somewhere else and be held there, the
      // correction's job being to keep whatever is on screen on screen.
      await waitForSettledOffsets();

      // Just past the tall select-all row, which is an option of this
      // collection like any other and was measured as one: a list that had
      // assumed a height for it would be showing something else here.
      const scroller = menu();
      scroller.scrollTop = UNEVEN_TALL;
      scroller.dispatchEvent(new Event("scroll"));
      await waitFor(() => {
        expect(optionTexts()[1]).toBe("Item 1");
      });
      await waitForSettledOffsets();
      const settled = {
        scrollHeight: menuScrollHeight(),
        scrollTop: scroller.scrollTop,
        texts: optionTexts(),
      };
      expect(settled.texts[0]).toBe("Select all");

      // Select-all rebuilds every option in the list at once, which is the
      // sharpest version of the question the key answers: a re-check is not a
      // re-order, no matter how much of the collection it replaces. The ids
      // stayed put, so the heights still describe the options they were
      // measured on and the reader is left looking at the same options in the
      // same places.
      await user.click(screen.getByText("Select all"));

      await waitFor(() => {
        expect(screen.getByLabelText("Item 1")).toBeChecked();
      });
      await waitForSettledOffsets();
      expect(optionTexts()).toEqual(settled.texts);
      expect(menuScrollHeight()).toBe(settled.scrollHeight);
      expect(scroller.scrollTop).toBe(settled.scrollTop);
    });
  });
});
