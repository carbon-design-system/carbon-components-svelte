<script>
  /**
   * Internal "+N" overflow avatar for `UserAvatarGroup`. Shadows the group
   * context so the inner `UserAvatar` does not register as a group item.
   */

  /** @type {string} */
  export let label;

  /** @type {string} */
  export let names = "";

  import { getContext, setContext } from "svelte";
  import { readable } from "svelte/store";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";

  const parent = getContext("carbon:UserAvatarGroup");

  // Opt out of registration and overflow (empty items/max, no-op register) so
  // the chip is never counted or hidden, but keep sharing the parent's
  // `activeTooltip` and `size` so the chip coordinates with the avatars.
  setContext("carbon:UserAvatarGroup", {
    items: readable([]),
    max: readable(0),
    size: parent?.size ?? readable(undefined),
    activeTooltip: parent?.activeTooltip ?? readable(null),
    register: () => {},
    unregister: () => {},
    updateName: () => {},
  });
</script>

<UserAvatar
  class="bx--user-avatar-group__overflow"
  initials={label}
  tooltipText={names}
/>
