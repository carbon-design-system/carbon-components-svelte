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
  export let iconDescription = "Closes notification";

  import CheckmarkFilled20 from "../icons/CheckmarkFilled20.svelte";
  import ErrorFilled20 from "../icons/ErrorFilled20.svelte";
  import InformationFilled20 from "../icons/InformationFilled20.svelte";
  import InformationSquareFilled20 from "../icons/InformationSquareFilled20.svelte";
  import WarningFilled20 from "../icons/WarningFilled20.svelte";
  import WarningAltFilled20 from "../icons/WarningAltFilled20.svelte";

  const icons = {
    error: ErrorFilled20,
    "info-square": InformationSquareFilled20,
    info: InformationFilled20,
    success: CheckmarkFilled20,
    warning: WarningFilled20,
    "warning-alt": WarningAltFilled20,
  };
</script>

<svelte:component
  this="{icons[kind]}"
  title="{iconDescription}"
  class="bx--{notificationType}-notification__icon"
/>
