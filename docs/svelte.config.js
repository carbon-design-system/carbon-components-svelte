import fs from "node:fs";
import path from "node:path";
import { mdsvex } from "mdsvex";
import { format } from "prettier";
import Prism from "prismjs";
import slug from "remark-slug";
import { parse, walk } from "svelte/compiler";
import visit from "unist-util-visit";
import pkg from "../package.json" with { type: "json" };
import component_api from "./src/COMPONENT_API.json" with { type: "json" };
import "prism-svelte";

const component_api_by_name = component_api.components.reduce((a, c) => {
  a[c.moduleName] = true;
  return a;
}, {});

const ICON_NAME_REGEX = /[A-Z][a-z]*/;
const NODE_MODULES_REGEX = /node_modules/;
const PAGES_COMPONENTS_REGEX = /pages\/(components)/;

function createImports(source) {
  const inlineComponents = new Set();
  const icons = new Set();
  const actions = new Set();

  // heuristic to guess if the inline component or expression name is a Carbon icon
  const isIcon = (text) =>
    ICON_NAME_REGEX.test(text) && !(text in component_api_by_name);

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
      } else if (node.type === "Action") {
        actions.add(node.name);
      }
    },
  });

  const action_imports = Array.from(actions.keys());
  const ccs_imports = [
    ...Array.from(inlineComponents.keys()),
    ...action_imports,
  ];
  const icon_imports = Array.from(icons.keys());

  if (ccs_imports.length === 0) return "";

  return `
  <script>
    import {${ccs_imports.join(",")}} from "carbon-components-svelte";
    ${
      icons.size > 0
        ? icon_imports
            .map(
              (icon) =>
                `import ${icon} from "carbon-icons-svelte/lib/${icon}.svelte";`,
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
        svelteSortOrder: "scripts-markup-styles-options",
      });
      const highlightedCode = Prism.highlight(
        formattedCode,
        Prism.languages.svelte,
        "svelte",
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
        path.join("src/pages", `${src}.svelte`),
        "utf-8",
      );
      const formattedCode = format(sourceCode, {
        parser: "svelte",
      });
      const highlightedCode = Prism.highlight(
        formattedCode,
        Prism.languages.svelte,
        "svelte",
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

export default {
  extensions: [".svelte", ".svx"],
  preprocess: [
    {
      markup: ({ filename, content }) => {
        if (NODE_MODULES_REGEX.test(filename) || !filename.endsWith(".svelte"))
          return;
        return {
          code: content.replace(
            /process.env.VERSION/g,
            JSON.stringify(pkg.version),
          ),
        };
      },
    },
    mdsvex({
      smartypants: false,
      remarkPlugins: [plugin, slug, carbonify],
      layout: {
        _: path.join("src/layouts/ComponentLayout.svelte"),
      },
    }),
    {
      markup({ content, filename }) {
        if (NODE_MODULES_REGEX.test(filename)) return null;
        if (!filename.match(PAGES_COMPONENTS_REGEX)) return null;

        const toc = [];

        walk(parse(content), {
          enter(node) {
            if (node.type === "Element") {
              if (node.name === "h2") {
                const id = node.attributes.find(
                  (attribute) => attribute.name === "id",
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
                      .map(
                        (item) =>
                          `<li class="bx--list__item"><a class="bx--link" href="#${item.id}">${item.text}</a></li>`,
                      )
                      .join("")}
                  <h5>Component API</h5>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#props">Props</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#typedefs">Typedefs</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#slots">Slots</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#forwarded-events">Forwarded events</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#dispatched-events">Dispatched events</a>
                  </li>
                  <li class="bx--list__item">
                    <a class="bx--link" href="#rest-props">restProps</a>
                  </li>
                </ul>
              </div>
            </Layout_MDSVEX_DEFAULT>`,
          ),
        };
      },
    },
  ],
};
