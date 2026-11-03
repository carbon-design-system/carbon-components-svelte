import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TabsOverflowMenu from "./TabsOverflowMenu.test.svelte";
import { mockScrollMetrics } from "./helpers";

type Entry = { target: Element; intersectionRatio: number };

/** An `IntersectionObserver` the test drives by hand. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  private callback: (entries: Entry[]) => void;
  options: IntersectionObserverInit;
  constructor(
    callback: (entries: Entry[]) => void,
    options: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    FakeIntersectionObserver.instances.push(this);
  }
  observe(element: Element) {
    this.observed.push(element);
  }
  disconnect() {
    this.disconnected = true;
  }
  /** Report the tabs named by `ratios` (label to visible fraction). */
  report(ratios: Record<string, number>) {
    this.callback(
      this.observed.flatMap((target) => {
        const label = target
          .querySelector(".bx--tabs__nav-item-label")
          ?.textContent?.trim();
        return label && label in ratios
          ? [{ target, intersectionRatio: ratios[label] }]
          : [];
      }),
    );
  }
  static get current() {
    return FakeIntersectionObserver.instances.at(-1);
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Overflow the tab list, as the buttons only show then. */
async function overflow() {
  const nav = screen.getByRole("tablist");
  mockScrollMetrics(nav, { scrollWidth: 500, clientWidth: 100, scrollLeft: 0 });
  await fireEvent.scroll(nav);
  await tick();
}

async function renderOverflowing(props: Record<string, unknown> = {}) {
  render(TabsOverflowMenu, { props });
  await tick();
  await tick();
  await overflow();
  await tick();
}

describe("Tabs overflowMenu", () => {
  it("renders no menu button without `overflowMenu`, or while nothing overflows", async () => {
    const { unmount } = render(TabsOverflowMenu, {
      props: { overflowMenu: false },
    });
    await tick();
    await overflow();
    expect(
      screen.queryByRole("button", { name: "More tabs" }),
    ).not.toBeInTheDocument();
    unmount();

    render(TabsOverflowMenu);
    await tick();
    expect(
      screen.queryByRole("button", { name: "More tabs" }),
    ).not.toBeInTheDocument();
  });

  it("observes every tab from the tab list's own edge", async () => {
    await renderOverflowing();

    const observer = FakeIntersectionObserver.current;
    expect(observer?.observed).toHaveLength(5);
    expect(observer?.options.root).toBe(screen.getByRole("tablist"));
  });

  it("lists the tabs that are not whole in view, in tab order", async () => {
    await renderOverflowing();
    FakeIntersectionObserver.current?.report({
      Alpha: 0,
      Bravo: 0.5,
      Charlie: 1,
      Delta: 0,
      Echo: 0,
    });
    await tick();

    await user.click(screen.getByRole("button", { name: "More tabs" }));
    const menu = await screen.findByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["Alpha", "Bravo", "Delta Modified", "Echo"]);
  });

  it("drops a tab from the list once it scrolls whole into view", async () => {
    await renderOverflowing();
    const observer = FakeIntersectionObserver.current;
    observer?.report({ Alpha: 0, Bravo: 0, Charlie: 1, Delta: 1, Echo: 1 });
    await tick();
    observer?.report({ Bravo: 1 });
    await tick();

    await user.click(screen.getByRole("button", { name: "More tabs" }));
    const menu = await screen.findByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["Alpha"]);
  });

  it("selects a chosen tab, moves focus to it, and scrolls it into view", async () => {
    await renderOverflowing();
    FakeIntersectionObserver.current?.report({
      Alpha: 1,
      Bravo: 1,
      Charlie: 1,
      Delta: 0,
      Echo: 0,
    });
    await tick();
    const nav = screen.getByRole("tablist");
    const scrolled = vi.fn();
    nav.getBoundingClientRect = () =>
      ({ left: 0, right: 100, width: 100 }) as DOMRect;
    const delta = screen.getByRole("tab", { name: "Delta Modified" });
    delta.getBoundingClientRect = () =>
      ({ left: 300, right: 400, width: 100 }) as DOMRect;
    Object.defineProperty(nav, "scrollLeft", {
      configurable: true,
      get: () => 0,
      set: scrolled,
    });

    await user.click(screen.getByRole("button", { name: "More tabs" }));
    await user.click(await screen.findByRole("menuitem", { name: /Delta/ }));
    await tick();
    await tick();

    expect(screen.getByTestId("selected")).toHaveTextContent("d");
    expect(screen.getByRole("tab", { name: "Delta Modified" })).toHaveFocus();
    expect(scrolled).toHaveBeenCalled();
  });

  it("says in the menu which hidden tab is modified", async () => {
    await renderOverflowing();
    FakeIntersectionObserver.current?.report({ Charlie: 0, Delta: 0 });
    await tick();

    await user.click(screen.getByRole("button", { name: "More tabs" }));

    const charlie = await screen.findByRole("menuitem", { name: /Charlie/ });
    const delta = screen.getByRole("menuitem", { name: /Delta/ });
    expect(charlie).not.toHaveTextContent("Modified");
    expect(delta).toHaveTextContent("Modified");
  });

  it("disables a disabled tab's item", async () => {
    await renderOverflowing();
    FakeIntersectionObserver.current?.report({ Echo: 0 });
    await tick();

    await user.click(screen.getByRole("button", { name: "More tabs" }));

    expect(
      await screen.findByRole("menuitem", { name: "Echo" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("names the button with `overflowMenuText`", async () => {
    await renderOverflowing({ overflowMenuText: "All files" });

    expect(screen.getByRole("button", { name: "All files" })).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
  });

  it("stops observing when the menu is turned off", async () => {
    const { rerender } = render(TabsOverflowMenu);
    await tick();
    await tick();
    const observer = FakeIntersectionObserver.current;
    expect(observer?.disconnected).toBe(false);

    await rerender({ overflowMenu: false });
    await tick();

    expect(observer?.disconnected).toBe(true);
  });
});
