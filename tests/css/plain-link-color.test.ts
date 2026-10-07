// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const linkColor = async (entry: string) =>
  parseRules(await compileEntry(entry))
    .find((r) => r.selector === "a" && r.context === "" && r.decls.has("color"))
    ?.decls.get("color");

describe("plain link color", () => {
  it("uses the link token so it follows the runtime theme", async () => {
    expect(await linkColor("all.scss")).toBe("var(--cds-link-01)");
  }, 30_000);

  it("resolves per theme in the static theme builds", async () => {
    expect(await linkColor("white.scss")).toBe("#0f62fe");
    expect(await linkColor("g100.scss")).toBe("#78a9ff");
  }, 60_000);
});
