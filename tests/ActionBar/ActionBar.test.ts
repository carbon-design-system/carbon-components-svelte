import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ActionBar from "./ActionBar.test.svelte";

/**
 * A `ResizeObserver` that reports the sizes a test sets, since jsdom lays
 * nothing out. The shared observer keeps one per constructor, so each test
 * gets a fresh class and a fresh observer.
 */
function stubResizeObserver() {
  const targets = new Set<Element>();
  let callback: ResizeObserverCallback = () => {};
  class FakeResizeObserver {
    constructor(cb: ResizeObserverCallback) {
      callback = cb;
    }
    observe(element: Element) {
      targets.add(element);
    }
    unobserve(element: Element) {
      targets.delete(element);
    }
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);

  const widthOf = (element: Element) =>
    element.classList.contains("bx--action-bar__divider")
      ? 17
      : element.classList.contains("bx--action-bar__button--collapsed")
        ? 0
        : element.classList.contains("bx--action-bar")
          ? bar
          : element.classList.contains("bx--btn--field") &&
              element.textContent?.trim()
            ? 90
            : 40;
  let bar = 1000;

  /** Report every observed element in one batch, as the browser does. */
  async function report(barWidth = bar) {
    bar = barWidth;
    const entries = [...targets].map((target) => {
      const size = widthOf(target);
      return {
        target,
        contentRect: new DOMRect(0, 0, size, 40),
        borderBoxSize: [{ inlineSize: size, blockSize: 40 }],
        contentBoxSize: [{ inlineSize: size, blockSize: 40 }],
        devicePixelContentBoxSize: [],
      };
    });
    callback(entries as unknown as ResizeObserverEntry[], {} as ResizeObserver);
    await tick();
    await tick();
  }
  return { report };
}

async function renderBar(props: Record<string, unknown> = {}) {
  const result = render(ActionBar, { props });
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Undo" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
  return result;
}

const button = (name: string) => screen.getByRole("button", { name });
const radio = (name: string) => screen.getByRole("radio", { name });
const clicks = () => screen.getByTestId("clicks").textContent;

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("dir");
});

describe("ActionBar roving focus", () => {
  it("is one tab stop, and a disabled button keeps its place in it", async () => {
    await renderBar();
    expect(button("Bold")).toHaveAttribute("tabindex", "-1");
    expect(button("Save")).toHaveAttribute("tabindex", "-1");

    button("Before").focus();
    await user.tab();
    expect(button("Undo")).toHaveFocus();
    expect(button("Undo")).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(button("After")).toHaveFocus();
    await user.tab({ shift: true });
    expect(button("Undo")).toHaveFocus();
  });

  it("moves with the arrows, Home and End, and wraps", async () => {
    await renderBar();
    button("Undo").focus();
    await user.keyboard("{ArrowRight}");
    expect(button("Bold")).toHaveFocus();
    expect(button("Bold")).toHaveAttribute("tabindex", "0");
    expect(button("Undo")).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{End}");
    expect(button("Save")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(button("Undo")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(button("Save")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(button("Undo")).toHaveFocus();
    // The tab stop followed the focus.
    await user.tab();
    expect(button("After")).toHaveFocus();
  });

  it("swaps Left and Right under dir=rtl", async () => {
    document.documentElement.setAttribute("dir", "rtl");
    await renderBar();
    button("Undo").focus();
    await user.keyboard("{ArrowLeft}");
    expect(button("Bold")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(button("Undo")).toHaveFocus();
  });

  it("moves with Up and Down, and not Left and Right, when vertical", async () => {
    await renderBar({ orientation: "vertical" });
    expect(screen.getByRole("toolbar")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
    button("Undo").focus();
    await user.keyboard("{ArrowRight}");
    expect(button("Undo")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(button("Bold")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(button("Undo")).toHaveFocus();
  });

  it("leaves a chord with a modifier to the browser", async () => {
    await renderBar();
    button("Undo").focus();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(button("Undo")).toHaveFocus();
  });

  it("tells the page when Escape is pressed on a button", async () => {
    await renderBar();
    button("Bold").focus();
    // The tooltip a focused button shows takes the first Escape to close.
    await user.keyboard("{Escape}");
    expect(screen.getByTestId("exits")).toHaveTextContent("0");
    await user.keyboard("{Escape}");
    expect(screen.getByTestId("exits")).toHaveTextContent("1");
  });
});

describe("ActionBar items", () => {
  it("announces a toggle as pressed, and a plain button as neither", async () => {
    await renderBar();
    expect(button("Bold")).toHaveAttribute("aria-pressed", "false");
    expect(button("Delete")).not.toHaveAttribute("aria-pressed");
    await user.click(button("Bold"));
    expect(button("Bold")).toHaveAttribute("aria-pressed", "true");
  });

  it("does not click a disabled button, by pointer or shortcut", async () => {
    await renderBar();
    await user.click(button("Undo"));
    expect(clicks()).toBe("");
    await user.click(button("Delete"));
    expect(clicks()).toBe("delete");
  });

  it("makes a single-choice group radio buttons, chosen with Space", async () => {
    await renderBar();
    const group = screen.getByRole("radiogroup", { name: "Alignment" });
    const radios = screen.getAllByRole("radio");
    expect(group).toContainElement(radios[0]);
    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    expect(radios[0]).not.toHaveAttribute("aria-pressed");

    radios[0].focus();
    await user.keyboard("{ArrowRight}");
    // Arrows move focus and leave the choice alone.
    expect(radios[1]).toHaveFocus();
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    await user.keyboard(" ");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
  });

  it("keeps the keys of a text field, and hands them on at its edge", async () => {
    await renderBar({ field: true });
    const input = screen.getByRole("textbox", {
      name: "Find",
    }) as HTMLInputElement;
    await waitFor(() => expect(input).toHaveAttribute("tabindex", "-1"));

    radio("Right").focus();
    await user.keyboard("{ArrowRight}");
    expect(input).toHaveFocus();
    await waitFor(() => expect(input.tabIndex).toBe(0));
    expect(radio("Right")).toHaveAttribute("tabindex", "-1");

    input.setSelectionRange(1, 1);
    await user.keyboard("{ArrowLeft}");
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    await user.keyboard("{Home}");
    expect(input).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(radio("Right")).toHaveFocus();

    radio("Right").focus();
    await user.keyboard("{ArrowRight}");
    input.setSelectionRange(3, 3);
    await user.keyboard("{ArrowRight}");
    expect(button("Delete")).toHaveFocus();
  });

  it("keeps focus in the editor when the pointer presses a button", async () => {
    await renderBar({ preserveFocus: true });
    expect(await fireEvent.mouseDown(button("Bold"))).toBe(false);
  });

  it("leaves the pointer alone without preserveFocus", async () => {
    await renderBar();
    expect(await fireEvent.mouseDown(button("Bold"))).toBe(true);
  });
});

describe("ActionBar overflow", () => {
  /** Room for the trigger, Undo, Bold, a divider, the radios and Delete. */
  const ROOM = 40 * 8 + 17 * 2;

  async function renderOverflowing(room: number) {
    const observer = stubResizeObserver();
    const result = await renderBar();
    await observer.report(room);
    return { ...result, ...observer };
  }

  it("shows every button while they fit, and no trigger", async () => {
    await renderOverflowing(1000);
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
    expect(
      document.querySelector(".bx--action-bar__button--collapsed"),
    ).toBeNull();
  });

  it("collapses the last of the lowest priority first, into the menu", async () => {
    await renderOverflowing(ROOM);
    // Delete (priority 2) and Save (pinned) stay. The rest went from the end.
    expect(button("More")).toBeInTheDocument();
    const collapsed = [
      ...document.querySelectorAll(".bx--action-bar__button--collapsed"),
    ].map((node) => node.getAttribute("aria-label") ?? node.textContent);
    expect(collapsed.length).toBeGreaterThan(0);
    expect(button("Delete")).not.toHaveClass(
      "bx--action-bar__button--collapsed",
    );
    expect(button("Save")).not.toHaveClass("bx--action-bar__button--collapsed");
    expect(screen.getByTestId("overflow")).toHaveTextContent(
      String(collapsed.length),
    );

    await user.click(button("More"));
    const menu = screen.getByRole("menu");
    expect(menu.querySelectorAll('[role^="menuitem"]')).toHaveLength(
      collapsed.length,
    );
  });

  it("runs the collapsed button's own handler from its menu item", async () => {
    await renderOverflowing(40 * 3 + 17);
    expect(button("Delete")).toBeInTheDocument();
    await user.click(button("More"));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Bold" }));
    expect(clicks()).toBe("bold");
  });

  it("shows a disabled button as a disabled menu item", async () => {
    await renderOverflowing(40 * 2);
    await user.click(button("More"));
    const undo = screen.getByRole("menuitem", { name: "Undo" });
    expect(undo).toHaveAttribute("aria-disabled", "true");
  });

  it("moves focus to the trigger when the focused button collapses", async () => {
    const { report } = await renderOverflowing(1000);
    button("Bold").focus();
    await report(40 * 3);
    await waitFor(() => expect(button("More")).toHaveFocus());
    expect(button("More")).toHaveAttribute("tabindex", "0");
  });

  it("keeps the tab stop on the trigger when the tab stop's button collapsed", async () => {
    const { report } = await renderOverflowing(1000);
    button("Bold").focus();
    await user.keyboard("{ArrowRight}");
    button("Before").focus();
    await report(40 * 3);
    await waitFor(() =>
      expect(button("More")).toHaveAttribute("tabindex", "0"),
    );
    await user.tab();
    expect(button("More")).toHaveFocus();
  });

  it("returns focus to the first button when the trigger goes away", async () => {
    const { report } = await renderOverflowing(40 * 3);
    button("More").focus();
    await report(1000);
    await waitFor(() => expect(button("Undo")).toHaveFocus());
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  });

  it("clicks a button from its shortcut, also once it collapsed", async () => {
    const { report } = await renderOverflowing(1000);
    await user.keyboard("{Alt>}b{/Alt}");
    expect(clicks()).toBe("bold");
    await report(40 * 3);
    expect(button("Bold")).toHaveClass("bx--action-bar__button--collapsed");
    await user.keyboard("{Alt>}b{/Alt}");
    expect(clicks()).toBe("bold,bold");
  });
});
