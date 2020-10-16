const fs = require("fs");
const sass = require("node-sass");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const path = require("path");
const { promisify } = require("util");

const writeFile = promisify(fs.writeFile);
const sassRender = promisify(sass.render);

const shared = {
  globals: `
    $css--font-face: true;
    $css--helpers: true;
    $css--body: true;
    $css--use-layer: true;
    $css--reset: true;
    $css--default-type: true;
    $css--plex: true;
    
    @import "node_modules/carbon-components-10.22/scss/globals/scss/_css--reset.scss";
    @import "node_modules/carbon-components-10.22/scss/globals/scss/_css--font-face.scss";
    @import "node_modules/carbon-components-10.22/scss/globals/scss/_css--helpers.scss";
    @import "node_modules/carbon-components-10.22/scss/globals/scss/_css--body.scss";
    @import "node_modules/carbon-components-10.22/scss/globals/grid/_grid.scss";
    @import "node_modules/carbon-components-10.22/scss/globals/scss/styles.scss";
  `,
  components: ``,
};

const themes = {
  white: `
    $carbon--theme: $carbon--theme--white;
    @include carbon--theme();
  `,
  g10: `
    $carbon--theme: $carbon--theme--g10;
    @include carbon--theme();
  `,
  g90: `
    $carbon--theme: $carbon--theme--g90;
    @include carbon--theme();
  `,
  g100: `
    $carbon--theme: $carbon--theme--g100;
    @include carbon--theme();
  `,
  all: `
    :root {
      @include carbon--theme($carbon--theme--white, true);
    }

    :root[theme="g10"] {
      @include carbon--theme($carbon--theme--g10, true);
    }
    
    :root[theme="g90"] {
      @include carbon--theme($carbon--theme--g90, true);
    }
    
    :root[theme="g100"] {
      @include carbon--theme($carbon--theme--g100, true);
    }
  `,
};

/**
 * Generate pre-compiled CSS for each Carbon theme.
 */
async function buildCss() {
  fs.rmdirSync(path.resolve("css"), { recursive: true });
  fs.mkdirSync(path.resolve("css"));

  Object.keys(themes).forEach(async (theme) => {
    try {
      const outFile = path.resolve("css", theme + ".css");
      const { css } = await sassRender({
        data: `
          $feature-flags: (
            enable-css-custom-properties: ${theme === "all"},
            grid-columns-16: true,
          );
          @import "node_modules/@carbon/themes/scss/themes";
          ${themes[theme]}
          ${shared.globals}
          ${shared.components}
        `,
        outFile,
        outputStyle: "compact",
        omitSourceMapUrl: true,
      });

      const prefixed = await postcss([
        autoprefixer({
          overrideBrowserslist: ["last 1 version", "ie >= 11", "Firefox ESR"],
        }),
      ]).process(css, { from: undefined });

      await writeFile(outFile, prefixed.css);
    } catch (e) {
      console.log(e);
    }
  });
}

buildCss();
