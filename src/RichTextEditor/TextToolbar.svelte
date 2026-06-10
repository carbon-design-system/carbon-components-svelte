<script>
  /**
   * @restProps {div}
   */

  import { setContext } from "svelte";

  /**
   * Registered toolbar controls, kept in DOM order. The toolbar owns each
   * control's `tabindex` so the bar is a single tab stop with roving focus.
   * @type {HTMLElement[]}
   */
  let items = [];
  let activeIndex = 0;

  function isDisabled(node) {
    return (
      node.hasAttribute("disabled") ||
      node.getAttribute("aria-disabled") === "true"
    );
  }

  function updateTabIndices() {
    items.forEach((node, index) => {
      node.tabIndex = index === activeIndex ? 0 : -1;
    });
  }

  /**
   * @param {HTMLElement} node
   * @returns {() => void}
   */
  function register(node) {
    items = [...items, node].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
    if (items.length === 1) activeIndex = 0;
    updateTabIndices();
    return () => {
      const removingActive = items[activeIndex] === node;
      items = items.filter((current) => current !== node);
      if (activeIndex >= items.length)
        activeIndex = Math.max(0, items.length - 1);
      if (removingActive) updateTabIndices();
    };
  }

  /**
   * Move focus by `direction`, skipping disabled controls and wrapping at the
   * ends.
   * @param {number} direction
   */
  function moveFocus(direction) {
    const count = items.length;
    if (count === 0) return;
    let next = activeIndex;
    for (let step = 0; step < count; step++) {
      next = (next + direction + count) % count;
      if (!isDisabled(items[next])) break;
    }
    focusIndex(next);
  }

  /** @param {number} index */
  function focusIndex(index) {
    if (!items[index]) return;
    activeIndex = index;
    updateTabIndices();
    items[index].focus();
  }

  function focusEnd(direction) {
    const count = items.length;
    if (count === 0) return;
    let index = direction > 0 ? 0 : count - 1;
    while (index >= 0 && index < count && isDisabled(items[index])) {
      index += direction;
    }
    focusIndex(index);
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveFocus(1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveFocus(-1);
        break;
      case "Home":
        event.preventDefault();
        focusEnd(1);
        break;
      case "End":
        event.preventDefault();
        focusEnd(-1);
        break;
    }
  }

  setContext("carbon:TextToolbar", { register });

  $: ({ "aria-label": ariaLabel, ...rest } = $$restProps);
</script>

<div
  role="toolbar"
  aria-label={ariaLabel ?? "Text formatting"}
  aria-orientation="horizontal"
  class:bx--text-toolbar={true}
  {...rest}
  on:keydown={handleKeydown}
>
  <slot />
</div>
