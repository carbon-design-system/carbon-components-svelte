<script>
  import {
    DatePicker,
    DatePickerInput,
    InlineLoading,
    Stack,
  } from "carbon-components-svelte";

  const format = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  let disabledDates = [];
  let loading = false;
  let summary = "";
  let latest = 0;

  // Stands in for a request to a booking service.
  function fetchBookedDays(start, end) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const booked = [];
        for (
          let day = new Date(start);
          day <= end;
          day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
        ) {
          if ((day.getDate() * 7 + day.getMonth()) % 5 === 0) booked.push(day);
        }
        resolve(booked);
      }, 600);
    });
  }

  async function loadAvailability(event) {
    const { start, end } = event.detail;
    const request = ++latest;
    loading = true;
    summary = `${format.format(start)} – ${format.format(end)}`;
    const booked = await fetchBookedDays(start, end);
    if (request !== latest) return;
    disabledDates = booked;
    loading = false;
    summary = `${booked.length} fully booked days, ${format.format(start)} – ${format.format(end)}`;
  }
</script>

<Stack gap={5}>
  <DatePicker
    datePickerType="single"
    inline
    {disabledDates}
    on:view={loadAvailability}
  >
    <DatePickerInput labelText="Appointment date" placeholder="mm/dd/yyyy" />
  </DatePicker>
  {#if loading}
    <InlineLoading description="Loading availability for {summary}" />
  {:else}
    <p>{summary}</p>
  {/if}
</Stack>
