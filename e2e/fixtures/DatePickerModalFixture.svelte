<script lang="ts">
  import { DatePicker, DatePickerInput, Modal } from "carbon-components-svelte";
</script>

<!-- Inside a Modal the calendar moves to a portal on the page. -->
<Modal open modalHeading="Schedule" primaryButtonText="Save">
  <DatePicker datePickerType="single">
    <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</Modal>
