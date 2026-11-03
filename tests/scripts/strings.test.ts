// @vitest-environment node
// @reads src/**/*.svelte src/Kbd/kbd-keys.js i18n/strings.json
import { readFileSync } from "node:fs";
import {
  buildStrings,
  generateStrings,
  STRINGS_PATH,
} from "../../scripts/generate-strings";

describe("i18n/strings.json", () => {
  it("matches the generator's output (run `bun run build:strings`)", () => {
    expect(readFileSync(STRINGS_PATH, "utf-8")).toBe(generateStrings());
  });
});

describe("buildStrings", () => {
  const component = (name: string) => ({
    moduleName: name,
    filePath: `src/${name}.svelte`,
    props: [
      {
        name: "translationIds",
        kind: "const",
        defaultValue: { raw: "", kind: "object", value: { open: "open" } },
      },
      {
        name: "translateWithId",
        kind: "let",
        type: "(id: string) => string",
        defaultValue: { raw: "", kind: "function" },
      },
    ],
  });
  const read = (path: string) =>
    `const defaultTranslations = {\n    [translationIds.open]: "${path.includes("A") ? "Open" : "Unfold"}",\n  };`;

  it("lists the ids of a translateWithId prop with their English text", () => {
    const strings = buildStrings({ components: [component("A")] }, read);

    expect(strings.translateWithId).toMatchObject([
      { component: "A", prop: "translateWithId", ids: { open: "Open" } },
    ]);
  });

  it("rejects one id with two English texts", () => {
    expect(() =>
      buildStrings({ components: [component("A"), component("B")] }, read),
    ).toThrow(/two English texts/);
  });
});
