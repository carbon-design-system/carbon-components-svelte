// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("content switcher icon with text", () => {
  it("centers a 16px current-color icon beside the label text", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const find = (selector: string) =>
      rules.find((r) => r.selector === selector);

    const label = find(".bx--content-switcher__label--with-icon");
    expect(label?.decls.get("display")).toBe("flex");
    expect(label?.decls.get("align-items")).toBe("center");

    const icon = find(".bx--content-switcher__label--with-icon>svg");
    expect(icon?.decls.get("width")).toBe("1rem");
    expect(icon?.decls.get("height")).toBe("1rem");
    expect(icon?.decls.get("flex")).toBe("none");
    // Follows the button's color, so selected, low contrast, and disabled
    // switches recolor the icon with the text.
    expect(icon?.decls.get("fill")).toBe("currentColor");

    expect(
      find(".bx--content-switcher__label-text")?.decls.get("text-overflow"),
    ).toBe("ellipsis");
  }, 30_000);
});
