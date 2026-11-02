import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import DataTable from "./DataTable.test.svelte";
import { clickHeader } from "./helpers";

const headers = [
  { key: "name", value: "Name" },
  { key: "port", value: "Port" },
];

const rows = [
  { id: "a", name: "Load Balancer 3", port: 3000 },
  { id: "b", name: "Load Balancer 1", port: 443 },
  { id: "c", name: "Load Balancer 2", port: 80 },
];

const liveRegion =
  '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"]';

/** Live regions whose content changes while `action` runs. */
async function changedLiveRegions(
  container: HTMLElement,
  action: () => Promise<unknown>,
) {
  const regions = new Set<Element>();
  const collect = (records: MutationRecord[]) => {
    for (const record of records) {
      const node = record.target;
      const element = node instanceof Element ? node : node.parentElement;
      const region = element?.closest(liveRegion);
      if (region) regions.add(region);
    }
  };
  const observer = new MutationObserver(collect);
  observer.observe(container, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  await action();
  await tick();
  collect(observer.takeRecords());
  observer.disconnect();
  return [...regions];
}

describe("DataTable sort status", () => {
  it("announces a header sort from one status region, outside the rows", async () => {
    const { container } = render(DataTable, {
      props: { sortable: true, headers, rows },
    });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/^$/);

    const regions = await changedLiveRegions(container, () =>
      clickHeader("Name"),
    );

    expect(regions).toEqual([status]);
    expect(status).toHaveTextContent("Sorted by Name, ascending");
    expect(screen.getAllByRole("rowgroup")[1].closest(liveRegion)).toBeNull();
  });

  it("announces each direction in the cycle", async () => {
    render(DataTable, { props: { sortable: true, headers, rows } });
    const status = screen.getByRole("status");

    await clickHeader("Name");
    await tick();
    expect(status).toHaveTextContent("Sorted by Name, ascending");

    await clickHeader("Name");
    await tick();
    expect(status).toHaveTextContent("Sorted by Name, descending");

    await clickHeader("Name");
    await tick();
    expect(status).toHaveTextContent("Not sorted");
  });

  it("does not announce the sort the table mounts with", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
        sortKey: "port",
        sortDirection: "descending",
      },
    });
    await tick();

    expect(screen.getByRole("status")).toHaveTextContent(/^$/);
  });

  it("announces a sort the consumer applies after canceling the click", async () => {
    const { rerender } = render(DataTable, {
      props: { sortable: true, headers, rows, preventSortDefault: true },
    });
    const status = screen.getByRole("status");

    await clickHeader("Port");
    await tick();
    expect(status).toHaveTextContent(/^$/);

    await rerender({ sortKey: "port", sortDirection: "ascending" });
    await tick();
    expect(status).toHaveTextContent("Sorted by Port, ascending");
  });

  it("takes its text from `sortStatusText`", async () => {
    render(DataTable, {
      props: {
        sortable: true,
        headers,
        rows,
        sortStatusText: (header, direction) =>
          `${header?.key}: ${direction === "ascending" ? "A-Z" : "Z-A"}`,
      },
    });

    await clickHeader("Name");
    await tick();

    expect(screen.getByRole("status")).toHaveTextContent("name: A-Z");
  });
});
