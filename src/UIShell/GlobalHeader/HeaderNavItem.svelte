<script>
  /**
   * Specify the `href` attribute
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the text
   * @type {string}
   */
  export let text = undefined;

  /** Set to `true` to select the item */
  export let isSelected = false;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;

  import { getContext } from "svelte";

  const id = "ccs-" + Math.random().toString(36);
  const { selectedItems, updateSelectedItems, closeMenu } =
    getContext("HeaderNavMenu");

  $: updateSelectedItems({ id, isSelected });
</script>

<li>
  <a
    bind:this="{ref}"
    role="menuitem"
    tabindex="0"
    href="{href}"
    rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
    class:bx--header__menu-item="{true}"
    aria-current="{isSelected ? 'page' : undefined}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:keydown
    on:focus
    on:blur
    on:blur="{() => {
      const ids = Object.keys($selectedItems);
      if (ids.indexOf(id) === ids.length - 1) closeMenu();
    }}"
  >
    <span class:bx--text-truncate--end="{true}">{text}</span>
  </a>
</li>
