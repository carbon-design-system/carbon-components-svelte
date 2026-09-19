import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ToolbarSearchSelectTextOnFocus from "./ToolbarSearchSelectTextOnFocus.test.svelte";

describe("ToolbarSearch selectTextOnFocus passthrough", () => {
  it("forwards selectTextOnFocus to the underlying Search field", async () => {
    render(ToolbarSearchSelectTextOnFocus);

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Alpha".length);
  });
});
