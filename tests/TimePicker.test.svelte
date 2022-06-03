<script lang="ts">
  import { TimePicker, TimePickerSelect, SelectItem } from "../types";
</script>

<TimePicker
  spellcheck="{false}"
  labelText="Cron job"
  placeholder="hh:mm"
  on:paste
>
  <TimePickerSelect value="PM">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="PDT">
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>

<TimePicker light labelText="Cron job" placeholder="hh:mm">
  <TimePickerSelect value="PM">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="PDT">
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>

<TimePicker size="xl" labelText="Cron job" placeholder="hh:mm">
  <TimePickerSelect value="PM">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="PDT">
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>

<TimePicker size="sm" labelText="Cron job" placeholder="hh:mm">
  <TimePickerSelect value="PM">
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="PDT">
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>

<TimePicker labelText="Cron job" placeholder="hh:mm" disabled>
  <TimePickerSelect value="PM" disabled>
    <SelectItem value="am" text="AM" />
    <SelectItem value="pm" text="PM" />
  </TimePickerSelect>
  <TimePickerSelect value="PDT" disabled>
    <SelectItem value="pdt" text="PDT" />
    <SelectItem value="gmt" text="GMT" />
  </TimePickerSelect>
</TimePicker>
