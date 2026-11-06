// @vitest-environment node
import QRCode from "carbon-components-svelte/QRCode/QRCode.svelte";
import { renderSSR } from "../utils/ssr";

describe("QRCode server render", () => {
  it("draws the code and its text alternative, with ids from `id`", () => {
    const { document } = renderSSR(QRCode, {
      id: "pair",
      value: "https://example.com/pair?code=123456",
      labelText: "Scan to pair this device",
    });

    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Scan to pair this device");
    expect(svg?.querySelector("path")?.getAttribute("d")).toMatch(/^M/);
    expect(svg).toHaveAttribute("aria-describedby", "pair-text");
    expect(document.getElementById("pair-text")).toHaveTextContent(
      "https://example.com/pair?code=123456",
    );
    // CopyText draws its ids from the scope `id` starts, so none is random.
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThan(2);
    for (const id of ids) expect(id).toMatch(/^pair\b/);
  });
});
