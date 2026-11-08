<script lang="ts">
  import Callout from "carbon-components-svelte/Notification/Callout.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<Callout>["kind"] = "info";
  export let lowContrast: ComponentProps<Callout>["lowContrast"] = false;
  export let titleText: ComponentProps<Callout>["titleText"] =
    "Scheduled downtime";
  export let subtitleText: ComponentProps<Callout>["subtitleText"] = "";
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
  {titleText}
  {subtitleText}
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
