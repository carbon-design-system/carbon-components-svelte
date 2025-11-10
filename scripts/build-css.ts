import path from "node:path";
import autoprefixer from "autoprefixer";
import { Glob } from "bun";
import postcss from "postcss";
import sass from "sass";

const PARTIAL_FILE_REGEX = /^_/;

const glob = new Glob("*.scss");
const scss = Array.from(glob.scanSync({ cwd: "css" }))
  .filter((file) => !PARTIAL_FILE_REGEX.test(file))
  .map((file) => path.parse(file));

await Promise.all(
  scss.map(async ({ name, base }) => {
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

    await Bun.write(outFile, prefixed.css);
  }),
);
