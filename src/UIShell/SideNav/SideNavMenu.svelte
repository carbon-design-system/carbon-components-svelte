<script>
  /** Set to `true` to toggle the expanded state */
  export let expanded = false;

  /**
   * Specify the text
   * @type {string}
   */
  export let text = undefined;

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML button element */
  export let ref = null;

  import ChevronDown16 from "../../icons/ChevronDown16.svelte";
</script>

<li class:bx--side-nav__item="{true}" class:bx--side-nav__item--icon="{icon}">
  <button
    type="button"
    bind:this="{ref}"
    aria-expanded="{expanded}"
    class:bx--side-nav__submenu="{true}"
    {...$$restProps}
    on:click
    on:click="{() => {
      expanded = !expanded;
    }}"
  >
    {#if icon}
      <div class:bx--side-nav__icon="{true}">
        <svelte:component this="{icon}" />
      </div>
    {/if}
    <span class:bx--side-nav__submenu-title="{true}">{text}</span>
    <div
      class:bx--side-nav__icon="{true}"
      class:bx--side-nav__icon--small="{true}"
      class:bx--side-nav__submenu-chevron="{true}"
    >
      <svelte:component this="{ChevronDown16}" title="Open Menu" tabindex="0" />
    </div>
  </button>
  <ul role="menu" class:bx--side-nav__menu="{true}">
    <slot />
  </ul>
</li>
