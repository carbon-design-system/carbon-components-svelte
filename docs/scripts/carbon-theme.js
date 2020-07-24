const fs = require("fs");
const sass = require("node-sass");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const { promisify } = require("util");

const writeFile = promisify(fs.writeFile);
const outFile = "./static/style.css";

async function generateCss() {
  sass.render(
    {
      outFile,
      omitSourceMapUrl: true,
      data: `
        $feature-flags: (
          enable-css-custom-properties: true,
          grid-columns-16: true,
        );
        
        @import "node_modules/carbon-components/scss/globals/scss/_css--helpers.scss";
        @import "node_modules/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/themes/_mixins.scss";
        
        :root[carbon-theme="white"] { @include carbon--theme($carbon--theme--white, true); }
        :root { @include carbon--theme($carbon--theme--g10, true); }
        :root[carbon-theme="g90"] { @include carbon--theme($carbon--theme--g90, true); }
        :root[carbon-theme="g100"] { @include carbon--theme($carbon--theme--g100, true); }
        
        $css--font-face: true;
        $css--helpers: true;
        $css--body: true;
        $css--use-layer: true;
        $css--reset: true;
        $css--default-type: true;
        $css--plex: true;
        
        @import "node_modules/carbon-components/scss/globals/scss/_css--reset.scss";
        @import "node_modules/carbon-components/scss/globals/scss/_css--font-face.scss";
        @import "node_modules/carbon-components/scss/globals/scss/_css--helpers.scss";
        @import "node_modules/carbon-components/scss/globals/scss/_css--body.scss";
        @import "node_modules/carbon-components/scss/globals/grid/_grid.scss";
        @import "node_modules/carbon-components/scss/globals/scss/styles.scss";`,
    },
    async (error, result) => {
      if (!error) {
        const prefixed = await postcss([autoprefixer]).process(result.css, {
          from: undefined,
        });
        await writeFile(outFile, prefixed.css);
      }
    }
  );
}

generateCss();
