import { render, screen } from "@testing-library/svelte";
import { stubPerOptionResizeObserver } from "../utils/stub-per-option-resize-observer";
import { user } from "../utils/user";
import MeasuredComboBox from "./ComboBoxMeasured.test.svelte";

/**
 * The menu window wiring every list box shares is in
 * tests/ListBox/family/menu-window-wiring.test.ts. What is left here is that
 * this component's own filtered collection is one the menu window can still
 * recognise.
 */

/**
 * Ten options, half tagged `Alpha` and half `Beta`, each one of three heights.
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
const unevenWindowed = {
  threshold: 1,
  itemHeight: 40,
  containerHeight: 200,
  overscan: unevenItems.length,
};

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

describe("ComboBox menu window: the collection it measures", () => {
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
