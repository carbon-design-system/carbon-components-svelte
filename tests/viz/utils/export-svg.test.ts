import {
  backgroundBehind,
  serializeSvg,
} from "../../../src/viz/utils/export-svg.js";

function chart() {
  const host = document.createElement("div");
  host.innerHTML = `
    <svg viewBox="0 0 400 200" role="application" tabindex="0" aria-label="Revenue" class="plot">
      <g class="marks"><rect class="bar" x="10" y="20" width="30" height="40" style="--bx-viz-color: red"></rect></g>
      <text class="label" x="5" y="5">A &amp; B</text>
    </svg>`;
  document.body.appendChild(host);
  const svg = host.querySelector("svg");
  if (!svg) throw new Error("no svg");
  // jsdom has no layout, so it has no viewBox.baseVal either.
  Object.defineProperty(svg, "viewBox", {
    value: { baseVal: { width: 400, height: 200 } },
  });
  return { host, svg };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("serializeSvg", () => {
  test("inlines computed styles and drops what only the page understands", () => {
    const { svg } = chart();
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (node) =>
        ({
          getPropertyValue: (name: string) =>
            name === "fill" && (node as Element).tagName === "rect"
              ? "rgb(15, 98, 254)"
              : "",
        }) as CSSStyleDeclaration,
    );

    const { markup } = serializeSvg(svg);

    expect(markup).toContain("fill: rgb(15, 98, 254)");
    expect(markup).not.toContain("class=");
    expect(markup).not.toContain("--bx-viz-color");
    expect(markup).not.toContain("tabindex");
    expect(markup).not.toContain('role="application"');
    // The live chart is untouched.
    expect(svg.getAttribute("class")).toBe("plot");
    expect(svg.getAttribute("tabindex")).toBe("0");
  });

  test("is a standalone document on an opaque background", () => {
    const { svg } = chart();
    const { markup, width, height } = serializeSvg(svg, {
      background: "rgb(22, 22, 22)",
    });

    expect(markup.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
      true,
    );
    expect(markup).toContain('fill="rgb(22, 22, 22)"');
    expect([width, height]).toEqual([432, 232]);
    expect(
      new DOMParser()
        .parseFromString(markup, "image/svg+xml")
        .querySelector("parsererror"),
    ).toBeNull();
  });

  test("adds the title above and the legend below, escaped", () => {
    const { svg } = chart();
    const { markup, height } = serializeSvg(svg, {
      title: "Revenue <Q1>",
      legend: [
        { label: "EMEA & APAC", color: "rgb(1, 2, 3)" },
        { label: "AMER", color: "rgb(4, 5, 6)" },
      ],
      color: "rgb(244, 244, 244)",
    });

    expect(markup).toContain("Revenue &lt;Q1&gt;");
    expect(markup).toContain("EMEA &amp; APAC");
    expect(markup).toContain('fill="rgb(4, 5, 6)"');
    expect(height).toBe(16 + 32 + 200 + 28 + 16);
    // The plot moves down to make room for the title.
    expect(markup).toContain('y="48"');
  });
});

describe("backgroundBehind", () => {
  test("walks up to the first opaque background", () => {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    outer.style.backgroundColor = "rgb(38, 38, 38)";
    inner.style.backgroundColor = "rgba(0, 0, 0, 0)";
    outer.appendChild(inner);
    document.body.appendChild(outer);

    expect(backgroundBehind(inner)).toBe("rgb(38, 38, 38)");
  });

  test("falls back to white", () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    expect(backgroundBehind(node)).toBe("#ffffff");
  });
});
