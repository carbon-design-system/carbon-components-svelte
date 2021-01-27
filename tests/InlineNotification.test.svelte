<script lang="ts">
  import { InlineNotification, NotificationActionButton } from "../types";
</script>

<InlineNotification on:close />

<InlineNotification
  hideCloseButton
  kind="warning"
  title="Upcoming scheduled maintenance"
  on:close="{(e) => {
    console.log(e.detail.timeout);
  }}"
/>

<InlineNotification kind="warning" title="Upcoming scheduled maintenance">
  <div slot="actions">
    <NotificationActionButton>Learn more</NotificationActionButton>
  </div>
</InlineNotification>

<NotificationActionButton>Learn more</NotificationActionButton>

<InlineNotification kind="error" />

<InlineNotification kind="info" />

<InlineNotification kind="info-square" />

<InlineNotification kind="success" />

<InlineNotification kind="warning" />

<InlineNotification kind="warning-alt" />

<InlineNotification lowContrast kind="error" />

<InlineNotification lowContrast kind="info" />

<InlineNotification lowContrast kind="info-square" />

<InlineNotification lowContrast kind="success" />

<InlineNotification lowContrast kind="warning" />

<InlineNotification lowContrast kind="warning-alt" />
