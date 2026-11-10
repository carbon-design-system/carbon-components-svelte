import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import {
  type IntersectionObserverMock,
  stubIntersectionObserver,
} from "../utils/intersection-observer-mock";
import { user } from "../utils/user";
import InfiniteList from "./InfiniteList.test.svelte";
import { deferred, firstPage, pagedLoader } from "./helpers";

const rows = () => screen.queryAllByTestId(/^row-/);
const loadMore = () => screen.getByRole("button", { name: /^Load more/ });
const status = () => screen.getByRole("status", { hidden: true });

describe("InfiniteList", () => {
  let instances: IntersectionObserverMock[];

  beforeEach(() => {
    ({ instances } = stubIntersectionObserver());
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Tells the list its footer is within the root margin. */
  async function reachEnd(container: HTMLElement) {
    const footer = container.querySelector(".bx--infinite-list__footer");
    assert(footer);
    for (const observer of instances) {
      if (observer.elements.has(footer)) observer.trigger(footer, true);
    }
    await flushMacrotask();
  }

  it("renders the first page with its position in the set", () => {
    const { load } = pagedLoader();
    render(InfiniteList, { props: { load, initial: firstPage() } });

    expect(rows()).toHaveLength(5);
    expect(load).not.toHaveBeenCalled();
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("aria-posinset", "1");
    expect(items[4]).toHaveAttribute("aria-posinset", "5");
    expect(items[0]).toHaveAttribute("aria-setsize", "40");
    expect(screen.getByText("Showing 5 of 40")).toBeInTheDocument();
  });

  it("says the size is unknown with -1 until the last page", async () => {
    const { load } = pagedLoader({ total: 8, reportTotal: false });
    render(InfiniteList, {
      props: {
        load,
        initial: { items: firstPage().items, nextCursor: 5 },
      },
    });
    expect(screen.getAllByRole("listitem")[0]).toHaveAttribute(
      "aria-setsize",
      "-1",
    );
    expect(screen.queryByText(/^Showing/)).toBeNull();

    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(8));
    for (const item of screen.getAllByRole("listitem")) {
      expect(item).toHaveAttribute("aria-setsize", "8");
    }
  });

  it("loads the first page on mount without an initial page", async () => {
    const { load } = pagedLoader();
    render(InfiniteList, { props: { load } });

    expect(screen.getByText("Loading results")).toBeInTheDocument();
    await waitFor(() => expect(rows()).toHaveLength(5));
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0][0].cursor).toBeUndefined();
  });

  it("loads the next page with the cursor, announces it, and focuses its first item", async () => {
    const { load } = pagedLoader();
    const onLoaded = vi.fn();
    render(InfiniteList, {
      props: { load, initial: firstPage(), onLoaded },
    });

    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(10));

    expect(load.mock.calls[0][0].cursor).toBe(5);
    expect(status()).toHaveTextContent("5 more results loaded");
    expect(screen.getByTestId("row-6")).toHaveFocus();
    expect(screen.getByText("Showing 10 of 40")).toBeInTheDocument();
    expect(onLoaded).toHaveBeenCalledWith({
      items: [6, 7, 8, 9, 10].map((id) => ({ id })),
      count: 10,
      page: 2,
    });
  });

  it("announces a repeated message again", async () => {
    const { load } = pagedLoader();
    render(InfiniteList, { props: { load, initial: firstPage() } });

    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(10));
    const first = status().querySelector("span");
    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(15));

    expect(status()).toHaveTextContent("5 more results loaded");
    expect(status().querySelector("span")).not.toBe(first);
  });

  it("shows busy on the button and the list while a page loads", async () => {
    const page = deferred<Awaited<ReturnType<typeof firstPage>>>();
    const load = vi.fn(() => page.promise);
    render(InfiniteList, { props: { load, initial: firstPage() } });

    await user.click(loadMore());
    const button = screen.getByRole("button", { name: /Loading more/ });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "true");

    // A second click while it loads asks for nothing.
    await user.click(button);
    expect(load).toHaveBeenCalledTimes(1);

    page.resolve({ items: [{ id: 6 }], nextCursor: undefined });
    await waitFor(() => expect(rows()).toHaveLength(6));
    expect(screen.getByRole("list")).not.toHaveAttribute("aria-busy");
  });

  it("ends the list", async () => {
    const { load } = pagedLoader({ total: 7 });
    render(InfiniteList, { props: { load, initial: firstPage(5, 7) } });

    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(7));
    expect(screen.queryByRole("button", { name: /Load more/ })).toBeNull();
    expect(
      screen.getByText("You have reached the end of the results."),
    ).toBeInTheDocument();
  });

  it("drops an item an earlier page already holds", async () => {
    const load = vi.fn(() =>
      Promise.resolve({
        items: [{ id: 5 }, { id: 6 }, { id: 7 }],
        nextCursor: undefined,
      }),
    );
    render(InfiniteList, { props: { load, initial: firstPage() } });

    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(7));
    expect(status()).toHaveTextContent("2 more results loaded");
    expect(screen.getAllByRole("listitem")[6]).toHaveAttribute(
      "aria-posinset",
      "7",
    );
  });

  it("stops at the depth cap and says so", async () => {
    const { load } = pagedLoader({ total: 4000 });
    render(InfiniteList, {
      props: { load, initial: firstPage(5, 4000), maxItems: 10 },
    });

    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(10));
    expect(screen.queryByRole("button", { name: /Load more/ })).toBeNull();
    expect(
      screen.getByText("Showing 10 of 4,000. Refine your search to see more."),
    ).toBeInTheDocument();
  });

  it("keeps the items and offers a retry when a page fails", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ items: [{ id: 6 }], nextCursor: undefined });
    const onError = vi.fn();
    render(InfiniteList, {
      props: { load, initial: firstPage(), onError },
    });

    await user.click(loadMore());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not load results.");
    expect(rows()).toHaveLength(5);
    expect(onError).toHaveBeenCalledWith({ error: new Error("offline") });
    expect(screen.queryByRole("button", { name: /Load more/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(rows()).toHaveLength(6));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(load).toHaveBeenCalledTimes(2);
    expect(load.mock.calls[1][0].cursor).toBe(5);
  });

  it("shows the error and retry when the first page fails", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(firstPage());
    render(InfiniteList, { props: { load } });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(rows()).toHaveLength(5));
  });

  it("shows the empty state", async () => {
    const load = vi.fn(() =>
      Promise.resolve({ items: [], nextCursor: undefined }),
    );
    render(InfiniteList, { props: { load } });
    expect(await screen.findByText("No results")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByRole("button", { name: /Load more/ })).toBeNull();
  });

  it("marks lazy items for the browser to skip off screen", () => {
    const { load } = pagedLoader();
    const { container } = render(InfiniteList, {
      props: { load, initial: firstPage(), lazyItems: true },
    });
    expect(container.querySelector(".bx--infinite-list")).toHaveClass(
      "bx--infinite-list--lazy",
    );
  });

  it("starts over on reset", async () => {
    const { load } = pagedLoader();
    render(InfiniteList, { props: { load, initial: firstPage() } });
    await user.click(loadMore());
    await waitFor(() => expect(rows()).toHaveLength(10));

    await user.click(screen.getByTestId("reset"));
    await waitFor(() => expect(rows()).toHaveLength(5));
    expect(load.mock.calls.at(-1)?.[0].cursor).toBeUndefined();
  });

  describe("mode", () => {
    it("loads nothing on scroll in button mode", async () => {
      const { load } = pagedLoader();
      const { container } = render(InfiniteList, {
        props: { load, initial: firstPage() },
      });
      await tick();
      await reachEnd(container);
      expect(load).not.toHaveBeenCalled();
    });

    it("loads as the end nears in auto mode, and keeps the button", async () => {
      const { load } = pagedLoader();
      const { container } = render(InfiniteList, {
        props: { load, initial: firstPage(), mode: "auto" },
      });
      await tick();
      expect(instances[0].options?.rootMargin).toBe("400px");
      await reachEnd(container);
      await waitFor(() => expect(rows()).toHaveLength(10));
      // Auto loads do not take focus from the reader.
      expect(screen.getByTestId("row-6")).not.toHaveFocus();
      expect(loadMore()).toBeInTheDocument();
    });

    it("hands over to the button after autoPages", async () => {
      const { load } = pagedLoader({ total: 100 });
      const { container } = render(InfiniteList, {
        props: {
          load,
          initial: firstPage(5, 100),
          mode: "auto-then-button",
          autoPages: 2,
        },
      });
      await tick();
      await reachEnd(container);
      await waitFor(() => expect(rows()).toHaveLength(10));
      await reachEnd(container);
      await waitFor(() => expect(rows()).toHaveLength(15));
      await reachEnd(container);
      await reachEnd(container);
      expect(rows()).toHaveLength(15);
      expect(load).toHaveBeenCalledTimes(2);

      await user.click(loadMore());
      await waitFor(() => expect(rows()).toHaveLength(20));
    });

    it("checks again after a page that leaves the end in view", async () => {
      const { load } = pagedLoader();
      const { container } = render(InfiniteList, {
        props: { load, initial: firstPage(), mode: "auto" },
      });
      await tick();
      await reachEnd(container);
      await waitFor(() => expect(rows()).toHaveLength(10));
      // The footer is observed again, which queues a fresh entry.
      await reachEnd(container);
      await waitFor(() => expect(rows()).toHaveLength(15));
    });

    it("does not load under a reader who is tabbing through the list", async () => {
      const { load } = pagedLoader();
      const { container } = render(InfiniteList, {
        props: { load, initial: firstPage(), mode: "auto" },
      });
      await tick();
      screen.getByTestId("row-5").focus();
      await reachEnd(container);
      expect(load).not.toHaveBeenCalled();

      // Leaving the list ends the pause.
      screen.getByTestId("reset").focus();
      await flushMacrotask();
      await reachEnd(container);
      await waitFor(() => expect(rows()).toHaveLength(10));
    });

    it("does not load on scroll after a failure", async () => {
      const load = vi.fn().mockRejectedValue(new Error("offline"));
      const { container } = render(InfiniteList, {
        props: { load, initial: firstPage(), mode: "auto" },
      });
      await tick();
      await reachEnd(container);
      await screen.findByRole("alert");
      await reachEnd(container);
      expect(load).toHaveBeenCalledTimes(1);
    });
  });

  describe("feed", () => {
    it("uses the feed roles", () => {
      const { load } = pagedLoader();
      render(InfiniteList, {
        props: { load, initial: firstPage(), pattern: "feed" },
      });
      const feed = screen.getByRole("feed");
      const articles = screen.getAllByRole("article");
      expect(articles).toHaveLength(5);
      expect(feed).not.toHaveAttribute("aria-busy");
      expect(articles[1]).toHaveAttribute("aria-posinset", "2");
      expect(articles[1]).toHaveAttribute("aria-setsize", "40");
    });

    it("moves between articles with Page Down and Page Up", async () => {
      const { load } = pagedLoader();
      render(InfiniteList, {
        props: { load, initial: firstPage(), pattern: "feed" },
      });
      const articles = screen.getAllByRole("article");
      screen.getByTestId("row-1").focus();
      await user.keyboard("{PageDown}");
      expect(articles[1]).toHaveFocus();
      await user.keyboard("{PageUp}");
      expect(articles[0]).toHaveFocus();
    });

    it("loads more with Page Down on the last article", async () => {
      const { load } = pagedLoader();
      render(InfiniteList, {
        props: { load, initial: firstPage(), pattern: "feed" },
      });
      screen.getByTestId("row-5").focus();
      await user.keyboard("{PageDown}");
      await waitFor(() => expect(rows()).toHaveLength(10));
      expect(screen.getByTestId("row-6")).toHaveFocus();
    });
  });

  describe("skip link", () => {
    it("moves focus past the list", async () => {
      const { load } = pagedLoader();
      render(InfiniteList, { props: { load, initial: firstPage(), id: "r" } });
      const skip = screen.getByRole("link", { name: "Skip to end of results" });
      expect(skip).toHaveAttribute("href", "#r-end");
      await user.click(skip);
      expect(document.getElementById("r-end")).toHaveFocus();
    });

    it("can be left out", () => {
      const { load } = pagedLoader();
      render(InfiniteList, {
        props: { load, initial: firstPage(), skipLink: false },
      });
      expect(screen.queryByRole("link", { name: /Skip/ })).toBeNull();
    });
  });

  describe("restore", () => {
    const entry = { key: "entry-1" };

    beforeEach(() => {
      vi.stubGlobal("navigation", { currentEntry: entry });
    });

    function snapshotKey() {
      return `ccs:infinite-list:rows:${entry.key}`;
    }

    it("saves the cursors of the loaded pages and the first item in view", async () => {
      const { load } = pagedLoader();
      const { container } = render(InfiniteList, {
        props: { load, initial: firstPage(), restore: "rows" },
      });
      // jsdom lays nothing out, and an element with no boxes is skipped.
      const root = container.querySelector(".bx--infinite-list");
      assert(root);
      root.getClientRects = () => [{}] as unknown as DOMRectList;
      await user.click(loadMore());
      await waitFor(() => expect(rows()).toHaveLength(10));
      await user.click(loadMore());
      await waitFor(() => expect(rows()).toHaveLength(15));
      // Rows are 20px tall; the third has its top 5px above the viewport.
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        const top = (Number(this.getAttribute("aria-posinset")) - 3) * 20 - 5;
        return { top, bottom: top + 20 } as DOMRect;
      };
      try {
        window.dispatchEvent(new Event("pagehide"));
      } finally {
        Element.prototype.getBoundingClientRect = original;
      }

      const saved = JSON.parse(sessionStorage.getItem(snapshotKey()) ?? "null");
      expect(saved).toMatchObject({
        v: 1,
        cursors: [null, 5, 10],
        anchorKey: 3,
        offset: -5,
      });
    });

    it("loads the saved pages together and scrolls the anchor back", async () => {
      sessionStorage.setItem(
        snapshotKey(),
        JSON.stringify({
          v: 1,
          cursors: [null, 5, 10, 15],
          anchorKey: 12,
          offset: 40,
          y: 900,
        }),
      );
      const { load, requests } = pagedLoader({ pageSize: 5, total: 40 });
      const scrollBy = vi.fn();
      vi.stubGlobal("scrollBy", scrollBy);
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        const top = this.getAttribute("aria-posinset") === "12" ? 700 : -100;
        return { top, bottom: top + 20 } as DOMRect;
      };

      try {
        render(InfiniteList, {
          props: { load, initial: firstPage(), restore: "rows" },
        });
        await waitFor(() => expect(rows()).toHaveLength(20));
      } finally {
        await waitFor(() => expect(scrollBy).toHaveBeenCalled());
        Element.prototype.getBoundingClientRect = original;
      }

      expect(requests.map((r) => r.cursor)).toEqual([5, 10, 15]);
      // 700 - 0 - 40: the item belongs 40px from the top.
      expect(scrollBy).toHaveBeenCalledWith(0, 660);
      expect(screen.getByRole("list")).not.toHaveAttribute("aria-busy");
    });

    it("does not announce the pages it restores", async () => {
      sessionStorage.setItem(
        snapshotKey(),
        JSON.stringify({
          v: 1,
          cursors: [null, 5],
          anchorKey: 1,
          offset: 0,
          y: 0,
        }),
      );
      const { load } = pagedLoader();
      render(InfiniteList, {
        props: { load, initial: firstPage(), restore: "rows" },
      });
      await waitFor(() => expect(rows()).toHaveLength(10));
      expect(status()).toHaveTextContent("");
    });

    it("holds history.scrollRestoration at manual while mounted", () => {
      history.scrollRestoration = "auto";
      const { load } = pagedLoader();
      const { unmount } = render(InfiniteList, {
        props: { load, initial: firstPage(), restore: "rows" },
      });
      expect(history.scrollRestoration).toBe("manual");
      unmount();
      expect(history.scrollRestoration).toBe("auto");
    });

    it("leaves history.scrollRestoration alone without restore", () => {
      history.scrollRestoration = "auto";
      const { load } = pagedLoader();
      render(InfiniteList, { props: { load, initial: firstPage() } });
      expect(history.scrollRestoration).toBe("auto");
    });

    it("starts at the top for a new history entry", async () => {
      sessionStorage.setItem(
        snapshotKey(),
        JSON.stringify({
          v: 1,
          cursors: [null, 5],
          anchorKey: 3,
          offset: 0,
          y: 100,
        }),
      );
      entry.key = "entry-2";
      const { load } = pagedLoader();
      render(InfiniteList, {
        props: { load, initial: firstPage(), restore: "rows" },
      });
      await flushMacrotask();
      expect(rows()).toHaveLength(5);
      expect(load).not.toHaveBeenCalled();
      entry.key = "entry-1";
    });

    it("shows the pages it reached when one fails", async () => {
      sessionStorage.setItem(
        snapshotKey(),
        JSON.stringify({
          v: 1,
          cursors: [null, 5, 10],
          anchorKey: 1,
          offset: 0,
          y: 0,
        }),
      );
      const load = vi.fn(({ cursor }: { cursor: unknown }) =>
        cursor === 10
          ? Promise.reject(new Error("offline"))
          : Promise.resolve({
              items: Array.from({ length: 5 }, (_, i) => ({ id: 6 + i })),
              nextCursor: 10,
            }),
      );
      render(InfiniteList, {
        props: { load, initial: firstPage(), restore: "rows" },
      });
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(rows()).toHaveLength(10);
    });
  });
});
