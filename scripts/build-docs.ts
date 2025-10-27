import fs from "node:fs";
import { Glob } from "bun";
import { sveld } from "sveld";
import pkg from "../package.json" with { type: "json" };

sveld({
  glob: true,
  markdown: true,
  markdownOptions: {
    onAppend: (type, document, components) => {
      if (type === "h1")
        document.append(
          "quote",
          `${components.size} components exported from ${pkg.name}@${pkg.version}.`,
        );
    },
  },
  json: true,
  jsonOptions: {
    outFile: "docs/src/COMPONENT_API.json",
  },
});

const glob = new Glob("**/*.d.ts");
for (const file of glob.scanSync({ cwd: "./src" })) {
  console.log("Copying", file, " to types/");
  fs.copyFileSync(`./src/${file}`, `./types/${file}`);
}
