import { render, screen } from "@testing-library/svelte";
import CssColumn from "./CssColumn.test.svelte";

const spanClasses = (el: HTMLElement) =>
  [...el.classList].filter((name) => /col-(span|start|end)-/.test(name));

describe("CssColumn", () => {
  it("should render a div.bx--css-grid-column with no span class by default", () => {
    render(CssColumn);
    const col = screen.getByTestId("test-col");
    expect(col.tagName).toBe("DIV");
    expect(col).toHaveClass("bx--css-grid-column");
    expect(spanClasses(col)).toEqual([]);
  });

  it.each([
    [4, "bx--col-span-4"],
    [0, "bx--col-span-0"],
    [true, "bx--col-span-auto"],
    ["50%", "bx--col-span-50"],
  ] as const)("should render span=%s as %s", (span, className) => {
    render(CssColumn, { props: { span } });
    expect(spanClasses(screen.getByTestId("test-col"))).toEqual([className]);
  });

  it("should render a percent span on a breakpoint prop", () => {
    render(CssColumn, { props: { sm: "50%" } });
    expect(screen.getByTestId("test-col")).toHaveClass("bx--sm:col-span-50");
  });

  it("should render start/end without a span class when span is omitted", () => {
    render(CssColumn, { props: { span: { start: 2, end: 5 } } });
    expect(spanClasses(screen.getByTestId("test-col"))).toEqual([
      "bx--col-start-2",
      "bx--col-end-5",
    ]);
  });

  it("should combine breakpoint classes", () => {
    render(CssColumn, {
      props: { sm: 4, md: { span: 6, start: 2 }, lg: 16 },
    });
    expect(screen.getByTestId("test-col")).toHaveClass(
      "bx--sm:col-span-4",
      "bx--md:col-span-6",
      "bx--md:col-start-2",
      "bx--lg:col-span-16",
    );
  });

  it("should render sm={0} as bx--sm:col-span-0", () => {
    render(CssColumn, { props: { sm: 0 } });
    expect(screen.getByTestId("test-col")).toHaveClass("bx--sm:col-span-0");
  });

  it("should map offset 0 to col-start-auto", () => {
    render(CssColumn, { props: { md: { offset: 0 } } });
    const col = screen.getByTestId("test-col");
    expect(col).toHaveClass("bx--md:col-start-auto");
    expect(col).not.toHaveClass("bx--md:col-start-1");
  });

  it("should map offset N to col-start N + 1", () => {
    render(CssColumn, { props: { md: { offset: 2 } } });
    expect(spanClasses(screen.getByTestId("test-col"))).toEqual([
      "bx--md:col-start-3",
    ]);
  });

  it("should map start 0 to col-start-auto", () => {
    render(CssColumn, { props: { lg: { start: 0 } } });
    expect(spanClasses(screen.getByTestId("test-col"))).toEqual([
      "bx--lg:col-start-auto",
    ]);
  });

  it("should map start N to col-start N", () => {
    render(CssColumn, { props: { lg: { start: 4 } } });
    expect(spanClasses(screen.getByTestId("test-col"))).toEqual([
      "bx--lg:col-start-4",
    ]);
  });

  it("should push both offset and start classes when both are set", () => {
    render(CssColumn, { props: { xlg: { offset: 3, start: 6 } } });
    expect(spanClasses(screen.getByTestId("test-col"))).toEqual([
      "bx--xlg:col-start-4",
      "bx--xlg:col-start-6",
    ]);
  });

  it("should emit a start beyond the breakpoint's column count", () => {
    render(CssColumn, { props: { max: { start: 14 } } });
    expect(screen.getByTestId("test-col")).toHaveClass("bx--max:col-start-14");
  });

  it("should render a percent span inside a descriptor", () => {
    render(CssColumn);
    expect(spanClasses(screen.getByTestId("test-col-descriptor-pct"))).toEqual([
      "bx--md:col-start-2",
      "bx--md:col-span-50",
    ]);
  });
});
