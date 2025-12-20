<script lang="ts">
  import { InlineNotification } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<InlineNotification>["kind"] = "error";
  export let lowContrast: ComponentProps<InlineNotification>["lowContrast"] = false;
  export let timeout: ComponentProps<InlineNotification>["timeout"] = 0;
  export let role: ComponentProps<InlineNotification>["role"] = "alert";
  export let title: ComponentProps<InlineNotification>["title"] = "";
  export let subtitle: ComponentProps<InlineNotification>["subtitle"] = "";
  export let statusIconDescription: ComponentProps<InlineNotification>["statusIconDescription"] =
    undefined;
  export let closeButtonDescription: ComponentProps<InlineNotification>["closeButtonDescription"] =
    "Close notification";
  export let hideCloseButton: ComponentProps<InlineNotification>["hideCloseButton"] = false;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<InlineNotification
  {kind}
  {lowContrast}
  {timeout}
  {role}
  {title}
  {subtitle}
  {statusIconDescription}
  {closeButtonDescription}
  {hideCloseButton}
  on:close={onclose}
  on:click={onclick}
  {...$$restProps}
/>
