import { render, screen, waitFor } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { stubPerOptionResizeObserver } from "../utils/stub-per-option-resize-observer";
import { user } from "../utils/user";
import MeasuredMultiSelect from "./MultiSelectMeasured.test.svelte";

/**
 * The menu window wiring every list box shares is in
 * tests/ListBox/family/menu-window-wiring.test.ts. What is left here is that
 * the identity key this component supplies is the one its collection needs,
 * every check rebuilding those options. The checkbox staying with the first
 * line of its label, and the select-all separator surviving, are asserted in
 * e2e/reflow.test.ts.
 */

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
const partlyWindowed = {
  threshold: 1,
  itemHeight: 40,
  containerHeight: 200,
  overscan: 1,
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

/** The spacer's height is the menu's whole scrollable length. */
function menuScrollHeight() {
  return menuScrollSpacer()?.style.height;
}

/**
 * Animation frames this suite runs itself. The height measurer reports each
 * batch on a frame, and each batch can render options the last one did not
 * cover, so offsets settle over a chain of frames. Driving them by hand makes
 * "settled" mean no frame is pending, however slow the machine.
 */
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 1;

function stubAnimationFrames() {
  frames.clear();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
}

/** Run frames until measurement stops asking for one. */
async function settleMeasurement() {
  for (let pass = 0; pass < 50; pass++) {
    // biome-ignore lint/performance/noAwaitInLoops: each frame's render must land before the next is judged
    await flushMacrotask();
    if (frames.size === 0) return;
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(performance.now());
  }
  throw new Error("Measurement kept asking for frames");
}

/** Option text in rendered order, trimmed of any surrounding whitespace. */
function optionTexts() {
  return screen
    .queryAllByRole("option")
    .map((option) => option.textContent?.trim() ?? "");
}

describe("MultiSelect menu window: the collection it measures", () => {
  beforeEach(() => {
    stubPerOptionResizeObserver();
    stubAnimationFrames();
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
    await settleMeasurement();

    // Just past the tall select-all row, which is an option of this
    // collection like any other and was measured as one: a list that had
    // assumed a height for it would be showing something else here.
    const scroller = menu();
    scroller.scrollTop = UNEVEN_TALL;
    scroller.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(optionTexts()[1]).toBe("Item 1");
    });
    await settleMeasurement();
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
    await settleMeasurement();
    expect(optionTexts()).toEqual(settled.texts);
    expect(menuScrollHeight()).toBe(settled.scrollHeight);
    expect(scroller.scrollTop).toBe(settled.scrollTop);
  });
});
