/**
 * Use library component metadata to generate component documentation in JSON format.
 * @param {Map<string, { component: { exported_props: Map<string, any>; slots: Map<string, any>; } typedefs: {name: string; type: string;}[] }>} components
 * @param {Map<string, string[]>} groups
 * @param {{name: string; version: string; homepage: string;}} pkg
 */
export function generatePublicAPI(components, groups, pkg) {
  const code = {
    version: pkg.version,
    components: {},
  };

  components.forEach((component, moduleName) => {
    const props = Array.from(component.component.exported_props);
    const slots = Array.from(component.component.slots);
    const forwarded_events = Array.from(component.component.forwarded_events);
    const dispatched_events = Array.from(component.component.dispatched_events);

    code.components[moduleName] = {
      moduleName,
      props,
      slots,
      forwarded_events,
      dispatched_events,
    };
  });

  return { code };
}
