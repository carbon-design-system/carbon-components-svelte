<script lang="ts">
  import ConfirmModal from "carbon-components-svelte/ConfirmModal/ConfirmModal.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let kind: ComponentProps<ConfirmModal>["kind"] = undefined;
  export let heading = "Delete this item?";
  export let label: ComponentProps<ConfirmModal>["label"] = undefined;
  export let confirmText = "Confirm";
  export let cancelText = "Cancel";
  export let confirmationPhrase: ComponentProps<ConfirmModal>["confirmationPhrase"] =
    undefined;
  export let confirmationLabel: ComponentProps<ConfirmModal>["confirmationLabel"] =
    undefined;
  export let loading = false;
  export let loadingDescription: ComponentProps<ConfirmModal>["loadingDescription"] =
    undefined;
  export let closeOnConfirm = true;
  export let size: ComponentProps<ConfirmModal>["size"] = undefined;
  export let preventCloseOnClickOutside: ComponentProps<ConfirmModal>["preventCloseOnClickOutside"] =
    undefined;
  export let onConfirm: ComponentProps<ConfirmModal>["onConfirm"] = undefined;
  export let errorText: ComponentProps<ConfirmModal>["errorText"] = undefined;
  export let onconfirm: (() => void) | undefined = undefined;
  export let oncancel: ((event: CustomEvent) => void) | undefined = undefined;
  export let onopen: (() => void) | undefined = undefined;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<ConfirmModal
  bind:open
  {kind}
  {heading}
  {label}
  {confirmText}
  {cancelText}
  {confirmationPhrase}
  {confirmationLabel}
  {loading}
  {loadingDescription}
  {closeOnConfirm}
  {size}
  {preventCloseOnClickOutside}
  {onConfirm}
  {...errorText ? { errorText } : {}}
  on:confirm={() => onconfirm?.()}
  on:cancel={(e) => oncancel?.(e)}
  on:open={() => onopen?.()}
  on:close={(e) => onclose?.(e)}
>
  <slot />
</ConfirmModal>
