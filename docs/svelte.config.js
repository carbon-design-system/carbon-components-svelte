import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mdsvex } from "mdsvex";
import { format } from "prettier";
import Prism from "prismjs";
import slug from "remark-slug";
import { parse, walk } from "svelte/compiler";
import visit from "unist-util-visit";
import pkg from "../package.json" with { type: "json" };
import componentApi from "./src/COMPONENT_API.json" with { type: "json" };
import "prism-svelte";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const componentApiByName = componentApi.components.reduce((a, c) => {
  a[c.moduleName] = true;
  return a;
}, {});

const ICON_NAME_REGEX = /[A-Z][a-z]*/;
const NODE_MODULES_REGEX = /node_modules/;
const PAGES_COMPONENTS_REGEX = /pages\/(components)/;
const GIT_PREFIX_REGEX = /^git\+/;
const GIT_SUFFIX_REGEX = /\.git$/;
const SCRIPT_TAG_REGEX = /(<script[^>]*>)/i;

function createImports(source) {
  const inlineComponents = new Set();
  const icons = new Set();
  const actions = new Set();

  // heuristic to guess if the inline component or expression name is a Carbon icon
  const isIcon = (text) =>
    ICON_NAME_REGEX.test(text) && !(text in componentApiByName);

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

  const actionImports = Array.from(actions.keys());
  const ccsImports = [...Array.from(inlineComponents.keys()), ...actionImports];
  const iconImports = Array.from(icons.keys());

  if (ccsImports.length === 0) return "";

  return `
  <script>
    import {${ccsImports.join(",")}} from "carbon-components-svelte";
    ${
      icons.size > 0
        ? iconImports
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

      node.value = `<Preview codeRaw={${JSON.stringify(formattedCode)}} code={${JSON.stringify(highlightedCode)}}>${node.value}</Preview>`;
    }

    if (node.value.startsWith("<FileSource")) {
      let src = "";

      walk(parse(node.value), {
        enter(node) {
          if (node.name === "FileSource") {
            for (const attribute of node.attributes) {
              if (attribute.name === "src") {
                src += attribute.value[0].raw;
              }
            }
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

      node.value = `<Preview framed src="${src}" codeRaw={${JSON.stringify(formattedCode)}} code={${JSON.stringify(highlightedCode)}} />`;
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

    visit(tree, "list", (node) => {
      node.data = {
        hProperties: {
          class: node.ordered ? "bx--list--ordered" : "bx--list--unordered",
        },
      };
    });

    visit(tree, "listItem", (node) => {
      node.data = { hProperties: { class: "bx--list__item" } };
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
        const repoUrl = pkg.repository?.url ?? "";
        const normalizedRepoUrl = repoUrl
          .replace(GIT_PREFIX_REGEX, "")
          .replace(GIT_SUFFIX_REGEX, "");
        return {
          code: content
            .replace(/process.env.VERSION/g, JSON.stringify(pkg.version))
            .replace(/"REPO_URL"/g, JSON.stringify(normalizedRepoUrl)),
        };
      },
    },
    mdsvex({
      smartypants: false,
      remarkPlugins: [plugin, slug, carbonify],
      layout: {
        _: path.join(__dirname, "src/layouts/ComponentLayout.svelte"),
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

        let code = content.replace(
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
        );

        // Auto-import Preview component used by the mdsvex remark plugin.
        if (!code.includes("import Preview")) {
          code = code.replace(
            SCRIPT_TAG_REGEX,
            '$1\n  import Preview from "../../components/Preview.svelte";',
          );
        }

        return { code };
      },
    },
  ],
};
