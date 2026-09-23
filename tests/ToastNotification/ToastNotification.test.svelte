<script lang="ts">
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<ToastNotification>["kind"] = "error";
  export let lowContrast: ComponentProps<ToastNotification>["lowContrast"] = false;
  export let timeout: ComponentProps<ToastNotification>["timeout"] = 0;
  export let showTimeout: ComponentProps<ToastNotification>["showTimeout"] = false;
  export let timeoutKey: ComponentProps<ToastNotification>["timeoutKey"] = 0;
  export let pauseOnHover: ComponentProps<ToastNotification>["pauseOnHover"] = false;
  export let role: ComponentProps<ToastNotification>["role"] = undefined;
  export let title: ComponentProps<ToastNotification>["title"] = "";
  export let subtitle: ComponentProps<ToastNotification>["subtitle"] = "";
  export let caption: ComponentProps<ToastNotification>["caption"] = "";
  export let closeButtonDescription: ComponentProps<ToastNotification>["closeButtonDescription"] =
    "Close notification";
  export let hideCloseButton: ComponentProps<ToastNotification>["hideCloseButton"] = false;
  export let fullWidth: ComponentProps<ToastNotification>["fullWidth"] = false;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<ToastNotification
  {kind}
  {lowContrast}
  {timeout}
  {timeoutKey}
  {showTimeout}
  {pauseOnHover}
  {role}
  {title}
  {subtitle}
  {caption}
  {closeButtonDescription}
  {hideCloseButton}
  {fullWidth}
  on:close={(e) => onclose?.(e)}
  on:click={(e) => onclick?.(e)}
  {...$$restProps}
/>
