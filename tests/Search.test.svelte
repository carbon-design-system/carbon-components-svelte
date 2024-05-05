<script lang="ts">
  import { Search, SearchSkeleton } from "../types";
</script>

<Search
  spellcheck="false"
  expandable
  disabled
  light
  size="sm"
  placeholder="Search catalog..."
  value="Cloud functions"
  on:input
  on:paste
  on:clear
  on:expand
  on:collapse
/>

<SearchSkeleton size="lg" />
