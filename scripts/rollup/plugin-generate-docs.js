import fs from "fs";
import path from "path";
import prettier from "prettier";
import pkg from "../../package.json";
import { parseComponent } from "./parse-component";

function pluginGenerateDocs() {
  let definitions = `
// Type definitions for ${pkg.name} ${pkg.version}
// Project: ${pkg.homepage}

class SvelteComponent {
  $$prop_def: {};

  $$slot_def: {};

  // stub all 'on:{event}' directives
  $on(eventname: string, handler: (e: Event) => any): () => void;
}\n\n`;

  const shared_types = new Set();
  const groups = new Map();
  const components = new Map();

  return {
    name: "generate-docs",
    async generateBundle(options, bundle) {
      for (const filename in bundle) {
        const chunkOrAsset = bundle[filename];

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
                  export class ${moduleName} extends SvelteComponent {
                    ${!!$$prop_def ? "$$prop_def: {" + $$prop_def + "}\n" : ""}
                    
                    ${!!$$slot_def ? "$$slot_def: {" + $$slot_def + "}\n" : ""}
                  }\n\n`;

                components.set(moduleName, component);
              }
            });
        }
      }
    },
    writeBundle() {
      const formatted_definitions = prettier.format(definitions, {
        parser: "typescript",
      });

      fs.writeFileSync(pkg.types, formatted_definitions);
    },
  };
}

export default pluginGenerateDocs;
