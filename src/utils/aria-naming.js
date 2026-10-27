/**
 * Split the naming and description attributes out of a component's rest
 * props. Rest props spread onto the root element, but these attributes
 * only work on the element that takes focus or carries the role. When
 * that is a child, the component places them there and spreads `rest`
 * on the root.
 *
 * @param {Record<string, any>} restProps
 */
export function splitAriaNaming(restProps) {
  const {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...rest
  } = restProps;
  return { ariaLabel, ariaLabelledBy, ariaDescribedBy, rest };
}

/**
 * Split every `aria-*` attribute out of a component's rest props, for a
 * component whose root is a wrapper with no role, such as a presentational
 * `li`. Those attributes describe the control inside it. The rest stay on
 * the wrapper.
 *
 * @param {Record<string, any>} restProps
 */
export function splitAria(restProps) {
  /** @type {Record<string, any>} */
  const aria = {};
  /** @type {Record<string, any>} */
  const rest = {};
  for (const [name, value] of Object.entries(restProps)) {
    (name.startsWith("aria-") ? aria : rest)[name] = value;
  }
  return { aria, rest };
}
