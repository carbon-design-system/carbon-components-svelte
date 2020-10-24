const toLink = (text) => text.toLowerCase().replace(/\s+/g, "-");

const toMdLink = (text) => `[${text}](#${toLink(text)})`;

const formatType = (type) => `<code>${type.replace(/\|/g, "&#124;")}</code>`;

const escapeHtml = (text) => text.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");

const HEADER_PROPS =
  "| Prop name | Type | Default value | Description |\n| :- | :- | :- | :- |\n";

/**
 * Use library component metadata to generate component documentation in markdown format.
 * @param {Map<string, { component: { exported_props: Map<string, any>; slots: Map<string, any>; } typedefs: {name: string; type: string;}[] }>} components
 * @param {Map<string, string[]>} groups
 * @param {{name: string; version: string; homepage: string;}} pkg
 */
export function generateIndex(components, groups, pkg) {
  let code = `# Component Index\n\n`;

  code += `> ${components.size} components exported from ${pkg.name} ${pkg.version}\n\n`;

  groups.forEach((group, component_group) => {
    if (group.length > 1) {
      code += `- ${component_group}\n`;
      group.sort().forEach((component) => {
        code += `  - ${toMdLink(component)}\n`;
      });
    } else {
      code += `- ${toMdLink(component_group)}\n`;
    }
  });

  code += "---\n";

  components.forEach((component, moduleName) => {
    const {
      typedefs,
      component: { exported_props, slots, forwarded_events, dispatched_events },
    } = component;

    code += `## ${moduleName}\n\n`;
    code += `### Import path\n\n`;
    code += `\`\`\`js\nimport { ${moduleName} } from "${pkg.name}";\n\`\`\`\n\n`;

    code += "### Props\n\n";

    if (exported_props.size > 0) {
      if (typedefs.length > 0) {
        let definitions = "";

        typedefs.forEach(({ name, type }) => {
          const typedef = type.startsWith("{")
            ? `interface ${name} ${type}`
            : `type ${name} = ${type};`;

          definitions += `${typedef}\n\n`;
        });

        code += `\`\`\`ts\n// \`${moduleName}\` type definitions\n\n${definitions}\n\`\`\`\n\n`;
      }

      code += HEADER_PROPS;

      exported_props.forEach((prop, name) => {
        code += `| ${name}${
          prop.kind === "const" ? " (`constant`)" : ""
        } | ${formatType(prop.type)} | ${
          prop.value ? "`" + prop.value + "`" : "--"
        } | ${escapeHtml(prop.description).replace(/\n/g, ". ")}. |\n`;
      });
    } else {
      code += "No exported props.\n\n";
    }

    code += "### Slots\n\n";

    if (slots.size > 0) {
      if (slots.get("default")) {
        code += "- **default**: `<div>...</div>`\n";
      }

      slots.forEach((slot, name) => {
        if (slot.default) return;
        code += `- **"${name}"**: \`<div name="${name}" ${slot.attributes
          .map((attr) => `let:${attr.name}`)
          .join(" ")}>...</div>\`\n`;
      });
    } else {
      code += "No slots.\n\n";
    }

    code += "### Forwarded events\n\n";

    if (forwarded_events.size > 0) {
      forwarded_events.forEach((event, name) => {
        code += `- \`on:${name}\`\n`;
      });
    } else {
      code += "No forwarded events.\n\n";
    }

    code += "### Dispatched events\n\n";

    if (dispatched_events.size > 0) {
      dispatched_events.forEach((event, name) => {
        code += `- \`on:${name}\`\n`;
      });
    } else {
      code += "No dispatched events.\n\n";
    }

    code += "---\n";
  });

  return { code };
}
