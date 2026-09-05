<script>
  /**
   * @restProps {div}
   */

  /**
   * Specify the kind of error page to be displayed.
   * @type {"custom" | "403" | "404"}
   */
  export let kind = "custom";

  /** Specify the label describing the error that occurred. */
  export let labelText = "";

  /** Specify the main title of the error page. */
  export let title = "";

  /** Specify the description for the error. */
  export let description = "";

  import { Column, Grid } from "../Grid";
  import Error403 from "./Error403.svelte";
  import Error404 from "./Error404.svelte";
  import ErrorGeneric from "./ErrorGeneric.svelte";

  const illustrations = {
    403: Error403,
    404: Error404,
    custom: ErrorGeneric,
  };
</script>

<div role="main" class:bx--full-page-error={true} {...$$restProps}>
  <div class:bx--full-page-error__container={true}>
    <Grid class="bx--full-page-error__grid">
      <Column sm={4} md={3} lg={6} class="bx--full-page-error__column">
        <h1 class:bx--full-page-error__title={true}>
          <span class:bx--full-page-error__label={true}>
            <span aria-hidden="true">↳ </span
            ><slot name="labelChildren">{labelText}</slot>
          </span>
          <span><slot name="titleChildren">{title}</slot></span>
        </h1>
        {#if description || $$slots.descriptionChildren}
          <p class:bx--full-page-error__description={true}>
            <slot name="descriptionChildren">{description}</slot>
          </p>
        {/if}
        <div class:bx--full-page-error__body={true}>
          <slot />
        </div>
      </Column>
      <Column sm={4} md={5} lg={10} class="bx--full-page-error__illustration">
        <div class:bx--full-page-error__svg-container={true}>
          <slot name="illustration">
            <svelte:component
              this={illustrations[kind]}
              class="bx--full-page-error__svg bx--full-page-error__{kind}"
            />
          </slot>
        </div>
      </Column>
    </Grid>
  </div>
</div>
