<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";

  export let border = false;
  export let theme: "classic" | undefined = undefined;
</script>

<SideNav {border} {theme} />
