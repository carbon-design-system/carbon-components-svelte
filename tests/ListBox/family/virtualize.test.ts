import { fireEvent, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { createItems } from "../../utils/create-items";
import { flushMacrotask } from "../../utils/flush-macrotask";
import { user } from "../../utils/user";
import { virtualWindowLayer } from "../../utils/virtual-window-layer";
import { caseRows, field, renderCase } from "./cases";

// Defaults: 40px rows in a 300px window, 3 rows of overscan, windowed above
// 100 items. From the top, that renders ceil(300 / 40) + 3 = 11 rows.

function menu() {
  return screen.getByRole("listbox");
}

function spacerHeight() {
  return menu().querySelector<HTMLElement>(":scope > div")?.style.height;
}

/** The option `aria-activedescendant` points at, which must be rendered. */
function activeOption() {
  const id = field().getAttribute("aria-activedescendant");
  assert(id);
  const option = document.getElementById(id);
  assert(option);
  return option;
}

/** `aria-posinset` of every rendered option, in DOM order. */
function positions() {
  return screen
    .getAllByRole("option")
    .map((option) => Number(option.getAttribute("aria-posinset")));
}

/**
 * KNOWN: MultiSelect assigns `prevOpen = open` before its close-time scroll
 * reset reads `prevOpen`, so the reset never runs and the reopened menu
 * renders the old window for a frame. Remove the names once fixed.
 */
async function scrollMenu(scrollTop: number) {
  menu().scrollTop = scrollTop;
  await fireEvent.scroll(menu());
}

describe.each(caseRows)("%s virtualization", (_, c) => {
  const setup = (fields: Record<string, unknown>) => renderCase(c, fields);

  /** Reopens a menu that selecting closed, then checks the option's state. */
  const expectSelected = async (name: string) => {
    if (!screen.queryByRole("listbox")) await user.click(field());
    await waitFor(() => {
      expect(screen.getByRole("option", { name })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  };

  it.each([
    {
      label: "auto, 150 items",
      count: 150,
      virtualize: undefined,
      rendered: 11,
      maxHeight: "300px",
    },
    {
      label: "auto, 100 items",
      count: 100,
      virtualize: undefined,
      rendered: 100,
      maxHeight: "",
    },
    {
      label: "false, 150 items",
      count: 150,
      virtualize: false,
      rendered: 150,
      maxHeight: "",
    },
    // Forced on below the threshold: windowed styles, every row rendered.
    {
      label: "true, 50 items",
      count: 50,
      virtualize: true,
      rendered: 50,
      maxHeight: "300px",
    },
    {
      label: "true, 150 items",
      count: 150,
      virtualize: true,
      rendered: 11,
      maxHeight: "300px",
    },
    {
      label: "threshold 100, 50 items",
      count: 50,
      virtualize: { threshold: 100 },
      rendered: 50,
      maxHeight: "300px",
    },
    {
      label: "threshold 40, 50 items",
      count: 50,
      virtualize: { threshold: 40 },
      rendered: 11,
      maxHeight: "300px",
    },
    // ceil(300 / 60) + 3
    {
      label: "itemHeight 60",
      count: 500,
      virtualize: { itemHeight: 60, containerHeight: 300 },
      rendered: 8,
      maxHeight: "300px",
    },
    // ceil(500 / 100) + 3
    {
      label: "itemHeight 100, containerHeight 500",
      count: 500,
      virtualize: { itemHeight: 100, containerHeight: 500 },
      rendered: 8,
      maxHeight: "500px",
    },
    // ceil(400 / 50) + 5, under the cap of 20
    {
      label: "full config object",
      count: 500,
      virtualize: {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 5,
        threshold: 50,
        maxItems: 20,
      },
      rendered: 13,
      maxHeight: "400px",
    },
    {
      label: "maxItems 6",
      count: 500,
      virtualize: { maxItems: 6 },
      rendered: 6,
      maxHeight: "300px",
    },
  ])(
    "renders $rendered options for virtualize: $label",
    async ({ count, virtualize, rendered, maxHeight }) => {
      setup({ items: createItems(count), virtualize });

      await user.click(field());

      expect(screen.getAllByRole("option")).toHaveLength(rendered);
      expect(menu().style.maxHeight).toBe(maxHeight);
      expect(menu().style.overflowY).toBe(maxHeight ? "auto" : "");
    },
  );

  it.each([
    [{ size: "sm", virtualize: true }, "16000px"],
    [{ size: "sm", virtualize: { itemHeight: 50 } }, "25000px"],
    [{ virtualize: { itemHeight: 80 } }, "40000px"],
    [{ fluid: true, virtualize: true }, "32000px"],
    [{ fluid: true, condensed: true, virtualize: true }, "20000px"],
    [{ fluid: true, portalMenu: true, virtualize: true }, "20000px"],
  ])("sizes 500 rows for %o as %s total", async (fields, height) => {
    setup({ items: createItems(500), ...fields });

    await user.click(field());

    expect(spacerHeight()).toBe(height);
  });

  it("moves the window when the menu scrolls", async () => {
    setup({
      items: createItems(500),
      virtualize: { itemHeight: 80, containerHeight: 400 },
    });

    await user.click(field());
    expect(positions()[0]).toBe(1);
    await flushMacrotask();

    await scrollMenu(800);

    // 800px at 80px per row puts row index 10 at the top of the viewport; the
    // window starts 3 rows of overscan above it (row index 7). The default
    // 40px row height would start it at row index 17.
    const itemEleven = await screen.findByRole("option", { name: "Item 11" });
    expect(itemEleven).toHaveAttribute("aria-posinset", "11");
    expect(positions()[0]).toBe(8);
    expect(screen.queryByRole("option", { name: "Item 1" })).toBeNull();

    await user.click(itemEleven);

    await expectSelected("Item 11");
  });

  it("exposes aria-setsize and aria-posinset on the rendered window", async () => {
    setup({ items: createItems(500), virtualize: true, ...c.preselect("250") });

    await user.click(field());

    await screen.findByRole("option", { name: "Item 251" });
    const options = screen.getAllByRole("option");
    expect(options.length).toBeLessThan(500);
    for (const option of options) {
      const number = Number(option.textContent?.trim().replace("Item ", ""));
      expect(option).toHaveAttribute("aria-setsize", "500");
      expect(option).toHaveAttribute("aria-posinset", String(number));
    }
    // Contiguous: the window is one slice of the list.
    const first = positions()[0];
    expect(positions()).toEqual(options.map((_, i) => first + i));
  });

  describe.each([
    { mode: "explicit", virtualize: true },
    { mode: "auto", virtualize: undefined },
  ])("$mode virtualization", ({ virtualize }) => {
    const expectSelectedAtTop = async () => {
      await waitFor(() => {
        const option = screen.getByRole("option", { name: "Item 251" });
        expect(option).toHaveAttribute("aria-selected", "true");
        // Item 251 is at index 250, at 40px per row.
        expect(menu().scrollTop).toBe(10000);
      });
    };

    it("scrolls the selected item to the top on open", async () => {
      setup({ items: createItems(500), virtualize, ...c.preselect("250") });

      await user.click(field());

      await expectSelectedAtTop();
    });

    it("scrolls the selected item to the top on reopen", async () => {
      const { rerender } = setup({
        items: createItems(500),
        virtualize,
        ...c.preselect("250"),
      });

      await user.click(field());
      await expectSelectedAtTop();

      menu().scrollTop = 0;
      await flushMacrotask();
      await rerender({ open: false });
      await flushMacrotask();
      await rerender({ open: true });

      await expectSelectedAtTop();
    });

    it("moves the highlight on ArrowDown from where the case starts it", async () => {
      setup({ items: createItems(500), virtualize, ...c.preselect("250") });
      // Single-select menus move on from the selection; MultiSelect starts at
      // the first item, bringing the window back to the top.
      const next = c.navigatesFromSelection ? "Item 252" : "Item 1";

      await user.click(field());
      await expectSelectedAtTop();
      await user.keyboard("{ArrowDown}");

      await waitFor(() => expect(activeOption()).toHaveAccessibleName(next));

      await user.keyboard("{Enter}");

      await expectSelected(next);
    });

    it("reopens at the top after scrolling", async () => {
      setup({ items: createItems(500), virtualize });

      await user.click(field());
      expect(screen.getByRole("option", { name: "Item 1" })).toBeVisible();
      await flushMacrotask();

      await scrollMenu(2000);
      await tick();

      expect(screen.queryByRole("option", { name: "Item 1" })).toBeNull();
      expect(screen.getByRole("option", { name: "Item 60" })).toBeVisible();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).toBeNull();

      // The reopened menu starts at the top, so it must never render the
      // window the previous scroll position pointed at, even for a frame.
      const rendered: string[] = [];
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            rendered.push(node.textContent ?? "");
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      await user.click(field());
      await tick();
      observer.disconnect();

      expect(menu().scrollTop).toBe(0);
      expect(screen.getByRole("option", { name: "Item 1" })).toBeVisible();
      expect(screen.queryByRole("option", { name: "Item 60" })).toBeNull();
      expect(rendered.some((text) => text.includes("Item 1"))).toBe(true);
      expect(rendered.some((text) => text.includes("Item 60"))).toBe(false);
    });
  });

  it("opens at the top when nothing is selected", async () => {
    setup({ items: createItems(500), virtualize: true });

    await user.click(field());
    await flushMacrotask();

    expect(menu().scrollTop).toBe(0);
    expect(positions()[0]).toBe(1);
  });

  it("clamps the scroll to a selected last item", async () => {
    setup({ items: createItems(500), virtualize: true, ...c.preselect("499") });

    await user.click(field());

    await waitFor(() => {
      const option = screen.getByRole("option", { name: "Item 500" });
      expect(option).toHaveAttribute("aria-selected", "true");
      // 499 * 40 = 19960, clamped to 500 * 40 - 300.
      expect(menu().scrollTop).toBe(19700);
    });
  });

  it("scrolls only once the highlight leaves the viewport", async () => {
    setup({ items: createItems(500), virtualize: true });

    await user.click(field());
    await flushMacrotask();

    // Item 7 ends at 280px, inside the 0-300px viewport.
    await user.keyboard("{ArrowDown>7/}");
    await flushMacrotask();
    expect(activeOption()).toHaveAccessibleName("Item 7");
    expect(menu().scrollTop).toBe(0);

    // Item 30 ends at 1200px, past the 11 rows first rendered, so the
    // viewport moves to end there.
    await user.keyboard("{ArrowDown>23/}");
    await waitFor(() => expect(menu().scrollTop).toBe(900));
    expect(activeOption()).toHaveAccessibleName("Item 30");
    expect(activeOption()).toHaveAttribute("aria-posinset", "30");
  });

  it.runIf(c.homeEndMove)(
    "renders and highlights the last item on End",
    async () => {
      setup({ items: createItems(500), virtualize: true });

      await user.click(field());
      await user.keyboard("{End}");

      await waitFor(() => expect(menu().scrollTop).toBe(19700));
      expect(activeOption()).toHaveAccessibleName("Item 500");
      expect(activeOption()).toHaveAttribute("aria-posinset", "500");

      await user.keyboard("{Enter}");

      await expectSelected("Item 500");
    },
  );

  it("keeps focus on the field while clicking a virtualized option", async () => {
    setup({ items: createItems(500), virtualize: true });

    await user.click(field());
    expect(field()).toHaveFocus();

    await user.click(screen.getByRole("option", { name: "Item 1" }));

    expect(field()).toHaveFocus();
    await expectSelected("Item 1");
  });

  it("pins the window when virtualize sets optimizeFastScroll", async () => {
    setup({
      items: createItems(500),
      virtualize: { optimizeFastScroll: true },
    });

    await user.click(field());

    const layer = virtualWindowLayer(menu());
    expect(layer.style.position).toBe("sticky");
    expect(layer.style.height).toBe("0px");

    await scrollMenu(2000);

    // 2000px down, the window starts 3 rows of overscan above row 50, at
    // 1880px. The sticky layer sits at 2000px, so the rows move back 120px.
    expect(layer.style.transform).toBe("translateY(-120px)");
  });

  it("does not pin the window by default", async () => {
    setup({ items: createItems(500), virtualize: true });

    await user.click(field());

    const layer = virtualWindowLayer(menu());
    expect(layer.style.position).toBe("");
    expect(layer.style.transform).toBe("translateY(0px)");
  });
});
