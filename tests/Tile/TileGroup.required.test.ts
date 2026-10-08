import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import TileGroup from "./TileGroup.form.test.svelte";

describe("TileGroup required", () => {
  it("shows a message instead of the browser bubble until a tile is selected", async () => {
    render(TileGroup, { props: { required: true } });
    const invalidEvents: Event[] = [];
    getForm().addEventListener("invalid", (e) => invalidEvents.push(e), true);

    expect(getForm().reportValidity()).toBe(false);
    await tick();

    expect(invalidEvents.every((e) => e.defaultPrevented)).toBe(true);
    const message = screen.getByText("Select an option");
    expect(screen.getByRole("group", { name: "Pick one" })).toHaveAttribute(
      "aria-describedby",
      message.id,
    );

    await user.click(screen.getByText("B"));
    expect(screen.queryByText("Select an option")).toBeNull();
  });
});
