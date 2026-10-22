import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import WordCloudChart from "./WordCloudChart.test.svelte";

const layout = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/utils/word-cloud.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/utils/word-cloud.js")
    >();
  return {
    ...actual,
    layoutWords: (...args: Parameters<typeof actual.layoutWords>) => {
      layout.calls += 1;
      return actual.layoutWords(...args);
    },
  };
});

const chart = () => screen.getByRole("application", { name: "Incident terms" });
const words = () =>
  Array.from(
    document.querySelectorAll<SVGTextElement>(".bx--viz-word-cloud__word"),
  );

beforeEach(() => {
  layout.calls = 0;
});

describe("WordCloudChart", () => {
  it("sums shared words and sizes them by value, largest first", () => {
    render(WordCloudChart);

    expect(words().map((node) => node.textContent?.trim())).toEqual([
      "latency",
      "timeout",
      "deploy",
      "cache",
    ]);
    const sizes = words().map((node) => Number(node.getAttribute("font-size")));
    expect(sizes[0]).toBe(56);
    expect(sizes[3]).toBe(12);
  });

  it("gives assistive technology the words as an ordered list with values", () => {
    render(WordCloudChart);

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent?.trim()),
    ).toEqual(["latency: 100", "timeout: 70", "deploy: 50", "cache: 20"]);
  });

  it("uses the text color without groups, and a color and legend with them", () => {
    const { unmount } = render(WordCloudChart);
    expect(words()[0].style.getPropertyValue("--bx-viz-color")).toBe("");
    expect(document.querySelector(".bx--viz-treemap__legend")).toBeNull();
    unmount();

    render(WordCloudChart, { grouped: true });
    const colors = words().map((node) =>
      node.style.getPropertyValue("--bx-viz-color"),
    );
    expect(colors[0]).toMatch(/^var\(--cds-viz-/);
    expect(colors[0]).toBe(colors[1]);
    expect(colors[0]).not.toBe(colors[2]);
    expect(
      Array.from(
        document.querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((node) => node.textContent?.trim()),
    ).toEqual(["symptom", "cause"]);
  });

  it("moves word to word, largest first, without laying out again, and selects", async () => {
    const onhover = vi.fn();
    const onselect = vi.fn();
    render(WordCloudChart, { onhover, onselect });
    const laidOut = layout.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ text: "timeout", value: 70 }),
    );
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /timeout\s*70/,
    );
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "timeout: 70",
    );
    expect(layout.calls).toBe(laidOut);

    await user.keyboard("{Home}{Enter}");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      word: { text: "latency", value: 100 },
    });
    expect(onselect.mock.calls[0][0].word.rows).toHaveLength(2);
  });
});
