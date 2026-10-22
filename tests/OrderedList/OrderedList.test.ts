import { render, screen } from "@testing-library/svelte";
import OrderedList from "./OrderedList.test.svelte";

describe("OrderedList", () => {
  it("should support native list styles", () => {
    render(OrderedList, {
      props: { native: true },
    });

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--ordered--native");
    expect(list).not.toHaveClass("bx--list--ordered");
  });
});
