<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  function formatDate(date) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${date.getFullYear()}`;
  }

  const now = new Date();
  const eventDates = [5, 12, 20].map((day) =>
    formatDate(new Date(now.getFullYear(), now.getMonth(), day)),
  );

  function markEventDays(_dObj, _dStr, fp, dayElem) {
    if (!eventDates.includes(fp.formatDate(dayElem.dateObj, "m/d/Y"))) return;

    dayElem.style.position = "relative";

    const dot = document.createElement("span");
    dot.style.position = "absolute";
    dot.style.bottom = "4px";
    dot.style.left = "50%";
    dot.style.transform = "translateX(-50%)";
    dot.style.width = "4px";
    dot.style.height = "4px";
    dot.style.borderRadius = "50%";
    dot.style.background = "var(--cds-support-info, #0f62fe)";
    dayElem.appendChild(dot);
  }
</script>

<DatePicker
  datePickerType="single"
  flatpickrProps={{ onDayCreate: markEventDays }}
  on:change
>
  <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
</DatePicker>
