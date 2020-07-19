<script>
  export let expanded = false;
  export let text = undefined;
  export let icon = undefined;

  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";
  import { Icon } from "../../Icon";
</script>

<li class:bx--side-nav__item={true} class:bx--side-nav__item--icon={true}>
  <button
    type="button"
    aria-haspopup="true"
    aria-expanded={expanded}
    class:bx--side-nav__submenu={true}
    {...$$restProps}
    on:click
    on:click={() => {
      expanded = !expanded;
    }}>
    <div class:bx--side-nav__icon={true}>
      {#if icon}
        <Icon {...icon} />
      {/if}
    </div>
    <span class:bx--side-nav__submenu-title={true}>{text}</span>
    <div
      class:bx--side-nav__icon={true}
      class:bx--side-nav__icon--small={true}
      class:bx--side-nav__submenu-chevron={true}>
      <Icon title="Open Menu" tabindex="0" render={ChevronDown16} />
    </div>
  </button>
  <ul role="menu" class:bx--side-nav__menu={true}>
    <slot />
  </ul>
</li>
