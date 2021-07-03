<script>
  export let component = {
    props: [],
    slots: [],
    events: [],
    rest_props: undefined,
    typedefs: [],
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
    Tag,
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

  $: source = `https://github.com/IBM/carbon-components-svelte/tree/master/${component.filePath}`;
  $: forwarded_events = component.events.filter(
    (event) => event.type === "forwarded"
  );
  $: dispatched_events = component.events.filter(
    (event) => event.type === "dispatched"
  );
</script>

<p style="margin-bottom: var(--cds-layout-02)">
  Component source code:
  <Link inline size="lg" href="{source}" target="_blank">
    {component.filePath}
    <Launch16 />
  </Link>
</p>

<h3 id="props">Props</h3>

{#if component.props.length > 0}
  <div class="overflow">
    <StructuredList flush condensed>
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>Prop name</StructuredListCell>
          <StructuredListCell head>Type</StructuredListCell>
          <StructuredListCell head noWrap>Default value</StructuredListCell>
          <StructuredListCell head>Description</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each component.props.sort((a, b) => {
          if (a.reactive > b.reactive) return -1;
        }) as prop (prop.name)}
          <StructuredListRow>
            <StructuredListCell noWrap>
              <InlineSnippet code="{prop.name}" />
              {#if prop.reactive}
                <div
                  style="white-space: nowrap; margin-top: var(--cds-spacing-03); margin-bottom: var(--cds-spacing-03)"
                >
                  <Tag style="margin-left: 0" size="sm" type="cyan"
                    >Reactive</Tag
                  >
                </div>
              {/if}
            </StructuredListCell>
            <StructuredListCell>
              {#each (prop.type || "").split(" | ") as type, i (type)}
                <div
                  class="cell"
                  style="z-index: {(prop.type || '').split(' | ').length - i}"
                >
                  {#if type.startsWith("typeof")}
                    <TooltipDefinition
                      direction="top"
                      align="start"
                      tooltipText="{`From "carbon-icons-svelte"`}"
                    >
                      Carbon Svelte icon
                    </TooltipDefinition>
                  {:else if type.startsWith("HTML")}
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
                  {:else if type.startsWith("(")}
                    <code>{type}</code>
                  {:else}
                    <InlineSnippet code="{type}" />
                  {/if}
                </div>
              {/each}
            </StructuredListCell>
            <StructuredListCell><code>{prop.value}</code></StructuredListCell>
            <StructuredListCell>
              {#if prop.description}
                {#each prop.description.split("\n") as line}
                  <div class="description">
                    {@html line
                      .replace(/\</g, "&lt;")
                      .replace(/\>/g, "&gt;")
                      .replace(/`(.*?)`/g, "<code>$1</code>")}.
                  </div>
                {/each}
              {:else}
                <div class="description">No description available.</div>
              {/if}
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
    {#each component.slots as slot (slot.name)}
      <ListItem>{slot.default ? "default" : slot.name}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No slots.</p>
{/if}

<h3 id="forwarded-events">Forwarded events</h3>
{#if forwarded_events.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each forwarded_events as event (event.name)}
      <ListItem>on:{event.name}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No forwarded events.</p>
{/if}

<h3 id="dispatched-events">Dispatched events</h3>

{#if dispatched_events.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each dispatched_events as event (event.name)}
      <ListItem>on:{event.name}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No dispatched events.</p>
{/if}

<h3 id="rest-props">$$restProps</h3>

<div class="my-layout-01-03">
  {#if component.rest_props}
    <code>{component.moduleName}</code>
    spreads
    <code>$$restProps</code>
    to the
    {#if component.rest_props.type === "Element"}
      <code>{component.rest_props.name}</code>
      element.
    {:else}<code>{component.rest_props.name}</code> component.{/if}
  {:else}This component does not spread <code>restProps</code>{/if}
</div>

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

  code {
    word-break: break-word;
  }
</style>
