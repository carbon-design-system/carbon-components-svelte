// @ts-check
import fs from "node:fs";
import { globSync } from "tinyglobby";
import { sveld } from "sveld";
import pkg from "../package.json" assert { type: "json" };

sveld({
  glob: true,
  markdown: true,
  markdownOptions: {
    onAppend: (type, document, components) => {
      if (type === "h1")
        document.append(
          "quote",
          `${components.size} components exported from ${pkg.name}@${pkg.version}.`
        );
    },
  },
  json: true,
  jsonOptions: {
    outFile: "docs/src/COMPONENT_API.json",
  },
});

globSync(["./src/**/*.d.ts"]).forEach((file) => {
  console.log("Copying", file, " to types/");
  fs.copyFileSync(file, file.replace(/src/, "types"));
});
