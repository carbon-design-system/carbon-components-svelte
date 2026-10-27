import { fireEvent, render, screen } from "@testing-library/svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import DataTable from "./DataTableResizable.test.svelte";

const COLUMN_WIDTH = 100;

function separators() {
  return screen.queryAllByRole("separator");
}

function colWidths() {
  return [...document.querySelectorAll<HTMLElement>("col")].map(
    (col) => col.style.width,
  );
}

function setup(props: Record<string, unknown> = {}) {
  // jsdom lays nothing out: every header is COLUMN_WIDTH wide.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      return rect({ width: this.tagName === "TH" ? COLUMN_WIDTH : 0 });
    },
  );
  const onresize = vi.fn();
  const onclickheader = vi.fn();
  const result = render(DataTable, {
    props: { onresize, onclickheader, ...props },
  });
  return { onresize, onclickheader, ...result };
}

/** Presses the handle at `from`, moves it to each point and releases it. */
async function drag(handle: HTMLElement, from: number, ...to: number[]) {
  await fireEvent.pointerDown(handle, { clientX: from, pointerId: 1 });
  await to.reduce(
    (moved, x) =>
      moved.then(() =>
        fireEvent.pointerMove(handle, { clientX: x, pointerId: 1 }),
      ),
    Promise.resolve(true),
  );
  await fireEvent.pointerUp(handle, { pointerId: 1 });
}

describe("DataTable resizable columns", () => {
  afterEach(() => {
    document.body.removeAttribute("dir");
  });

  it("renders a labelled handle on each resizable header", () => {
    setup();

    const [name, region] = separators();
    expect(separators()).toHaveLength(2);
    expect(name).toHaveAttribute("aria-orientation", "vertical");
    expect(name).toHaveAttribute("tabindex", "0");
    expect(name).toHaveAccessibleName("Resize column Name");
    expect(name).toHaveAttribute("aria-valuenow", `${COLUMN_WIDTH}`);
    expect(name).toHaveAttribute("aria-valuemin", "48");
    expect(region).toHaveAttribute("aria-valuemin", "96");
    expect(region).toHaveAttribute("aria-valuemax", "200");
    // The handle's label stays out of the column's own name.
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
  });

  it("lets one column opt in without resizable, and one opt out with it", () => {
    const { unmount } = setup({
      resizable: false,
      headers: [
        { key: "name", value: "Name", columnResizable: true },
        { key: "region", value: "Region" },
      ],
    });
    expect(separators()).toHaveLength(1);
    expect(document.querySelector("table")).toHaveClass(
      "bx--data-table--fixed-layout",
    );

    unmount();
    setup({ resizable: false });
    expect(separators()).toHaveLength(0);
    expect(document.querySelector("table")).not.toHaveClass(
      "bx--data-table--fixed-layout",
    );
  });

  it("renders seeded widths, and a table as wide as their sum", () => {
    setup({ columnWidths: { name: 200, region: 120, owner: 90 } });

    expect(colWidths()).toEqual(["200px", "120px", "90px"]);
    expect(document.querySelector("table")?.style.width).toBe("410px");
    expect(separators()[0]).toHaveAttribute("aria-valuenow", "200");
  });

  it("resizes by a drag, with one event on release", async () => {
    const { onresize } = setup();
    const [name] = separators();

    await drag(name, 200, 220, 245);

    expect(onresize).toHaveBeenCalledTimes(1);
    expect(onresize).toHaveBeenCalledWith({
      key: "name",
      width: 145,
      widths: { name: 145, region: 100, owner: 100 },
    });
    expect(screen.getByTestId("widths")).toHaveTextContent(
      '{"name":145,"region":100,"owner":100}',
    );
    expect(colWidths()).toEqual(["145px", "100px", "100px"]);
  });

  it("changes nothing on a press without movement", async () => {
    const { onresize } = setup();

    await drag(separators()[0], 200);

    expect(onresize).not.toHaveBeenCalled();
  });

  it("clamps a drag to the column's bounds", async () => {
    const { onresize } = setup();
    const [name, region] = separators();

    await drag(name, 200, 100);
    await drag(region, 200, 900);

    expect(onresize).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ key: "name", width: 48 }),
    );
    expect(onresize).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ key: "region", width: 200 }),
    );
  });

  it("drags the other way under rtl", async () => {
    document.body.setAttribute("dir", "rtl");
    const { onresize } = setup();

    await drag(separators()[0], 200, 170);

    expect(onresize).toHaveBeenCalledWith(
      expect.objectContaining({ key: "name", width: 130 }),
    );
  });

  it("cancels a drag with Escape", async () => {
    const { onresize } = setup();
    const [name] = separators();

    await fireEvent.pointerDown(name, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerMove(name, { clientX: 260, pointerId: 1 });
    await fireEvent.keyDown(name, { key: "Escape" });
    await fireEvent.pointerMove(name, { clientX: 300, pointerId: 1 });
    await fireEvent.pointerUp(name, { pointerId: 1 });

    expect(onresize).not.toHaveBeenCalled();
    expect(colWidths()[0]).toBe("100px");
  });

  it("resizes by keys: 10px, 40px with Shift, Home and End", async () => {
    const { onresize } = setup();
    const [, region] = separators();

    await fireEvent.keyDown(region, { key: "ArrowRight" });
    await fireEvent.keyDown(region, { key: "ArrowRight", shiftKey: true });
    await fireEvent.keyDown(region, { key: "ArrowLeft" });
    await fireEvent.keyDown(region, { key: "End" });
    await fireEvent.keyDown(region, { key: "Home" });

    expect(onresize.mock.calls.map(([detail]) => detail.width)).toEqual([
      110, 150, 140, 200, 96,
    ]);
  });

  it("ignores modifier chords and swaps the arrows under rtl", async () => {
    document.body.setAttribute("dir", "rtl");
    const { onresize } = setup();
    const [name] = separators();

    await fireEvent.keyDown(name, { key: "ArrowRight", altKey: true });
    expect(onresize).not.toHaveBeenCalled();

    await fireEvent.keyDown(name, { key: "ArrowRight" });
    expect(onresize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 90 }),
    );
  });

  it("restores a declared pixel width on double click", async () => {
    const { onresize } = setup({
      headers: [
        { key: "name", value: "Name", width: "160px" },
        { key: "region", value: "Region" },
      ],
    });

    await fireEvent.dblClick(separators()[0]);

    expect(onresize).toHaveBeenCalledWith(
      expect.objectContaining({ key: "name", width: 160 }),
    );
  });

  it("does not click the header when the handle is pressed", async () => {
    const { onclickheader } = setup();
    const [name] = separators();

    await user.click(name);
    await drag(name, 200, 230);

    expect(onclickheader).not.toHaveBeenCalled();
  });
});
