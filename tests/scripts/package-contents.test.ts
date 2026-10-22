// @vitest-environment node
import { packageContentProblems } from "../../scripts/lib/package-contents";

const file = (path: string) => ({ path, size: 1 });

describe("packageContentProblems", () => {
  test("accepts the expected package files", () => {
    const files = [
      "package.json",
      "README.md",
      "LICENSE",
      "telemetry.yml",
      "css/all.css",
      "css/css.d.ts",
      "src/index.js",
      "src/index.d.ts",
      "src/Button/Button.svelte",
      "src/Button/Button.svelte.d.ts",
    ].map(file);
    expect(packageContentProblems(files, 1)).toEqual([]);
  });

  test("rejects node_modules and .cache paths", () => {
    const problems = packageContentProblems(
      [
        file("src/node_modules/.cache/sveld/parse-cache.json"),
        file("src/node_modules/x.js"),
        file("src/.cache/y.js"),
      ],
      1,
    );
    expect(problems).toEqual([
      expect.stringContaining("node_modules/ segment"),
      expect.stringContaining("node_modules/ segment"),
      expect.stringContaining(".cache/ segment"),
    ]);
  });

  test("rejects unexpected files", () => {
    const paths = [
      "src/data.json",
      "src/Button/Button.test.ts",
      "css/_button.scss",
      "css/vendor/x.css",
      "docs/x.md",
    ];
    expect(packageContentProblems(paths.map(file), 1)).toEqual(
      paths.map((path) =>
        expect.stringContaining(`${path} (1 B): not an expected package file`),
      ),
    );
  });

  test.each([
    "docs/package.json",
    "docs/README.md",
    "packages/LICENSE",
    "LICENSE.txt",
    "telemetry.yml.bak",
    "css/vendor/css.d.ts",
    "css/all.css.map",
    "src/index.js.map",
    "docs/src/Button.svelte",
  ])("rejects %s, which only resembles an allowed file", (path) => {
    expect(packageContentProblems([file(path)], 1)).toEqual([
      expect.stringContaining("not an expected package file"),
    ]);
  });

  test("rejects an unpacked size over budget", () => {
    expect(packageContentProblems([], 11, 10)).toEqual([
      expect.stringContaining("exceeds the 10 B budget"),
    ]);
    expect(packageContentProblems([], 10, 10)).toEqual([]);
  });

  test("requires build outputs only when asked", () => {
    const unbuilt = [file("package.json"), file("src/index.js")];
    expect(packageContentProblems(unbuilt, 1)).toEqual([]);
    expect(
      packageContentProblems(unbuilt, 1, undefined, { requireBuilt: true }),
    ).toEqual([
      expect.stringContaining("css/*.css"),
      expect.stringContaining("src/**/*.svelte.d.ts"),
      expect.stringContaining("src/index.d.ts"),
    ]);
    const built = [
      ...unbuilt,
      file("css/all.css"),
      file("src/index.d.ts"),
      file("src/Button/Button.svelte.d.ts"),
    ];
    expect(
      packageContentProblems(built, 1, undefined, { requireBuilt: true }),
    ).toEqual([]);
  });
});
