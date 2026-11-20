// @vitest-environment node

import PivotFieldList from "carbon-components-svelte/PivotTable/PivotFieldList.svelte";
import { RANDOM_ID, renderRaw, renderSSR } from "../utils/ssr";

describe("PivotFieldList server render", () => {
  const props = {
    id: "fields",
    fields: [
      { key: "region", label: "Region" },
      { key: "amount", label: "Amount", type: "number" as const },
    ],
    config: { rows: ["region"], values: [{ field: "amount" }] },
  };

  it("derives every id from the id", () => {
    expect(renderRaw(PivotFieldList, props).match(RANDOM_ID)).toBeNull();
  });

  it("renders every area with its fields", () => {
    const { document } = renderSSR(PivotFieldList, props);
    const names = [...document.querySelectorAll("[data-pivot-zone]")].map(
      (zone) => [
        zone.getAttribute("data-pivot-zone"),
        [...zone.querySelectorAll(".bx--pivot-fields__text")].map((el) =>
          el.textContent?.trim(),
        ),
      ],
    );
    expect(names).toEqual([
      ["available", ["Amount"]],
      ["rows", ["Region"]],
      ["columns", []],
      ["values", ["Sum of Amount"]],
      ["filters", []],
    ]);
    expect(
      document
        .querySelector("[data-pivot-zone=rows]")
        ?.getAttribute("aria-labelledby"),
    ).toBe("fields-rows");
  });
});
