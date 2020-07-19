<script>
  export let story = undefined;

  import ContentSwitcher from "./ContentSwitcher.svelte";
  import Switch from "./Switch.svelte";
  import Add16 from "carbon-icons-svelte/lib/Add16";

  $: selectedIndex = 0;
  $: console.log("bind selectedIndex", selectedIndex);
</script>

{#if story === 'selected'}
  <ContentSwitcher
    on:change={({ detail }) => {
      console.log('on:change', detail);
    }}>
    <Switch {...$$props} text="First section" />
    <Switch {...$$props} text="Second section" selected />
    <Switch {...$$props} text="Third section" />
  </ContentSwitcher>
{:else}
  <ContentSwitcher
    bind:selectedIndex
    on:change={({ detail }) => {
      console.log('on:change', detail);
    }}>
    <Switch {...$$props} text="First section" />
    <Switch {...$$props} text="Second section" />
    <Switch {...$$props}>
      <div style="display: flex; align-items:center;">
        <Add16 style="margin-right: .25rem;" />
        Third section
      </div>
    </Switch>
  </ContentSwitcher>
  <div
    style="margin-top: 1.5rem"
    on:click={() => {
      selectedIndex = 1;
    }}>
    Programmatically set to second index
  </div>
{/if}
