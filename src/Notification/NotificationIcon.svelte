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

  import CheckmarkFilled20 from "carbon-icons-svelte/lib/CheckmarkFilled20";
  import ErrorFilled20 from "carbon-icons-svelte/lib/ErrorFilled20";
  import InformationFilled20 from "carbon-icons-svelte/lib/InformationFilled20";
  import InformationSquareFilled20 from "carbon-icons-svelte/lib/InformationSquareFilled20";
  import WarningFilled20 from "carbon-icons-svelte/lib/WarningFilled20";
  import WarningAltFilled20 from "carbon-icons-svelte/lib/WarningAltFilled20";

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
