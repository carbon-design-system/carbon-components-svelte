<script lang="ts">
  import { ToastNotification } from "../types";
</script>

<ToastNotification fullWidth />

<ToastNotification
  hideCloseButton
  kind="warning"
  title="Upcoming scheduled maintenance"
  on:close="{(e) => {
    console.log(e.detail.timeout);
  }}"
/>

<ToastNotification kind="error" />

<ToastNotification kind="info" />

<ToastNotification kind="info-square" />

<ToastNotification kind="success" />

<ToastNotification kind="warning" />

<ToastNotification kind="warning-alt" />

<ToastNotification lowContrast kind="error" />

<ToastNotification lowContrast kind="info" />

<ToastNotification lowContrast kind="info-square" />

<ToastNotification lowContrast kind="success" />

<ToastNotification lowContrast kind="warning" />

<ToastNotification lowContrast kind="warning-alt" />
