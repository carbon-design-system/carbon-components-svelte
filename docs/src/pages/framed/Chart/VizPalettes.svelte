<script>
  const pad = (n) => String(n).padStart(2, "0");
  const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
  const GROUP_OPTIONS = { 1: 4, 2: 5, 3: 5, 4: 3, 5: 2 };

  const categorical = range(14).map((i) => `cat-${pad(i)}`);
  const groups = Object.entries(GROUP_OPTIONS).map(([size, options]) => ({
    size,
    options: range(options).map((o) =>
      range(Number(size)).map((i) => `group-${size}-${o}-${i}`),
    ),
  }));
  const ramps = [
    ...["purple", "blue", "cyan", "teal"].map((hue) => ({
      name: hue,
      steps: range(11).map((i) => ({
        fill: `seq-${hue}-${pad(i)}`,
        on: `seq-on-${pad(i)}`,
      })),
    })),
    ...["red-cyan", "purple-teal"].map((name) => ({
      name,
      steps: range(17).map((i) => ({
        fill: `div-${name}-${pad(i)}`,
        on: `div-on-${pad(i)}`,
      })),
    })),
  ];
  const semantic = [
    "interactive",
    "neutral",
    "success",
    "error",
    "warning",
    "info",
  ];
</script>

<h2>Categorical</h2>
<div class="swatches">
  {#each categorical as token (token)}
    <span
      class="swatch"
      style="background: var(--cds-viz-{token})"
      title={token}
    ></span>
  {/each}
</div>

<h2>Groups</h2>
{#each groups as group (group.size)}
  <div class="row">
    <span class="label">{group.size} series</span>
    {#each group.options as option, o (o)}
      <span class="swatches">
        {#each option as token (token)}
          <span
            class="swatch"
            style="background: var(--cds-viz-{token})"
            title={token}
          ></span>
        {/each}
      </span>
    {/each}
  </div>
{/each}

<h2>Sequential and diverging, with their label colors</h2>
{#each ramps as ramp (ramp.name)}
  <div class="row">
    <span class="label">{ramp.name}</span>
    <span class="swatches joined">
      {#each ramp.steps as step, i (step.fill)}
        <span
          class="swatch"
          style="background: var(--cds-viz-{step.fill}); color: var(--cds-viz-{step.on})"
          title={step.fill}
        >
          {i + 1}
        </span>
      {/each}
    </span>
  </div>
{/each}

<h2>Semantic</h2>
<div class="row">
  {#each semantic as name (name)}
    <span class="swatches">
      <span
        class="swatch"
        style="background: var(--cds-viz-{name})"
        title={name}
      ></span>
      <span class="label">{name}</span>
    </span>
  {/each}
</div>

<style>
  h2 {
    margin-block: 1.5rem 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  h2:first-of-type {
    margin-block-start: 0;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1.5rem;
    margin-block-end: 0.5rem;
  }

  .swatches {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
  }

  .joined {
    gap: 0;
  }

  .swatch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    block-size: 1.75rem;
    box-shadow: inset 0 0 0 1px var(--cds-ui-03);
    font-size: 0.75rem;
    inline-size: 1.75rem;
  }

  .label {
    color: var(--cds-text-02);
    font-size: 0.875rem;
    min-inline-size: 5.5rem;
  }
</style>
