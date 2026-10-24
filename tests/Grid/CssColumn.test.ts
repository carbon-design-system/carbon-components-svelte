import { render, screen } from "@testing-library/svelte";
import CssColumn from "./CssColumn.test.svelte";

function placement() {
  return [...screen.getByTestId("col").classList].filter(
    (name) => name !== "bx--css-grid-column",
  );
}

describe("CssColumn", () => {
  it("renders a column with no placement class by default", () => {
    render(CssColumn);
    const col = screen.getByTestId("col");
    expect(col.tagName).toBe("DIV");
    expect(col).toHaveClass("bx--css-grid-column");
    expect(placement()).toEqual([]);
  });

  it.each([
    ["sm", "bx--sm:"],
    ["md", "bx--md:"],
    ["lg", "bx--lg:"],
    ["xlg", "bx--xlg:"],
    ["max", "bx--max:"],
    ["span", "bx--"],
  ] as const)("prefixes %s classes with %s", (prop, prefix) => {
    render(CssColumn, { props: { [prop]: { offset: 2, span: 4 } } });
    expect(placement()).toEqual([
      `${prefix}col-start-3`,
      `${prefix}col-span-4`,
    ]);
  });

  it.each([
    [4, ["bx--md:col-span-4"]],
    [0, ["bx--md:col-span-0"]],
    [true, ["bx--md:col-span-auto"]],
    [false, []],
    ["50%", ["bx--md:col-span-50"]],
    ["100%", ["bx--md:col-span-100"]],
    [{ span: "25%" }, ["bx--md:col-span-25"]],
    [{ offset: 0 }, ["bx--md:col-start-auto"]],
    [{ start: 0 }, ["bx--md:col-start-auto"]],
    [{ start: 3, end: 7 }, ["bx--md:col-start-3", "bx--md:col-end-7"]],
    [{ start: 14 }, ["bx--md:col-start-14"]],
  ] as const)("renders md=%j as %j", (md, classes) => {
    render(CssColumn, { props: { md } });
    expect(placement()).toEqual(classes);
  });

  it("combines every breakpoint in order", () => {
    render(CssColumn, {
      props: { span: 2, sm: 4, md: { span: 6, start: 2 }, lg: "50%", max: 4 },
    });
    expect(placement()).toEqual([
      "bx--col-span-2",
      "bx--sm:col-span-4",
      "bx--md:col-start-2",
      "bx--md:col-span-6",
      "bx--lg:col-span-50",
      "bx--max:col-span-4",
    ]);
  });

  it.each(["start", "center", "end", "stretch"] as const)(
    "aligns the column with align=%s",
    (align) => {
      render(CssColumn, { props: { md: 4, align } });
      expect(placement()).toEqual([
        "bx--md:col-span-4",
        `bx--col--align-${align}`,
      ]);
    },
  );

  it("passes the classes to a custom element", () => {
    render(CssColumn, { props: { as: true, sm: 2 } });
    const col = screen.getByTestId("col");
    expect(col.tagName).toBe("ARTICLE");
    expect(col).toHaveClass(
      "custom",
      "bx--css-grid-column",
      "bx--sm:col-span-2",
    );
  });
});
