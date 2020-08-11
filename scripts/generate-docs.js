const fs = require("fs");
const rollup = require("rollup");
const pkg = require("../package.json");
const svelte = require("rollup-plugin-svelte");
const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const path = require("path");
const prettier = require("prettier");
const { parseComponent } = require("./parse-component");

async function generateDocs() {
  let definitions = `
// Type definitions for carbon-components-svelte ${pkg.version}
// Project: https://github.com/IBM/carbon-components-svelte

class CarbonSvelteBase {
  $$prop_def: {};

  $$slot_def: {};

  // stub all 'on:{event}' directives
  $on(eventname: string, handler: (e: Event) => any): () => void;
}\n\n`;

  const shared_types = new Set();
  const groups = new Map();
  const components = new Map();
  const bundle = await rollup.rollup({
    input: "src",
    plugins: [svelte(), resolve(), commonjs()],
  });
  const { output } = await bundle.generate({ format: "es", file: pkg.module });

  for (const chunkOrAsset of output) {
    if (chunkOrAsset.type !== "asset" && chunkOrAsset.isEntry) {
      chunkOrAsset.exports.forEach((exportee) => {
        components.set(exportee, {});
      });

      Object.keys(chunkOrAsset.modules)
        .sort()
        .forEach(async (filename) => {
          const { dir, ext, name } = path.parse(filename);
          const moduleName = name.replace(/\./g, "");

          if (ext === ".svelte" && components.has(moduleName)) {
            const group = dir.split("src/").pop().split("/")[0];

            if (groups.has(group)) {
              groups.set(group, [...groups.get(group), moduleName]);
            } else {
              groups.set(group, [moduleName]);
            }

            const source = fs.readFileSync(filename, "utf-8");
            const component = parseComponent(source, {
              component: moduleName,
              onTypeDef: (tag) => {
                if (shared_types.has(tag.name)) return;

                shared_types.add(tag.name);

                const ts_type = tag.type.startsWith("{")
                  ? `interface ${tag.name} ${tag.type}`
                  : `type ${tag.name} = ${tag.type};`;

                definitions += ts_type + "\n\n";
              },
            });

            let $$prop_def = "";

            component.exported_props.forEach((prop, name) => {
              $$prop_def += "/**\n";

              prop.description.split("\n").forEach((line) => {
                $$prop_def += "* " + line + "\n";
              });

              if (prop.value !== undefined) {
                $$prop_def += "* @default " + prop.value + "\n";
              }

              $$prop_def += "*/\n";

              let value = "undefined";

              if (prop.type) {
                value = prop.type;
              }

              $$prop_def += name + "?: " + value + ";" + "\n\n";
            });

            let $$slot_def = "";

            component.slots.forEach((slot, slot_name) => {
              let value = "";

              slot.attributes.forEach((attribute) => {
                if (attribute.name !== "name") {
                  value += attribute.name + ": any;";
                }
              });

              if (slot.default) {
                $$slot_def += "default: {" + value + "};" + "\n";
              } else {
                $$slot_def +=
                  JSON.stringify(slot_name) + ": {" + value + "};" + "\n";
              }
            });

            definitions += `
              export class ${moduleName} extends CarbonSvelteBase {
                ${!!$$prop_def ? "$$prop_def: {\n" + $$prop_def + "\n}\n" : ""}
                
                ${!!$$slot_def ? "$$slot_def: {\n" + $$slot_def + "\n}\n" : ""}
              }\n\n`;

            components.set(moduleName, component);
          }
        });
    }
  }

  const formatted_definitions = prettier.format(definitions, {
    parser: "typescript",
  });

  fs.writeFileSync(pkg.types, formatted_definitions);
}

generateDocs();
