import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelectRefs from "./MultiSelectRefs.test.svelte";

describe("MultiSelect refs", () => {
  it("clears selectionRef when the selection badge unmounts", async () => {
    render(MultiSelectRefs);
    const selectionRef = screen.getByTestId("selection-ref");
    expect(selectionRef).toHaveTextContent("connected");

    await user.click(
      screen.getByRole("button", { name: "Clear selected item" }),
    );

    expect(selectionRef).toHaveTextContent("null");
  });
});
