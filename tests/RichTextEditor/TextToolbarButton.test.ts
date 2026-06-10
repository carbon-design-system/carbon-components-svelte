import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TextToolbarButton from "./TextToolbarButton.test.svelte";

describe("TextToolbarButton", () => {
  it("renders an accessible name from iconDescription", () => {
    render(TextToolbarButton);

    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  });

  it("renders a group with its label and a non-focusable divider", () => {
    render(TextToolbarButton);

    expect(screen.getByRole("group", { name: "Inline" })).toBeInTheDocument();
    // The divider is aria-hidden and is not exposed as a separator role.
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("dispatches its command on click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TextToolbarButton);

    await user.click(screen.getByRole("button", { name: "Bold" }));

    expect(
      consoleLog.mock.calls.some(
        ([event, command]) => event === "execute" && command === "bold",
      ),
    ).toBe(true);
  });

  it("reflects active state as aria-pressed for toggle commands", () => {
    render(TextToolbarButton, { props: { active: ["bold"] } });

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not set aria-pressed for non-toggle commands", () => {
    render(TextToolbarButton);

    expect(screen.getByRole("button", { name: "Undo" })).not.toHaveAttribute(
      "aria-pressed",
    );
  });

  it("does not reflect pressed when inactive", () => {
    render(TextToolbarButton);

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("disables controls and blocks dispatch when the editor is disabled", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TextToolbarButton, { props: { disabled: true } });

    const bold = screen.getByRole("button", { name: "Bold" });
    expect(bold).toBeDisabled();

    await user.click(bold);
    expect(consoleLog.mock.calls.some(([event]) => event === "execute")).toBe(
      false,
    );
  });
});
