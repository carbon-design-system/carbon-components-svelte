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
  doc("Button", "Button"),
  doc("ButtonSet", "ButtonSet"),
  doc("DataTable", "DataTable"),
  doc("DataTable", "Sorting"),
  doc("MultiSelect", "MultiSelect"),
  doc("MultiSelect", "Basic"),
  doc("Select", "Select"),
  doc("Select", "Basic"),
  doc("Tooltip", "Tooltip"),
]);

describe("createSearch", () => {
  it.each([
    // Prefix and typo.
    [
      "sel",
      [
        "Select-Select",
        "MultiSelect-MultiSelect",
        "Select-Basic",
        "MultiSelect-Basic",
      ],
    ],
    ["tooltp", ["Tooltip-Tooltip"]],
    // A word of a component's name.
    ["table", ["DataTable-DataTable", "DataTable-Sorting"]],
    [
      "multi select",
      [
        "MultiSelect-MultiSelect",
        "Select-Select",
        "MultiSelect-Basic",
        "Select-Basic",
      ],
    ],
    // `button` matches `ButtonSet` once, not as a word and a prefix.
    ["button", ["Button-Button", "ButtonSet-ButtonSet"]],
  ])("ranks %j", (query, ids) => {
    expect(search(query).map((d) => d.id)).toEqual(ids);
  });
});
