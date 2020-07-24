<script>
  export let segment = undefined;

  import {
    Grid,
    Row,
    Column,
    Breadcrumb,
    BreadcrumbItem,
    Content,
  } from "carbon-components-svelte";
  import GlobalHeader from "../components/GlobalHeader.svelte";
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  const tail = writable(undefined);

  const urlIds = {
    about: "About",
    components: "Components",
  };

  setContext("navigation", {
    tail,
    setTail: (value) => {
      tail.set(value);
    },
  });
</script>

<style>
  :global(.bx--content) {
    padding: 0;
  }
</style>

{#if segment !== 'examples'}
  <GlobalHeader {segment} />
  <Content>
    <Grid>
      <Row>
        <Column>
          <Breadcrumb style="margin-top: 1rem">
            <BreadcrumbItem href="." isCurrentPage={!$tail && !segment}>
              Home
            </BreadcrumbItem>
            {#if segment}
              <BreadcrumbItem href={segment} isCurrentPage={!$tail}>
                {urlIds[segment]}
              </BreadcrumbItem>
            {/if}
            {#if segment && $tail}
              <BreadcrumbItem
                href="{segment}/{$tail.slug}"
                isCurrentPage
                hideTrailingSlash>
                {$tail.title}
              </BreadcrumbItem>
            {/if}
          </Breadcrumb>
          <slot />
        </Column>
      </Row>
    </Grid>
  </Content>
{:else}
  <slot />
{/if}
