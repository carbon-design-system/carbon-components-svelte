<script>
  /**
   * Specify the kind of notification icon
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "error";

  /**
   * Set the type of notification
   * @type {"toast" | "inline"}
   */
  export let notificationType = "toast";

  /** Specify the ARIA label for the icon */
  export let iconDescription;

  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import InformationFilled from "../icons/InformationFilled.svelte";
  import InformationSquareFilled from "../icons/InformationSquareFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";

  const icons = {
    error: ErrorFilled,
    "info-square": InformationSquareFilled,
    info: InformationFilled,
    success: CheckmarkFilled,
    warning: WarningFilled,
    "warning-alt": WarningAltFilled,
  };
</script>

<svelte:component
  this="{icons[kind]}"
  size="{20}"
  title="{iconDescription}"
  class="{notificationType === 'toast' &&
    'bx--toast-notification__icon'} {notificationType === 'inline' &&
    'bx--inline-notification__icon'}"
/>
