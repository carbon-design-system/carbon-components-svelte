const { parse, walk } = require("svelte/compiler");
const commentParser = require("comment-parser");

function parseComponent(source, hooks) {
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
          let description = null;

          if (init != null) {
            value = init.raw;
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
            type = comment[0].tags[0].type;
          } else {
            throw Error(
              `[${hooks.component}] property \`${id.name}\` should be annotated.`
            );
          }

          exported_props.set(id.name, { value, type, description });
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

          slots.set(slot_name == null ? "default" : slot_name, {
            attributes: node.attributes,
            children: node.children,
            default: slot_name == null,
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

        dispatched_events.set(name.raw, {
          detail: detail ? source.slice(detail.start, detail.end) : undefined,
        });
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

module.exports = { parseComponent };
