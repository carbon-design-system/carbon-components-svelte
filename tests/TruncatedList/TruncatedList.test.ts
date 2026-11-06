import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TruncatedList from "./TruncatedList.test.svelte";

const names = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Edsger Dijkstra",
];

// The visible text, without the visually hidden full list.
const visibleText = (root: HTMLElement) => {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const hidden of clone.querySelectorAll(".bx--visually-hidden")) {
    hidden.remove();
  }
  return clone.textContent?.replace(/\s+/g, " ").trim();
};

afterEach(() => {
  for (const portal of document.querySelectorAll("[data-floating-portal]")) {
    portal.remove();
  }
});

describe("TruncatedList", () => {
  it("shows max items and a more button", () => {
    render(TruncatedList, { props: { items: names, max: 2 } });

    const list = screen.getByTestId("list");
    expect(list).toHaveClass("bx--truncated-list");
    expect(visibleText(list)).toBe("Ada Lovelace, Grace Hopper, and 2 more");
    expect(screen.getByRole("button", { name: "2 more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("shows every item, with no button, when they fit", () => {
    render(TruncatedList, { props: { items: names, max: 4 } });

    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace, Grace Hopper, Alan Turing, and Edsger Dijkstra",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("list").querySelector(".bx--visually-hidden"),
    ).toBeNull();
  });

  it.each(["popover", "expand", "title", "none"] as const)(
    "reads the hidden items to a screen reader without opening them (%s)",
    (overflow) => {
      render(TruncatedList, { props: { items: names, max: 2, overflow } });

      expect(
        screen.getByTestId("list").querySelector(".bx--visually-hidden"),
      ).toHaveTextContent("Alan Turing and Edsger Dijkstra");
    },
  );

  it("opens the hidden items in a toggletip", async () => {
    render(TruncatedList, {
      props: {
        items: [
          "Ada Lovelace",
          "Grace Hopper",
          { label: "Alan Turing", href: "/alan" },
          "Edsger Dijkstra",
        ],
        max: 2,
      },
    });
    const button = screen.getByRole("button", { name: "2 more" });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("list");
    expect(list.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Alan Turing" })).toHaveAttribute(
      "href",
      "/alan",
    );
  });

  it("renders linked items as links in the sentence", () => {
    render(TruncatedList, {
      props: { items: [{ label: "Ada", href: "/ada" }, "Grace"], max: 2 },
    });

    expect(screen.getByRole("link", { name: "Ada" })).toHaveAttribute(
      "href",
      "/ada",
    );
  });

  it("renders the item slot, here and in the toggletip", async () => {
    render(TruncatedList, {
      props: { items: names, max: 2, highlight: true },
    });

    expect(screen.getByTestId("item-0")).toHaveTextContent("Ada Lovelace");
    expect(screen.getByTestId("item-1")).toHaveTextContent("Grace Hopper");

    await user.click(screen.getByRole("button", { name: "2 more" }));

    // The index counts from the first item, not from the toggletip's.
    expect(screen.getByTestId("item-2")).toHaveTextContent("Alan Turing");
    expect(screen.getByTestId("item-3")).toHaveTextContent("Edsger Dijkstra");
  });

  it("isolates each item from the sentence's direction", () => {
    render(TruncatedList, { props: { items: names, max: 2 } });

    expect(
      screen.getByTestId("list").querySelectorAll(":scope > bdi"),
    ).toHaveLength(2);
  });

  describe("overflow", () => {
    it("expands in place and collapses again, handing focus along", async () => {
      render(TruncatedList, {
        props: { items: names, max: 2, overflow: "expand" },
      });

      await user.click(screen.getByRole("button", { name: "2 more" }));

      const less = screen.getByRole("button", { name: "Show less" });
      expect(visibleText(screen.getByTestId("list"))).toBe(
        "Ada Lovelace, Grace Hopper, Alan Turing, and Edsger Dijkstra Show less",
      );
      expect(less).toHaveAttribute("aria-expanded", "true");
      expect(less).toHaveFocus();

      await user.click(less);

      const more = screen.getByRole("button", { name: "2 more" });
      expect(more).toHaveFocus();
      expect(more).toHaveAttribute("aria-expanded", "false");
    });

    it("follows a bound expanded", async () => {
      const { rerender } = render(TruncatedList, {
        props: { items: names, max: 2, overflow: "expand", expanded: true },
      });

      expect(screen.getByRole("button", { name: "Show less" })).toBeVisible();

      await rerender({ expanded: false });
      expect(screen.getByRole("button", { name: "2 more" })).toBeVisible();
    });

    it("lists the hidden items in a title, with no button", () => {
      render(TruncatedList, {
        props: { items: names, max: 2, overflow: "title" },
      });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(
        screen.getByTestId("list").querySelector(".bx--truncated-list__more"),
      ).toHaveAttribute("title", "Alan Turing and Edsger Dijkstra");
    });

    it("only counts the hidden items with none", () => {
      render(TruncatedList, {
        props: { items: names, max: 2, overflow: "none" },
      });

      const more = screen
        .getByTestId("list")
        .querySelector(".bx--truncated-list__more");
      expect(more).toHaveTextContent("2 more");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(more).not.toHaveAttribute("title");
    });
  });

  describe("locale", () => {
    it.each([
      ["en", "Ada Lovelace, Grace Hopper, and 2 more"],
      ["en-GB", "Ada Lovelace, Grace Hopper and 2 more"],
      ["de", "Ada Lovelace, Grace Hopper und 2 more"],
      ["ja", "Ada Lovelace、Grace Hopper、2 more"],
      ["zh", "Ada Lovelace、Grace Hopper和2 more"],
    ])("joins as %s does", (locale, text) => {
      render(TruncatedList, { props: { items: names, max: 2, locale } });

      // Toggletip's markup leaves a space beside the button that a flex
      // box drops, so compare without whitespace.
      expect(visibleText(screen.getByTestId("list"))?.replace(/\s/g, "")).toBe(
        text.replace(/\s/g, ""),
      );
    });

    it.each([
      ["en", "ltr"],
      ["de", "ltr"],
      ["ja", "ltr"],
      ["ar", "rtl"],
    ])("sets the direction of %s to %s", (locale, dir) => {
      render(TruncatedList, { props: { items: names, max: 2, locale } });

      expect(screen.getByTestId("list")).toHaveAttribute("dir", dir);
    });

    it("joins Arabic with its own conjunction", () => {
      render(TruncatedList, {
        props: { items: names, max: 2, locale: "ar" },
      });

      expect(visibleText(screen.getByTestId("list"))?.replace(/\s/g, "")).toBe(
        "AdaLovelaceوGraceHopperو2more",
      );
    });

    it("falls back to English for an invalid locale", () => {
      render(TruncatedList, {
        props: { items: names, max: 2, locale: "en_US" },
      });

      expect(visibleText(screen.getByTestId("list"))).toBe(
        "Ada Lovelace, Grace Hopper, and 2 more",
      );
    });

    it("takes the more text from translateWithId, by plural form", () => {
      const translations: Record<string, string> = {
        "more.one": "{count} weiterer",
        "more.other": "{count} weitere",
        less: "Weniger",
      };
      const translateWithId = (id: string) => translations[id];

      const { unmount } = render(TruncatedList, {
        props: { items: names, max: 2, locale: "de", translateWithId },
      });
      expect(visibleText(screen.getByTestId("list"))).toBe(
        "Ada Lovelace, Grace Hopper und 2 weitere",
      );
      unmount();

      render(TruncatedList, {
        props: { items: names, max: 3, locale: "de", translateWithId },
      });
      expect(visibleText(screen.getByTestId("list"))).toBe(
        "Ada Lovelace, Grace Hopper, Alan Turing und 1 weiterer",
      );
    });

    it("falls back to more.other for a plural form left out", () => {
      render(TruncatedList, {
        props: {
          items: names,
          max: 3,
          // English has "one", and this leaves it out.
          translateWithId: (id: string) =>
            id === "more.other" ? "{count} others" : undefined,
        },
      });

      expect(screen.getByRole("button", { name: "1 others" })).toBeVisible();
    });
  });

  it("follows items and max as they change", async () => {
    const { rerender } = render(TruncatedList, {
      props: { items: names, max: 1 },
    });
    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace and 3 more",
    );

    await rerender({ max: 3 });
    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace, Grace Hopper, Alan Turing, and 1 more",
    );

    await rerender({ items: names.slice(0, 2) });
    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace and Grace Hopper",
    );
  });

  it("shows every item at max Infinity", () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY },
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a thousand items as max, and lists the rest on demand", async () => {
    const many = Array.from({ length: 1000 }, (_, i) => `Person ${i}`);
    render(TruncatedList, { props: { items: many, max: 3 } });

    const list = screen.getByTestId("list");
    expect(visibleText(list)).toBe(
      "Person 0, Person 1, Person 2, and 997 more",
    );
    expect(list.querySelectorAll(":scope > bdi")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "997 more" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(997);
  });

  it("passes rest props and a class to the element", () => {
    render(TruncatedList, {
      props: { items: names, class: "custom", "aria-label": "Assignees" },
    });

    const list = screen.getByTestId("list");
    expect(list).toHaveClass("bx--truncated-list", "custom");
    expect(list).toHaveAttribute("aria-label", "Assignees");
  });
});

describe("TruncatedList fit=width", () => {
  type Observer = { callback: ResizeObserverCallback };
  const observers: Observer[] = [];
  const original = globalThis.ResizeObserver;
  const rectSpy = vi.spyOn(Element.prototype, "getBoundingClientRect");

  // Ten pixels a character, in a line `lineWidth` wide.
  let lineWidth = 400;
  const CHARACTER = 10;

  beforeEach(() => {
    observers.length = 0;
    lineWidth = 400;
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback });
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    rectSpy.mockImplementation(function (this: Element) {
      const width = this.classList.contains("bx--truncated-list__measure")
        ? (this.textContent?.length ?? 0) * CHARACTER
        : lineWidth;
      return {
        width,
        height: 20,
        top: 0,
        left: 0,
        right: width,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON() {},
      };
    });
  });

  afterEach(() => {
    globalThis.ResizeObserver = original;
    rectSpy.mockReset();
  });

  const resize = async (width: number) => {
    lineWidth = width;
    const target = screen.getByTestId("list");
    for (const { callback } of observers) {
      callback(
        [{ target } as unknown as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    }
    await tick();
  };

  it("fits as many items as the line holds, with the more text in it", async () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });
    await tick();

    // "Ada Lovelace, Grace Hopper, and 2 more" is 38 characters.
    await resize(380);
    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace, Grace Hopper, and 2 more",
    );

    await resize(379);
    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace and 3 more",
    );
  });

  it("shows every item when the line holds them", async () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });

    await resize(1000);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace, Grace Hopper, Alan Turing, and Edsger Dijkstra",
    );
  });

  it("never shows more than max", async () => {
    render(TruncatedList, { props: { items: names, max: 2, fit: "width" } });

    await resize(1000);

    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace, Grace Hopper, and 2 more",
    );
  });

  it("keeps the first item when not even it fits", async () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });

    await resize(20);

    expect(visibleText(screen.getByTestId("list"))).toBe(
      "Ada Lovelace and 3 more",
    );
  });

  it("puts the whole list in a title when the first item is clipped", async () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });
    await resize(20);

    expect(screen.getByTestId("list")).toHaveAttribute(
      "title",
      "Ada Lovelace, Grace Hopper, Alan Turing, and Edsger Dijkstra",
    );

    await resize(1000);
    expect(screen.getByTestId("list")).not.toHaveAttribute("title");
  });

  it("settles on the same count after a run of resizes", async () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });
    const text = () => visibleText(screen.getByTestId("list"));

    await resize(380);
    const at380 = text();
    await resize(900);
    await resize(100);
    await resize(250);
    await resize(600);
    await resize(150);
    await resize(380);

    expect(text()).toBe(at380);
  });

  it("measures offscreen and leaves the measurer empty", async () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });
    await resize(380);

    const measurer = screen
      .getByTestId("list")
      .querySelector(".bx--truncated-list__measure");
    expect(measurer).toHaveAttribute("aria-hidden", "true");
    expect(measurer).toBeEmptyDOMElement();
  });

  it("fits a thousand items with small probes", async () => {
    const many = Array.from({ length: 1000 }, (_, i) => `Person ${i}`);
    const lengths: number[] = [];
    rectSpy.mockImplementation(function (this: Element) {
      const isMeasurer = this.classList.contains("bx--truncated-list__measure");
      if (isMeasurer) lengths.push(this.textContent?.length ?? 0);
      const width = isMeasurer
        ? (this.textContent?.length ?? 0) * CHARACTER
        : lineWidth;
      return {
        width,
        height: 20,
        top: 0,
        left: 0,
        right: width,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON() {},
      };
    });
    render(TruncatedList, {
      props: { items: many, max: Number.POSITIVE_INFINITY, fit: "width" },
    });
    lengths.length = 0;

    await resize(500);

    // Settled by doubling, so no probe is the middle of a thousand items.
    expect(Math.max(...lengths)).toBeLessThan(120);
    expect(lengths.length).toBeLessThan(16);
    expect(visibleText(screen.getByTestId("list"))).toMatch(/and \d+ more$/);
  });

  it("refits when the items change", async () => {
    const { rerender } = render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });
    await resize(380);

    await rerender({ items: ["Al", "Bo", "Cy"] });
    await waitFor(() =>
      expect(visibleText(screen.getByTestId("list"))).toBe("Al, Bo, and Cy"),
    );
  });

  it("renders the toggletip in a portal, out of the clipping line", async () => {
    render(TruncatedList, {
      props: { items: names, max: Number.POSITIVE_INFINITY, fit: "width" },
    });
    await resize(380);

    await user.click(screen.getByRole("button", { name: "2 more" }));

    const items = screen.getAllByRole("listitem");
    expect(screen.getByTestId("list")).not.toContainElement(items[0]);
  });
});
