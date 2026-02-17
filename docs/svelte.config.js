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

const ADMONITION_RE = /^\[!(NOTE|WARNING|TIP|CAUTION)\]\s*/i;
const ADMONITION_LINK_REF_RE = /^!(NOTE|WARNING|TIP|CAUTION)$/;
const LEADING_WHITESPACE_RE = /^\n\s*/;

const NOTIFICATION_ICONS = {
  info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path fill="none" d="M16,8a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,8Zm4,13.875H17.125v-8H13v2.25h1.875v5.75H12v2.25h8Z" data-icon-path="inner-path"></path><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,6a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,8Zm4,16.125H12v-2.25h2.875v-5.75H13v-2.25h4.125v8H20Z"></path></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path d="M16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14C30,8.3,23.7,2,16,2z M14.9,8h2.2v11h-2.2V8z M16,25c-0.8,0-1.5-0.7-1.5-1.5S15.2,22,16,22c0.8,0,1.5,0.7,1.5,1.5S16.8,25,16,25z"></path><path fill="none" d="M17.5,23.5c0,0.8-0.7,1.5-1.5,1.5c-0.8,0-1.5-0.7-1.5-1.5S15.2,22,16,22C16.8,22,17.5,22.7,17.5,23.5z M17.1,8h-2.2v11h2.2V8z" data-icon-path="inner-path" opacity="0"></path></svg>',
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2ZM14,21.5908l-5-5L10.5906,15,14,18.4092,21.41,11l1.5957,1.5859Z"></path><path fill="none" d="M14 21.591L9 16.591 10.591 15 14 18.409 21.41 11 23.005 12.585 14 21.591z" data-icon-path="inner-path"></path></svg>',
  error:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="20" height="20" class="bx--inline-notification__icon"><path fill="none" d="M14.9 7.2H17.1V24.799H14.9z" data-icon-path="inner-path" transform="rotate(-45 16 16)"></path><path d="M16,2A13.914,13.914,0,0,0,2,16,13.914,13.914,0,0,0,16,30,13.914,13.914,0,0,0,30,16,13.914,13.914,0,0,0,16,2Zm5.4449,21L9,10.5557,10.5557,9,23,21.4448Z"></path></svg>',
};

const NOTIFICATION_KINDS = {
  NOTE: "info",
  WARNING: "warning",
  TIP: "success",
  CAUTION: "error",
};

const NOTIFICATION_TITLES = {
  NOTE: "Note:",
  WARNING: "Warning:",
  TIP: "Tip:",
  CAUTION: "Caution:",
};

function serializeInlineNodes(nodes) {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return node.value;
        case "inlineCode":
          return `<code>${node.value}</code>`;
        case "strong":
          return `<strong>${serializeInlineNodes(node.children)}</strong>`;
        case "emphasis":
          return `<em>${serializeInlineNodes(node.children)}</em>`;
        case "link":
          return `<a class="bx--link" href="${node.url}">${serializeInlineNodes(node.children)}</a>`;
        case "break":
          return "<br/>";
        default:
          return "";
      }
    })
    .join("");
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

    visit(tree, "blockquote", (node, index, parent) => {
      if (!parent || index == null) return;

      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== "paragraph") return;

      const first = firstChild.children[0];
      if (!first) return;

      let type = null;

      if (first.type === "text") {
        // [!NOTE] parsed as plain text
        const match = first.value.match(ADMONITION_RE);
        if (!match) return;
        type = match[1].toUpperCase();
        first.value = first.value.slice(match[0].length);
        if (!first.value) {
          firstChild.children.shift();
          if (firstChild.children[0]?.type === "break") {
            firstChild.children.shift();
          }
        }
      } else if (first.type === "linkReference") {
        // remark may parse [!NOTE] as a shortcut link reference
        const id = (first.identifier || "").toUpperCase();
        const admonitionMatch = id.match(ADMONITION_LINK_REF_RE);
        if (!admonitionMatch) return;
        type = admonitionMatch[1];
        firstChild.children.shift();
        // Clean up leading whitespace/break after the marker
        while (firstChild.children.length > 0) {
          const next = firstChild.children[0];
          if (next.type === "break") {
            firstChild.children.shift();
          } else if (next.type === "text") {
            next.value = next.value.replace(LEADING_WHITESPACE_RE, "");
            if (!next.value) firstChild.children.shift();
            break;
          } else {
            break;
          }
        }
      } else {
        return;
      }

      const kind = NOTIFICATION_KINDS[type];
      const title = NOTIFICATION_TITLES[type];
      const icon = NOTIFICATION_ICONS[kind];

      // If the first paragraph is now empty, remove it
      if (firstChild.children.length === 0) {
        node.children.shift();
      }

      // Serialize paragraph children directly to avoid <p> wrappers
      const body = node.children
        .map((child) =>
          child.type === "paragraph"
            ? serializeInlineNodes(child.children)
            : "",
        )
        .join("<br/>");

      const html = {
        type: "html",
        value: `<div role="alert" class="bx--inline-notification bx--inline-notification--low-contrast bx--inline-notification--hide-close-button bx--inline-notification--${kind}"><div class="bx--inline-notification__details">${icon}<div class="bx--inline-notification__text-wrapper"><p class="bx--inline-notification__title">${title}</p><div class="body-short-01">${body}</div></div></div></div>`,
      };

      parent.children.splice(index, 1, html);
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
