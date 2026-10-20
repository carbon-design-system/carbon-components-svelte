import { render, screen } from "@testing-library/svelte";
import JoinTagSet from "./JoinTagSet.test.svelte";

describe("joinTagSet", () => {
  it("is inert outside a TagSet", () => {
    render(JoinTagSet);
    const probe = screen.getByRole("button", { name: "Standalone" });

    expect(probe).toHaveAttribute("data-navigation", "tab");
    expect(probe).toHaveAttribute("data-overflow", "false");
    expect(probe).not.toHaveAttribute("tabindex");
  });
});
