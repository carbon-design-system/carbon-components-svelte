<script lang="ts">
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import JoinTagSetProbe from "./JoinTagSetProbe.test.svelte";
</script>

<JoinTagSetProbe label="Standalone" />

<TagSet navigation="roving" multiline>
  <JoinTagSetProbe label="First" />
  <JoinTagSetProbe label="Second" />
</TagSet>
