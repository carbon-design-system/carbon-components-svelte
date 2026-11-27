import { render, screen } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import DataTableRowDelete from "./DataTable.rowDelete.test.svelte";

const button = (name: string) => screen.getByRole("button", { name });

describe("DataTable focus after a row is removed", () => {
  it("moves focus to the same action of the next row", async () => {
    render(DataTableRowDelete);

    button("Delete Alpha").focus();
    await user.keyboard("{Enter}");
    await flushMacrotask();

    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(button("Delete Beta")).toHaveFocus();
  });

  it("moves to the previous row when the last row is removed", async () => {
    render(DataTableRowDelete);

    button("Delete Gamma").focus();
    await user.keyboard("{Enter}");
    await flushMacrotask();

    expect(button("Delete Beta")).toHaveFocus();
  });

  it("leaves focus alone when the app removes a row focus is not in", async () => {
    render(DataTableRowDelete);

    button("Delete Gamma").focus();
    button("Remove Alpha").click();
    await flushMacrotask();

    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(button("Delete Gamma")).toHaveFocus();
  });
});
