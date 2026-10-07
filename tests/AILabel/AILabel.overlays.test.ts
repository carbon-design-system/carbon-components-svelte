import { render, screen } from "@testing-library/svelte";
import AILabelOverlays from "./AILabel.overlays.test.svelte";

function table(testId = "table") {
  const element = screen.getByTestId(testId).querySelector("table");
  assert(element);
  return element;
}

describe("AILabel in data tables", () => {
  it("adds a leading decorator column", () => {
    render(AILabelOverlays);

    const headerCells = table().querySelectorAll("thead th");
    expect(headerCells[0]).toHaveClass("bx--table-column-decorator");
    expect(headerCells).toHaveLength(3);

    const bodyRows = table().querySelectorAll("tbody tr");
    for (const row of bodyRows) {
      expect(row.firstElementChild).toHaveClass("bx--table-column-decorator");
    }
  });

  it("marks only rows with an active AI label", () => {
    render(AILabelOverlays);

    const [aiRow, plainRow] = table().querySelectorAll("tbody tr");
    expect(aiRow).toHaveClass("bx--data-table--ai-label-row");
    expect(aiRow.querySelector(".bx--ai-label")).toHaveClass(
      "bx--ai-label--mini",
    );
    expect(plainRow).not.toHaveClass("bx--data-table--ai-label-row");
    expect(plainRow.querySelector(".bx--ai-label")).toBeNull();
  });

  it("spans expanded rows across the decorator column", () => {
    render(AILabelOverlays, { props: { expandable: true } });

    const expandedCell = screen.getByText("Details").closest("td");
    expect(expandedCell).toHaveAttribute("colspan", "4");
  });

  it.each([false, true])(
    "marks the AI column header (sortable: %s)",
    (sortable) => {
      render(AILabelOverlays, { props: { sortable } });

      const forecast = table().querySelectorAll("thead th")[2];
      expect(forecast).toHaveClass("bx--table-header--ai-label");
      expect(forecast.querySelector(".bx--ai-label")).toHaveClass(
        "bx--ai-label--mini",
      );
      expect(forecast.querySelector("button .bx--ai-label")).toBeNull();
      expect(table().querySelectorAll("thead th")[1]).not.toHaveClass(
        "bx--table-header--ai-label",
      );
    },
  );

  it("puts a label beside the title", () => {
    render(AILabelOverlays);

    const header = screen
      .getByTestId("table")
      .querySelector(".bx--data-table-header");
    expect(header).toHaveClass("bx--data-table-header--decorator");
    expect(
      header?.querySelector(".bx--data-table-header__decorator .bx--ai-label"),
    ).toHaveClass("bx--ai-label--xs");
  });

  it("leaves tables without decorators unchanged", () => {
    render(AILabelOverlays);

    expect(
      table("plain-table").querySelector(".bx--table-column-decorator"),
    ).toBeNull();
    expect(table("plain-table").querySelectorAll("thead th")).toHaveLength(2);
  });
});

describe("AILabel in modals", () => {
  it.each(["modal", "composed-modal"])("marks the %s", (testId) => {
    render(AILabelOverlays);

    const modal = screen.getByTestId(testId).querySelector(".bx--modal");
    expect(modal).toHaveClass("bx--modal--decorator", "bx--modal--ai-label");
    expect(
      modal?.querySelector(".bx--modal--inner__decorator .bx--ai-label"),
    ).toHaveClass("bx--ai-label--sm");
  });
});
