import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { generateCatalog } from "../../docs/src/catalog-page/catalog-data.js";
import { createMemorySource } from "../../docs/src/catalog-page/catalog-source.js";
import type {
  CatalogQuery,
  CatalogResult,
  CatalogSource,
} from "../../docs/src/catalog-page/catalog-source.js";
import { user } from "../utils/user";
import CatalogPage from "./CatalogPageHarness.test.svelte";

const items = generateCatalog(300);

/** A source whose answers are released by hand. */
function gatedSource() {
  const inner = createMemorySource({ items });
  const gates: Array<() => void> = [];
  const seen: CatalogQuery[] = [];
  let hold = false;
  const source: CatalogSource = {
    maxLimit: inner.maxLimit,
    async query(query) {
      seen.push(query);
      const result: CatalogResult = await inner.query(query);
      if (hold) await new Promise<void>((resolve) => gates.push(resolve));
      return result;
    },
  };
  return {
    source,
    seen,
    hold: () => {
      hold = true;
    },
    release: () => {
      hold = false;
      for (const gate of gates.splice(0)) gate();
    },
  };
}

const cards = () => document.querySelectorAll(".ccs-catalog-card");
const titles = () =>
  [...document.querySelectorAll(".ccs-catalog-card__link")].map(
    (link) => link.textContent?.trim() ?? "",
  );

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  window.scrollTo = vi.fn();
  history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CatalogPage", () => {
  it("shows skeletons first, then the cards, and says nothing at load", async () => {
    const gate = gatedSource();
    gate.hold();
    render(CatalogPage, { props: { source: gate.source } });

    expect(screen.getByLabelText("Loading results")).toBeInTheDocument();
    expect(cards()).toHaveLength(0);

    gate.release();
    await waitFor(() => expect(cards()).toHaveLength(24));
    expect(screen.queryByLabelText("Loading results")).toBeNull();
    // The panel has a status region of its own, empty because the page speaks
    // the count.
    expect(document.querySelector(".ccs-catalog__status")).toHaveTextContent(
      "",
    );
    expect(screen.getByText("300 results")).toBeInTheDocument();
  });

  it("keeps the old results while the new ones load", async () => {
    const gate = gatedSource();
    render(CatalogPage, { props: { source: gate.source } });
    await waitFor(() => expect(cards()).toHaveLength(24));
    const before = titles();

    gate.hold();
    await user.click(screen.getByRole("checkbox", { name: /^Compute/ }));

    // Asked, not answered: the cards are the old ones, marked busy, with no
    // skeleton in their place.
    await waitFor(() =>
      expect(gate.seen.at(-1)?.filters).toEqual({ category: ["Compute"] }),
    );
    expect(titles()).toEqual(before);
    expect(screen.queryByLabelText("Loading results")).toBeNull();
    expect(document.querySelector(".ccs-catalog__results")).toHaveAttribute(
      "aria-busy",
      "true",
    );

    gate.release();
    await waitFor(() => expect(titles()).not.toEqual(before));
    expect(document.querySelector(".ccs-catalog__results")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    // The chip says what is applied.
    expect(
      screen.getByRole("button", { name: "Remove filter Category: Compute" }),
    ).toBeInTheDocument();
  });

  it("makes a card one link with its buttons beside it, not inside it", async () => {
    const onhash = vi.fn();
    window.addEventListener("hashchange", onhash);
    render(CatalogPage, { props: { source: createMemorySource({ items }) } });
    await waitFor(() => expect(cards()).toHaveLength(24));

    const card = cards()[0] as HTMLElement;
    const link = card.querySelector("a") as HTMLAnchorElement;
    expect(card.querySelectorAll("a")).toHaveLength(1);
    // Nothing interactive sits inside the link.
    expect(link.querySelector("button, a, input, [tabindex]")).toBeNull();
    const favorite = within(card).getByRole("button", { name: /^Favorite / });
    expect(link.contains(favorite)).toBe(false);

    await user.click(favorite);
    expect(favorite).toHaveAttribute("aria-pressed", "true");
    // Pressing a button is not following the card.
    expect(onhash).not.toHaveBeenCalled();
    window.removeEventListener("hashchange", onhash);
  });

  it("explains an empty result and clears it", async () => {
    render(CatalogPage, {
      props: { source: createMemorySource({ items }), url: "?q=zzzz-nothing" },
    });

    expect(
      await screen.findByRole("heading", {
        name: "No results for “zzzz-nothing”",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    await waitFor(() => expect(cards()).toHaveLength(24));
  });

  it("loads the next page onto the end of the list, and keeps the page count", async () => {
    const gate = gatedSource();
    render(CatalogPage, {
      props: { source: gate.source, syncUrl: true },
    });
    await waitFor(() => expect(cards()).toHaveLength(24));

    await user.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(cards()).toHaveLength(48));
    expect(gate.seen.at(-1)?.cursor).not.toBeNull();
    expect(new Set(titles().map((t) => t)).size).toBeGreaterThan(0);
    expect(location.search).toBe("?page=2");
    expect(screen.getByText("Showing 48 of 300")).toBeInTheDocument();
  });

  it("puts the state in the URL and follows the back button", async () => {
    render(CatalogPage, {
      props: { source: createMemorySource({ items }), syncUrl: true },
    });
    await waitFor(() => expect(cards()).toHaveLength(24));

    await user.click(screen.getByRole("checkbox", { name: /^Compute/ }));
    expect(location.search).toBe("?category=Compute");
    await waitFor(() =>
      expect(screen.getByText(/^\d+ results$/)).toBeInTheDocument(),
    );
    const filtered = screen.getByText(/^\d+ results$/).textContent;
    expect(filtered).not.toBe("300 results");

    history.back();
    await waitFor(() => expect(location.search).toBe(""));
    await waitFor(() =>
      expect(screen.getByText("300 results")).toBeInTheDocument(),
    );
    await tick();
    expect(
      screen.getByRole("checkbox", { name: /^Compute/ }),
    ).not.toBeChecked();
  });
});
