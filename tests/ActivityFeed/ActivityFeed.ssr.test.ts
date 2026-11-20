// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ActivityFeed from "./ActivityFeed.ssr.test.svelte";

describe("ActivityFeed on the server", () => {
  it("renders the feed whole, with the day, the times and the places fixed", () => {
    const { document } = renderSSR(ActivityFeed);

    const feed = document.querySelector("[role=feed]");
    expect(feed?.getAttribute("aria-label")).toBe("Activity");
    const articles = [...document.querySelectorAll("article")];
    expect(
      articles.map((article) => article.getAttribute("aria-posinset")),
    ).toEqual(["1", "2"]);
    expect(articles[1].getAttribute("aria-setsize")).toBe("2");
    expect(articles[1].getAttribute("aria-label")).toBe(
      "Comment by Grace Hopper, Mar 2, 2026, 10:00 AM",
    );
    expect(
      [...document.querySelectorAll(".bx--chat-divider__label")].map(
        (label) => label.textContent,
      ),
    ).toEqual(["Yesterday", "Today"]);
    expect(articles[1].querySelector("time")?.textContent).toBe("2 hr. ago");
    expect(articles[0].textContent).toContain("assigned @Ada Lovelace");
  });

  it("writes a body as text and leaves the draft storage to the browser", () => {
    const { document } = renderSSR(ActivityFeed);

    expect(document.querySelector(".bx--activity-body script")).toBeNull();
    expect(document.querySelector(".bx--activity-body")?.textContent).toContain(
      "<script>alert(1)</script>",
    );
    expect(
      document.querySelector(".bx--activity-body strong")?.textContent,
    ).toBe("bold");
    expect(document.querySelector("textarea")?.value).toBe("");
  });

  it("renders the same markup twice", () => {
    expect(renderSSR(ActivityFeed).html).toBe(renderSSR(ActivityFeed).html);
  });
});
