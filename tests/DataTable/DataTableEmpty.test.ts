import { render, screen, waitFor, within } from "@testing-library/svelte";
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { user } from "../utils/user";
import DataTableEmpty from "./DataTableEmpty.test.svelte";
import DataTableEmptySlot from "./DataTableEmptySlot.test.svelte";

describe("DataTable empty state", () => {
  const getBody = () => screen.getAllByRole("rowgroup")[1];
  const getSearch = () => screen.getByRole("searchbox");

  it("renders no body row without emptyText or slot", () => {
    render(DataTableEmpty);

    expect(within(getBody()).queryAllByRole("row")).toHaveLength(0);
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("matches the existing output when emptyText is empty", () => {
    const props = {
      headers: [
        { key: "name", value: "Name" },
        { key: "region", value: "Region" },
      ],
      rows: [],
    };
    const { container } = render(DataTable, { props });
    const { container: withEmptyText } = render(DataTable, {
      props: { ...props, emptyText: "" },
    });

    expect(withEmptyText.querySelector("tbody")?.innerHTML).toBe(
      container.querySelector("tbody")?.innerHTML,
    );
    expect(container.querySelector("tbody")?.innerHTML).not.toContain("<tr");
  });

  it("renders emptyText in one row spanning all columns", () => {
    render(DataTableEmpty, { props: { emptyText: "No deployments yet" } });

    expect(within(getBody()).getAllByRole("row")).toHaveLength(1);
    const text = within(getBody()).getByText("No deployments yet");
    expect(text.closest("td")).toHaveAttribute("colspan", "2");
    expect(text.closest("td")).toHaveClass("bx--table-cell");
  });

  it("mounts the status region empty, then fills it with the message", async () => {
    render(DataTableEmpty, { props: { emptyText: "No deployments yet" } });

    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    await waitFor(() => expect(status).toHaveTextContent("No deployments yet"));

    await user.click(screen.getByRole("button", { name: "Add rows" }));
    await waitFor(() => expect(status.textContent).toBe(""));
    expect(screen.getByRole("status")).toBe(status);
  });

  it("announces the empty slot's text when a search matches nothing", async () => {
    render(DataTableEmptySlot);
    const status = screen.getByRole("status");

    await user.type(getSearch(), "zzz");
    await waitFor(() => expect(status).toHaveTextContent("No results"));
  });

  it("includes selection and expand columns in the colspan", () => {
    render(DataTableEmpty, {
      props: {
        emptyText: "No deployments yet",
        expandable: true,
        selectable: true,
      },
    });

    expect(
      within(getBody()).getByText("No deployments yet").closest("td"),
    ).toHaveAttribute("colspan", "4");
  });

  it("removes the empty row once rows are provided", async () => {
    render(DataTableEmpty, { props: { emptyText: "No deployments yet" } });

    expect(
      within(getBody()).getByText("No deployments yet"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add rows" }));

    expect(
      within(getBody()).queryByText("No deployments yet"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("api-gateway")).toBeInTheDocument();
  });

  it("passes filtered=false to the empty slot when there is no data", () => {
    render(DataTableEmptySlot, { props: { empty: true } });

    expect(within(getBody()).getByText("No data")).toBeInTheDocument();
  });

  it("passes filtered=true when a search matches nothing", async () => {
    render(DataTableEmptySlot);

    expect(within(getBody()).queryByText("No data")).not.toBeInTheDocument();
    expect(within(getBody()).queryByText("No results")).not.toBeInTheDocument();

    await user.type(getSearch(), "zzz");
    expect(within(getBody()).getByText("No results")).toBeInTheDocument();
    expect(screen.queryByText("Load Balancer 1")).not.toBeInTheDocument();

    await user.clear(getSearch());
    expect(within(getBody()).queryByText("No results")).not.toBeInTheDocument();
    expect(screen.getByText("Load Balancer 1")).toBeInTheDocument();
  });

  it('renders the empty row with filterMode="hide" and keeps rows mounted', async () => {
    render(DataTableEmptySlot, { props: { filterMode: "hide" } });

    await user.type(getSearch(), "zzz");

    expect(within(getBody()).getByText("No results")).toBeInTheDocument();
    const row = document.querySelector('[data-row="0"]');
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute("hidden");

    await user.clear(getSearch());
    expect(within(getBody()).queryByText("No results")).not.toBeInTheDocument();
  });
});
