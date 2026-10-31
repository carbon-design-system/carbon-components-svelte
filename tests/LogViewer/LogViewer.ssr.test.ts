// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import LogViewer from "./LogViewer.ssr.test.svelte";

const ESC = "\u001b";

describe("LogViewer on the server", () => {
  it("renders the window of a long log as a named log region", () => {
    const lines = Array.from({ length: 5000 }, (_, i) => `line ${i + 1}`);
    const { document } = renderSSR(LogViewer, { lines });

    const region = document.querySelector("[role=log]");
    expect(region?.getAttribute("aria-label")).toBe("Build output");
    expect(region?.getAttribute("tabindex")).toBe("0");
    const rows = document.querySelectorAll("[data-line-id]");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(200);
  });

  it("renders colors, levels, times and links without the browser", () => {
    const { document } = renderSSR(LogViewer, {
      lines: [
        `2026-10-27T09:41:07.123Z ERROR ${ESC}[31mfailed${ESC}[0m https://example.com/a`,
      ],
    });

    const row = document.querySelector("[data-line-id]");
    expect(row?.querySelector(".bx--log-viewer__level")?.textContent).toBe(
      "ERROR",
    );
    expect(row?.querySelector(".bx--log-viewer__time")?.textContent).toBe(
      "09:41:07.123",
    );
    expect(row?.querySelector(".bx--log-viewer__text")?.textContent).toMatch(
      /^failed\s*https:\/\/example\.com\/a$/,
    );
    expect(row?.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com/a",
    );
    expect(row?.textContent).not.toContain(ESC);
  });

  it("gives the toolbar buttons one tab stop in the server HTML", () => {
    const { document } = renderSSR(LogViewer, { lines: ["INFO a"] });

    const buttons = [
      ...document.querySelectorAll("[role=toolbar] button"),
    ].filter((button) => !button.classList.contains("bx--search-close"));
    expect(buttons.length).toBe(7);
    expect(
      buttons.filter((button) => button.getAttribute("tabindex") === "0"),
    ).toHaveLength(1);
    expect(buttons[0].textContent).toContain("Match case");
  });

  it("shows the empty state when there are no lines", () => {
    const { document } = renderSSR(LogViewer, { lines: [] });

    expect(document.querySelector(".bx--log-viewer__empty")?.textContent).toBe(
      "No log lines",
    );
  });
});
