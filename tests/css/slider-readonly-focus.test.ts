// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const READONLY = ".bx--slider-container--readonly";

async function decls(selector: string) {
  return parseRules(await compileEntry("all.scss")).find(
    (r) => r.context === "" && r.selector === selector,
  )?.decls;
}

describe("read-only slider thumb focus", () => {
  it("restores the hidden thumb's size so focus is visible", async () => {
    const thumb = await decls(`${READONLY} .bx--slider__thumb:focus`);

    expect(thumb?.get("width")).toBe("0.875rem");
    expect(thumb?.get("height")).toBe("0.875rem");
  }, 30_000);

  it.each(["lower", "upper"])(
    "fills the %s range handle's wrapper like an editable one",
    async (bound) => {
      const thumb = await decls(
        `${READONLY} .bx--slider__thumb--${bound}:focus`,
      );
      const connector = await decls(
        `${READONLY} .bx--slider__thumb--${bound}:focus::before`,
      );

      expect(thumb?.get("width")).toBe("100%");
      expect(thumb?.get("height")).toBe("100%");
      expect(connector?.get("display")).toBe("block");
    },
    30_000,
  );
});
