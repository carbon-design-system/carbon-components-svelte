import { render } from "@testing-library/svelte";
import TooltipDefinition from "./TooltipDefinition.test.svelte";

/** dismiss() defers window listener registration by a macrotask; flush it before asserting. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

const net = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
  type: string,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === type).length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === type).length;

describe("TooltipDefinition window listeners", () => {
  test("closed tooltips register no window keydown listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++)
      render(TooltipDefinition, { props: { open: false } });
    expect(net(add, remove, "keydown")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  test("an open tooltip registers exactly one window keydown listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(TooltipDefinition, { props: { open: true } });
    await flush();
    expect(net(add, remove, "keydown")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
