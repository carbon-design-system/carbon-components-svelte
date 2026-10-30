import { render, screen } from "@testing-library/svelte";
import CoachmarkBeacon from "../../src/Coachmark/CoachmarkBeacon.svelte";

describe("CoachmarkBeacon", () => {
  it("names the button by its label and hides the decoration", () => {
    render(CoachmarkBeacon, { props: { iconDescription: "Show filters tip" } });

    const button = screen.getByRole("button", { name: "Show filters tip" });
    expect(button).toHaveAttribute("type", "button");
    for (const part of button.children) {
      expect(part).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("adds the overlay modifier", async () => {
    const { rerender } = render(CoachmarkBeacon, {
      props: { iconDescription: "Tip" },
    });
    const button = screen.getByRole("button");
    expect(button).not.toHaveClass("bx--coachmark-beacon--overlay");

    await rerender({ overlay: true });

    expect(button).toHaveClass("bx--coachmark-beacon--overlay");
  });
});
