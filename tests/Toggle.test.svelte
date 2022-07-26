<script lang="ts">
  import { Toggle, ToggleSkeleton } from "../types";
</script>

<Toggle labelText="Push notifications" hideLabel />

<Toggle
  labelText="Push notifications"
  toggled
  on:toggle="{(e) => {
    console.log(e.detail.toggled);
  }}"
/>

<Toggle labelText="Push notifications" labelA="No" labelB="Yes" />

<Toggle labelText="Push notifications" disabled />

<ToggleSkeleton />
