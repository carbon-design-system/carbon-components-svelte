<script>
  import Button from "../Button/Button.svelte";

  /**
   * Specify the href attribute
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   * @type {typeof import("carbon-icons-svelte").CarbonIcon}
   */
  export let icon = undefined;

  /**
   * Specify the description
   * @type {string}
   */
  export let description = undefined;
</script>

<Button
  class="header-action"
  href="{href}"
  icon="{icon}"
  hasIconOnly
  iconDescription="{description}"
  tooltipPosition="bottom"
  tooltipAlignment="center"
  kind="secondary"
  on:click
/>
