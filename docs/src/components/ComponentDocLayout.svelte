<script lang="ts">
  import { Column, Grid, Row } from "carbon-components-svelte";

  export let aside = true;

  function syncTableScrollHeight(node: HTMLDivElement) {
    let raf = 0;

    function sync() {
      const table = node.closest(".table");
      if (!(table instanceof HTMLElement)) return;

      const top = table.getBoundingClientRect().top;
      node.style.maxHeight = `${Math.max(window.innerHeight - top, 0)}px`;
    }

    function schedule() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return {
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        node.style.maxHeight = "";
      },
    };
  }
</script>

<div class="component-body" {...$$restProps}>
  <Grid class="fix-overflow">
    <Row>
      <Column class="prose">
        <slot />
      </Column>
    </Row>
    <slot name="rows" />
  </Grid>
  {#if aside}
    <Column class="table" xlg={3} lg={4} noGutterRight>
      <div class="table__scroll scrollbar-hover" use:syncTableScrollHeight>
        <slot name="aside" />
      </div>
    </Column>
  {/if}
</div>
