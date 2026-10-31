<script>
  import { scrollEdges, Stack, Tag } from "carbon-components-svelte";

  const logLines = Array.from(
    { length: 24 },
    (_, i) => `Deployment ${i + 1} finished`,
  );

  let state = {
    isXScrollable: false,
    isYScrollable: false,
    atTop: true,
    atBottom: true,
    atStart: true,
    atEnd: true,
  };

  $: scrollable = state.isXScrollable || state.isYScrollable;
</script>

<Stack gap={4}>
  <Stack orientation="horizontal" gap={3}>
    <Tag type={state.atTop ? "gray" : "blue"}>
      {state.atTop ? "At top" : "Scrolled"}
    </Tag>
    <Tag type={state.atBottom ? "gray" : "blue"}>
      {state.atBottom ? "At bottom" : "More below"}
    </Tag>
  </Stack>
  <div class="frame">
    <div
      class="scroller"
      role="region"
      aria-label="Deployment log"
      tabindex={scrollable ? 0 : undefined}
      use:scrollEdges={{ onChange: (next) => (state = next) }}
    >
      {#each logLines as line}
        <p>{line}</p>
      {/each}
    </div>
    <div
      class="fade fade--top"
      class:visible={!state.atTop}
      aria-hidden="true"
    ></div>
    <div
      class="fade fade--bottom"
      class:visible={!state.atBottom}
      aria-hidden="true"
    ></div>
  </div>
</Stack>

<style>
  .frame {
    position: relative;
  }

  .scroller {
    block-size: 10rem;
    overflow-y: auto;
    padding-inline: var(--cds-spacing-05);
    background: var(--cds-layer);
  }

  .fade {
    position: absolute;
    inset-inline: 0;
    block-size: 2rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 110ms;
  }

  .fade--top {
    inset-block-start: 0;
    background: linear-gradient(to bottom, var(--cds-layer), transparent);
  }

  .fade--bottom {
    inset-block-end: 0;
    background: linear-gradient(to top, var(--cds-layer), transparent);
  }

  .visible {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .fade {
      transition: none;
    }
  }
</style>
