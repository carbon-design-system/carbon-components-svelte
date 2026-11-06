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
      title: "Deployed",
      status: "success" as const,
    },
    {
      id: "b",
      time: "2026-11-05T09:00:00Z",
      title: "Failed",
      status: "error" as const,
    },
    { id: "c", title: "Next", status: "pending" as const },
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
