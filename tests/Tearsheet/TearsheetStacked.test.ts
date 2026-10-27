import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TearsheetStacked from "./TearsheetStacked.test.svelte";

// Svelte 5 sets `inert` as a property, which jsdom doesn't reflect.
const isInert = (element: HTMLElement) =>
  element.hasAttribute("inert") || element.inert === true;

function sheet(index: number) {
  const root = screen
    .getByTestId(`sheet-${index}`)
    .closest<HTMLElement>(".bx--tearsheet");
  assert(root);
  return root;
}

async function open(name: string) {
  await user.click(screen.getByRole("button", { name }));
  await tick();
}

describe("Stacked Tearsheets", () => {
  afterEach(() => {
    document.body.classList.remove("bx--body--with-modal-open");
  });

  it("scales a tearsheet back and makes it inert while another opens over it", async () => {
    render(TearsheetStacked);
    await open("Open first");
    expect(sheet(1)).not.toHaveClass("bx--tearsheet--behind-1");
    expect(sheet(1)).not.toHaveClass("bx--tearsheet--stacked");

    await open("Open sheet 2");
    expect(sheet(1)).toHaveClass("bx--tearsheet--behind-1");
    expect(isInert(sheet(1))).toBe(true);
    expect(sheet(2)).toHaveClass("bx--tearsheet--stacked");
    expect(isInert(sheet(2))).toBe(false);

    await open("Open sheet 3");
    expect(sheet(1)).toHaveClass("bx--tearsheet--behind-2");
    expect(sheet(2)).toHaveClass("bx--tearsheet--behind-1");
    expect(sheet(3)).toHaveClass("bx--tearsheet--stacked");
  });

  it("closes only the top tearsheet on Escape, and returns focus into the one beneath", async () => {
    render(TearsheetStacked);
    await open("Open first");
    await open("Open sheet 2");

    await user.keyboard("{Escape}");
    await tick();
    await tick();
    expect(sheet(2)).not.toHaveClass("is-visible");
    expect(sheet(1)).toHaveClass("is-visible");
    expect(sheet(1)).not.toHaveClass("bx--tearsheet--behind-1");
    expect(isInert(sheet(1))).toBe(false);
    expect(screen.getByRole("button", { name: "Open sheet 2" })).toHaveFocus();
  });

  it("keeps Tab inside the top tearsheet", async () => {
    render(TearsheetStacked);
    await open("Open first");
    await open("Open sheet 2");
    const expectFocusInside = () =>
      expect(sheet(2)).toContainElement(document.activeElement as HTMLElement);
    await user.tab();
    expectFocusInside();
    await user.tab();
    expectFocusInside();
    await user.tab();
    expectFocusInside();
  });

  it("stacks by the order tearsheets open, not by their place in the markup", async () => {
    render(TearsheetStacked);
    await open("Open fourth first");
    await open("Open earlier sheet 3");
    expect(sheet(4)).toHaveClass("bx--tearsheet--behind-1");
    expect(sheet(3)).toHaveClass("bx--tearsheet--stacked");
  });

  it("warns once past three tearsheets and shares the last level", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(TearsheetStacked);
    await open("Open first");
    await open("Open sheet 2");
    await open("Open sheet 3");
    expect(warn).not.toHaveBeenCalled();
    await open("Open sheet 4");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(sheet(1)).toHaveClass("bx--tearsheet--behind-2");
    expect(sheet(2)).toHaveClass("bx--tearsheet--behind-2");
    expect(sheet(3)).toHaveClass("bx--tearsheet--behind-1");
    warn.mockRestore();
  });
});
