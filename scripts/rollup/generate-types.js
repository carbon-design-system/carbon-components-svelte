/**
 * Use library component metadata to generate TypeScript definitions.
 * @param {Map<string, { component: { exported_props: Map<string, any>; slots: Map<string, any>; } typedefs: {name: string; type: string;}[] }>} components
 * @param {{name: string; version: string; homepage: string;}} pkg
 */
export function generateTypes(components, pkg) {
  let code = `
    // Type definitions for ${pkg.name} ${pkg.version}
    // Project: ${pkg.homepage}

    class SvelteComponent {
      $$prop_def: {};

      $$slot_def: {};

      // stub all \`on:{eventname}\` directives
      $on(eventname: string, handler: (e: Event) => any): () => void;
    }\n\n`;

  components.forEach((component, moduleName) => {
    let $$prop_def = "";
    let $$slot_def = "";

    component.typedefs.forEach(({ name, type }) => {
      const typedef = type.startsWith("{")
        ? `interface ${name} ${type}`
        : `type ${name} = ${type};`;
      code += typedef + "\n\n";
    });

    component.component.exported_props.forEach((prop, name) => {
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

    component.component.slots.forEach((slot, slot_name) => {
      let value = "";

      slot.attributes.forEach((attribute) => {
        if (attribute.name !== "name") {
          value += attribute.name + ": any;";
        }
      });

      if (slot.default) {
        $$slot_def += "default: {" + value + "};" + "\n";
      } else {
        $$slot_def += JSON.stringify(slot_name) + ": {" + value + "};" + "\n";
      }
    });

    code += `
      export class ${moduleName} extends SvelteComponent {
        ${!!$$prop_def ? "$$prop_def: {" + $$prop_def + "}\n" : ""}
        
        ${!!$$slot_def ? "$$slot_def: {" + $$slot_def + "}\n" : ""}
      }\n\n`;
  });

  return { code };
}
