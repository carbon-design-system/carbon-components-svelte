<script>
  import { Button, Coachmark, Stack } from "carbon-components-svelte";

  const stops = [
    { label: "Filter", text: "Narrow the list by owner or status." },
    { label: "Export", text: "Download the rows you selected." },
    { label: "Share", text: "Send a view of this table with a link." },
  ];

  let current = -1;

  function next(index) {
    current = index + 1 < stops.length ? index + 1 : -1;
  }
</script>

<Stack orientation="horizontal" gap={5}>
  <Button on:click={() => (current = 0)}>Start tour</Button>
  {#each stops as stop, i}
    <Coachmark
      focusOnOpen
      titleText={stop.label}
      open={current === i}
      on:close={() => {
        if (current === i) current = -1;
      }}
    >
      <Button
        slot="target"
        let:triggerProps
        let:toggle
        {...triggerProps}
        kind="tertiary"
        size="small"
        on:click={toggle}
      >
        {stop.label}
      </Button>
      {stop.text}
      <svelte:fragment slot="actions">
        <Button size="small" data-modal-primary-focus on:click={() => next(i)}>
          {i + 1 < stops.length ? "Next" : "Done"}
        </Button>
      </svelte:fragment>
    </Coachmark>
  {/each}
</Stack>
