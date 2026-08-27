import { render, screen } from "@testing-library/svelte";
import { stubPerOptionResizeObserver } from "../utils/stubPerOptionResizeObserver";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.test.svelte";
import MeasuredComboBox from "./ComboBoxMeasured.test.svelte";

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
 * measured, and this component's own filtered collection is one the menu
 * window can still recognise. The wrapping itself, and the highlight markup
 * surviving a line break, are asserted in e2e/reflow.test.ts.
 */

// The suite's ResizeObserver stub reports 100px for every element it observes,
// so a measured list renders 100px rows against a 40px assumption. A scroll
// height built from 100 rather than 40 is one built from measured heights.
const MEASURED_HEIGHT = 100;
const WINDOWED_COUNT = 120;
const UNWINDOWED_COUNT = 10;

const ITEM_HEIGHT = 40;
const windowed = {
  threshold: 1,
  itemHeight: ITEM_HEIGHT,
  containerHeight: 200,
};

function makeItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    text: `Item ${index + 1}`,
    price: index,
  }));
}

/**
 * Ten options, half tagged `Alpha` and half `Beta`, each one of three heights.
 *
 * The tags and the heights are deliberately out of step: the `Alpha` options
 * add up to 300 while the average of the whole list over five options is 280,
 * so a filtered total taken from the estimate is a different number from one
 * taken from the heights the surviving options were measured at.
 */
const unevenItems = Array.from({ length: 10 }, (_, index) => ({
  id: String(index),
  text: `${index % 2 === 0 ? "Alpha" : "Beta"} ${index + 1}`,
  height: 40 + 20 * (index % 3),
}));
const ALPHA_HEIGHT = unevenItems
  .filter((item) => item.text.startsWith("Alpha"))
  .reduce((total, item) => total + item.height, 0);

/**
 * Options are only measured once they render, so an overscan wide enough to
 * render the list whole is what lets a total be asserted exactly.
 */
const unevenWindowed = { ...windowed, overscan: unevenItems.length };

function field() {
  return screen.getByRole("combobox");
}

function menu() {
  return screen.getByRole("listbox");
}

function menuScrollSpacer() {
  return menu().querySelector<HTMLElement>(":scope > div");
}

/**
 * Measurement arrives in batches, each one sharpening the offsets, so the
 * length is polled rather than read.
 */
function expectScrollHeight(pixels: number) {
  return expect
    .poll(() => menuScrollSpacer()?.style.height)
    .toBe(`${pixels}px`);
}

describe("ComboBox menu window wiring", () => {
  it("marks the menu so the option wrap styles reach its options", async () => {
    render(ComboBox, {
      props: { items: makeItems(UNWINDOWED_COUNT), wrapOptions: true },
    });

    await user.click(field());

    expect(menu()).toHaveClass("bx--list-box__menu--wrap-options");
  });

  it("marks a portaled menu, which a class on the component root could not reach", async () => {
    render(ComboBox, {
      props: {
        items: makeItems(UNWINDOWED_COUNT),
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
    render(ComboBox, { props: { items: makeItems(UNWINDOWED_COUNT) } });

    await user.click(field());

    expect(menu()).not.toHaveClass("bx--list-box__menu--wrap-options");
    expect(screen.getAllByRole("option")[0]).not.toHaveAttribute(
      "data-virtual-index",
    );
  });

  it("puts a list it windows itself on the measured path under the prop", async () => {
    render(ComboBox, {
      props: { items: makeItems(WINDOWED_COUNT), wrapOptions: true },
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
    const { unmount } = render(ComboBox, {
      props: { items, virtualize: windowed, wrapOptions: true },
    });

    await user.click(field());
    const measuredOptions = screen.getAllByRole("option");
    expect(measuredOptions[0]).toHaveAttribute("data-virtual-index", "0");
    expect(measuredOptions[1]).toHaveAttribute("data-virtual-index", "1");
    unmount();

    render(ComboBox, {
      props: { items, virtualize: windowed },
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
    render(ComboBox, {
      props: {
        items: makeItems(UNWINDOWED_COUNT),
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

    it("hands the menu window a filtered collection it still recognises", async () => {
      render(MeasuredComboBox, {
        props: {
          items: unevenItems,
          virtualize: unevenWindowed,
          wrapOptions: true,
        },
      });

      await user.click(field());
      await user.type(field(), "Alpha");

      // This component needs no identity key: filtering keeps the consumer's
      // own option objects, so the heights measured before the keystroke still
      // describe the options that survived it. The total is the matches'
      // measured heights, not five options at the list's average.
      await expectScrollHeight(ALPHA_HEIGHT);
      expect(screen.getAllByRole("option")).toHaveLength(5);
    });

    it("never measures a hidden option, since the hide filter mode yields to windowing", async () => {
      render(MeasuredComboBox, {
        props: {
          items: unevenItems,
          virtualize: unevenWindowed,
          wrapOptions: true,
          filterMode: "hide" as const,
        },
      });

      await user.click(field());
      await user.type(field(), "Alpha");

      // `filterMode="hide"` falls back to `"remove"` whenever virtualization is
      // on, so a non-matching option is unmounted rather than left hidden at a
      // height that is not the one it would render at.
      await expectScrollHeight(ALPHA_HEIGHT);
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(5);
      for (const option of options) {
        expect(option).not.toHaveAttribute("hidden");
      }
    });
  });
});
