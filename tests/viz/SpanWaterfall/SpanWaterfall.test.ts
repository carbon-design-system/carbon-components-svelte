import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import SpanWaterfall from "./SpanWaterfall.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/SpanWaterfall/span-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/SpanWaterfall/span-geometry.js")
      >();
    return {
      ...actual,
      buildSpans: (...args: Parameters<typeof actual.buildSpans>) => {
        geometry.calls += 1;
        return actual.buildSpans(...args);
      },
    };
  },
);

const table = () => screen.getByRole("table", { name: "Checkout trace" });
const rows = () => within(table()).getAllByRole("rowheader");
const bars = () =>
  Array.from(
    table().querySelectorAll<HTMLElement>(".bx--viz-timeline__segment"),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("SpanWaterfall", () => {
  it("lists spans depth first, indented, on one time scale", () => {
    render(SpanWaterfall);

    expect(rows().map((th) => th.textContent?.trim())).toEqual([
      "route",
      "GET /checkout",
      "query orders",
      "session",
      "html",
    ]);
    const depths = Array.from(
      table().querySelectorAll<HTMLElement>(".bx--viz-spans__row"),
    ).map((tr) => tr.style.getPropertyValue("--bx-viz-depth"));
    expect(depths).toEqual(["0", "1", "2", "1", "1"]);
    expect(bars()[1].style.getPropertyValue("--bx-viz-start")).toBe("12.5");
    expect(bars()[1].style.getPropertyValue("--bx-viz-pct")).toBe("56.25");
  });

  it("tells assistive technology each span's service, length, and offset", () => {
    render(SpanWaterfall);

    expect(bars()[2]).toHaveTextContent(/^db, 40ms, 35ms in$/);
    expect(bars()[0]).toHaveTextContent("on the critical path");
    expect(
      table().querySelectorAll(".bx--viz-spans__row--critical"),
    ).toHaveLength(2);
    expect(
      table().querySelectorAll(".bx--viz-timeline__tick")[0],
    ).toHaveTextContent("0ms");
  });

  it("can draw the critical path like any other span", () => {
    render(SpanWaterfall, { criticalPath: false });
    expect(
      table().querySelectorAll(".bx--viz-spans__row--critical"),
    ).toHaveLength(0);
    expect(bars()[0]).not.toHaveTextContent("critical");
  });

  it("folds a span's children away from its toggle, without rebuilding on hover", async () => {
    const ontoggle = vi.fn();
    render(SpanWaterfall, { ontoggle });
    const built = geometry.calls;

    await fireEvent.mouseEnter(bars()[1]);
    expect(geometry.calls).toBe(built);

    const toggle = screen.getByRole("button", {
      name: "Collapse GET /checkout",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(ontoggle).toHaveBeenCalledWith({ id: "api", collapsed: true });
    expect(screen.getByTestId("collapsed")).toHaveTextContent("api");
    expect(rows().map((th) => th.textContent?.trim())).toEqual([
      "route",
      "GET /checkout",
      "session",
      "html",
    ]);
    expect(
      screen.getByRole("button", { name: "Expand GET /checkout" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("is a set of toggles with one tab stop when selectable", async () => {
    const onselect = vi.fn();
    const onhover = vi.fn();
    render(SpanWaterfall, { selectable: true, onselect, onhover });

    const buttons = bars();
    expect(buttons.map((button) => button.tabIndex)).toEqual([
      0, -1, -1, -1, -1,
    ]);
    expect(buttons[2]).toHaveAccessibleName("query orders: db, 40ms, 35ms in");

    buttons[0].focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onhover).toHaveBeenCalledWith(
      expect.objectContaining({ id: "api", depth: 1, duration: 90 }),
    );
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        span: expect.objectContaining({ id: "api", offset: 20 }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("api");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });
});
