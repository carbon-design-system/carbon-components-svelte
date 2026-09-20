import { render, screen } from "@testing-library/svelte";
import MicroFunnel from "./MicroFunnel.test.svelte";

const steps = (id: string) =>
  Array.from(
    screen.getByTestId(id).querySelectorAll(".bx--viz-micro-funnel__step"),
  ).map((step) => (step as HTMLElement).style.getPropertyValue("--bx-viz-pct"));

describe("MicroFunnel", () => {
  it("names the image with the label and the overall conversion", () => {
    render(MicroFunnel);

    expect(
      screen.getAllByRole("img", {
        name: "Signup funnel. Overall conversion 9%",
      }),
    ).toHaveLength(2);
  });

  it("is decorative without a label", () => {
    render(MicroFunnel);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
  });

  it("draws one segment per stage, sized relative to the largest", () => {
    render(MicroFunnel);

    expect(steps("steps")).toEqual(["100", "60", "9"]);
  });

  it("reduces to one bar and a percentage in the completion variant", () => {
    render(MicroFunnel);

    const root = screen.getByTestId("completion");
    expect(root).toHaveClass("bx--viz-micro-funnel--completion");
    expect(steps("completion")).toEqual([]);
    expect(
      (
        root.querySelector(".bx--viz-micro-funnel__track") as HTMLElement
      ).style.getPropertyValue("--bx-viz-pct"),
    ).toBe("9");
    expect(root).toHaveTextContent("9%");
    expect(screen.getByTestId("completion-bare")).not.toHaveTextContent("9%");
  });

  it("applies size and color", () => {
    render(MicroFunnel);

    const styled = screen.getByTestId("styled");
    expect(styled).toHaveClass("bx--viz-micro-funnel--sm");
    expect(styled.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-cat-03)",
    );
    expect(
      screen.getByTestId("semantic").style.getPropertyValue("--bx-viz-color"),
    ).toBe("var(--cds-viz-success)");
    expect(
      screen.getByTestId("steps").style.getPropertyValue("--bx-viz-color"),
    ).toBe("");
  });

  it("renders nothing for an empty funnel and names it with the label alone", () => {
    render(MicroFunnel);

    expect(steps("empty")).toEqual([]);
    expect(
      screen.getByRole("img", { name: "Empty funnel" }),
    ).toBeInTheDocument();
  });

  it("keeps segment nodes when stages are reassigned", async () => {
    const { rerender } = render(MicroFunnel);
    const before = screen
      .getByTestId("steps")
      .querySelectorAll(".bx--viz-micro-funnel__step");

    await rerender({
      stages: [
        { id: "visit", label: "Visitors", value: 10000 },
        { id: "signup", label: "Signup", value: 2000 },
        { id: "paid", label: "Paid", value: 900 },
      ],
    });

    const after = screen
      .getByTestId("steps")
      .querySelectorAll(".bx--viz-micro-funnel__step");
    expect(Array.from(after).every((node, i) => node === before[i])).toBe(true);
    expect(steps("steps")).toEqual(["100", "20", "9"]);
  });
});
