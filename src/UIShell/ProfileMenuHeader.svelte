<script>
  /**
   * Specify the display name.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the secondary text below the name (for example, a username).
   * @type {string}
   */
  export let username = undefined;

  /**
   * Specify the call-to-action text shown below the identity.
   * Set to a falsy value to hide it.
   * @type {string}
   */
  export let text = "View profile";

  /**
   * Specify the `href` attribute. When set, the entire block is a link.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Obtain a reference to the HTML element (anchor or div).
   * @bindable readonly
   * @type {null | HTMLAnchorElement | HTMLDivElement}
   */
  export let ref = null;

  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
</script>

{#if href}
  <a
    bind:this={ref}
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    class:bx--profile-menu__header={true}
    class:bx--profile-menu__header--link={true}
    {...$$restProps}
    on:click
  >
    <span class:bx--profile-menu__identity={true}>
      <span class:bx--profile-menu__avatar={true}>
        <slot name="avatar"><UserAvatar size="lg" /></slot>
      </span>
      <span class:bx--profile-menu__meta={true}>
        <span class:bx--profile-menu__name={true}>{name}</span>
        <span class:bx--profile-menu__username={true}>{username}</span>
      </span>
    </span>
    {#if text || $$slots.default}
      <span class:bx--profile-menu__view={true}><slot>{text}</slot></span>
    {/if}
  </a>
{:else}
  <div
    bind:this={ref}
    class:bx--profile-menu__header={true}
    {...$$restProps}
    on:click
  >
    <span class:bx--profile-menu__identity={true}>
      <span class:bx--profile-menu__avatar={true}>
        <slot name="avatar"><UserAvatar size="lg" /></slot>
      </span>
      <span class:bx--profile-menu__meta={true}>
        <span class:bx--profile-menu__name={true}>{name}</span>
        <span class:bx--profile-menu__username={true}>{username}</span>
      </span>
    </span>
    {#if text || $$slots.default}
      <span class:bx--profile-menu__view={true}><slot>{text}</slot></span>
    {/if}
  </div>
{/if}
