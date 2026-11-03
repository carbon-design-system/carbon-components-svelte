import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ErrorBoundarySnippet from "./ErrorBoundarySnippet.test.svelte";

describe("ErrorBoundary", () => {
  it("takes a failed snippet in a runes component", async () => {
    const control = { fail: new Error("boom") as unknown };
    render(ErrorBoundarySnippet, { control });
    expect(screen.getByTestId("snippet")).toHaveTextContent("Snippet: boom");

    control.fail = false;
    await user.click(screen.getByRole("button", { name: "Reload" }));

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
