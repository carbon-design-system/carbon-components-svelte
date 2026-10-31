<script>
  import { ChartTooltipRow } from "carbon-components-svelte/viz";

  // Every tooltip the charts draw, laid out still, to check spacing and
  // alignment without hovering. The boxes are the real tooltip markup and
  // classes; only the cells around them are the gallery's.
  const cat = (n) => `var(--cds-viz-cat-${String(n).padStart(2, "0")})`;
  const neutral = "var(--cds-viz-neutral)";

  const series = [
    "EMEA",
    "APAC",
    "AMER",
    "LATAM",
    "ANZ",
    "Nordics",
    "DACH",
    "Benelux",
  ];
  const values = [
    "$42,180",
    "$38,920",
    "$51,004",
    "$12,300",
    "$9,870",
    "$7,650",
    "$6,420",
    "$5,110",
  ];

  /**
   * @type {Array<{ name: string; items: Array<{ caption: string; title?: string; custom?: boolean; more?: string; rows?: Array<{ color?: string; label: string; value: string; indent?: boolean }> }> }>}
   */
  const groups = [
    {
      name: "Chart presets",
      items: [
        {
          caption: "One series",
          title: "Mar 12",
          rows: [{ color: cat(1), label: "Revenue", value: "$42,180" }],
        },
        {
          caption: "Three series",
          title: "Mar 12",
          rows: series
            .slice(0, 3)
            .map((s, i) => ({ color: cat(i + 1), label: s, value: values[i] })),
        },
        {
          caption: "Eight series",
          title: "Mar 12",
          rows: series.map((s, i) => ({
            color: cat(i + 1),
            label: s,
            value: values[i],
          })),
        },
        {
          caption: "Sorted by value",
          title: "Mar 12",
          rows: [
            { color: cat(3), label: "AMER", value: "$51,004" },
            { color: cat(1), label: "EMEA", value: "$42,180" },
            { color: cat(2), label: "APAC", value: "$38,920" },
          ],
        },
        {
          caption: "Capped at five rows",
          title: "Mar 12",
          rows: series
            .slice(0, 5)
            .map((s, i) => ({ color: cat(i + 1), label: s, value: values[i] })),
          more: "+3 more",
        },
        {
          caption: "A label that wraps",
          title: "Mar 12",
          rows: [
            {
              color: cat(1),
              label:
                "Enterprise accounts in Northern Europe, the Middle East, and Africa, renewals only",
              value: "$42,180",
            },
            { color: cat(2), label: "APAC", value: "$38,920" },
          ],
        },
        {
          caption: "Long labels, wide values",
          title: "Week of September 28, 2026",
          rows: [
            {
              color: cat(1),
              label: "Northern Europe and Middle East",
              value: "$1,234,567,890.00",
            },
            { color: cat(2), label: "Asia Pacific", value: "$12.50" },
          ],
        },
        {
          caption: "Two axes, two formats",
          title: "Q3 2026",
          rows: [
            { color: cat(1), label: "Revenue", value: "$1.2M" },
            { color: cat(2), label: "Cost", value: "$860K" },
            { color: cat(3), label: "Margin", value: "28.3%" },
          ],
        },
        {
          caption: "Negative and missing",
          title: "Jun",
          rows: [
            { color: cat(1), label: "Net", value: "−$3,420" },
            { color: cat(2), label: "Forecast", value: "–" },
          ],
        },
        { caption: "Custom slot", custom: true },
      ],
    },
    {
      name: "Presets with their own rows",
      items: [
        {
          caption: "Candlestick",
          title: "Mar 12",
          rows: [
            { color: neutral, label: "Open", value: "$197.85" },
            { color: neutral, label: "High", value: "$200.14" },
            { color: neutral, label: "Low", value: "$196.55" },
            { color: neutral, label: "Close", value: "$198.34" },
            { label: "Change", value: "+$0.49", indent: true },
          ],
        },
        {
          caption: "Stock, with overlays and volume",
          title: "Jun 12",
          rows: [
            { color: neutral, label: "Open", value: "$197.85" },
            { color: neutral, label: "High", value: "$200.14" },
            { color: neutral, label: "Low", value: "$196.55" },
            { color: neutral, label: "Close", value: "$198.34" },
            { color: cat(1), label: "SMA 10", value: "$195.69" },
            { color: cat(2), label: "EMA 30", value: "$199.84" },
            { color: neutral, label: "Volume", value: "27M" },
            { label: "Change", value: "+$0.49", indent: true },
          ],
        },
        {
          caption: "Boxplot",
          title: "Checkout",
          rows: [
            { label: "Max", value: "412 ms" },
            { label: "Q3", value: "310 ms" },
            { label: "Median", value: "240 ms" },
            { label: "Q1", value: "180 ms" },
            { label: "Min", value: "96 ms" },
            { label: "Count", value: "1,204" },
          ],
        },
        {
          caption: "Gantt",
          title: "Specification of the launch",
          rows: [
            { color: cat(1), label: "Duration", value: "7 days" },
            { label: "Start", value: "Sep 1, 2026", indent: true },
            { label: "End", value: "Sep 8, 2026", indent: true },
            { label: "Progress", value: "60%", indent: true },
          ],
        },
        {
          caption: "Sunburst, Treemap, Icicle",
          rows: [{ color: cat(3), label: "Warehouse", value: "28 (32%)" }],
        },
        {
          caption: "Chord",
          title: "EMEA",
          rows: [
            { color: cat(1), label: "EMEA", value: "184 out, 96 in" },
            { color: cat(2), label: "to APAC", value: "72" },
            { color: cat(2), label: "from APAC", value: "41" },
          ],
        },
        {
          caption: "Radar",
          title: "Latency",
          rows: [
            { color: cat(1), label: "Service A", value: "72" },
            { color: cat(2), label: "Service B", value: "58" },
          ],
        },
        {
          caption: "Tile grid map",
          rows: [{ label: "California", value: "900" }],
        },
      ],
    },
  ];

  const placements = [
    { caption: "Beside the anchor (default)", cls: "" },
    {
      caption: "Flipped, past the middle",
      cls: "bx--viz-chart-tooltip--flipped",
    },
    {
      caption: "Above the row (horizontal chart)",
      cls: "bx--viz-chart-tooltip--above",
    },
    { caption: "Fixed in a facet corner", cls: "bx--viz-chart-tooltip--fixed" },
    {
      caption: "Pinned (text selectable)",
      cls: "bx--viz-chart-tooltip--pinned",
    },
  ];
</script>

<div class="gallery">
  {#each groups as group (group.name)}
    <h2 class="gallery__heading">{group.name}</h2>
    <div class="gallery__grid">
      {#each group.items as item (item.caption)}
        <figure class="gallery__cell" style:--rows={item.rows?.length ?? 2}>
          <div
            class="bx--viz-chart-tooltip bx--viz-chart-tooltip--fixed"
            aria-hidden="true"
          >
            {#if item.custom}
              <strong>Week of Sep 28</strong>
              <ChartTooltipRow
                color={cat(1)}
                label="EMEA region"
                value="$42,180"
              />
              <ChartTooltipRow
                color={cat(2)}
                label="APAC region"
                value="$38,920"
              />
              <div class="bx--viz-chart-tooltip__row">
                <span class="bx--viz-chart-tooltip__label">Total</span>
                <span class="bx--viz-chart-tooltip__value">$81,100</span>
              </div>
            {:else}
              {#if item.title}
                <div class="bx--viz-chart-tooltip__title">{item.title}</div>
              {/if}
              {#each item.rows as row (row.label)}
                <ChartTooltipRow
                  color={row.color ?? ""}
                  label={row.label}
                  value={row.value}
                  indent={row.indent ?? false}
                />
              {/each}
              {#if item.more}
                <ChartTooltipRow
                  indent
                  class="bx--viz-chart-tooltip__more"
                  label={item.more}
                />
              {/if}
            {/if}
          </div>
          <figcaption class="gallery__caption">{item.caption}</figcaption>
        </figure>
      {/each}
    </div>
  {/each}

  <h2 class="gallery__heading">Placement against the anchor</h2>
  <p class="gallery__note">
    The dot is the hovered point. Each box carries the modifier class the chart
    would set.
  </p>
  <div class="gallery__grid">
    {#each placements as placement (placement.caption)}
      <figure class="gallery__cell gallery__cell--anchored" style:--rows={3}>
        <span class="gallery__anchor" aria-hidden="true"></span>
        <div class="bx--viz-chart-tooltip {placement.cls}" aria-hidden="true">
          <div class="bx--viz-chart-tooltip__title">Mar 12</div>
          <ChartTooltipRow color={cat(1)} label="EMEA" value="$42,180" />
          <ChartTooltipRow color={cat(2)} label="APAC" value="$38,920" />
          <ChartTooltipRow color={cat(3)} label="AMER" value="$51,004" />
        </div>
        <figcaption class="gallery__caption">{placement.caption}</figcaption>
      </figure>
    {/each}
  </div>
</div>

<style>
  /* Only the cells are styled here; the tooltips are the charts' own. */
  .gallery {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .gallery__heading {
    margin: 1rem 0 0;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .gallery__note {
    margin: 0;
    color: var(--cds-text-secondary, #525252);
    font-size: 0.75rem;
  }

  .gallery__grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  }

  /* An absolutely placed tooltip sits at its static position, the cell's
     top left, so the cell only needs room for its rows. */
  .gallery__cell {
    position: relative;
    margin: 0;
    padding: 0.5rem;
    background: var(--cds-layer-01, #f4f4f4);
    min-block-size: calc(var(--rows) * 1.25rem + 4.5rem);
  }

  .gallery__cell--anchored {
    min-block-size: 12rem;
  }

  .gallery__anchor {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 35%;
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
    background: var(--cds-interactive-01, #0f62fe);
    transform: translate(-50%, -50%);
  }

  .gallery__cell--anchored > .bx--viz-chart-tooltip {
    inset-inline-start: 50%;
    inset-block-start: 35%;
  }

  .gallery__caption {
    position: absolute;
    inset-inline-start: 0.5rem;
    inset-block-end: 0.5rem;
    color: var(--cds-text-secondary, #525252);
    font-size: 0.75rem;
  }
</style>
