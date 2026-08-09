import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import PaginationOverflow from "./PaginationOverflow.test.svelte";

describe("PaginationOverflow", () => {
  test("single-item branch dispatches a 1-based index matching the rendered page", async () => {
    const onSelect = vi.fn();
    render(PaginationOverflow, {
      props: { fromIndex: 4, count: 1, onSelect },
    });

    const item = screen.getByRole("button");
    expect(item).toHaveTextContent("5");

    await user.click(item);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].detail).toEqual({ index: 5 });
  });

  test("multi-item branch already dispatches a 1-based index for comparison", async () => {
    const onSelect = vi.fn();
    render(PaginationOverflow, {
      props: { fromIndex: 4, count: 2, onSelect },
    });

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "5");

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].detail).toEqual({ index: 5 });
  });
});
