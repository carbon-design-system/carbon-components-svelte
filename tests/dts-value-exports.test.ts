// @vitest-environment node
// @depends-on src/**

// A hand-written `.d.ts` next to a `.js` module declares every value the
// module exports. `./src/*` is a public export, so a value missing from the
// `.d.ts` is a type error for anyone who imports it.
import { globSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");

const pairs = globSync("src/**/*.d.ts", { cwd: root })
  .filter((dts) => !dts.endsWith(".svelte.d.ts"))
  .map((dts) => [dts, dts.replace(/\.d\.ts$/, ".js")])
  .filter(([, js]) => ts.sys.fileExists(path.join(root, js)));

describe(".d.ts value exports", () => {
  it("declare every value the module exports", () => {
    const program = ts.createProgram(
      pairs.flat().map((file) => path.join(root, file)),
      { allowJs: true, noEmit: true },
    );
    const checker = program.getTypeChecker();
    const exported = (file: string, valuesOnly: boolean) => {
      const source = program.getSourceFile(path.join(root, file));
      const module = source && checker.getSymbolAtLocation(source);
      if (!module) return [];
      return checker
        .getExportsOfModule(module)
        .filter((symbol) => {
          if (!valuesOnly) return true;
          const target =
            symbol.flags & ts.SymbolFlags.Alias
              ? checker.getAliasedSymbol(symbol)
              : symbol;
          return target.flags & ts.SymbolFlags.Value;
        })
        .map((symbol) => symbol.name);
    };

    const missing = pairs.flatMap(([dts, js]) => {
      const declared = new Set(exported(dts, false));
      return exported(js, true)
        .filter((name) => !declared.has(name))
        .map((name) => `${dts}: ${name}`);
    });
    expect(missing).toEqual([]);
  });
});
