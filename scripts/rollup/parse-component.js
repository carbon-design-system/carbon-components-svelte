import { parse, walk } from "svelte/compiler";
import commentParser from "comment-parser";

/**
 * Parse Svelte component for metadata using the Svelte compiler
 * @param {string} source - raw Svelte component code
 * @param {{ component: string; onTypeDef: (tag: { type: "typedef"; tag: string; name: string; }) => void;}} hooks
 */
export function parseComponent(source, hooks) {
  const exported_props = new Map();
  const slots = new Map();
  const forwarded_events = new Map();
  const dispatched_events = new Map();

  let hasDispatchedEvents = false;
  let dispatcher_name = null;
  let callee = [];

  walk(parse(source), {
    enter(node, parent, prop) {
      switch (node.type) {
        case "CallExpression":
          if (hasDispatchedEvents) {
            if (node.callee.name === "createEventDispatcher") {
              dispatcher_name = parent.id.name;
            }
          }
          break;
        case "Identifier":
          if (node.name === "createEventDispatcher") {
            hasDispatchedEvents = true;
          }

          if (prop === "callee") {
            callee.push({ name: node.name, parent });
          }
          break;
        case "ExportNamedDeclaration":
          const { id, init } = node.declaration.declarations[0];

          let value = undefined;
          let type = undefined;
          let kind = node.declaration.kind;
          let description = null;

          if (init != null) {
            if (init.type === "ObjectExpression") {
              value = source.slice(init.start, init.end).replace(/\n/g, " ");
              type = value;
            } else {
              value = init.raw;
            }
          }

          const general_comments = commentParser(source);

          general_comments.forEach((comment) => {
            comment.tags.forEach((tag) => {
              if (tag.tag === "typedef") hooks.onTypeDef(tag);
            });
          });

          if (node.leadingComments) {
            const comment = commentParser(
              "/*" + node.leadingComments[0].value + "*/"
            );

            description = comment[0].description;

            type = comment[0].tags[comment[0].tags.length - 1].type;
          } else {
            throw Error(
              `[${hooks.component}] property \`${id.name}\` should be annotated.`
            );
          }

          exported_props.set(id.name, { kind, value, type, description });
          break;
        case "Slot":
          let slot_name = null;

          const slot_attributes = [];

          node.attributes.forEach((attribute) => {
            if (attribute.name === "name") {
              slot_name = attribute.value[0].raw;
            } else {
              slot_attributes.push(attribute);
            }
          });

          let default_value = "";

          node.children.forEach((child) => {
            default_value += `${source.slice(child.start, child.end)}\n`;
          });

          slots.set(slot_name == null ? "default" : slot_name, {
            attributes: node.attributes,
            children: node.children,
            default: slot_name == null,
            default_value,
          });
          break;
        case "EventHandler":
          if (node.expression == null) {
            forwarded_events.set(node.name, node);
          }
          break;
      }
    },
  });

  if (hasDispatchedEvents) {
    callee.forEach((node) => {
      if (node.name === dispatcher_name) {
        const [name, detail] = node.parent.arguments;

        if (name.value !== undefined) {
          dispatched_events.set(name.value, {
            detail: detail ? source.slice(detail.start, detail.end) : undefined,
          });
        }
      }
    });
  }

  return {
    exported_props,
    slots,
    forwarded_events,
    dispatched_events,
  };
}
