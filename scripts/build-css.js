// @ts-check
import fs from "node:fs";
import path from "node:path";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import sass from "sass";

const scss = fs
  .readdirSync("css")
  .filter((file) => file.endsWith(".scss") && !/^_popover/.test(file))
  .map((file) => path.parse(file));

for (const { name, base } of scss) {
  const file = `css/${base}`;
  const outFile = `css/${name}.css`;

  console.log("[build-css]", file, "-->", outFile);

  const { css } = sass.renderSync({
    file,
    outFile,
    outputStyle: "compressed",
    omitSourceMapUrl: true,
    includePaths: ["node_modules"],
  });

  const prefixed = await postcss([
    autoprefixer({
      overrideBrowserslist: ["last 1 version", "ie >= 11", "Firefox ESR"],
    }),
  ]).process(css, { from: undefined });

  fs.writeFileSync(outFile, prefixed.css);
}
