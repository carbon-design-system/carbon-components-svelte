import { render, screen, waitFor } from "@testing-library/svelte";
import JoinTagSet from "./JoinTagSet.test.svelte";

describe("joinTagSet", () => {
  it("is inert outside a TagSet", () => {
    render(JoinTagSet);
    const probe = screen.getByRole("button", { name: "Standalone" });

    expect(probe).toHaveAttribute("data-navigation", "tab");
    expect(probe).toHaveAttribute("data-overflow", "false");
    expect(probe).not.toHaveAttribute("tabindex");
  });

  it("joins a roving TagSet as a single tab stop", async () => {
    render(JoinTagSet);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "First" })).toHaveAttribute(
        "tabindex",
        "0",
      );
    });
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute(
      "data-navigation",
      "roving",
    );
  });
});
