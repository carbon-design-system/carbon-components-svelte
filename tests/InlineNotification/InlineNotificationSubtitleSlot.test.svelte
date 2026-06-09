<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
</script>

<InlineNotification on:close on:click>
  <span slot="subtitleChildren">Slot subtitle</span>
</InlineNotification>
