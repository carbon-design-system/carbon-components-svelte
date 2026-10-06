// @vitest-environment node
import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";
import { renderSSR } from "../utils/ssr";

const now = Date.parse("2026-09-01T12:00:00Z");
const date = Date.parse("2026-09-01T11:55:00Z");

function renderTitle(timeZone: string) {
  const { document } = renderSSR(RelativeTime, {
    date,
    now,
    locale: "en-US",
    timeZone,
  });

  // Newer ICU versions put a narrow no-break space before AM/PM.
  return document
    .querySelector("time")
    ?.getAttribute("title")
    ?.replace(/\s/g, " ");
}

describe("RelativeTime server render", () => {
  it("formats the title in the given time zone", () => {
    expect(renderTitle("UTC")).toBe("Sep 1, 2026, 11:55 AM");
    expect(renderTitle("Asia/Tokyo")).toBe("Sep 1, 2026, 8:55 PM");
  });

  it("does not render a timeZone attribute", () => {
    const { document } = renderSSR(RelativeTime, {
      date,
      now,
      locale: "en-US",
      timeZone: "UTC",
    });

    expect(document.querySelector("time")).not.toHaveAttribute("timezone");
  });
});
