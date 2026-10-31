<script>
  import {
    DatePicker,
    DatePickerInput,
    SelectItem,
    Stack,
    TimePicker,
    TimePickerSelect,
  } from "carbon-components-svelte";

  // 12-hour time; a leading zero ("09:30") is allowed.
  const TIME_PATTERN = "(0?[1-9]|1[0-2]):[0-5][0-9]";
  const timeRegex = new RegExp(`^${TIME_PATTERN}$`);

  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  let selectedDates = [];
  let time = "";
  let period = "AM";

  /**
   * Combines the picked day with a 12-hour time into one `Date`, in the
   * browser's time zone. Returns `null` until both parts are valid.
   */
  function toDateTime(date, time, period) {
    if (!date || !timeRegex.test(time)) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const result = new Date(date);
    result.setHours((hours % 12) + (period === "PM" ? 12 : 0), minutes, 0, 0);
    return result;
  }

  $: timeInvalid = time !== "" && !timeRegex.test(time);
  $: startsAt = toDateTime(selectedDates[0], time, period);
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" gap={5} align="start" wrap="wrap">
    <DatePicker datePickerType="single" bind:selectedDates>
      <DatePickerInput
        labelText="Maintenance window date"
        placeholder="mm/dd/yyyy"
      />
    </DatePicker>
    <TimePicker
      labelText="Start time"
      placeholder="hh:mm"
      pattern={TIME_PATTERN}
      bind:value={time}
      invalid={timeInvalid}
      invalidText="Use hh:mm, such as 9:30"
    >
      <TimePickerSelect labelText="Period" bind:value={period}>
        <SelectItem value="AM" text="AM" />
        <SelectItem value="PM" text="PM" />
      </TimePickerSelect>
    </TimePicker>
  </Stack>
  <p>Starts: {startsAt ? formatter.format(startsAt) : "not scheduled"}</p>
</Stack>
