import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import FlameGraph from "./FlameGraph.test.svelte";

const frame = (label: string) =>
  Array.from(
    screen
      .getByTestId("flame")
      .querySelectorAll<HTMLElement>(".bx--viz-icicle__node"),
  ).find((node) => node.title.startsWith(`${label}:`)) as HTMLElement;

describe("FlameGraph", () => {
  it("is an icicle with the root at the bottom", () => {
    render(FlameGraph);

    expect(screen.getByTestId("flame")).toHaveClass("bx--viz-icicle--flame");
    expect(frame("main").style.top).toBe("40px");
    expect(frame("render").style.top).toBe("20px");
    expect(frame("layout").style.top).toBe("0px");
    expect(frame("main").style.width).toBe("100%");
    expect(Number.parseFloat(frame("render").style.width)).toBeCloseTo(60, 3);
  });

  it("drills into a frame from select, keeping its callers below as steps back", async () => {
    render(FlameGraph);

    await user.click(
      within(screen.getByTestId("flame")).getByRole("button", {
        name: "render, 60",
      }),
    );
    expect(screen.getByTestId("root")).toHaveTextContent("render");
    expect(frame("render").style.width).toBe("100%");
    expect(frame("main")).toHaveClass("bx--viz-icicle__node--ancestor");
    expect(frame("fetch")).toBeUndefined();
    expect(Number.parseFloat(frame("layout").style.width)).toBeCloseTo(
      (35 / 60) * 100,
      3,
    );
  });
});
