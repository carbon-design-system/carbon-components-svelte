<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Popconfirm from "carbon-components-svelte/Popconfirm/Popconfirm.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let kind: ComponentProps<Popconfirm>["kind"] = undefined;
  export let description = "";
  export let confirm: ComponentProps<Popconfirm>["confirm"] = undefined;
  export let errorText: ComponentProps<Popconfirm>["errorText"] = undefined;
  export let onconfirm: (() => void) | undefined = undefined;
  export let oncancel: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclose: (() => void) | undefined = undefined;
  export let onconfirmerror: ((event: CustomEvent) => void) | undefined =
    undefined;
  export let onkeydown: ((event: KeyboardEvent) => void) | undefined =
    undefined;
</script>

<div on:keydown={(event) => onkeydown?.(event)} role="presentation">
  <Popconfirm
    bind:open
    {kind}
    title="Delete this row?"
    {description}
    confirmText="Delete"
    {confirm}
    {errorText}
    on:confirm={() => onconfirm?.()}
    on:cancel={(e) => oncancel?.(e)}
    on:close={() => onclose?.()}
    on:confirm:error={(e) => onconfirmerror?.(e)}
  >
    <Button>Remove</Button>
  </Popconfirm>
  <button type="button">Elsewhere</button>
</div>
