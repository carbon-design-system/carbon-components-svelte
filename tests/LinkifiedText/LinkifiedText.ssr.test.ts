// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import LinkifiedText from "./LinkifiedText.test.svelte";

describe("LinkifiedText server render", () => {
  it("renders links, escaped text and no script", () => {
    const { document } = renderSSR(LinkifiedText, {
      text: 'Go to https://example.com/a?b=1&c=2 <script>alert(1)</script> "quoted"',
    });

    const host = document.querySelector('[data-testid="text"]');
    const link = host?.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com/a?b=1&c=2");
    expect(link?.getAttribute("dir")).toBe("ltr");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    expect(host?.querySelector("script")).toBeNull();
    expect(host?.textContent).toContain("<script>alert(1)</script>");
  });

  it("leaves a javascript URL as text", () => {
    const { document } = renderSSR(LinkifiedText, {
      text: "javascript://%0Aalert(1)",
    });

    expect(document.querySelector("a")).toBeNull();
  });
});
