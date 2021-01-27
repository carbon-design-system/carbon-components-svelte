<script>
  /** Set to `true` to select the current link */
  export let isSelected = false;

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

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   * @type {typeof import("carbon-icons-svelte").CarbonIcon}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;

  import Icon from "../../Icon/Icon.svelte";
</script>

<li class:bx--side-nav__item="{true}">
  <a
    bind:this="{ref}"
    aria-current="{isSelected ? 'page' : undefined}"
    href="{href}"
    rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
    class:bx--side-nav__link="{true}"
    class:bx--side-nav__link--current="{isSelected}"
    {...$$restProps}
    on:click
  >
    {#if icon}
      <div
        class:bx--side-nav__icon="{true}"
        class:bx--side-nav__icon--small="{true}"
      >
        <Icon render="{icon}" />
      </div>
    {/if}
    <span class:bx--side-nav__link-text="{true}">{text}</span>
  </a>
</li>
