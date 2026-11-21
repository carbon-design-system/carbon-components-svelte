import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { cases } from "./cases";

const NO_ANCHOR = /opened without an `anchor`/;

describe.each(cases)("$name ($variant)", (c) => {
  let clientWidth: ReturnType<typeof vi.spyOn>;
  let scrollWidth: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // jsdom has no layout. Report every element as clipped, so the
    // tooltips that only show for truncated text can open.
    clientWidth = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(40);
    scrollWidth = vi
      .spyOn(HTMLElement.prototype, "scrollWidth", "get")
      .mockReturnValue(200);
  });

  afterEach(() => {
    clientWidth.mockRestore();
    scrollWidth.mockRestore();
  });

  it("places its open portal against an anchor", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(c.component, { props: c.props });
    await flushMacrotask();
    await c.open?.();

    // Without this, a case that never opens its portal would pass.
    await waitFor(() =>
      expect(document.querySelectorAll("[data-floating-portal]")).toHaveLength(
        c.portals ?? 1,
      ),
    );
    await tick();
    await tick();

    const missing = warn.mock.calls.filter(([message]) =>
      NO_ANCHOR.test(String(message)),
    );
    warn.mockRestore();
    expect(missing).toEqual([]);
  });
});
