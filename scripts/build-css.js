const fs = require("fs");
const sass = require("sass");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const path = require("path");

(async () => {
  const popover = fs.readFileSync(
    "node_modules/carbon-components-10.47/src/components/popover/_popover.scss",
    "utf-8"
  );
  const popover_mod = popover.replace(/..\/..\//g, "carbon-components/scss/");

  fs.writeFileSync("css/_popover.scss", popover_mod);

  const scss = fs
    .readdirSync("css")
    .filter((file) => file.endsWith(".scss"))
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
})();
