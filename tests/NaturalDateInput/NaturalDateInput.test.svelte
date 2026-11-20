<script lang="ts">
  import NaturalDateInput from "carbon-components-svelte/NaturalDateInput/NaturalDateInput.svelte";
  import type { ComponentProps } from "svelte";

  type $$Props = ComponentProps<NaturalDateInput> & {
    onChange?: (detail: unknown) => void;
    onClose?: (detail: unknown) => void;
    onKeydown?: (event: KeyboardEvent) => void;
  };

  export let value: $$Props["value"] = null;
  export let text: $$Props["text"] = "";
  export let hasTime: $$Props["hasTime"] = false;
  export let open: $$Props["open"] = false;
  export let onChange: (detail: unknown) => void = () => {};
  export let onClose: (detail: unknown) => void = () => {};
  export let onKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<div role="presentation" on:keydown={onKeydown}>
  <form data-testid="form">
    <NaturalDateInput
      labelText="Due date"
      now="2026-11-12T15:30:00Z"
      timeZone="America/New_York"
      locale="en-US"
      bind:value
      bind:text
      bind:hasTime
      bind:open
      {...$$restProps}
      on:change={(event) => onChange(event.detail)}
      on:close={(event) => onClose(event.detail)}
    />
  </form>
</div>
<p data-testid="bound">
  {value instanceof Date ? value.toISOString() : String(value)}
</p>
<p data-testid="has-time">{hasTime}</p>
