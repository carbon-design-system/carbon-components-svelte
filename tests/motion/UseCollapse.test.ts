import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import UseCollapse from "./UseCollapse.test.svelte";

describe("use:collapse", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the bound open state", async () => {
    render(UseCollapse);
    const content = screen.getByTestId("content");
    expect(content.inert).toBe(true);
    expect(content.style.height).toBe("0px");
    expect(content.style.visibility).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(content.inert).toBe(false);
    expect(content.style.height).toBe("");
    expect(content.style.visibility).toBe("");

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(content.inert).toBe(true);
  });
});
