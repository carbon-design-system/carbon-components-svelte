<script>
  import {
    Grid,
    Row,
    Column,
    Content,
    Select,
    SelectItem,
  } from "carbon-components-svelte";
  import { page, metatags } from "@sveltech/routify";
  import { onMount } from "svelte";
  import { theme } from "../store";

  export let component = $page.title;

  metatags.title = $page.title;

  onMount(() => {
    const currentTheme = window.location.search.split("?theme=")[1];

    if (["white", "g10", "g90", "g100"].includes(currentTheme)) {
      theme.set(currentTheme);
    }
  });
</script>

<Content data-components>
  <Grid>
    <Row>
      <Column>
        <h1>{component}</h1>
        <div class="bar">
          <Select
            id="select-theme"
            inline
            labelText="Theme"
            bind:selected="{$theme}"
          >
            <SelectItem value="white" text="White" />
            <SelectItem value="g10" text="Gray 10" />
            <SelectItem value="g90" text="Gray 90" />
            <SelectItem value="g100" text="Gray 100" />
          </Select>
        </div>
      </Column>
    </Row>

    <Row>
      <Column class="prose">
        <div class="toc mobile">
          <h5>Table of Contents</h5>
          <slot name="aside" />
        </div>
        <slot />
      </Column>
    </Row>
  </Grid>

  <Column class="table" xlg="{4}" lg="{5}">
    <div class="toc">
      <h5>Table of Contents</h5>
      <slot name="aside" />
    </div>
  </Column>
</Content>

<style>
  .bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--cds-layout-02);
    border-bottom: 1px solid var(--cds-ui-03);
  }

  .toc h5 {
    margin-bottom: var(--cds-spacing-03);
  }

  .toc.mobile {
    display: none;
  }

  @media (max-width: 1056px) {
    .toc.mobile {
      display: block;
    }
  }
</style>
