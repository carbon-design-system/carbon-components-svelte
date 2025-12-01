<script lang="ts">
  import { ToastNotification } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<ToastNotification>["kind"] = "error";
  export let lowContrast: ComponentProps<ToastNotification>["lowContrast"] = false;
  export let timeout: ComponentProps<ToastNotification>["timeout"] = 0;
  export let role: ComponentProps<ToastNotification>["role"] = "alert";
  export let title: ComponentProps<ToastNotification>["title"] = "";
  export let subtitle: ComponentProps<ToastNotification>["subtitle"] = "";
  export let caption: ComponentProps<ToastNotification>["caption"] = "";
  export let statusIconDescription: ComponentProps<ToastNotification>["statusIconDescription"] =
    undefined;
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
  {role}
  {title}
  {subtitle}
  {caption}
  {statusIconDescription}
  {closeButtonDescription}
  {hideCloseButton}
  {fullWidth}
  on:close={onclose}
  on:click={onclick}
  {...$$restProps}
/>
