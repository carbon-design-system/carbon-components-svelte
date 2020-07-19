<script>
  export let kind = "error";
  export let notificationType = "toast";
  export let iconDescription = "closes notification";

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
    "warning-alt": WarningAltFilled20
  };
</script>

<svelte:component
  this={icons[kind]}
  title={iconDescription}
  class="bx--{notificationType}-notification__icon" />
