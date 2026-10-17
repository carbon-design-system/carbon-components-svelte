import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";

describe("ToolbarSearch selectTextOnFocus passthrough", () => {
  it("forwards selectTextOnFocus to the underlying Search field", async () => {
    render(ToolbarSearchHost, {
      props: {
        value: "Alpha",
        searchProps: { persistent: true, selectTextOnFocus: true },
      },
    });

    const input = screen.getByRole("searchbox");
    assert(input instanceof HTMLInputElement);
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Alpha".length);
  });
});
