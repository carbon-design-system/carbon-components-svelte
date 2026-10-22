import { render, screen } from "@testing-library/svelte";
import MicroDonut from "./MicroDonut.test.svelte";

const slices = (id: string) =>
  Array.from(
    screen
      .getByTestId(id)
      .querySelectorAll<SVGPathElement>(".bx--viz-micro-donut__slice"),
  );

describe("MicroDonut", () => {
  it("names the image with the label and every share", () => {
    render(MicroDonut);

    expect(
      screen.getByRole("img", {
        name: "Plan mix, Team 45%, Enterprise 38%, Free 17%",
      }),
    ).toBe(screen.getByTestId("basic"));
  });

  it("is decorative without a label", () => {
    render(MicroDonut);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
  });

  it("draws one colored slice for each part at the default size", () => {
    render(MicroDonut);

    const paths = slices("basic");
    expect(paths).toHaveLength(3);
    expect(
      new Set(paths.map((p) => p.style.getPropertyValue("--bx-viz-color")))
        .size,
    ).toBe(3);
    expect(screen.getByTestId("basic").querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 24 24",
    );
    expect(
      screen.getByTestId("basic").querySelector(".bx--viz-micro-donut__center"),
    ).toBeNull();
  });

  it("fills the center from the slot", () => {
    render(MicroDonut);

    const root = screen.getByTestId("center");
    expect(root.querySelector("svg")).toHaveAttribute("viewBox", "0 0 32 32");
    expect(
      root.querySelector(".bx--viz-micro-donut__center"),
    ).toHaveTextContent("100");
  });

  it("folds past five slices into a neutral one and honors the diameter", () => {
    render(MicroDonut);

    const paths = slices("many");
    expect(paths).toHaveLength(5);
    expect(paths[4].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-neutral)",
    );
    expect(
      screen.getByTestId("many").style.getPropertyValue("--bx-viz-diameter"),
    ).toBe("64px");
  });

  it("skips empty parts and draws a lone part as a full ring", () => {
    render(MicroDonut);

    const paths = slices("single");
    expect(paths).toHaveLength(1);
    expect(paths[0].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-success)",
    );
    // A full ring is two half arcs per edge.
    expect(paths[0].getAttribute("d")?.match(/A/g)?.length).toBe(4);
  });

  it("draws only the track for no data", () => {
    render(MicroDonut);

    expect(slices("empty")).toEqual([]);
    expect(
      screen.getByTestId("empty").querySelector(".bx--viz-micro-donut__track"),
    ).not.toBeNull();
  });
});
