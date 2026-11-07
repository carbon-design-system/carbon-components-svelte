<script lang="ts">
  import HoverCard from "../../src/HoverCard/HoverCard.svelte";
</script>

<HoverCard id="one" openDelay={50} closeDelay={50}>
  <a slot="trigger" href="/one">one</a>
  <p>Card one</p>
</HoverCard>
<HoverCard id="two" openDelay={50} closeDelay={50}>
  <a slot="trigger" href="/two">two</a>
  <p>Card two</p>
</HoverCard>
