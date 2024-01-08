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
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML button element */
  export let ref = null;

  import ChevronDown from "../icons/ChevronDown.svelte";
</script>

<li class:cds--side-nav__item="{true}" class:cds--side-nav__item--icon="{icon}">
  <button
    type="button"
    bind:this="{ref}"
    aria-expanded="{expanded}"
    class:cds--side-nav__submenu="{true}"
    {...$$restProps}
    on:click
    on:click="{() => {
      expanded = !expanded;
    }}"
  >
    {#if $$slots.icon || icon}
      <div class:cds--side-nav__icon="{true}">
        <slot name="icon">
          <svelte:component this="{icon}" />
        </slot>
      </div>
    {/if}
    <span class:cds--side-nav__submenu-title="{true}">{text}</span>
    <div
      class:cds--side-nav__icon="{true}"
      class:cds--side-nav__icon--small="{true}"
      class:cds--side-nav__submenu-chevron="{true}"
    >
      <ChevronDown />
    </div>
  </button>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul
    role="menu"
    class:cds--side-nav__menu="{true}"
    style:max-height="{expanded ? "none" : undefined}"
  >
    <slot />
  </ul>
</li>
