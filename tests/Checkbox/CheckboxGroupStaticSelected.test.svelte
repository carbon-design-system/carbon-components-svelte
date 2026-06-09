<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import CheckboxGroup from "carbon-components-svelte/Checkbox/CheckboxGroup.svelte";
</script>

<CheckboxGroup
  legendText="Notification preferences"
  name="prefs"
  selected={["email"]}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
>
  <Checkbox value="email" labelText="Email" />
  <Checkbox value="sms" labelText="SMS" />
  <Checkbox value="push" labelText="Push notifications" />
</CheckboxGroup>
