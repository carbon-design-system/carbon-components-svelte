import { get } from "svelte/store";
import { createTagTooltip } from "../../src/Tag/tag-tooltip.js";
import {
  isTruncated,
  observeTruncation,
} from "../../src/Tag/tag-truncation.js";
import {
  activeTooltip,
  createTooltipGroup,
} from "../../src/utils/tooltip-group.js";

const group = () =>
  createTooltipGroup({
    enterDelayMs: () => 100,
    leaveDelayMs: () => 0,
    skipDelayMs: () => 0,
  });

function setup(options: { enabled?: () => boolean } = {}) {
  const node = document.createElement("button");
  document.body.append(node);
  const tooltip = createTagTooltip({ group: group(), ...options });
  const detach = tooltip.attach(node);
  return { node, tooltip, detach, open: () => get(tooltip.open) };
}

function escapeKey(init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    ...init,
  });
  const stopPropagation = vi.spyOn(event, "stopPropagation");
  return { event, stopPropagation };
}

describe("createTagTooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeTooltip.set(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("opens after the enter delay on hover and closes on leave", () => {
    const { node, open } = setup();

    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(99);
    expect(open()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(open()).toBe(true);

    node.dispatchEvent(new MouseEvent("mouseleave"));
    expect(open()).toBe(false);
  });

  it("opens at once on focus and closes on blur", () => {
    const { node, open } = setup();

    node.dispatchEvent(new FocusEvent("focus"));
    expect(open()).toBe(true);

    node.dispatchEvent(new FocusEvent("blur"));
    expect(open()).toBe(false);
  });

  it("stays open on blur while hovered, and on leave while focused", () => {
    const { node, open } = setup();

    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);
    node.dispatchEvent(new FocusEvent("focus"));
    node.dispatchEvent(new FocusEvent("blur"));
    expect(open()).toBe(true);

    node.dispatchEvent(new FocusEvent("focus"));
    node.dispatchEvent(new MouseEvent("mouseleave"));
    expect(open()).toBe(true);
  });

  it("hides on activation until the next pointer enter", () => {
    const { node, open } = setup();

    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);
    node.dispatchEvent(new MouseEvent("click"));
    expect(open()).toBe(false);

    node.dispatchEvent(new MouseEvent("mouseleave"));
    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);
    expect(open()).toBe(true);
  });

  it("cancels a pending open on activation", () => {
    const { node, open } = setup();

    node.dispatchEvent(new MouseEvent("mouseenter"));
    node.dispatchEvent(new MouseEvent("click"));
    vi.advanceTimersByTime(100);
    expect(open()).toBe(false);
  });

  it("keeps Escape from a tooltip opened by hover alone", () => {
    const { node, tooltip, open } = setup();
    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);

    const { event, stopPropagation } = escapeKey();
    tooltip.handleKeydown(event);

    expect(open()).toBe(false);
    expect(stopPropagation).toHaveBeenCalledOnce();
  });

  it("passes Escape on to a focused anchor's handlers", () => {
    const { node, tooltip, open } = setup();
    node.dispatchEvent(new FocusEvent("focus"));

    const { event, stopPropagation } = escapeKey();
    tooltip.handleKeydown(event);

    expect(open()).toBe(false);
    expect(stopPropagation).not.toHaveBeenCalled();

    // Hidden until the next focus.
    node.dispatchEvent(new FocusEvent("blur"));
    node.dispatchEvent(new FocusEvent("focus"));
    expect(open()).toBe(true);
  });

  it.each([
    ["a closed tooltip", {}, false],
    ["another key", { key: "Enter" }, true],
    ["an IME composition", { isComposing: true }, true],
  ])("ignores Escape for %s", (_, init, opened) => {
    const { node, tooltip, open } = setup();
    if (opened) node.dispatchEvent(new FocusEvent("focus"));

    const { event, stopPropagation } = escapeKey(init);
    tooltip.handleKeydown(event);

    expect(open()).toBe(opened);
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it("ignores hover and focus while disabled", () => {
    let enabled = false;
    const { node, open } = setup({ enabled: () => enabled });

    node.dispatchEvent(new FocusEvent("focus"));
    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);
    expect(open()).toBe(false);
    expect(get(activeTooltip)).toBeNull();

    enabled = true;
    node.dispatchEvent(new FocusEvent("focus"));
    expect(open()).toBe(true);
  });

  it("closes when another tooltip opens", () => {
    const first = setup();
    const second = setup();

    first.node.dispatchEvent(new FocusEvent("focus"));
    second.node.dispatchEvent(new FocusEvent("focus"));

    expect(first.open()).toBe(false);
    expect(second.open()).toBe(true);
  });

  it("hide() closes and releases the slot", () => {
    const { node, tooltip, open } = setup();
    node.dispatchEvent(new FocusEvent("focus"));

    tooltip.hide();

    expect(open()).toBe(false);
    expect(get(activeTooltip)).toBeNull();
  });

  it("stops listening once detached", () => {
    const { node, detach, open } = setup();

    detach();
    node.dispatchEvent(new FocusEvent("focus"));

    expect(open()).toBe(false);
  });
});

describe("isTruncated", () => {
  function sized(scrollWidth: number, clientWidth: number) {
    const node = document.createElement("span");
    Object.defineProperty(node, "scrollWidth", { value: scrollWidth });
    Object.defineProperty(node, "clientWidth", { value: clientWidth });
    return node;
  }

  it.each([
    [200, 40, true],
    [41, 40, true],
    [40, 40, false],
    [0, 0, false],
  ])("scrollWidth %i, clientWidth %i: %s", (scrollWidth, clientWidth, want) => {
    expect(isTruncated(sized(scrollWidth, clientWidth))).toBe(want);
  });

  it("observeTruncation reports after the first layout and stops", async () => {
    const node = sized(200, 40);
    const callback = vi.fn();

    const stop = observeTruncation(node, callback);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledExactlyOnceWith(true);

    // A new subscriber queues a fresh entry for the node; the stopped one
    // no longer hears it.
    stop();
    const next = vi.fn();
    observeTruncation(node, next);
    await Promise.resolve();
    expect(next).toHaveBeenCalledExactlyOnceWith(true);
    expect(callback).toHaveBeenCalledOnce();
  });
});
