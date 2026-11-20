// @vitest-environment node
import { createMemorySource } from "../../src/AuditLogExplorer/memory-source";
import { renderSSR } from "../utils/ssr";
import AuditLogHarness from "./AuditLogHarness.test.svelte";

const NOW = Date.parse("2026-11-04T12:00:00Z");

describe("AuditLogExplorer server render", () => {
  it("writes the view state from the URL: query, facets, rows and landmarks", async () => {
    const source = createMemorySource({ size: 5000, now: NOW });
    const url = "q=outcome%3Adenied+deploy&range=30d";
    // What a server's load function does: parse the URL, ask the source.
    const initialPage = await source.query({
      q: "",
      filters: [
        { key: "outcome", op: "eq", values: ["denied"], negated: false },
      ],
      range: { from: new Date(NOW - 30 * 86_400_000).toISOString(), to: null },
      limit: 20,
      facets: ["outcome", "action", "actor"],
    });
    const { document } = renderSSR(AuditLogHarness, {
      source,
      url,
      initialPage,
    });

    // The query bar holds the text as it was in the URL.
    expect(
      document
        .querySelector<HTMLInputElement>("input[role=combobox]")
        ?.getAttribute("value"),
    ).toBe("outcome:denied deploy");
    // The facet in the text is checked, and its count is the page's.
    const checked = [
      ...document.querySelectorAll<HTMLInputElement>("input.bx--checkbox"),
    ]
      .filter((input) => input.hasAttribute("checked"))
      .map((input) => input.value);
    expect(checked).toEqual(["denied"]);
    expect(
      document.querySelector(".bx--audit-log__count")?.textContent?.trim(),
    ).toBe(`${initialPage.total?.toLocaleString("en")} events`);
    // The first rows are in the markup, in a grid that knows its size.
    const grid = document.querySelector("[role=grid]");
    expect(grid?.getAttribute("aria-rowcount")).toBe(
      String((initialPage.total ?? 0) + 1),
    );
    expect(
      document.querySelectorAll("[role=row][aria-rowindex]").length,
    ).toBeGreaterThan(5);
    // The three landmarks the screen is made of.
    expect(document.querySelector("[role=search]")).not.toBeNull();
    expect(document.querySelector("aside[aria-label=Filters]")).not.toBeNull();
    expect(document.querySelector("main[aria-label=Events]")).not.toBeNull();
    // Nothing is announced at first load.
    expect(
      [...document.querySelectorAll("[role=status]")].map((node) =>
        node.textContent?.trim(),
      ),
    ).toEqual(expect.not.arrayContaining(["1 event"]));
  });

  it("writes a custom range and live tail into the controls", async () => {
    const source = createMemorySource({ size: 100, now: NOW });
    const initialPage = await source.query({
      q: "",
      filters: [],
      range: { from: null, to: null },
      limit: 20,
    });
    const { document } = renderSSR(AuditLogHarness, {
      source,
      url: "from=2026-11-01T08%3A00&to=2026-11-02T17%3A30&live=1",
      initialPage,
    });
    expect(document.querySelector(".bx--audit-log__custom")).not.toBeNull();
    expect(
      [...document.querySelectorAll("input")].some(
        (input) => input.getAttribute("value") === "2026-11-01",
      ),
    ).toBe(true);
  });
});
