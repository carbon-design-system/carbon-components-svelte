import { render, screen, waitFor, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableEmpty from "./DataTableEmpty.test.svelte";
import DataTableEmptySlot from "./DataTableEmptySlot.test.svelte";

const rows = [
  { id: 1, name: "api-gateway", region: "us-east-1" },
  { id: 2, name: "auth", region: "eu-west-1" },
];

describe("DataTable empty state", () => {
  const getBody = () => screen.getAllByRole("rowgroup")[1];
  const getSearch = () => screen.getByRole("searchbox");

  it("renders no row for empty rows by default", () => {
    render(DataTableEmpty);

    expect(within(getBody()).queryAllByRole("row")).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("renders emptyText in one row spanning every column", () => {
    render(DataTableEmpty, {
      props: { emptyText: "No data", expandable: true, selectable: true },
    });

    expect(within(getBody()).getAllByRole("row")).toHaveLength(1);
    const cell = within(getBody()).getByText("No data").closest("td");
    expect(cell).toHaveAttribute("colspan", "4");
    expect(cell).toHaveClass("bx--table-cell");
  });

  it("renders noResultsText when a search matches nothing", async () => {
    render(DataTableEmpty, { props: { rows } });

    await user.type(getSearch(), "zzz");
    expect(within(getBody()).getByText("No results")).toBeInTheDocument();
    expect(within(getBody()).queryByText("No data")).not.toBeInTheDocument();

    await user.clear(getSearch());
    expect(within(getBody()).queryByText("No results")).not.toBeInTheDocument();
    expect(screen.getByText("api-gateway")).toBeInTheDocument();
  });

  it("renders no row when noResultsText is empty", async () => {
    render(DataTableEmpty, { props: { rows, noResultsText: "" } });
    await user.type(getSearch(), "zzz");

    expect(within(getBody()).queryAllByRole("row")).toHaveLength(0);
  });

  it("removes the empty row once rows are provided", async () => {
    render(DataTableEmpty, { props: { emptyText: "No deployments yet" } });
    expect(within(getBody()).getByText("No deployments yet")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Add rows" }));

    expect(
      within(getBody()).queryByText("No deployments yet"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("api-gateway")).toBeInTheDocument();
  });

  it("renders the empty slot when there is no data", () => {
    render(DataTableEmptySlot, { props: { empty: true } });

    expect(within(getBody()).getByText("No load balancers")).toBeVisible();
    expect(
      within(getBody()).queryByText("No matching load balancers"),
    ).not.toBeInTheDocument();
  });

  it.each(["remove", "hide"] as const)(
    'renders the noResults slot with filterMode="%s"',
    async (filterMode) => {
      render(DataTableEmptySlot, { props: { filterMode } });

      await user.type(getSearch(), "zzz");
      expect(
        within(getBody()).getByText("No matching load balancers"),
      ).toBeVisible();
      expect(
        within(getBody()).queryByText("No load balancers"),
      ).not.toBeInTheDocument();
      if (filterMode === "hide") {
        expect(document.querySelector('[data-row="0"]')).toHaveAttribute(
          "hidden",
        );
      }

      await user.clear(getSearch());
      expect(
        within(getBody()).queryByText("No matching load balancers"),
      ).not.toBeInTheDocument();
    },
  );

  it("fills the status region a tick after the row shows, then clears it", async () => {
    render(DataTableEmpty, { props: { emptyText: "No deployments yet" } });

    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    await waitFor(() => expect(status).toHaveTextContent("No deployments yet"));

    await user.click(screen.getByRole("button", { name: "Add rows" }));
    await waitFor(() => expect(status.textContent).toBe(""));
    expect(screen.getAllByRole("status")).toEqual([status]);
  });

  it("announces the slot's text with a space between its elements", async () => {
    render(DataTableEmptySlot, { props: { empty: true } });

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "No load balancers Create one to route traffic.",
      ),
    );
  });
});
