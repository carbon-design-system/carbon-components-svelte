<script lang="ts">
  import { ContainedList, ContainedListItem } from "../types";
</script>

<ContainedList labelText="Title" kind="on-page">
  <div slot="labelText">Title</div>
  <ContainedListItem interactive disabled on:click>Item 1</ContainedListItem>
  <svelte:fragment slot="action" />
</ContainedList>
