import {
  createOverlay,
  getModalHost,
  getOverlays,
  overlay,
  resetOverlays,
  routeEscape,
  subscribeModalHost,
} from "../../src/utils/overlay-stack.js";

const task = () => new Promise((resolve) => setTimeout(resolve));

function key(init: KeyboardEventInit & { key: string }) {
  return new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

const escapeKey = (init: KeyboardEventInit = {}) =>
  key({ key: "Escape", ...init });

function div(parent: Element = document.body) {
  const node = document.createElement("div");
  parent.append(node);
  return node;
}

function setup(options: Record<string, unknown> = {}) {
  const element = div();
  const onDismiss = vi.fn();
  const layer = createOverlay({ element, onDismiss, ...options });
  return { element, onDismiss, layer };
}

describe("overlay stack", () => {
  afterEach(() => {
    resetOverlays();
    document.body.innerHTML = "";
    document.body.className = "";
  });

  describe("Escape", () => {
    it("goes to the top layer only, and stops there", () => {
      const lower = setup();
      const upper = setup();
      lower.layer.open();
      upper.layer.open();

      const event = escapeKey();
      const stop = vi.spyOn(event, "stopPropagation");
      document.body.dispatchEvent(event);

      expect(upper.onDismiss).toHaveBeenCalledWith("escape-key", event);
      expect(lower.onDismiss).not.toHaveBeenCalled();
      expect(stop).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it("reaches the next layer on the next key", () => {
      const lower = setup();
      const upper = setup();
      lower.layer.open();
      upper.layer.open();
      upper.onDismiss.mockImplementation(() => upper.layer.close());

      document.body.dispatchEvent(escapeKey());
      document.body.dispatchEvent(escapeKey());

      expect(upper.onDismiss).toHaveBeenCalledTimes(1);
      expect(lower.onDismiss).toHaveBeenCalledTimes(1);
    });

    it("skips a layer with escape false", () => {
      const lower = setup();
      const upper = setup({ escape: false });
      lower.layer.open();
      upper.layer.open();

      document.body.dispatchEvent(escapeKey());

      expect(upper.onDismiss).not.toHaveBeenCalled();
      expect(lower.onDismiss).toHaveBeenCalledTimes(1);
    });

    it("dismisses a 'pass' layer and goes on to the next", () => {
      const lower = setup();
      const upper = setup({ escape: "pass" });
      lower.layer.open();
      upper.layer.open();

      document.body.dispatchEvent(escapeKey());

      expect(upper.onDismiss).toHaveBeenCalledTimes(1);
      expect(lower.onDismiss).toHaveBeenCalledTimes(1);
    });

    it("leaves the key to the browser for a native layer", () => {
      const lower = setup();
      const upper = setup({ escape: "native" });
      lower.layer.open();
      upper.layer.open();

      const event = escapeKey();
      document.body.dispatchEvent(event);

      expect(lower.onDismiss).not.toHaveBeenCalled();
      expect(upper.onDismiss).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it("ignores an IME composition", () => {
      const { onDismiss, layer } = setup();
      layer.open();

      document.body.dispatchEvent(escapeKey({ isComposing: true }));

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("takes a key a widget used, unless the layer respects that", () => {
      const takes = setup();
      const respects = setup({ respectHandled: true });
      const used = () => {
        const event = escapeKey();
        event.preventDefault();
        return event;
      };

      takes.layer.open();
      document.body.dispatchEvent(used());
      expect(takes.onDismiss).toHaveBeenCalledTimes(1);

      takes.layer.close();
      respects.layer.open();
      document.body.dispatchEvent(used());
      expect(respects.onDismiss).not.toHaveBeenCalled();
    });

    it("lets a widget inside stop the key before the layer sees it", () => {
      const { element, onDismiss, layer } = setup();
      const inner = div(element);
      inner.addEventListener("keydown", (event) => event.stopPropagation());
      layer.open();

      inner.dispatchEvent(escapeKey());

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("dismisses a layer once per key, from its own handler and the window", () => {
      const { element, onDismiss, layer } = setup();
      element.addEventListener("keydown", (event) => layer.escape(event));
      layer.open();

      element.dispatchEvent(escapeKey());

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("takes the key before a widget inside for a capture layer", () => {
      const { element, onDismiss, layer } = setup({ capture: true });
      const widget = vi.fn();
      element.addEventListener("keydown", widget);
      layer.open();

      element.dispatchEvent(escapeKey());

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(widget).not.toHaveBeenCalled();
    });

    it("gives the key to a menu opened after a tooltip, not to the tooltip", () => {
      const tooltip = setup({ capture: true, outside: "ignore" });
      const menu = setup();
      tooltip.layer.open();
      menu.layer.open();

      const event = escapeKey();
      menu.element.dispatchEvent(event);

      expect(menu.onDismiss).toHaveBeenCalledTimes(1);
      expect(tooltip.onDismiss).not.toHaveBeenCalled();
    });

    it("gives the key to a tooltip opened after a menu, then to the menu", () => {
      const menu = setup();
      const tooltip = setup({ capture: true, outside: "ignore" });
      menu.layer.open();
      tooltip.layer.open();
      tooltip.onDismiss.mockImplementation(() => tooltip.layer.close());

      menu.element.dispatchEvent(escapeKey());
      expect(tooltip.onDismiss).toHaveBeenCalledTimes(1);
      expect(menu.onDismiss).not.toHaveBeenCalled();

      menu.element.dispatchEvent(escapeKey());
      expect(menu.onDismiss).toHaveBeenCalledTimes(1);
    });

    it("lets routeEscape be called with no layer open", () => {
      expect(routeEscape(escapeKey())).toBe(false);
    });
  });

  describe("outside clicks", () => {
    const click = (target: Element) =>
      target.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    it("ignore the click that opened the layer, and take the next", () => {
      const trigger = div();
      const { onDismiss, layer } = setup();
      trigger.addEventListener("click", () => layer.open());

      click(trigger);
      expect(layer.isOpen()).toBe(true);
      expect(onDismiss).not.toHaveBeenCalled();

      click(document.body);
      expect(onDismiss).toHaveBeenCalledWith(
        "outside-click",
        expect.anything(),
      );
    });

    it("dismiss every layer above the one clicked, and none below", async () => {
      const bottom = setup();
      const middle = setup();
      const top = setup();
      for (const entry of [bottom, middle, top]) entry.layer.open();
      await task();

      click(middle.element);

      expect(top.onDismiss).toHaveBeenCalledTimes(1);
      expect(middle.onDismiss).not.toHaveBeenCalled();
      expect(bottom.onDismiss).not.toHaveBeenCalled();
    });

    it("dismiss all layers for a click on the page", async () => {
      const a = setup();
      const b = setup();
      a.layer.open();
      b.layer.open();
      await task();

      click(document.body);

      expect(a.onDismiss).toHaveBeenCalledTimes(1);
      expect(b.onDismiss).toHaveBeenCalledTimes(1);
    });

    it("pass over a layer with outside ignore", async () => {
      const lower = setup();
      const tooltip = setup({ outside: "ignore" });
      lower.layer.open();
      tooltip.layer.open();
      await task();

      click(document.body);

      expect(tooltip.onDismiss).not.toHaveBeenCalled();
      expect(lower.onDismiss).toHaveBeenCalledTimes(1);
    });

    it("stop at a layer with outside block, after telling it", async () => {
      const lower = setup();
      const modal = setup({ outside: "block", onOutsidePress: vi.fn() });
      lower.layer.open();
      modal.layer.open();
      await task();

      click(document.body);

      expect(modal.onDismiss).not.toHaveBeenCalled();
      expect(lower.onDismiss).not.toHaveBeenCalled();
    });

    it("count the trigger as inside", async () => {
      const trigger = div();
      const { onDismiss, layer } = setup({ anchors: () => [trigger] });
      layer.open();
      await task();

      click(trigger);

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("do not dismiss a layer when the press began inside it", async () => {
      const { element, onDismiss, layer } = setup();
      layer.open();
      await task();

      element.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      click(document.body);

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it("register no window listener while no layer is open", () => {
      const add = vi.spyOn(window, "addEventListener");
      const remove = vi.spyOn(window, "removeEventListener");
      const { layer } = setup();

      layer.open();
      const net = (type: string) =>
        add.mock.calls.filter((c) => c[0] === type).length -
        remove.mock.calls.filter((c) => c[0] === type).length;
      expect([net("click"), net("keydown")]).toEqual([1, 1]);

      layer.close();
      expect([net("click"), net("keydown")]).toEqual([0, 0]);
      add.mockRestore();
      remove.mockRestore();
    });
  });

  describe("modal layers", () => {
    it("lock body scroll until the last modal closes", () => {
      const a = setup({ modal: true });
      const b = setup({ modal: true });
      a.layer.open();
      b.layer.open();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      a.layer.close();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      b.layer.close();
      expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    });

    it("make the page behind inert, except the modal's own branch and portals", () => {
      const page = div();
      const sibling = div();
      const portal = div();
      portal.setAttribute("data-portal", "");
      const shell = div();
      const nearby = div(shell);
      const element = div(shell);
      const layer = createOverlay({ element, modal: true, onDismiss: vi.fn() });

      layer.open();

      expect(page).toHaveAttribute("inert");
      expect(sibling).toHaveAttribute("inert");
      expect(nearby).toHaveAttribute("inert");
      expect(portal).not.toHaveAttribute("inert");
      expect(shell).not.toHaveAttribute("inert");
      expect(element).not.toHaveAttribute("inert");

      layer.close();
      expect(page).not.toHaveAttribute("inert");
      expect(nearby).not.toHaveAttribute("inert");
    });

    it("keep a layer above the modal interactive, and inert the one below it", () => {
      const page = div();
      const lower = setup({ modal: true });
      lower.layer.open();
      const upper = setup({ modal: true });
      upper.layer.open();

      expect(lower.element).toHaveAttribute("inert");
      expect(upper.element).not.toHaveAttribute("inert");

      upper.layer.close();
      expect(lower.element).not.toHaveAttribute("inert");
      expect(page).toHaveAttribute("inert");
    });

    it("tell a layer under a modal to cover itself, and leave its inert to it", () => {
      const onCovered = vi.fn();
      const lower = setup({ modal: true, onCovered });
      lower.layer.open();
      expect(onCovered).not.toHaveBeenCalled();

      const upper = setup({ modal: true });
      upper.layer.open();
      expect(onCovered).toHaveBeenLastCalledWith(true);
      expect(lower.element).not.toHaveAttribute("inert");

      upper.layer.close();
      expect(onCovered).toHaveBeenLastCalledWith(false);
    });

    it("do not cover a layer that holds the modal in its own DOM", () => {
      const onCovered = vi.fn();
      const outer = setup({ modal: true, onCovered });
      outer.layer.open();
      const inner = createOverlay({
        element: div(outer.element),
        modal: true,
        onDismiss: vi.fn(),
      });

      inner.open();

      expect(onCovered).not.toHaveBeenCalled();
    });

    it("keep what names or describes the modal out of the inert page", () => {
      const note = div();
      note.id = "note";
      const holder = div();
      const nearby = div(holder);
      const label = div(holder);
      label.id = "label";
      const dialog = div();
      dialog.setAttribute("aria-labelledby", "label");
      dialog.setAttribute("aria-describedby", "note");

      createOverlay({
        element: dialog,
        modal: true,
        onDismiss: vi.fn(),
      }).open();

      expect(note).not.toHaveAttribute("inert");
      expect(label).not.toHaveAttribute("inert");
      expect(holder).not.toHaveAttribute("inert");
      expect(nearby).toHaveAttribute("inert");
    });

    it("leave an element that is inert for its own reasons alone", () => {
      const closedModal = div();
      closedModal.setAttribute("inert", "");
      const { layer } = setup({ modal: true });

      layer.open();
      layer.close();

      expect(closedModal).toHaveAttribute("inert");
    });

    it("do not make the page inert for a native layer", () => {
      const page = div();
      const { layer } = setup({ modal: true, native: true });

      layer.open();

      expect(page).not.toHaveAttribute("inert");
      expect(document.body).not.toHaveClass("bx--body--with-modal-open");
    });

    it("wait for an element that is not bound yet", async () => {
      const page = div();
      let element: Element | null = null;
      const layer = createOverlay({
        element: () => element,
        modal: true,
        onDismiss: vi.fn(),
      });
      layer.open();
      expect(page).not.toHaveAttribute("inert");

      element = div();
      await Promise.resolve();
      expect(page).toHaveAttribute("inert");
    });
  });

  describe("Tab", () => {
    function tab(target: Element) {
      const event = key({ key: "Tab" });
      target.dispatchEvent(event);
      return event;
    }

    it("is trapped in the top trapping layer, under a tooltip", () => {
      const element = div();
      const first = document.createElement("button");
      const last = document.createElement("button");
      element.append(first, last);
      const modal = createOverlay({ element, trap: true, onDismiss: vi.fn() });
      const tooltip = setup({ capture: true, outside: "ignore" });
      modal.open();
      tooltip.layer.open();

      last.focus();
      const event = tab(last);

      expect(event.defaultPrevented).toBe(true);
      expect(first).toHaveFocus();
    });

    it("leaves a Tab from outside the layer alone", () => {
      const outside = document.createElement("button");
      document.body.append(outside);
      const element = div();
      element.append(document.createElement("button"));
      createOverlay({ element, trap: true, onDismiss: vi.fn() }).open();

      outside.focus();

      expect(tab(outside).defaultPrevented).toBe(false);
    });

    it("dismisses a layer that closes on Tab", () => {
      const { onDismiss, layer } = setup({ closeOnTab: true });
      layer.open();

      const event = tab(document.body);

      expect(onDismiss).toHaveBeenCalledWith("tab", event);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe("focus return", () => {
    it("goes back to the element focused at open time", () => {
      const trigger = document.createElement("button");
      document.body.append(trigger);
      trigger.focus();
      const { layer } = setup();

      layer.open();
      document.body.focus();
      layer.close();
      layer.restoreFocus();

      expect(trigger).toHaveFocus();
    });

    it("falls back to returnFocusTo when the trigger is gone", () => {
      const trigger = document.createElement("button");
      const fallback = document.createElement("button");
      document.body.append(trigger, fallback);
      trigger.focus();
      const { layer } = setup({ returnFocusTo: fallback });
      layer.open();

      trigger.remove();
      layer.close();
      layer.restoreFocus();

      expect(fallback).toHaveFocus();
    });

    it("falls back to the layer below when nothing else is left", () => {
      const trigger = document.createElement("button");
      const target = document.createElement("button");
      document.body.append(trigger, target);
      const lower = setup({ focusTarget: target });
      lower.layer.open();
      trigger.focus();
      const upper = setup();
      upper.layer.open();

      trigger.remove();
      upper.layer.close();
      upper.layer.restoreFocus();

      expect(target).toHaveFocus();
    });

    it("does nothing when focus has moved somewhere outside the closing layer", () => {
      const trigger = document.createElement("button");
      const other = document.createElement("button");
      document.body.append(trigger, other);
      trigger.focus();
      const { element, layer } = setup();
      layer.open();
      layer.close();
      other.focus();

      layer.restoreFocus(element);

      expect(other).toHaveFocus();
    });

    it("restores once", () => {
      const trigger = document.createElement("button");
      const other = document.createElement("button");
      document.body.append(trigger, other);
      trigger.focus();
      const { layer } = setup();
      layer.open();
      layer.close();
      layer.restoreFocus();
      other.focus();

      layer.restoreFocus();

      expect(other).toHaveFocus();
    });
  });

  describe("the modal host", () => {
    it("is the top modal's host while one is open, and tells listeners", () => {
      const host = div();
      const listener = vi.fn();
      const stop = subscribeModalHost(listener);
      const modal = createOverlay({
        element: div(),
        host,
        modal: true,
        onDismiss: vi.fn(),
      });

      modal.open();
      expect(getModalHost()).toBe(host);
      expect(listener).toHaveBeenLastCalledWith(host);

      modal.close();
      expect(getModalHost()).toBeNull();
      expect(listener).toHaveBeenLastCalledWith(null);

      stop();
      modal.open();
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("is not changed by a menu over the modal", () => {
      const host = div();
      createOverlay({
        element: div(),
        host,
        modal: true,
        onDismiss: vi.fn(),
      }).open();
      setup().layer.open();

      expect(getModalHost()).toBe(host);
    });
  });

  describe("controller", () => {
    it("syncs with a flag, and opens once", () => {
      const { layer } = setup();

      layer.sync(true);
      layer.sync(true);
      expect(getOverlays()).toHaveLength(1);

      layer.sync(false);
      expect(getOverlays()).toHaveLength(0);
    });

    it("reports whether a layer that takes clicks is above", () => {
      const lower = setup();
      lower.layer.open();
      const tooltip = setup({ outside: "ignore" });
      tooltip.layer.open();
      expect(lower.layer.hasLayerAbove()).toBe(false);

      setup().layer.open();
      expect(lower.layer.hasLayerAbove()).toBe(true);
      expect(lower.layer.isTop()).toBe(false);
    });

    it("moves the scroll lock when an update changes the options", () => {
      const { layer } = setup({ modal: true });
      layer.open();
      expect(document.body).toHaveClass("bx--body--with-modal-open");

      layer.update({ modal: false });
      expect(document.body).not.toHaveClass("bx--body--with-modal-open");

      layer.update({ modal: true });
      expect(document.body).toHaveClass("bx--body--with-modal-open");
    });

    it("works as an action on a node", async () => {
      const node = div();
      const onDismiss = vi.fn();
      const action = overlay(node, { enabled: false, onDismiss });
      expect(getOverlays()).toHaveLength(0);

      action.update({ enabled: true, onDismiss });
      expect(getOverlays()).toHaveLength(1);
      await task();
      document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onDismiss).toHaveBeenCalledTimes(1);

      action.destroy();
      expect(getOverlays()).toHaveLength(0);
    });
  });
});
