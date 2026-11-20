import { render, screen, waitFor } from "@testing-library/svelte";
import type {
  AuditPage,
  AuditQuery,
  AuditSource,
} from "../../src/AuditLogExplorer/audit-source";
import { createMemorySource } from "../../src/AuditLogExplorer/memory-source";
import { user } from "../utils/user";
import AuditLogHarness from "./AuditLogHarness.test.svelte";

const NOW = Date.parse("2026-11-04T12:00:00Z");

/** A source that records its queries and answers from a small memory source. */
function recording() {
  const inner = createMemorySource({ size: 3000, now: NOW });
  const calls: AuditQuery[] = [];
  const source: AuditSource = {
    query: (q) => {
      calls.push(q);
      return inner.query(q);
    },
    tail: inner.tail,
  };
  return { source, calls, inner };
}

describe("AuditLogExplorer", () => {
  it("asks the source for the page the URL describes, facets included", async () => {
    const { source, calls } = recording();
    render(AuditLogHarness, {
      source,
      url: "q=outcome%3Adenied+svc-ci&range=24h",
    });
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].q).toBe("svc-ci");
    expect(calls[0].filters).toEqual([
      { key: "outcome", op: "eq", values: ["denied"], negated: false },
    ]);
    expect(calls[0].facets).toEqual(["outcome", "action", "actor"]);
    expect(calls[0].range.to).toBeNull();
    expect(
      Date.now() - Date.parse(calls[0].range.from as string),
    ).toBeGreaterThan(86_000_000);
    expect(screen.getByRole("combobox", { name: "Search events" })).toHaveValue(
      "outcome:denied svc-ci",
    );
  });

  it("writes a facet click into the query bar and asks again, keeping what was typed", async () => {
    const { source, calls } = recording();
    render(AuditLogHarness, { source, url: "q=iam" });
    await waitFor(() => expect(calls).toHaveLength(1));
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0),
    );

    await user.click(screen.getByRole("checkbox", { name: /Denied/ }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(screen.getByRole("combobox", { name: "Search events" })).toHaveValue(
      "iam outcome:denied",
    );
    expect(calls[1].q).toBe("iam");
    expect(calls[1].filters.map((f) => f.key)).toEqual(["outcome"]);
  });

  it("checks the facet that a typed qualifier names", async () => {
    const { source, calls } = recording();
    render(AuditLogHarness, { source, url: "" });
    await waitFor(() => expect(calls).toHaveLength(1));
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0),
    );

    const input = screen.getByRole("combobox", { name: "Search events" });
    await user.type(input, "outcome:failure{Enter}");
    await waitFor(() => expect(calls).toHaveLength(2));
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: /Failure/ })).toBeChecked(),
    );
    expect(screen.getByRole("checkbox", { name: /Success/ })).not.toBeChecked();
  });

  it("names its landmarks and points the grid at the active row", async () => {
    const { source } = recording();
    const page: AuditPage = await source.query({
      q: "",
      filters: [],
      range: { from: null, to: null },
      limit: 20,
      facets: ["actor"],
    });
    render(AuditLogHarness, { source, initialPage: page });
    // `Search` is a landmark of its own: once for the query bar and once for
    // each facet that has an in-list search.
    expect(screen.getAllByRole("search").length).toBeGreaterThan(1);
    expect(
      screen.getByRole("complementary", { name: "Filters" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Events" })).toBeInTheDocument();

    const grid = screen.getByRole("grid", { name: "Events, newest first" });
    grid.focus();
    await user.keyboard("{ArrowDown}");
    const active = grid.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.getElementById(active as string)).toHaveAttribute(
      "aria-rowindex",
      "3",
    );
  });

  it("does not announce at mount, and says the count once it settles", async () => {
    const { source } = recording();
    const page = await source.query({
      q: "",
      filters: [],
      range: { from: null, to: null },
      limit: 20,
    });
    const { container } = render(AuditLogHarness, {
      source,
      initialPage: page,
      url: "",
    });
    const ours = [
      ...container.querySelectorAll(".bx--audit-log > p[role=status]"),
    ];
    expect(ours).toHaveLength(2);
    expect(ours.map((node) => node.textContent?.trim())).toEqual(["", ""]);
  });
});
