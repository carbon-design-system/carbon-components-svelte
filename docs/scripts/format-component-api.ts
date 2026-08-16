import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import plugin from "prettier/plugins/typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "../src/COMPONENT_API.json");
const cacheFile = path.join(__dirname, "../src/.COMPONENT_API_FORMAT_CACHE");

const hash = (value: string) => createHash("sha1").update(value).digest("hex");

const cachedHash = fs.existsSync(cacheFile)
  ? fs.readFileSync(cacheFile, "utf8").trim()
  : null;

if (
  cachedHash !== null &&
  hash(fs.readFileSync(outFile, "utf8")) === cachedHash
) {
  // COMPONENT_API.json hasn't changed since it was last formatted;
  // re-running the prettier pass on every `dev` startup is pure overhead.
  process.exit(0);
}

const { default: componentApi } = await import("../src/COMPONENT_API.json", {
  with: { type: "json" },
});

const WHITESPACE_REGEX = /\s{2,}/;
const TRAILING_SEMICOLON_REGEX = /;\s*$/;
const EVENT_DETAIL_PREFIX_REGEX = /type EventDetail = /;
const SLOT_PROPS_PREFIX_REGEX = /type SlotProps = /;

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

console.time("formatComponentApi");

const modified = {
  ...componentApi,
  components: await Promise.all(
    componentApi.components.map(async (component) => {
      const props = await Promise.all(
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

      const typedefs = await Promise.all(
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

      return {
        ...component,
        props,
        typedefs,
        events,
        slots,
      };
    }),
  ),
};

const output = JSON.stringify(modified, null, 2);
fs.writeFileSync(outFile, output);
fs.writeFileSync(cacheFile, hash(output));

console.timeEnd("formatComponentApi");
