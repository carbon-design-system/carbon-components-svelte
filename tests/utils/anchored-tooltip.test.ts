import { get } from "svelte/store";
import { createAnchoredTooltip } from "../../src/utils/anchored-tooltip.js";
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

function setup(options: Parameters<typeof createAnchoredTooltip>[0] = {}) {
  const node = document.createElement("p");
  document.body.append(node);
  const tooltip = createAnchoredTooltip({ group: group(), ...options });
  const detach = tooltip.attach(node);
  return {
    node,
    tooltip,
    detach,
    open: () => get(tooltip.open),
    hidden: () => get(tooltip.hidden),
  };
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

describe("createAnchoredTooltip", () => {
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
    node.dispatchEvent(new MouseEvent("click"));
    vi.advanceTimersByTime(100);
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

  it("stays open on activation with dismissOnClick false", () => {
    const { node, open } = setup({ dismissOnClick: false });

    node.dispatchEvent(new FocusEvent("focus"));
    node.dispatchEvent(new MouseEvent("click"));
    expect(open()).toBe(true);
  });

  it("opens at once on hover with an enter delay of 0", () => {
    const { node, open } = setup({ enterDelayMs: () => 0 });

    node.dispatchEvent(new MouseEvent("mouseenter"));
    expect(open()).toBe(true);
  });

  it("hides on Escape from anywhere, before a window listener sees it", () => {
    const { node, open } = setup();
    const onWindowKeydown = vi.fn();
    window.addEventListener("keydown", onWindowKeydown);
    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);

    document.body.dispatchEvent(escapeKey().event);
    window.removeEventListener("keydown", onWindowKeydown);

    expect(open()).toBe(false);
    expect(onWindowKeydown).not.toHaveBeenCalled();
  });

  it("marks the anchor hidden while hovered or focused but closed", () => {
    const { node, tooltip, hidden } = setup();
    expect(hidden()).toBe(false);

    // Waiting out the enter delay.
    node.dispatchEvent(new MouseEvent("mouseenter"));
    expect(hidden()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(hidden()).toBe(false);

    tooltip.handleKeydown(escapeKey().event);
    expect(hidden()).toBe(true);

    node.dispatchEvent(new MouseEvent("mouseleave"));
    expect(hidden()).toBe(false);
  });

  it.each([
    ["hover", new MouseEvent("mouseenter")],
    ["focus", new FocusEvent("focus")],
  ])("hides on Escape after %s and stops the key", (_, open$) => {
    const { node, tooltip, open } = setup();
    node.dispatchEvent(open$);
    vi.advanceTimersByTime(100);

    const { event, stopPropagation } = escapeKey();
    tooltip.handleKeydown(event);

    expect(open()).toBe(false);
    expect(stopPropagation).toHaveBeenCalledOnce();
  });

  it("passes Escape on to a focused anchor when asked", () => {
    const { node, tooltip, open } = setup({ passEscapeWhenFocused: true });
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

  it("passes Escape on, focused or not, while passEscape returns true", () => {
    let pass = false;
    const { node, tooltip } = setup({ passEscape: () => pass });

    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);
    const first = escapeKey();
    tooltip.handleKeydown(first.event);
    expect(first.stopPropagation).toHaveBeenCalledOnce();

    pass = true;
    node.dispatchEvent(new MouseEvent("mouseleave"));
    node.dispatchEvent(new MouseEvent("mouseenter"));
    vi.advanceTimersByTime(100);
    const second = escapeKey();
    tooltip.handleKeydown(second.event);
    expect(second.stopPropagation).not.toHaveBeenCalled();
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
