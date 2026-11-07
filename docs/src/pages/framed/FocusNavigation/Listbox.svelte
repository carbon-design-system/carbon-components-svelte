<script>
  import {
    Box,
    createFocusNav,
    focusNav,
    Stack,
  } from "carbon-components-svelte";

  const regions = [
    "Amsterdam",
    "Berlin",
    "Cape Town",
    "Dublin",
    "Frankfurt",
    "Lisbon",
    "London",
    "Madrid",
    "Milan",
    "Oslo",
  ];
  const disabled = new Set([2, 5]);

  let selected = -1;

  // Focus stays on the list. `aria-activedescendant` names the option the
  // cursor is on, so typing keeps working and the page does not scroll.
  const nav = createFocusNav({
    mode: "activedescendant",
    orientation: "vertical",
    selector: "[role='option']",
    skip: (i) => disabled.has(i),
    typeahead: { label: (i) => regions[i] },
    pageSize: 4,
  });

  function select(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selected = $nav.index;
    }
  }
</script>

<Stack gap={3}>
  <Box width="16rem">
    <div
      role="listbox"
      tabindex="0"
      aria-label="Region"
      aria-activedescendant={$nav.activeId}
      class="listbox"
      use:focusNav={nav}
      on:keydown={select}
    >
      {#each regions as region, i (region)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
        <div
          role="option"
          id="region-{i}"
          class="option"
          class:cursor={i === $nav.index}
          aria-selected={i === selected}
          aria-disabled={disabled.has(i) ? "true" : undefined}
          on:click={() => {
            if (!disabled.has(i)) {
              nav.set(i, { focus: false });
              selected = i;
            }
          }}
        >
          {region}
        </div>
      {/each}
    </div>
  </Box>
  <p>Selected: {regions[selected] ?? "none"}</p>
</Stack>

<style>
  .listbox {
    border: 1px solid var(--cds-border-strong-01);
    background: var(--cds-layer-01);
    color: var(--cds-text-primary);
  }

  .listbox:focus-visible {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }

  .option {
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  .option[aria-selected="true"] {
    background: var(--cds-layer-selected-01);
  }

  .option[aria-disabled="true"] {
    color: var(--cds-text-disabled);
    cursor: not-allowed;
  }

  .cursor {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }
</style>
