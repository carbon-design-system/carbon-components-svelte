<script>
  import Row from "../Grid/Row.svelte";
  import Column from "../Grid/Column.svelte";

  /**
   * Set the flexDirection of the head
   * @type {"row" | "row-reverse"}
   */
  export let flexDirection = "row";

  /** Set the margin of the head */
  export let margin = "20px 0 15px";
</script>

<style>
  #header {
    display: flex;
    flex-direction: var(--flex-direction);
    justify-content: space-between;
    margin: var(--margin);
  }
</style>

<svelte:head>
  <style lang="scss">
    #header-filters {
      .bx--select-input__wrapper {
        margin-right: 10px;

        select.bx--select-input {
          width: unset;
          min-width: 95px;
          max-width: 125px;
          padding-right: 30px;
        }
      }
    }
  </style>
</svelte:head>
<Row>
  <Column>
    <div
      id="header"
      style="--flex-direction: {flexDirection}; --margin: {margin}"
    >
      <slot />
    </div>
  </Column>
</Row>
