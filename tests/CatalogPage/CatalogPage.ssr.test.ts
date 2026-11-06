// @vitest-environment node
import { generateCatalog } from "../../docs/src/catalog-page/catalog-data.js";
import {
  createMemorySource,
  loadCatalog,
} from "../../docs/src/catalog-page/catalog-source.js";
import { parseCatalogUrl } from "../../docs/src/catalog-page/catalog-url.js";
import { renderSSR } from "../utils/ssr";
import CatalogPageHarness from "./CatalogPageHarness.test.svelte";

const source = createMemorySource({ items: generateCatalog(800) });

/** What a server does: read the URL, ask the source, render. */
async function serve(search: string, pageSize = 12) {
  const state = parseCatalogUrl(search);
  const result = await loadCatalog(source, state, { pageSize });
  return renderSSR(CatalogPageHarness, {
    source,
    url: search,
    initial: { state, result },
    pageSize,
  });
}

describe("CatalogPage server render", () => {
  it("writes the first page, the count and the facets from the URL", async () => {
    const { document } = await serve(
      "?q=vault&category=Security&category=Compute&sort=name",
    );

    const links = [...document.querySelectorAll(".ccs-catalog-card__link")].map(
      (link) => link.textContent?.trim(),
    );
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(12);
    // Name order, and every title holds the query.
    expect(links).toEqual([...links].sort((a, b) => a!.localeCompare(b!)));
    for (const title of links) expect(title?.toLowerCase()).toContain("vault");

    expect(
      [...document.querySelectorAll<HTMLInputElement>("input.bx--checkbox")]
        .filter((input) => input.hasAttribute("checked"))
        .map((input) => input.value),
    ).toEqual(["Compute", "Security"]);
    expect(
      document.querySelector<HTMLInputElement>(
        'input[placeholder="Search the catalog"]',
      )?.value,
    ).toBe("vault");
    expect(document.querySelector(".ccs-catalog__count")?.textContent).toMatch(
      /^\d+ results? for “vault”$/,
    );
    // The matches are marked in the server markup, with no script.
    expect(
      document.querySelector(".ccs-catalog-card .bx--highlight__mark")
        ?.textContent,
    ).toMatch(/vault/i);
  });

  it("writes as many pages as the URL asks for", async () => {
    const { document } = await serve("?page=3", 12);

    expect(document.querySelectorAll(".ccs-catalog-card")).toHaveLength(36);
    expect(
      document.querySelector(".ccs-catalog__progress")?.textContent?.trim(),
    ).toBe("Showing 36 of 800");
    // The page links only to what the server rendered: a "Load more" button.
    expect(
      [...document.querySelectorAll("button")].some(
        (button) => button.textContent?.trim() === "Load more",
      ),
    ).toBe(true);
  });

  it("writes the empty state when nothing matches", async () => {
    const { document } = await serve("?q=zzzz-no-such");

    expect(document.querySelectorAll(".ccs-catalog-card")).toHaveLength(0);
    expect(document.querySelector(".bx--empty-state__title")?.textContent).toBe(
      "No results for “zzzz-no-such”",
    );
  });
});
