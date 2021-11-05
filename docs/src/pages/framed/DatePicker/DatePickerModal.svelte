<script>
  import { Modal, DatePicker, DatePickerInput } from "carbon-components-svelte";
</script>

<Modal open modalHeading="DatePicker">
  <DatePicker datePickerType="single" flatpickrProps="{{ static: true }}">
    <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</Modal>
