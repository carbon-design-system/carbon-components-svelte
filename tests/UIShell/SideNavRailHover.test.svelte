<script lang="ts">
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";

  export let rail = true;
  export let enterDelayMs = 100;
  export let leaveDelayMs = 0;
</script>

<SideNav {rail} {enterDelayMs} {leaveDelayMs} />
