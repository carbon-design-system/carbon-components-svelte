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
    const problems = packageContentProblems(
      [file("src/data.json"), file("css/_button.scss"), file("docs/x.md")],
      1,
    );
    expect(problems).toHaveLength(3);
  });

  test("rejects an unpacked size over budget", () => {
    expect(packageContentProblems([], 11, 10)).toEqual([
      expect.stringContaining("exceeds the 10 B budget"),
    ]);
    expect(packageContentProblems([], 10, 10)).toEqual([]);
  });
});
