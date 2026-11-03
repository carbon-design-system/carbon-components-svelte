// @ts-check

/**
 * Whether `node` is disabled by an ancestor `<fieldset disabled>`. As for a
 * native control, content of the fieldset's first `<legend>` is exempt.
 *
 * @param {Element} node
 * @returns {boolean}
 */
export function isInDisabledFieldset(node) {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (el instanceof HTMLFieldSetElement && el.disabled) {
      const legend = el.querySelector(":scope > legend");
      if (!legend?.contains(node)) return true;
    }
  }
  return false;
}

/**
 * Svelte action: call `onChange` when `node` becomes disabled or enabled by
 * an ancestor `<fieldset disabled>`.
 *
 * The browser disables a fieldset's native controls, but not custom ones
 * such as a `role="slider"` div, and not handlers on a disabled button's
 * children. Components combine this with their own `disabled` prop so
 * guards, `tabindex`, ARIA and styles follow the fieldset too. The action
 * runs after mount, so server-rendered markup shows the enabled state until
 * hydration.
 *
 * @param {Element} node
 * @param {(disabled: boolean) => void} onChange
 * @returns {{ update: (onChange: (disabled: boolean) => void) => void, destroy: () => void }}
 */
export function fieldsetDisabled(node, onChange) {
  let callback = onChange;
  let disabled = false;

  function check() {
    const next = isInDisabledFieldset(node);
    if (next === disabled) return;
    disabled = next;
    callback(next);
  }

  /** @type {MutationObserver | undefined} */
  let observer;
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (!(el instanceof HTMLFieldSetElement)) continue;
    observer ??= new MutationObserver(check);
    observer.observe(el, { attributes: true, attributeFilter: ["disabled"] });
  }
  check();

  return {
    update(onChange) {
      callback = onChange;
    },
    destroy() {
      observer?.disconnect();
    },
  };
}
