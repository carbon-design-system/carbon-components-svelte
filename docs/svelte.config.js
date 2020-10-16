const path = require("path");
const { mdsvex } = require("mdsvex");
const { parse, walk } = require("svelte/compiler");
const slug = require("remark-slug");
const visit = require("unist-util-visit");
const { format } = require("prettier");
const pkg = require("../package.json");
const fs = require("fs");
const Prism = require("prismjs");
require("prism-svelte");

function createImports(source) {
  const inlineComponents = new Set();
  const icons = new Set();

  // TODO: [refactor] better determine if component is a Carbon icon
  const isIcon = (text) => text.match(/(16|20|24|32)/);

  walk(parse(source), {
    enter(node) {
      if (node.type === "InlineComponent") {
        if (isIcon(node.name)) {
          icons.add(node.name);
        } else {
          inlineComponents.add(node.name);
        }
      } else if (node.type === "MustacheTag") {
        if (
          node.expression.type === "Identifier" &&
          isIcon(node.expression.name)
        ) {
          icons.add(node.expression.name);
        }
      }
    },
  });

  const ccs_imports = Array.from(inlineComponents.keys());
  const icon_imports = Array.from(icons.keys());

  return `
  <script>
    import {${ccs_imports.join(",")}} from "carbon-components-svelte";
    ${
      icons.size > 0
        ? icon_imports
            .map(
              (icon) => `import ${icon} from "carbon-icons-svelte/lib/${icon}";`
            )
            .join("\n")
        : ""
    }
  </script>\n`;
}

function plugin() {
  function visitor(node) {
    if (
      node.lang !== "svelte" &&
      !node.value.startsWith("<FileSource") &&
      !node.value.startsWith("<script>") &&
      !node.value.match(/svx-ignore/g)
    ) {
      const scriptBlock = createImports(node.value);
      const formattedCode = format(scriptBlock + node.value, {
        parser: "svelte",
        svelteBracketNewLine: true,
      });
      const highlightedCode = Prism.highlight(
        formattedCode,
        Prism.languages.svelte,
        "svelte"
      );

      node.value = `<Preview codeRaw="{\`${formattedCode}\`}" code="{\`${highlightedCode}\`}">${node.value}</Preview>`;
    }

    if (node.value.startsWith("<FileSource")) {
      let src = "";

      walk(parse(node.value), {
        enter(node) {
          if (node.name === "FileSource") {
            node.attributes.forEach((attribute) => {
              if (attribute.name === "src") {
                src += attribute.value[0].raw;
              }
            });
          }
        },
      });

      const sourceCode = fs.readFileSync(
        path.join(__dirname, "src/pages", `${src}.svelte`),
        "utf-8"
      );
      const formattedCode = format(sourceCode, {
        parser: "svelte",
        svelteBracketNewLine: true,
      });
      const highlightedCode = Prism.highlight(
        formattedCode,
        Prism.languages.svelte,
        "svelte"
      );

      node.value = `<Preview framed src="${src}" codeRaw="{\`${formattedCode}\`}" code="{\`${highlightedCode}\`}" />`;
    }
  }

  return (tree) => {
    visit(tree, "html", visitor);
  };
}

function carbonify() {
  return (tree) => {
    visit(tree, "link", (node) => {
      node.data = { hProperties: { class: "bx--link" } };
    });
  };
}

const NODE_ENV = process.env.NODE_ENV || "production";

module.exports = {
  extensions: [".svelte", ".svx"],
  preprocess: [
    require("svelte-preprocess")({
      replace: [
        ["process.env.VERSION", JSON.stringify(pkg.version)],
        ["process.env.NODE_ENV", JSON.stringify(NODE_ENV)],
      ],
      postcss: {
        plugins: [
          require("autoprefixer")({
            overrideBrowserslist: ["last 1 version", "ie >= 11"],
          }),
        ],
      },
    }),
    mdsvex({
      remarkPlugins: [plugin, slug, carbonify],
      layout: {
        recipe: path.join(__dirname, "src/layouts/Recipe.svelte"),
        _: path.join(__dirname, "src/layouts/ComponentLayout.svelte"),
      },
    }),
    {
      markup({ content, filename }) {
        if (filename.endsWith(".svx") && filename.match(/pages\/(recipes)/)) {
          const toc = [];

          walk(parse(content), {
            enter(node) {
              if (node.type === "Element") {
                if (node.name === "h2") {
                  const id = node.attributes.find(
                    (attribute) => attribute.name === "id"
                  );
                  toc.push({
                    id: id.value[0].raw,
                    text: node.children[0].raw,
                  });
                }
              }
            },
          });

          return {
            code: content.replace(
              "</Layout_MDSVEX_DEFAULT>",
              `<div slot="aside">
                <ul class="bx--list--unordered">
                ${toc
                  .map((item) => {
                    return `
                      <li class="bx--list__item">
                        <a class="bx--link" href="\#${item.id}">${item.text}</a>
                      </li>`;
                  })
                  .join("")}
                </ul>
              </div>
            </Layout_MDSVEX_DEFAULT>`
            ),
          };
        }

        if (
          filename.endsWith(".svx") &&
          filename.match(/pages\/(components)/)
        ) {
          const toc = [];

          walk(parse(content), {
            enter(node) {
              if (node.type === "Element") {
                if (node.name === "h3") {
                  const id = node.attributes.find(
                    (attribute) => attribute.name === "id"
                  );
                  toc.push({
                    id: id.value[0].raw,
                    text: node.children[0].raw,
                  });
                }
              }
            },
          });

          return {
            code: content.replace(
              "</Layout_MDSVEX_DEFAULT>",
              `<div slot="aside">
                <ul class="bx--list--unordered">
                  <li class="bx--list__item">
                    <a class="bx--link" href="#usage">Usage</a>
                    <ul class="bx--list--unordered bx--list--nested">
                    ${toc
                      .map((item) => {
                        return `
                          <li class="bx--list__item">
                            <a class="bx--link" href="\#${item.id}">${item.text}</a>
                          </li>`;
                      })
                      .join("")}
                    </ul>
                  </li>
                </ul>
              </div>
            </Layout_MDSVEX_DEFAULT>`
            ),
          };
        }
      },
    },
  ],
};
