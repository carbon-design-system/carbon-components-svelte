<script>
  export let component = {
    props: [],
    slots: [],
    forwarded_events: [],
    dispatched_events: [],
  };

  import {
    Link,
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody,
    TooltipDefinition,
    UnorderedList,
    ListItem,
  } from "carbon-components-svelte";
  import InlineSnippet from "./InlineSnippet.svelte";
  import Launch16 from "carbon-icons-svelte/lib/Launch16";

  const mdn_api = "https://developer.mozilla.org/en-US/docs/Web/API/";
  const typeMap = {
    string: "string",
    boolean: "boolean",
    number: "number",
    null: "null",
    Date: "JavaScript Date",
  };
</script>

<style>
  .description {
    margin-bottom: var(--cds-spacing-04);
  }

  .cell {
    position: relative;
    z-index: 9;
    min-height: 1.25rem;
    margin-bottom: var(--cds-spacing-02);
  }

  .overflow {
    overflow-x: auto;
  }

  :global(.my-layout-01-03),
  :global(.overflow .bx--structured-list) {
    margin-top: var(--cds-layout-01);
    margin-bottom: var(--cds-layout-04);
  }
</style>

<h3 id="props">Props</h3>

{#if component.props.length > 0}
  <div class="overflow">
    <StructuredList
      style="margin-left: calc(-1 * var(--cds-spacing-05)); margin-right: calc(-1 * var(--cds-spacing-05))"
    >
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>Prop name</StructuredListCell>
          <StructuredListCell head>Type</StructuredListCell>
          <StructuredListCell head noWrap>Default value</StructuredListCell>
          <StructuredListCell head>Description</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each component.props as prop}
          <StructuredListRow>
            <StructuredListCell noWrap>
              <InlineSnippet code="{prop[0]}" />
            </StructuredListCell>
            <StructuredListCell>
              {#each prop[1].type.split(' | ') as type, i (type)}
                <div
                  class="cell"
                  style="z-index: {prop[1].type.split(' | ').length - i}"
                >
                  {#if type.startsWith('typeof')}
                    <TooltipDefinition
                      direction="top"
                      align="start"
                      tooltipText="{`From "carbon-icons-svelte"`}"
                    >
                      Carbon Svelte icon
                    </TooltipDefinition>
                  {:else if type.startsWith('HTML')}
                    <Link
                      href="{mdn_api}{type}"
                      target="_blank"
                      style="white-space: nowrap"
                    >
                      {type}
                      <Launch16 />
                    </Link>
                  {:else if type in typeMap}
                    <code>{typeMap[type]}</code>
                  {:else if type.startsWith('(')}
                    <code>{type}</code>
                  {:else}
                    <InlineSnippet code="{type}" />
                  {/if}
                </div>
              {/each}
            </StructuredListCell>
            <StructuredListCell>
              <code>{prop[1].value}</code>
            </StructuredListCell>
            <StructuredListCell>
              {#each prop[1].description.split('\n') as line}
                <div class="description">
                  {@html line.replace(/`(.*?)`/g, '<code>$1</code>')}.
                </div>
              {/each}
            </StructuredListCell>
          </StructuredListRow>
        {/each}
      </StructuredListBody>
    </StructuredList>
  </div>
{:else}
  <p class="my-layout-01-03">No props.</p>
{/if}
<h3 id="slots">Slots</h3>
{#if component.slots.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each component.slots as slot}
      <ListItem>{slot[0]}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No slots.</p>
{/if}

<h3 id="forwarded-events">Forwarded events</h3>
{#if component.forwarded_events.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each component.forwarded_events as event}
      <ListItem>on:{event[0]}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No forwarded events.</p>
{/if}

<h3 id="dispatched-events">Dispatched events</h3>

{#if component.dispatched_events.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each component.dispatched_events as event}
      <ListItem>on:{event[0]}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No dispatched events.</p>
{/if}
