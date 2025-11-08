import fs from "node:fs";
import { format } from "prettier";
import plugin from "prettier/plugins/typescript";
import componentApi from "../docs/src/COMPONENT_API.json" with { type: "json" };

const WHITESPACE_REGEX = /\s{2,}/;
const TRAILING_SEMICOLON_REGEX = /;\s*$/;
const EVENT_DETAIL_PREFIX_REGEX = /type EventDetail = /;
const SLOT_PROPS_PREFIX_REGEX = /type SlotProps = /;

const formatTypeScript = async (value) => {
  return await format(value, {
    parser: "typescript",
    plugins: [plugin],
    printWidth: 40, // Force breaking onto new lines
    bracketSameLine: false,
  });
};

console.time("formatComponentApi");

const modified = { ...componentApi };

modified.components = await Promise.all(
  componentApi.components.map(async (component) => {
    component.props = await Promise.all(
      component.props.map(async (prop) => {
        if (!prop.value || !WHITESPACE_REGEX.test(prop.value)) {
          return prop;
        }

        let normalizedValue = prop.value;
        const prefix = `const ${prop.name} = `;

        if (prop.isFunction || prop.value.startsWith("{")) {
          normalizedValue = prefix + prop.value;
        }

        const formatted = (await formatTypeScript(normalizedValue))
          // Remove prefix needed for formatting.
          .replace(new RegExp(`^${prefix}`), "")
          // Remove trailing semi-colon.
          .replace(TRAILING_SEMICOLON_REGEX, "");

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

        const normalizedValue = `type EventDetail = ${event.detail}`;

        const formatted = (await formatTypeScript(normalizedValue))
          // Remove prefix needed for formatting.
          .replace(EVENT_DETAIL_PREFIX_REGEX, "")
          // Remove trailing semi-colon.
          .replace(TRAILING_SEMICOLON_REGEX, "");

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
          normalizedValue = `type SlotProps = ${normalizedValue}`;
        }

        const formatted = (await formatTypeScript(normalizedValue))
          // Remove prefix needed for formatting.
          .replace(SLOT_PROPS_PREFIX_REGEX, "")
          // Remove trailing semi-colon.
          .replace(TRAILING_SEMICOLON_REGEX, "");

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
