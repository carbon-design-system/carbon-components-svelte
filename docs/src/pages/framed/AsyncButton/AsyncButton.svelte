<script>
  import { AsyncButton, Toggle } from "carbon-components-svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";

  let status = "idle";
  let fail = false;

  const reserve = () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fail) reject(new Error("That room was just booked."));
        else resolve();
      }, 900);
    });
</script>

<Toggle
  labelText="Make the request fail"
  bind:toggled={fail}
  on:toggle={() => (status = "idle")}
/>

<br>

<AsyncButton
  bind:status
  icon={Checkmark}
  activeText="Reserving"
  finishedText="Deluxe King reserved"
  onClick={reserve}
>
  Reserve
</AsyncButton>
