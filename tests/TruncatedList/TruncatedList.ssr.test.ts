// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TruncatedList from "./TruncatedList.test.svelte";

const names = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Edsger Dijkstra",
];

describe("TruncatedList server render", () => {
  it("renders max items and the more button", () => {
    const { document } = renderSSR(TruncatedList, { items: names, max: 2 });

    const list = document.querySelector("[data-testid=list]");
    expect(list?.querySelectorAll(":scope > bdi")).toHaveLength(2);
    expect(list?.querySelector("button")?.textContent?.trim()).toBe("2 more");
  });

  it("renders max with fit=width, for the client to refit", () => {
    const { document } = renderSSR(TruncatedList, {
      items: names,
      max: 3,
      fit: "width",
    });

    const list = document.querySelector("[data-testid=list]");
    expect(list?.className).toContain("bx--truncated-list--fit");
    expect(list?.querySelectorAll(":scope > bdi")).toHaveLength(3);
    // The offscreen measurer renders empty, so it adds no text.
    expect(
      list?.querySelector(".bx--truncated-list__measure")?.textContent,
    ).toBe("");
  });

  it("renders the locale's direction and joining words", () => {
    const { document } = renderSSR(TruncatedList, {
      items: names,
      max: 2,
      locale: "ar",
    });

    const list = document.querySelector("[data-testid=list]");
    expect(list?.getAttribute("dir")).toBe("rtl");
    expect(list?.textContent).toContain("و");
  });
});
