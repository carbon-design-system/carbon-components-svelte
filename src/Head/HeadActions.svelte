<script>
  /** Set the width of the head actions */
  export let width = "100%";
</script>

<style>
  #header-actions {
    display: flex;
    height: 47px;
    margin: auto 0 0;
    width: var(--width);

    /* .header-action {
      margin-right: 3px;
    }

    :last-child {
      margin-right: 0px;
    } */
  }
</style>

<div id="header-actions" style="--width: {width}">
  <slot />
</div>
