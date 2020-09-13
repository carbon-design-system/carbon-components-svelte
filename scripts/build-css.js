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
    
    @import "node_modules/carbon-components-10.19/scss/globals/scss/_css--reset.scss";
    @import "node_modules/carbon-components-10.19/scss/globals/scss/_css--font-face.scss";
    @import "node_modules/carbon-components-10.19/scss/globals/scss/_css--helpers.scss";
    @import "node_modules/carbon-components-10.19/scss/globals/scss/_css--body.scss";
    @import "node_modules/carbon-components-10.19/scss/globals/grid/_grid.scss";
  `,
  components: `
    @import "node_modules/carbon-components-10.19/scss/components/accordion/accordion";
    @import "node_modules/carbon-components-10.19/scss/components/breadcrumb/breadcrumb";
    @import "node_modules/carbon-components-10.19/scss/components/button/button";
    @import "node_modules/carbon-components-10.19/scss/components/checkbox/checkbox";
    @import "node_modules/carbon-components-10.19/scss/components/code-snippet/code-snippet";
    @import "node_modules/carbon-components-10.19/scss/components/combo-box/combo-box";
    @import "node_modules/carbon-components-10.19/scss/components/content-switcher/content-switcher";
    @import "node_modules/carbon-components-10.19/scss/components/copy-button/copy-button";
    @import "node_modules/carbon-components-10.19/scss/components/data-table/data-table";
    @import "node_modules/carbon-components-10.19/scss/components/date-picker/date-picker";
    @import "node_modules/carbon-components-10.19/scss/components/dropdown/dropdown";
    @import "node_modules/carbon-components-10.19/scss/components/file-uploader/file-uploader";
    @import "node_modules/carbon-components-10.19/scss/components/form/form";
    @import "node_modules/carbon-components-10.19/scss/components/inline-loading/inline-loading";
    @import "node_modules/carbon-components-10.19/scss/components/link/link";
    @import "node_modules/carbon-components-10.19/scss/components/list/list";
    @import "node_modules/carbon-components-10.19/scss/components/list-box/list-box";
    @import "node_modules/carbon-components-10.19/scss/components/loading/loading";
    @import "node_modules/carbon-components-10.19/scss/components/modal/modal";
    @import "node_modules/carbon-components-10.19/scss/components/multi-select/multi-select";
    @import "node_modules/carbon-components-10.19/scss/components/notification/inline-notification";
    @import "node_modules/carbon-components-10.19/scss/components/notification/toast-notification";
    @import "node_modules/carbon-components-10.19/scss/components/number-input/number-input";
    @import "node_modules/carbon-components-10.19/scss/components/overflow-menu/overflow-menu";
    @import "node_modules/carbon-components-10.19/scss/components/pagination/pagination";
    @import "node_modules/carbon-components-10.19/scss/components/pagination-nav/pagination-nav";
    @import "node_modules/carbon-components-10.19/scss/components/progress-indicator/progress-indicator";
    @import "node_modules/carbon-components-10.19/scss/components/radio-button/radio-button";
    @import "node_modules/carbon-components-10.19/scss/components/search/search";
    @import "node_modules/carbon-components-10.19/scss/components/select/select";
    @import "node_modules/carbon-components-10.19/scss/components/skeleton/skeleton";
    @import "node_modules/carbon-components-10.19/scss/components/slider/slider";
    @import "node_modules/carbon-components-10.19/scss/components/structured-list/structured-list";
    @import "node_modules/carbon-components-10.19/scss/components/tag/tag";
    @import "node_modules/carbon-components-10.19/scss/components/text-area/text-area";
    @import "node_modules/carbon-components-10.19/scss/components/text-input/text-input";
    @import "node_modules/carbon-components-10.19/scss/components/tile/tile";
    @import "node_modules/carbon-components-10.19/scss/components/time-picker/time-picker";
    @import "node_modules/carbon-components-10.19/scss/components/toggle/toggle";
    @import "node_modules/carbon-components-10.19/scss/components/toolbar/toolbar";
    @import "node_modules/carbon-components-10.19/scss/components/tooltip/tooltip";
    @import "node_modules/carbon-components-10.19/scss/components/ui-shell/ui-shell";

    @import "node_modules/carbon-components-10.18/scss/components/tabs/tabs";
  `,
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
    :root[theme="white"] {
      @include carbon--theme($carbon--theme--white, true);
    }
    
    :root {
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
