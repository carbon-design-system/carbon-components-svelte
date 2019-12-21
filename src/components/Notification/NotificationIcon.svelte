<script>
  export let kind = 'error';
  export let notificationType = 'toast';
  export let iconDescription = 'closes notification';

  import ErrorFilled20 from 'carbon-icons-svelte/lib/ErrorFilled20';
  import CheckmarkFilled20 from 'carbon-icons-svelte/lib/CheckmarkFilled20';
  import WarningFilled20 from 'carbon-icons-svelte/lib/WarningFilled20';
  import { cx } from '../../lib';

  const icons = {
    error: ErrorFilled20,
    success: CheckmarkFilled20,
    warning: WarningFilled20
  };
</script>

<svelte:component
  this={icons[kind]}
  class={cx(`--${notificationType}-notification__icon`)}
  title={iconDescription} />
