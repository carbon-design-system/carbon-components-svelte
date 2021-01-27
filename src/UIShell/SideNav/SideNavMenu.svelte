<script>
  /** Set to `true` to toggle the expanded state */
  export let expanded = false;

  /**
   * Specify the text
   * @type {string}
   */
  export let text = undefined;

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   * @type {typeof import("carbon-icons-svelte").CarbonIcon}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML button element */
  export let ref = null;

  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16/ChevronDown16.svelte";
  import Icon from "../../Icon/Icon.svelte";
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
        <Icon render="{icon}" />
      </div>
    {/if}
    <span class:bx--side-nav__submenu-title="{true}">{text}</span>
    <div
      class:bx--side-nav__icon="{true}"
      class:bx--side-nav__icon--small="{true}"
      class:bx--side-nav__submenu-chevron="{true}"
    >
      <Icon title="Open Menu" tabindex="0" render="{ChevronDown16}" />
    </div>
  </button>
  <ul role="menu" class:bx--side-nav__menu="{true}">
    <slot />
  </ul>
</li>
