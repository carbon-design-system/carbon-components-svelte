import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.test.svelte";

/** dismiss() defers window listener registration by a macrotask; flush it before asserting. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

const netClick = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === "click").length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === "click").length;

describe("ComboBox window listeners", () => {
  test("closed combo boxes register no window click listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(ComboBox, { props: { open: false } });
    expect(netClick(add, remove)).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  test("an open combo box registers exactly one window click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(ComboBox, { props: { open: true } });
    await flush();
    expect(netClick(add, remove)).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });

  test("closing a combo box removes the window click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(ComboBox, { props: { open: true } });
    await flush();
    expect(netClick(add, remove)).toBe(1);

    // An outside click closes the menu, which must tear down the listener.
    await user.click(document.body);
    expect(netClick(add, remove)).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });
});
