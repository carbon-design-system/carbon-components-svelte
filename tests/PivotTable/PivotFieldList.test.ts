import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import PivotFieldList from "./PivotFieldList.test.svelte";

const area = (name: string) => within(screen.getByRole("group", { name }));
const config = () => JSON.parse(screen.getByTestId("config").textContent ?? "");
const chips = (name: string) =>
  area(name)
    .queryAllByRole("listitem")
    .filter((li) => li.hasAttribute("data-pivot-field"))
    .map((li) => li.querySelector(".bx--pivot-fields__text")?.textContent);

describe("PivotFieldList", () => {
  it("lists the unplaced fields, then rows, columns, values and filters", () => {
    render(PivotFieldList);
    expect(screen.getByRole("group", { name: "Pivot fields" })).toBeVisible();
    expect(chips("Fields")).toEqual(["Year", "Amount"]);
    expect(chips("Rows")).toEqual(["Region"]);
    expect(chips("Values")).toEqual(["Sum of Amount"]);
    expect(chips("Columns")).toEqual([]);
    expect(
      area("Columns").getByText("Drag a field here, or use its menu."),
    ).toBeVisible();
  });

  it("moves a field from its menu and announces it", async () => {
    const { component } = render(PivotFieldList);
    await user.click(
      area("Fields").getByRole("button", { name: "Actions for Year" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Move to Columns" }),
    );
    expect(config().columns).toEqual(["year"]);
    expect(chips("Columns")).toEqual(["Year"]);
    expect(chips("Fields")).toEqual(["Amount"]);
    expect(component.events).toEqual(["move:year:available>columns", "change"]);
    expect(screen.getByText("Year moved to Columns")).toBeInTheDocument();
  });

  it("keeps a number field's default sum and a text field's count", async () => {
    render(PivotFieldList);
    await user.click(
      area("Fields").getByRole("button", { name: "Actions for Year" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Move to Values" }),
    );
    expect(config().values.at(-1)).toEqual({ field: "year", aggregate: "sum" });
  });

  it("leaves the config alone when move is canceled", async () => {
    const { component } = render(PivotFieldList, { prevent: true });
    await user.click(
      area("Fields").getByRole("button", { name: "Actions for Year" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Move to Rows" }),
    );
    expect(config().rows).toEqual(["region"]);
    expect(component.events).toEqual(["move:year:available>rows"]);
  });

  it("changes the order of a zone with Move up and Move down", async () => {
    render(PivotFieldList, {
      config: { rows: ["region", "year"], values: [{ field: "amount" }] },
    });
    await user.click(
      area("Rows").getByRole("button", { name: "Actions for Year" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Move up" }));
    expect(config().rows).toEqual(["year", "region"]);
  });

  it("lists a filter's values from the records and keeps the rest", async () => {
    render(PivotFieldList, {
      config: { filters: [{ field: "region" }], values: [{ field: "amount" }] },
      records: [{ region: "EMEA" }, { region: "APAC" }, { region: null }],
    });
    await user.click(
      area("Filters").getByRole("button", { name: "Actions for Region" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Show values" }),
    );
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "EMEA" }),
    );
    expect(config().filters).toEqual([
      { field: "region", include: ["APAC", null] },
    ]);
  });
});
