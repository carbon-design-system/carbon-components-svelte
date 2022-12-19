<script>
  /** Specify the id for the main element */
  export let id = "main-content";

  import { Grid, Row, Column } from "../Grid";
  import { shouldRenderHamburgerMenu } from "./navStore";
</script>

<div
  style="padding: 3em; display: flex; flex-direction: column; align-items: center;"
>
  <div style="position: relative; width: 100%; z-index: 0;">
    <main
      id="{id}"
      class:bx--content="{true}"
      {...$$restProps}
      style="{`height: 100%; margin: 0px; width: 100%; ${$$restProps.style}`}"
    >
      <Grid>
        <Row>
          <Column
            lg="{$shouldRenderHamburgerMenu ? { span: 13, offset: 3 } : {}}"
          >
            <slot />
          </Column>
        </Row>
      </Grid>
    </main>
  </div>
</div>
