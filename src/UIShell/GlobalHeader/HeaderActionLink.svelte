<script>
  /** Set to `true` to use the active state */
  export let linkIsActive = false;

  /**
   * Specify the `href` attribute
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the icon props
   * @type {{ render: import("carbon-icons-svelte").CarbonIcon; skeleton: boolean; }}
   */
  export let icon = undefined;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;

  import { Icon } from "../../Icon";
</script>

<style>
  .action-link {
    text-align: center;
    align-items: center;
    vertical-align: middle;
    justify-content: center;
    padding-top: 10px;
  }
</style>

<a
  bind:this="{ref}"
  class:bx--header__action="{true}"
  class:bx--header__action--active="{linkIsActive}"
  class:action-link="{true}"
  href="{href}"
  rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
  {...$$restProps}
>
  <Icon {...icon} />
</a>
