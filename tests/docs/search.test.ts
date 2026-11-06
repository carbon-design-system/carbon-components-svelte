// @vitest-environment node
import { createSearch } from "../../docs/src/search";

const doc = (text: string, description: string) => ({
  id: `${text}-${description}`,
  text,
  description,
  href: "",
  isComponent: text === description,
});

const search = createSearch([
  doc("MultiSelect", "MultiSelect"),
  doc("MultiSelect", "Basic"),
  doc("MultiSelect", "Filterable"),
  doc("Select", "Select"),
  doc("Select", "Basic"),
  doc("Tooltip", "Tooltip"),
  doc("Tooltip", "Custom icon"),
]);

describe("createSearch", () => {
  // Expected orders are MiniSearch's with the options the site used.
  it.each([
    [
      "multiselect bas",
      [
        "MultiSelect-MultiSelect",
        "MultiSelect-Basic",
        "MultiSelect-Filterable",
        "Select-Basic",
      ],
    ],
    ["tooltp", ["Tooltip-Tooltip", "Tooltip-Custom icon"]],
    ["sel", ["Select-Select", "Select-Basic"]],
  ])("ranks %j as MiniSearch did", (query, ids) => {
    expect(search(query).map((d) => d.id)).toEqual(ids);
  });
});
