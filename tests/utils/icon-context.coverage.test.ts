/// <reference types="vite/client" />
import types from "../../src/utils/icon-context.d.ts?raw";

// An icon is swappable everywhere the library draws it or nowhere: every
// component that imports a built-in icon draws it through
// `getIconContext`, under the name `IconName` lists.

const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ICON_IMPORT = /import (\w+) from "(?:\.\.\/)+icons\/(\w+)\.svelte"/g;

/** Names `IconName` lists. */
const iconNames = new Set(
  [...(types.split("export type IconName =")[1] ?? "").matchAll(/"(\w+)"/g)]
    .map(([, name]) => name)
    .filter((name) => name !== undefined),
);

const uses = Object.entries(sources)
  .filter(([path]) => !path.includes("/src/icons/"))
  .flatMap(([path, source]) =>
    [...source.matchAll(ICON_IMPORT)].map(([, binding, file]) => ({
      path,
      source,
      binding,
      file,
    })),
  );

describe("setIconContext coverage", () => {
  it("finds the built-in icons components import", () => {
    expect(uses.length).toBeGreaterThan(100);
  });

  it("draws every built-in icon through getIconContext", () => {
    const problems: string[] = [];
    for (const { path, source, binding, file } of uses) {
      const where = `${path.replace(/.*\/src\//, "src/")}: ${file}`;
      if (!binding?.startsWith("Builtin")) {
        problems.push(`${where} is imported as ${binding}, not Builtin…`);
        continue;
      }
      const local = binding.slice("Builtin".length);
      const swap = new RegExp(
        String.raw`[{,]\s*(?:(\w+):\s*)?${local} = ${binding}\s*[,}][^;]*=\s*getIconContext\(\)`,
      ).exec(source);
      if (!swap) {
        problems.push(`${where} isn't read from getIconContext()`);
        continue;
      }
      const name = swap[1] ?? local;
      if (!iconNames.has(name))
        problems.push(`${where}: IconName lacks "${name}"`);
      // Only the import and the fallback name the built-in icon.
      const mentions = source.match(
        new RegExp(String.raw`\b${binding}\b`, "g"),
      );
      if (mentions?.length !== 2) {
        problems.push(`${where} draws ${binding} outside getIconContext`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("calls getIconContext once per component", () => {
    const counts = [...new Set(uses.map(({ path }) => path))].map((path) => [
      path,
      sources[path]?.match(/getIconContext\(\)/g)?.length,
    ]);
    expect(counts.filter(([, count]) => count !== 1)).toEqual([]);
  });

  it("lists in IconName only icons a component draws", () => {
    const keys = new Set(
      uses.map(({ source, binding }) => {
        const local = binding?.slice("Builtin".length);
        return (
          new RegExp(String.raw`(\w+):\s*${local} = ${binding}`).exec(
            source,
          )?.[1] ?? local
        );
      }),
    );
    expect([...iconNames].filter((name) => !keys.has(name))).toEqual([]);
  });
});
