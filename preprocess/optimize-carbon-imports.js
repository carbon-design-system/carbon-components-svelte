const fs = require("fs");
const path = require("path");
const { parse, walk } = require("svelte/compiler");
const api = require("./api.json");

const carbon = {
  components: "carbon-components-svelte",
  icons: "carbon-icons-svelte",
  pictograms: "carbon-pictograms-svelte",
};

function getPackageJson() {
  const path_pkg = path.join(process.cwd(), "package.json");

  if (fs.existsSync(path_pkg)) {
    return JSON.parse(fs.readFileSync(path_pkg, "utf-8"));
  } else {
    return {};
  }
}

function getCarbonVersions() {
  const pkg = getPackageJson();
  const devDeps = pkg.devDependencies || {};
  const deps = pkg.dependencies || {};

  return [carbon.components, carbon.icons, carbon.pictograms].reduce((a, c) => {
    let version = devDeps[c] || deps[c];

    if (version !== undefined) {
      const [major, minor, patch] = version.replace(/^(\^|\~)/, "").split(".");
      version = major;
    }

    return { ...a, [c]: version };
  }, {});
}

const versions = getCarbonVersions();

function optimizeCarbonImports() {
  return {
    script: ({ content, filename }) => {
      if (/node_modules/.test(filename)) return { code: content };

      const ast = parse(`<script>${content}</script>`, { filename });

      let cursor = -8;

      function replaceContent(node, onSpecifier) {
        const replacer = node.specifiers.map((i) => onSpecifier(i)).join("\n");
        const replacee = content.slice(node.start + cursor, node.end + cursor);

        content = content.replace(replacee, replacer);
        cursor += replacer.length - replacee.length;
      }

      walk(ast.instance, {
        enter(node) {
          if (node.type === "ImportDeclaration") {
            switch (node.source.value) {
              case carbon.components:
                replaceContent(node, ({ local, imported }) => {
                  return `import ${local.name} from "${
                    api.components[imported.name].path
                  }";`;
                });
                break;

              case carbon.icons:
                replaceContent(node, ({ local, imported }) => {
                  return `import ${local.name} from "carbon-icons-svelte/lib/${imported.name}/${imported.name}.svelte";`;
                });
                break;

              case carbon.pictograms:
                replaceContent(node, ({ local, imported }) => {
                  if (versions[carbon.pictograms] === "11") {
                    return `import ${local.name} from "carbon-pictograms-svelte/lib/${imported.name}.svelte";`;
                  }

                  return `import ${local.name} from "carbon-pictograms-svelte/lib/${imported.name}/${imported.name}.svelte";`;
                });
                break;
            }
          }
        },
      });

      return { code: content };
    },
  };
}

module.exports = {
  optimizeCarbonImports,
};
