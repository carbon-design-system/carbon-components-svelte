<script>
  export let notificationType = "toast"; // "toast" | "inline"
  export let title = "title";
  export let subtitle = "";
  export let caption = "caption";
</script>

{#if notificationType === 'toast'}
  <div class:bx--toast-notification__details={true}>
    <h3 class:bx--toast-notification__title={true}>{title}</h3>
    <div class:bx--toast-notification__subtitle={true}>{subtitle}</div>
    <div class:bx--toast-notification__caption={true}>{caption}</div>
    <slot />
  </div>
{/if}

{#if notificationType === 'inline'}
  <div class:bx--inline-notification__text-wrapper={true}>
    <p class:bx--inline-notification__title={true}>{title}</p>
    <div class:bx--inline-notification__subtitle={true}>{subtitle}</div>
    <slot />
  </div>
{/if}
