<script lang="ts">
  import Content from "carbon-components-svelte/UIShell/Content.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";

  type Shell = { sideNav: boolean; rail?: boolean; width?: number };

  export let shells: Shell[] = [{ sideNav: true }];
</script>

{#each shells as shell, index}
  {#if shell.sideNav}
    <SideNav
      ariaLabel="Shell {index + 1}"
      rail={shell.rail ?? false}
      resizable={shell.width !== undefined}
      width={shell.width ?? 256}
    />
  {/if}
  <Content id="content-{index + 1}" />
{/each}
