import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import TimeRangePicker from "./TimeRangePicker.test.svelte";

describe("TimeRangePicker", () => {
  it("switches the range between presets, and shows dates behind Custom", async () => {
    const onchange = vi.fn();
    render(TimeRangePicker, { onchange });
    expect(screen.getByTestId("range")).toHaveTextContent("7d");
    expect(screen.queryByLabelText("From")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Last 24 hours" }));
    expect(screen.getByTestId("range")).toHaveTextContent("24h");
    expect(onchange).toHaveBeenLastCalledWith(
      expect.objectContaining({ preset: "24h" }),
    );

    await user.click(screen.getByRole("tab", { name: "Custom" }));
    expect(screen.getByTestId("range")).toHaveTextContent("..");
    expect(screen.getByLabelText("From")).toBeInTheDocument();
  });

  it("offers the presets alone without custom", () => {
    render(TimeRangePicker, { custom: false });
    expect(screen.queryByRole("tab", { name: "Custom" })).toBeNull();
  });
});
