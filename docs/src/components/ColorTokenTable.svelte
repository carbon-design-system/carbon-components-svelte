<script lang="ts">
  import {
    Box,
    CopyButton,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Tag,
    Text,
  } from "carbon-components-svelte";
  import { themes } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import type { CarbonTheme } from "carbon-components-svelte/tokens";
  import { colorTokens } from "carbon-components-svelte/tokens";
  import { type ColorRow, TOKEN_THEMES } from "../token-reference";
  import TokenName from "./TokenName.svelte";

  export let label: string;
  export let rows: ColorRow[];
  export let currentTheme: CarbonTheme;
</script>

<Box overflowX="auto">
  <Box minWidth="64rem">
    <StructuredList
      condensed
      flush
      class="token-table"
      aria-label="{label} tokens"
    >
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head class="token-name-column">
            Token
          </StructuredListCell>
          {#each TOKEN_THEMES as theme (theme)}
            <StructuredListCell
              head
              class={theme === currentTheme ? "token-current" : undefined}
            >
              <Stack orientation="horizontal" gap={2} align="center">
                {themes[theme]}
                {#if theme === currentTheme}
                  <Tag size="sm" type="blue" inline>Current</Tag>
                {/if}
              </Stack>
            </StructuredListCell>
          {/each}
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each rows as row (row.name)}
          <StructuredListRow>
            <StructuredListCell>
              <TokenName name={row.name} />
            </StructuredListCell>
            {#each TOKEN_THEMES as theme (theme)}
              {@const value = row.values[theme]}
              <StructuredListCell
                class={theme === currentTheme ? "token-current" : undefined}
              >
                <Stack gap={2}>
                  <!-- Translucent values draw over the theme's background. -->
                  <span
                    class="token-swatch"
                    style:--token-swatch={value}
                    style:--token-swatch-background={colorTokens.background[
                      theme
                    ]}
                    aria-hidden="true"
                  ></span>
                  <Stack orientation="horizontal" gap={1} align="center">
                    <Text tag="code" type="code-01" color="secondary">
                      {value}
                    </Text>
                    <CopyButton
                      kind="ghost"
                      size="sm"
                      text={value}
                      iconDescription="Copy {themes[theme]} value"
                    />
                  </Stack>
                </Stack>
              </StructuredListCell>
            {/each}
          </StructuredListRow>
        {/each}
      </StructuredListBody>
    </StructuredList>
  </Box>
</Box>

<style>
  .token-swatch {
    display: block;
    height: var(--cds-spacing-07);
    border: 1px solid var(--cds-border-subtle-01);
    background:
      linear-gradient(var(--token-swatch), var(--token-swatch)),
      var(--token-swatch-background);
    /* The swatch is the content: keep its colors in forced colors mode. */
    forced-color-adjust: none;
  }
</style>
