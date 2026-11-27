import { screen } from "@testing-library/svelte";
import { createItems } from "../../utils/create-items";
import { user } from "../../utils/user";
import { caseRows, field, renderCase } from "./cases";

// Windowed defaults: 40px rows and 3 rows of overscan, windowed above 100
// items, so a window of H px renders ceil(H / 40) + 3 rows.

function menu() {
  return screen.getByRole("listbox");
}

describe.each(caseRows)("%s maxHeight", (_, c) => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { label: "in place", fields: {}, maxHeight: 150, style: "150px" },
    { label: "in place", fields: {}, maxHeight: "12rem", style: "12rem" },
    {
      label: "in a portal",
      fields: { portalMenu: true },
      maxHeight: "20rem",
      style: "20rem",
    },
  ])(
    "caps a $label menu at $maxHeight",
    async ({ fields, maxHeight, style }) => {
      renderCase(c, { items: createItems(20), maxHeight, ...fields });

      await user.click(field());

      expect(menu().style.maxHeight).toBe(style);
    },
  );

  it("sizes a virtualized window from a number", async () => {
    renderCase(c, { items: createItems(500), maxHeight: 200 });

    await user.click(field());

    expect(menu().style.maxHeight).toBe("200px");
    expect(screen.getAllByRole("option")).toHaveLength(8);
  });

  it("resolves a CSS length to pixels for a virtualized window", async () => {
    const rect = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return this.style.height === "10rem"
          ? DOMRect.fromRect({ width: 0, height: 160 })
          : rect.call(this);
      },
    );
    renderCase(c, { items: createItems(500), maxHeight: "10rem" });

    await user.click(field());

    expect(menu().style.maxHeight).toBe("160px");
    expect(screen.getAllByRole("option")).toHaveLength(7);
  });

  it("lets virtualize.containerHeight win over maxHeight", async () => {
    renderCase(c, {
      items: createItems(500),
      maxHeight: 200,
      virtualize: { containerHeight: 400 },
    });

    await user.click(field());

    expect(menu().style.maxHeight).toBe("400px");
  });
});
