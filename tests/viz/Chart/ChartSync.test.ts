import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChartSync from "./ChartSync.test.svelte";

const traffic = () => screen.getByRole("application", { name: "Traffic" });

describe("Chart syncId", () => {
  it("shows one crosshair across charts that share an id", async () => {
    const onhoverB = vi.fn();
    render(ChartSync, { onhoverB });

    traffic().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByTestId("ruler-a")).toBeInTheDocument();
    expect(screen.getByTestId("ruler-b")).toBeInTheDocument();
    expect(screen.queryByTestId("ruler-c")).toBeNull();
    expect(onhoverB).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 1 }),
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("ruler-a")).toBeNull();
    expect(screen.queryByTestId("ruler-b")).toBeNull();
  });

  it("leaves the channel when the id goes away", async () => {
    const { rerender } = render(ChartSync);

    // An empty id, because `undefined` would fall back to the fixture default.
    await rerender({ syncB: "" });
    traffic().focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("ruler-a")).toBeInTheDocument();
    expect(screen.queryByTestId("ruler-b")).toBeNull();
  });
});
