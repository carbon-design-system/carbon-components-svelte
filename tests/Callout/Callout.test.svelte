<script lang="ts">
  import Callout from "carbon-components-svelte/Notification/Callout.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<Callout>["kind"] = "info";
  export let lowContrast: ComponentProps<Callout>["lowContrast"] = false;
  export let title: ComponentProps<Callout>["title"] = "Scheduled downtime";
  export let subtitle: ComponentProps<Callout>["subtitle"] = "";
  export let titleId: ComponentProps<Callout>["titleId"] = "callout-title";
  export let statusIconDescription: ComponentProps<Callout>["statusIconDescription"] =
    undefined;
  export let fullWidth: ComponentProps<Callout>["fullWidth"] = false;
  export let action = false;
  export let actionDescribedBy: string | undefined = undefined;
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<Callout
  {kind}
  {lowContrast}
  {title}
  {subtitle}
  {titleId}
  {statusIconDescription}
  {fullWidth}
  data-testid="callout"
  on:click={(e) => onclick?.(e)}
>
  <svelte:fragment slot="actions">
    {#if action}
      <NotificationActionButton aria-describedby={actionDescribedBy}>
        View schedule
      </NotificationActionButton>
    {/if}
  </svelte:fragment>
</Callout>
