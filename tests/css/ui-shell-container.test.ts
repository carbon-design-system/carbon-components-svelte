// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("UIShellContainer CSS", () => {
  async function rules() {
    return parseRules(await compileEntry("all.scss"));
  }

  it("declares every theme token on a themed container", async () => {
    const all = await rules();
    // The theme blocks: the root rules that set a background token.
    const tokens = (selector: string) =>
      all
        .filter(
          (r) => r.selector === selector && r.decls.has("--cds-ui-background"),
        )
        .flatMap((r) => [...r.decls.keys()])
        .filter((name) => name.startsWith("--cds-"));
    // White declares every token, so the page's theme can't show through;
    // the others re-declare what differs from white, as on the root.
    expect(tokens(".bx--ui-shell-container[theme]")).toEqual(tokens(":root"));
    for (const theme of ["g10", "g80", "g90", "g100"]) {
      expect(tokens(`.bx--ui-shell-container[theme=${theme}]`)).toEqual(
        tokens(`:root[theme=${theme}]`),
      );
    }
    expect(
      tokens(".bx--ui-shell-container[theme=g100]").length,
    ).toBeGreaterThan(0);
  }, 30_000);
});
