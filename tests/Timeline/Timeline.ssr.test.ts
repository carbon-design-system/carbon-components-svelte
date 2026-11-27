// @vitest-environment node
import Timeline from "carbon-components-svelte/Timeline/Timeline.svelte";
import { renderSSR } from "../utils/ssr";

const props = {
  "aria-label": "Deploys",
  groupBy: "day" as const,
  order: "desc" as const,
  now: Date.parse("2026-11-06T15:00:00Z"),
  locale: "en-US",
  timeZone: "UTC",
  items: [
    {
      id: "a",
      time: "2026-11-06T14:20:00Z",
      titleText: "Deployed",
      status: "success" as const,
    },
    {
      id: "b",
      time: "2026-11-05T09:00:00Z",
      titleText: "Failed",
      status: "error" as const,
    },
    { id: "c", titleText: "Next", status: "pending" as const },
  ],
};

describe("Timeline server render", () => {
  it("writes the days, times and statuses from a fixed clock", () => {
    const { document } = renderSSR(Timeline, props);

    expect(
      [...document.querySelectorAll("h3")].map((heading) =>
        heading.textContent?.trim(),
      ),
    ).toEqual(["Today", "Yesterday"]);
    expect(document.querySelector("time")?.textContent).toContain("2:20");
    expect(document.body.textContent).toContain("40 minutes ago");
    expect(document.body.textContent).toContain("Error");
    expect(document.querySelector("[aria-current='step']")).not.toBeNull();
    expect(document.querySelector("[role='status']")).toBeNull();
  });

  it("renders the same markup every time", () => {
    expect(renderSSR(Timeline, props).document.body.innerHTML).toBe(
      renderSSR(Timeline, props).document.body.innerHTML,
    );
  });
});

describe("Timeline server render with no clock, locale or zone set", () => {
  const unpinned = {
    ...props,
    now: undefined,
    locale: undefined,
    timeZone: undefined,
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prints dates in en and UTC, with no relative time", () => {
    const { document } = renderSSR(Timeline, unpinned);

    expect(
      [...document.querySelectorAll("h3")].map((heading) =>
        heading.textContent?.trim(),
      ),
    ).toEqual(["Nov 6, 2026", "Nov 5, 2026"]);
    expect(document.querySelector("time")?.textContent).toBe("2:20 PM");
    expect(document.body.textContent).not.toContain("ago");
  });

  it("does not depend on the server's clock", () => {
    vi.useFakeTimers({ now: Date.parse("2026-11-06T15:00:00Z") });
    const first = renderSSR(Timeline, unpinned).document.body.innerHTML;
    vi.setSystemTime(Date.parse("2030-01-01T00:00:00Z"));

    expect(renderSSR(Timeline, unpinned).document.body.innerHTML).toBe(first);
  });
});
