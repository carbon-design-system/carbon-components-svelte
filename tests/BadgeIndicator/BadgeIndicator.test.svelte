<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
</script>

<div data-testid="dot">
  <BadgeIndicator />
</div>

<div data-testid="zero">
  <BadgeIndicator count={0} />
</div>

<div data-testid="count">
  <BadgeIndicator count={4} />
</div>

<div data-testid="overflow">
  <BadgeIndicator count={1000} />
</div>

<div data-testid="boundary">
  <BadgeIndicator count={999} />
</div>

<div data-testid="label">
  <BadgeIndicator count="1.2k" />
</div>

<div data-testid="restprops">
  <BadgeIndicator id="notifications" class="custom" />
</div>
