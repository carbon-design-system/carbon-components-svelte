<script>
  export let props = [];

  import {
    StructuredList,
    StructuredListBody,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    Tag,
    CodeSnippet
  } from 'carbon-components-svelte';
  import copy from 'clipboard-copy';

  const propTypeColor = {
    string: 'green',
    number: 'blue',
    boolean: 'purple'
  };

  function formatValue(value) {
    return typeof value === 'string' ? `"${value}"` : value;
  }
</script>

<style>
  .bx--row {
    margin-top: 1rem;
  }

  .values {
    display: flex;
  }

  :global(.value) {
    margin-right: 0.5rem;
  }

  :global(.value:not(:first-of-type)) {
    margin-left: 0.5rem;
  }

  .separator {
    color: var(--cds-text-03);
  }
</style>

<div class="bx--row">
  <StructuredList>
    <StructuredListHead>
      <StructuredListRow head>
        <StructuredListCell head>Prop</StructuredListCell>
        <StructuredListCell head>Type</StructuredListCell>
        <StructuredListCell head>Value</StructuredListCell>
        <StructuredListCell head>Description</StructuredListCell>
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each props as prop, i (prop.name)}
        <StructuredListRow>
          <StructuredListCell noWrap>{prop.name}</StructuredListCell>
          <StructuredListCell noWrap>
            <Tag type={propTypeColor[prop.type]}>
              <code>{prop.type}</code>
            </Tag>
          </StructuredListCell>
          <StructuredListCell>
            <div class="values">
              {#each prop.value as value, j (value)}
                <CodeSnippet
                  class="value"
                  type="inline"
                  code={formatValue(value)}
                  on:click={() => {
                    copy(formatValue(value));
                  }} />
                {#if j < prop.value.length - 1}
                  <span class="separator">|</span>
                {/if}
              {/each}
            </div>
            {#if prop.defaultValue}
              <div style="margin-top: .75rem">
                <strong>Default:</strong>
                <code>{formatValue(prop.defaultValue.value)}</code>
              </div>
            {/if}
          </StructuredListCell>
          <StructuredListCell>
            {@html prop.description}
          </StructuredListCell>
        </StructuredListRow>
      {/each}
    </StructuredListBody>
  </StructuredList>
</div>
