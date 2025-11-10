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
const files = Array.from(glob.scanSync({ cwd: "./src" }));

await Promise.all(
  files.map(async (file) => {
    console.log("Copying", file, " to types/");
    const sourceFile = Bun.file(`./src/${file}`);
    await Bun.write(`./types/${file}`, sourceFile);
  }),
);
