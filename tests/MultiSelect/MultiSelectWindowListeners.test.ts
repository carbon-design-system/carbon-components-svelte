import { render } from "@testing-library/svelte";
import MultiSelect from "./MultiSelect.test.svelte";

const net = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
  type: string,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === type).length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === type).length;

describe("MultiSelect window listeners", () => {
  test("closed MultiSelects register no window click/focusin listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) {
      render(MultiSelect, { props: { open: false } });
    }

    expect(net(add, remove, "click")).toBe(0);
    expect(net(add, remove, "focusin")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  test("an open MultiSelect registers one click and one focusin listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(MultiSelect, { props: { open: true } });
    expect(net(add, remove, "click")).toBe(1);
    expect(net(add, remove, "focusin")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
