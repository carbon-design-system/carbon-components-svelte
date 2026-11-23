import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { stubViewport } from "../utils/match-media";
import { user } from "../utils/user";
import FilterFlyout from "./FilterFlyout.test.svelte";

describe("FilterFlyout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the filters inline at the breakpoint and above", () => {
    stubViewport(1100);
    render(FilterFlyout);

    expect(screen.getByTestId("flyout")).toHaveTextContent("false");
    expect(
      screen.getByRole("complementary", { name: "Filters" }),
    ).toContainElement(screen.getByRole("checkbox", { name: "Acme" }));
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  });

  it("moves them into a side panel below it, opened by the consumer", async () => {
    const viewport = stubViewport(800);
    render(FilterFlyout);

    expect(screen.getByTestId("flyout")).toHaveTextContent("true");
    expect(screen.queryByRole("checkbox", { name: "Acme" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Filter" }));
    expect(screen.getByTestId("open")).toHaveTextContent("true");
    expect(screen.getByRole("checkbox", { name: "Acme" })).toBeInTheDocument();

    // Growing past the breakpoint puts them inline again and closes the panel.
    viewport.setWidth(1200);
    await tick();
    expect(screen.getByTestId("flyout")).toHaveTextContent("false");
    expect(screen.getByTestId("open")).toHaveTextContent("false");
    expect(
      screen.getByRole("complementary", { name: "Filters" }),
    ).toBeInTheDocument();
  });
});
