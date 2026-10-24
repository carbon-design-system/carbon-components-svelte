import {
  closeOverControls,
  findCoveredControl,
} from "../../src/utils/tooltip-cover.js";

/** Hit-test stack `document.elementsFromPoint` returns, topmost first. */
let stack: Element[] = [];
const elementsFromPoint = vi.fn(() => stack);

beforeEach(() => {
  Object.defineProperty(document, "elementsFromPoint", {
    configurable: true,
    value: elementsFromPoint,
  });
});

afterEach(() => {
  // biome-ignore lint/performance/noDelete: restore jsdom's document
  delete (document as { elementsFromPoint?: unknown }).elementsFromPoint;
  elementsFromPoint.mockClear();
  document.body.innerHTML = "";
  stack = [];
});

/**
 * A row of icon buttons. Delete's inline tooltip opens to the right, over
 * Save, as in a toolbar of ghost buttons.
 */
function row() {
  document.body.innerHTML = `
    <div class="row">
      <button class="delete">
        <span class="bx--assistive-text">Delete</span>
        <svg class="delete-icon"></svg>
      </button>
      <button class="save"><svg class="save-icon"></svg></button>
      <span class="label">Draft</span>
      <button class="publish" disabled>Publish</button>
    </div>
    <div class="portal">
      <div class="bx--tooltip-portal">
        <span class="bx--tooltip-portal__caret"></span>
        <span class="bx--assistive-text">Duplicate</span>
      </div>
    </div>
  `;
  const $ = (selector: string) => {
    const element = document.querySelector(selector);
    assert(element);
    return element as HTMLElement;
  };
  return {
    row: $(".row"),
    delete: $(".delete"),
    deleteIcon: $(".delete-icon"),
    tooltip: $(".delete .bx--assistive-text"),
    save: $(".save"),
    saveIcon: $(".save-icon"),
    label: $(".label"),
    publish: $(".publish"),
    portal: $(".portal"),
    portalTooltip: $(".bx--tooltip-portal"),
    portalText: $(".bx--tooltip-portal .bx--assistive-text"),
    portalCaret: $(".bx--tooltip-portal__caret"),
  };
}

describe("findCoveredControl", () => {
  test("finds the control under an inline tooltip", () => {
    const el = row();
    stack = [
      el.tooltip,
      el.delete,
      el.saveIcon,
      el.save,
      el.row,
      document.body,
    ];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBe(el.save);
  });

  test("skips the trigger that holds an inline tooltip", () => {
    const el = row();
    // The trigger is listed above the neighbor, as an ancestor of the hit.
    stack = [el.tooltip, el.delete, el.save, el.row];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBe(el.save);
  });

  test("finds nothing over plain content", () => {
    const el = row();
    stack = [el.tooltip, el.delete, el.label, el.row, document.body];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBeNull();
  });

  test("finds nothing over the page background", () => {
    const el = row();
    stack = [el.tooltip, el.delete, el.row, document.body];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBeNull();
  });

  test("ignores a disabled control", () => {
    const el = row();
    stack = [el.tooltip, el.delete, el.publish, el.row];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBeNull();
  });

  test("ignores a control that holds the tooltip", () => {
    const el = row();
    const tile = document.createElement("a");
    tile.href = "#service";
    el.row.before(tile);
    tile.append(el.row);
    stack = [el.tooltip, el.delete, el.label, el.row, tile];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBeNull();
  });

  test("finds the control under a portalled tooltip", () => {
    const el = row();
    stack = [el.portalText, el.portalTooltip, el.portal, el.save, el.row];
    expect(findCoveredControl(el.portalText, 10, 10, el.delete)).toBe(el.save);
  });

  test("ignores the trigger under its portalled tooltip", () => {
    const el = row();
    stack = [el.portalCaret, el.portalTooltip, el.deleteIcon, el.delete];
    expect(findCoveredControl(el.portalTooltip, 10, 10, el.delete)).toBeNull();
  });

  test("ignores a control that holds the trigger of a portalled tooltip", () => {
    const el = row();
    const tile = document.createElement("div");
    tile.setAttribute("role", "button");
    tile.tabIndex = 0;
    el.row.before(tile);
    tile.append(el.row);
    stack = [el.portalText, el.portalTooltip, el.label, el.row, tile];
    expect(findCoveredControl(el.portalText, 10, 10, el.delete)).toBeNull();
  });

  test.each([
    ["a link", '<a href="#next">Next</a>'],
    ["a text input", "<input />"],
    ["a select", "<select></select>"],
    ["a textarea", "<textarea></textarea>"],
    ["a label", "<label>Name</label>"],
    ["a summary", "<details><summary>More</summary></details>"],
    ["an ARIA tab", '<div role="tab"></div>'],
    ["a roving menu item", '<div role="menuitem" tabindex="-1"></div>'],
    ["a focusable widget", '<div tabindex="0"></div>'],
    ["editable text", '<div contenteditable="true"></div>'],
  ])("finds %s", (_, html) => {
    const el = row();
    el.label.innerHTML = html;
    const control =
      el.label.querySelector("summary") ?? el.label.firstElementChild;
    assert(control);
    stack = [el.tooltip, el.delete, control, el.label, el.row];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBe(control);
  });

  test.each([
    ["a hidden input", '<input type="hidden" />'],
    ["a container that only takes script focus", '<div tabindex="-1"></div>'],
    ["text that isn't editable", '<div contenteditable="false"></div>'],
  ])("ignores %s", (_, html) => {
    const el = row();
    el.label.innerHTML = html;
    const element = el.label.firstElementChild;
    assert(element);
    stack = [el.tooltip, el.delete, element, el.label, el.row];
    expect(findCoveredControl(el.tooltip, 10, 10)).toBeNull();
  });
});

describe("closeOverControls", () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;

  function runFrames() {
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(performance.now());
  }

  beforeEach(() => {
    frames = new Map();
    nextFrame = 1;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function move(
    target: Element,
    init: PointerEventInit = {},
    type = "pointermove",
  ) {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerType: "mouse",
        clientX: 10,
        clientY: 10,
        ...init,
      }),
    );
  }

  test("closes an inline tooltip at once over another control", () => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.delete, { onCover });
    stack = [el.tooltip, el.delete, el.save, el.row];

    move(el.tooltip);
    expect(onCover).toHaveBeenCalledTimes(1);
  });

  test("keeps a tooltip that covers no control", () => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.delete, { onCover });
    stack = [el.tooltip, el.delete, el.label, el.row];

    move(el.tooltip);
    runFrames();
    expect(onCover).not.toHaveBeenCalled();
  });

  test("closes a portalled tooltip over another control", () => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.portalTooltip, { onCover, trigger: el.delete });
    stack = [el.portalCaret, el.portalTooltip, el.portal, el.save];

    move(el.portalCaret);
    expect(onCover).toHaveBeenCalledTimes(1);
  });

  test("doesn't hit-test while the pointer is on the trigger itself", () => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.delete, { onCover });

    move(el.deleteIcon);
    move(el.delete);
    runFrames();
    expect(elementsFromPoint).not.toHaveBeenCalled();
    expect(onCover).not.toHaveBeenCalled();
  });

  test.each(["touch", "pen"])("ignores %s", (pointerType) => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.delete, { onCover });
    stack = [el.tooltip, el.delete, el.save, el.row];

    move(el.tooltip, { pointerType });
    runFrames();
    expect(elementsFromPoint).not.toHaveBeenCalled();
    expect(onCover).not.toHaveBeenCalled();
  });

  test("hit-tests the first move at once, then once per frame", () => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.delete, { onCover });
    stack = [el.tooltip, el.delete, el.label, el.row];

    move(el.tooltip, { clientX: 1 });
    move(el.tooltip, { clientX: 2 });
    move(el.tooltip, { clientX: 3 });
    expect(elementsFromPoint).toHaveBeenCalledTimes(1);
    expect(elementsFromPoint).toHaveBeenLastCalledWith(1, 10);

    // The pointer reaches the neighbor within the frame.
    stack = [el.tooltip, el.delete, el.save, el.row];
    move(el.tooltip, { clientX: 4 });
    expect(onCover).not.toHaveBeenCalled();

    runFrames();
    expect(elementsFromPoint).toHaveBeenCalledTimes(2);
    expect(elementsFromPoint).toHaveBeenLastCalledWith(4, 10);
    expect(onCover).toHaveBeenCalledTimes(1);

    // A frame with no move checks nothing.
    runFrames();
    expect(elementsFromPoint).toHaveBeenCalledTimes(2);
  });

  test("drops the pending check when the pointer moves back to the trigger", () => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.delete, { onCover });
    stack = [el.tooltip, el.delete, el.label, el.row];

    move(el.tooltip);
    stack = [el.tooltip, el.delete, el.save, el.row];
    move(el.tooltip);
    move(el.deleteIcon);
    runFrames();
    expect(onCover).not.toHaveBeenCalled();
  });

  test("drops the pending check when the pointer leaves", () => {
    const el = row();
    const onCover = vi.fn();
    closeOverControls(el.portalTooltip, { onCover, trigger: el.delete });
    stack = [el.portalText, el.portalTooltip, el.label];

    move(el.portalText);
    stack = [el.portalText, el.portalTooltip, el.save];
    move(el.portalText);
    el.portalTooltip.dispatchEvent(
      new PointerEvent("pointerleave", { pointerType: "mouse" }),
    );
    expect(frames.size).toBe(0);
    runFrames();
    expect(onCover).not.toHaveBeenCalled();
  });

  test("calls the latest onCover and stops on destroy", () => {
    const el = row();
    const first = vi.fn();
    const second = vi.fn();
    const action = closeOverControls(el.delete, { onCover: first });
    stack = [el.tooltip, el.delete, el.save, el.row];

    action.update({ onCover: second });
    move(el.tooltip);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    action.destroy();
    expect(frames.size).toBe(0);
    move(el.tooltip);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
