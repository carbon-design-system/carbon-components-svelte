<script>
  /**
   * Set to `true` to use the active state
   * @type {boolean} [linkIsActive=false]
   */
  export let linkIsActive = false;

  /**
   * Specify the `href` attribute
   * @type {string} [href]
   */
  export let href = undefined;

  /**
   * Specify the icon props
   * @type {{ render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean; }} [icon]
   */
  export let icon = undefined;

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
  class:bx--header__action="{true}"
  class:bx--header__action--active="{linkIsActive}"
  class:action-link="{true}"
  {...$$restProps}
  href="{href}">
  <Icon {...icon} />
</a>
