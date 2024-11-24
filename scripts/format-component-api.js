// @ts-check
import fs from "node:fs";
import componentApi from "../docs/src/COMPONENT_API.json" assert { type: "json" };
import { format } from "prettier";
import plugin from "prettier/plugins/typescript";

const formatTypeScript = async (value) => {
  return await format(value, { 
    parser: "typescript", 
    plugins: [plugin],
    printWidth: 40, // Force breaking onto new lines
    bracketSameLine: false
  });
};

console.time("formatComponentApi");

let modified = { ...componentApi };

modified.components = await Promise.all(
  componentApi.components.map(async (component) => {
    component.props = await Promise.all(
      component.props.map(async (prop) => {
        if (!prop.value || !/\s{2,}/.test(prop.value)) {
          return prop;
        }

        let normalizedValue = prop.value;
        let prefix = `const ${prop.name} = `;

        if (prop.isFunction || prop.value.startsWith("{")) {
          normalizedValue = prefix + prop.value;
        }

        const formatted = (await formatTypeScript(normalizedValue))
          // Remove prefix needed for formatting.
          .replace(new RegExp(`^${prefix}`), "")
          // Remove trailing semi-colon.
          .replace(/;\s*$/, "");

        return {
          ...prop,
          value: formatted,
        };
      }),
    );

    component.typedefs = await Promise.all(
      component.typedefs.map(async (typedef) => {
        if (!typedef.ts) {
          return typedef;
        }

        return {
          ...typedef,
          ts: await formatTypeScript(typedef.ts),
        };
      }),
    );

    component.events = await Promise.all(
      component.events.map(async (event) => {
        if (event.type === "forwarded") {
          return event;
        }

        let normalizedValue = `type EventDetail = ` + event.detail;

        const formatted = (await formatTypeScript(normalizedValue))
          // Remove prefix needed for formatting.
          .replace(/type EventDetail = /, "")
          // Remove trailing semi-colon.
          .replace(/;\s*$/, "");

        return {
          ...event,
          detail: formatted,
        };
      }),
    );

    component.slots = await Promise.all(
      component.slots.map(async (slot) => {
        if (!slot.slot_props) {
          return slot;
        }

        let normalizedValue = slot.slot_props;

        if (normalizedValue.startsWith("{")) {
          normalizedValue = `type SlotProps = ` + normalizedValue;
        }

        const formatted = (await formatTypeScript(normalizedValue))
          // Remove prefix needed for formatting.
          .replace(/type SlotProps = /, "")
          // Remove trailing semi-colon.
          .replace(/;\s*$/, "");

        return {
          ...slot,
          slot_props: formatted,
        };
      }),
    );

    return component;
  }),
);

fs.writeFileSync(
  "./docs/src/COMPONENT_API.json",
  JSON.stringify(modified, null, 2),
);

console.timeEnd("formatComponentApi");
