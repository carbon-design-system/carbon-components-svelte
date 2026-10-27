import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TableStateTest from "./TableState.test.svelte";
import { clickHeader } from "./helpers";

describe("createTableState with DataTable bindings", () => {
  async function goToPageThree() {
    const next = screen.getByRole("button", { name: "Next page" });
    await user.click(next);
    await user.click(next);
  }

  it("resets the page when the search changes", async () => {
    const onrequest = vi.fn();
    render(TableStateTest, { props: { onrequest } });
    await goToPageThree();
    expect(onrequest).toHaveBeenLastCalledWith("page=3&pageSize=5");

    await user.type(screen.getByRole("searchbox"), "a");

    expect(onrequest).toHaveBeenLastCalledWith("page=1&pageSize=5&q=a");
  });

  it("resets the page and makes one request when a header is clicked", async () => {
    const onrequest = vi.fn();
    render(TableStateTest, { props: { onrequest } });
    await goToPageThree();
    onrequest.mockClear();

    await clickHeader("Name");

    expect(onrequest.mock.calls).toEqual([
      ["sort=name%3Aasc&page=1&pageSize=5"],
    ]);
  });
});
