import { render, screen } from "@testing-library/svelte";
import Tag from "carbon-components-svelte/Tag/Tag.svelte";

describe("Tag aria forwarding (filter)", () => {
  it("keeps the built-in name without consumer naming", () => {
    render(Tag, { props: { filter: true, type: "red", id: "tag" } });

    expect(
      screen.getByRole("button", { name: "Clear filter red" }),
    ).toBeInTheDocument();
  });
});
