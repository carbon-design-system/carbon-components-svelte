import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import plugin from "prettier/plugins/typescript";
import componentApi from "../src/COMPONENT_API.json" with { type: "json" };
import { extractExampleCode, highlightCode } from "./shiki-highlighter.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "../src/COMPONENT_API.json");
const componentApiDir = path.join(__dirname, "../src/component-api");
const componentApiComponentsDir = path.join(componentApiDir, "components");

const WHITESPACE_REGEX = /\s{2,}/;
const TRAILING_SEMICOLON_REGEX = /;\s*$/;
const EVENT_DETAIL_PREFIX_REGEX = /type EventDetail = /;
const SLOT_PROPS_PREFIX_REGEX = /type SlotProps = /;

const PRIMITIVE_TYPES = [
  "string",
  "boolean",
  "number",
  "null",
  "Date",
] as const;

/** Avoid `type EventDetail = type EventDetail = …` when re-running the formatter. */
const stripLeadingTypeAlias = (
  source: string,
  name: "EventDetail" | "SlotProps",
) => {
  const re = new RegExp(`^\\s*type\\s+${name}\\s*=\\s*`, "i");
  let s = source;
  let next = s.replace(re, "").trimStart();
  while (next !== s) {
    s = next;
    next = s.replace(re, "").trimStart();
  }
  return s;
};

const formatTypeScript = async (value: string) => {
  return await format(value, {
    parser: "typescript",
    plugins: [plugin],
    printWidth: 40, // Force breaking onto new lines
    bracketSameLine: false,
  });
};

async function highlightTypeScriptFragment(code: string) {
  if (!code) return "";
  return await highlightCode(code, "typescript", { fragment: true });
}

async function highlightSvelteFragment(code: string) {
  if (!code) return "";
  return await highlightCode(code, "svelte", { fragment: true });
}

console.time("formatComponentApi");

const highlightedPrimitives = Object.fromEntries(
  await Promise.all(
    PRIMITIVE_TYPES.map(async (type) => {
      const display = type === "Date" ? "JavaScript Date" : type;
      return [type, await highlightTypeScriptFragment(display)] as const;
    }),
  ),
);

const modified = {
  ...componentApi,
  highlightedPrimitives,
  components: await Promise.all(
    componentApi.components.map(async (component) => {
      const props = await Promise.all(
        component.props.map(async (prop) => {
          let nextProp = { ...prop };

          if (prop.value && WHITESPACE_REGEX.test(prop.value)) {
            let normalizedValue = prop.value;
            const prefix = `const ${prop.name} = `;

            if (prop.isFunction || prop.value.startsWith("{")) {
              normalizedValue = prefix + prop.value;
            }

            const formatted = (await formatTypeScript(normalizedValue))
              .replace(new RegExp(`^${prefix}`), "")
              .replace(TRAILING_SEMICOLON_REGEX, "");

            nextProp = { ...nextProp, value: formatted };
          }

          const typeSegments = (prop.type || "").split(" | ").filter(Boolean);
          const typesHighlighted = await Promise.all(
            typeSegments.map((type) => {
              if (type.startsWith("HTML") || type in highlightedPrimitives) {
                return Promise.resolve("");
              }
              return highlightTypeScriptFragment(type);
            }),
          );

          const exampleCode = prop.description
            ? extractExampleCode(prop.description)
            : null;

          nextProp = {
            ...nextProp,
            typesHighlighted,
            valueHighlighted:
              nextProp.value === undefined
                ? undefined
                : await highlightTypeScriptFragment(nextProp.value),
            exampleCode: exampleCode ?? undefined,
            exampleCodeHighlighted: exampleCode
              ? await highlightSvelteFragment(exampleCode)
              : undefined,
          };

          return nextProp;
        }),
      );

      const typedefs = await Promise.all(
        component.typedefs.map(async (typedef) => {
          if (!typedef.ts) {
            return typedef;
          }

          const ts = await formatTypeScript(typedef.ts);
          return {
            ...typedef,
            ts,
            tsHighlighted: await highlightTypeScriptFragment(ts),
          };
        }),
      );

      const events = await Promise.all(
        component.events.map(async (event) => {
          if (event.type === "forwarded") {
            return event;
          }

          if (!("detail" in event) || typeof event.detail !== "string") {
            return event;
          }

          const detailBody = stripLeadingTypeAlias(event.detail, "EventDetail");
          if (!detailBody) {
            return event;
          }

          const normalizedValue = `type EventDetail = ${detailBody}`;

          const formatted = (await formatTypeScript(normalizedValue))
            .replace(EVENT_DETAIL_PREFIX_REGEX, "")
            .replace(TRAILING_SEMICOLON_REGEX, "");

          return {
            ...event,
            detail: formatted,
            detailHighlighted: await highlightTypeScriptFragment(formatted),
          };
        }),
      );

      const slots = await Promise.all(
        component.slots.map(async (slot) => {
          if (!slot.slot_props) {
            return slot;
          }

          let normalizedValue = stripLeadingTypeAlias(
            slot.slot_props,
            "SlotProps",
          );

          if (normalizedValue.startsWith("{")) {
            normalizedValue = `type SlotProps = ${normalizedValue}`;
          }

          const formatted = (await formatTypeScript(normalizedValue))
            .replace(SLOT_PROPS_PREFIX_REGEX, "")
            .replace(TRAILING_SEMICOLON_REGEX, "");

          return {
            ...slot,
            slot_props: formatted,
            slot_propsHighlighted: await highlightTypeScriptFragment(formatted),
          };
        }),
      );

      const typedefTs = typedefs.map((t) => t.ts ?? "").join("\n");

      return {
        ...component,
        props,
        typedefs,
        typedefsHighlighted:
          typedefTs.length > 0
            ? await highlightTypeScriptFragment(typedefTs)
            : undefined,
        events,
        slots,
      };
    }),
  ),
};

fs.writeFileSync(outFile, JSON.stringify(modified, null, 2));

fs.mkdirSync(componentApiComponentsDir, { recursive: true });
for (const component of modified.components) {
  fs.writeFileSync(
    path.join(componentApiComponentsDir, `${component.moduleName}.json`),
    JSON.stringify(component),
  );
}
fs.writeFileSync(
  path.join(componentApiDir, "highlighted-primitives.json"),
  JSON.stringify(highlightedPrimitives),
);
fs.writeFileSync(
  path.join(componentApiDir, "module-names.json"),
  JSON.stringify(modified.components.map((component) => component.moduleName)),
);

console.timeEnd("formatComponentApi");
