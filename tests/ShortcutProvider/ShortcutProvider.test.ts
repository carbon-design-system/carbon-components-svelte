import { render, screen } from "@testing-library/svelte";
import { netListenerCalls } from "../utils/net-listener-calls";
import { user } from "../utils/user";
import ShortcutProvider from "./ShortcutProvider.test.svelte";
import ShortcutProviderScope from "./ShortcutProviderScope.test.svelte";

const ctrl = (key: string) => `{Control>}${key}{/Control}`;

describe("ShortcutProvider", () => {
  it("runs the shortcut that matches and prevents the key's default", () => {
    const onTrigger = vi.fn();
    render(ShortcutProvider, { props: { onTrigger } });

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);

    expect(onTrigger).toHaveBeenCalledExactlyOnceWith("palette");
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves other keys alone", async () => {
    const onTrigger = vi.fn();
    render(ShortcutProvider, { props: { onTrigger } });

    await user.keyboard(ctrl("j"));
    await user.keyboard("k");

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("listens once on window, and stops on destroy", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const first = render(ShortcutProvider);
    const second = render(ShortcutProvider);
    expect(netListenerCalls(add, remove, "keydown")).toBe(1);

    first.unmount();
    expect(netListenerCalls(add, remove, "keydown")).toBe(1);
    second.unmount();
    expect(netListenerCalls(add, remove, "keydown")).toBe(0);
  });

  it("ignores a typed shortcut in text fields but not one with mod", async () => {
    const onTrigger = vi.fn();
    render(ShortcutProvider, { props: { onTrigger } });

    await user.click(screen.getByTestId("field"));
    await user.keyboard("d");
    await user.keyboard(ctrl("k"));
    expect(onTrigger.mock.calls).toEqual([["palette"]]);

    onTrigger.mockClear();
    const editable = screen.getByTestId("editable");
    // The test DOM does not implement `isContentEditable`.
    Object.defineProperty(editable, "isContentEditable", { value: true });
    await user.click(editable);
    await user.keyboard("d");
    expect(onTrigger).not.toHaveBeenCalled();

    editable.blur();
    await user.keyboard("d");
    expect(onTrigger.mock.calls).toEqual([["delete"]]);
  });

  it("does not run for a disabled or hidden target", async () => {
    const onTrigger = vi.fn();
    const { rerender } = render(ShortcutProvider, {
      props: { onTrigger, disabled: true, hidden: true },
    });

    await user.keyboard(ctrl("k"));
    await user.keyboard("d");
    expect(onTrigger).not.toHaveBeenCalled();

    await rerender({ disabled: false, hidden: false });
    await user.keyboard(ctrl("k"));
    await user.keyboard("d");
    expect(onTrigger.mock.calls).toEqual([["palette"], ["delete"]]);
  });

  it("follows a change of keys", async () => {
    const onTrigger = vi.fn();
    const { rerender } = render(ShortcutProvider, { props: { onTrigger } });

    await rerender({ palette: "mod+p" });
    await user.keyboard(ctrl("k"));
    expect(onTrigger).not.toHaveBeenCalled();

    await user.keyboard(ctrl("p"));
    expect(onTrigger).toHaveBeenCalledExactlyOnceWith("palette");
  });

  it("registers the shortcuts prop and follows its changes", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(ShortcutProvider, {
      props: {
        shortcuts: [{ keys: "mod+j", label: "Jump", onTrigger: first }],
      },
    });

    await user.keyboard(ctrl("j"));
    expect(first).toHaveBeenCalledTimes(1);

    await rerender({
      shortcuts: [{ keys: "mod+j", label: "Jump", onTrigger: second }],
    });
    await user.keyboard(ctrl("j"));
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);

    await rerender({ shortcuts: [] });
    await user.keyboard(ctrl("j"));
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("warns about a duplicate in one scope, and the later one wins", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(ShortcutProvider, {
      props: {
        shortcuts: [
          { keys: "mod+j", label: "Jump to row", onTrigger: first },
          { keys: "ctrl+j", label: "Jump to page", onTrigger: second },
        ],
      },
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(
      'registered twice in the page scope: "Jump to row" and "Jump to page"',
    );

    await user.keyboard(ctrl("j"));
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    await rerender({
      shortcuts: [{ keys: "mod+j", label: "Jump to row", onTrigger: first }],
    });
    await user.keyboard(ctrl("j"));
    expect(first).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("warns once for keys it cannot parse, and registers nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onTrigger = vi.fn();
    render(ShortcutProvider, { props: { palette: "mod+nope", onTrigger } });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"mod+nope" is not a valid');
    await user.keyboard(ctrl("k"));
    expect(onTrigger).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("ShortcutProvider scopes", () => {
  it("lets a shown scope shadow the same keys outside it", async () => {
    const onTrigger = vi.fn();
    render(ShortcutProviderScope, { props: { onTrigger } });

    await user.keyboard(ctrl("s"));
    expect(onTrigger.mock.calls).toEqual([["panel save"]]);

    onTrigger.mockClear();
    await user.keyboard(ctrl("k"));
    expect(onTrigger.mock.calls).toEqual([["palette"]]);
  });

  it("gives the keys back when the scope is hidden, inert or removed", async () => {
    const onTrigger = vi.fn();
    const { rerender } = render(ShortcutProviderScope, {
      props: { onTrigger, hidden: true },
    });

    await user.keyboard(ctrl("s"));
    expect(onTrigger.mock.calls).toEqual([["page save"]]);

    onTrigger.mockClear();
    await rerender({ hidden: false });
    await user.keyboard(ctrl("s"));
    expect(onTrigger.mock.calls).toEqual([["panel save"]]);

    onTrigger.mockClear();
    screen.getByTestId("panel").setAttribute("inert", "");
    await user.keyboard(ctrl("s"));
    expect(onTrigger.mock.calls).toEqual([["page save"]]);
    screen.getByTestId("panel").removeAttribute("inert");

    onTrigger.mockClear();
    await rerender({ open: false });
    await user.keyboard(ctrl("s"));
    expect(onTrigger.mock.calls).toEqual([["page save"]]);
  });
});
