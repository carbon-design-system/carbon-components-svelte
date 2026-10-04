<script lang="ts">
  import Header from "carbon-components-svelte/UIShell/Header.svelte";

  export let companyName: string | undefined = undefined;
  export let platformName = "";
  export let uiShellAriaLabel: string | undefined = undefined;
</script>

<Header {companyName} {platformName} {uiShellAriaLabel} />
