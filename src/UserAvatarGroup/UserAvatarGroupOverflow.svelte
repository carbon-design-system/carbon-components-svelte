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
  import { noop } from "../utils/noop.js";

  const parent = getContext("carbon:UserAvatarGroup");

  // Opt out of registration and overflow (empty items/max, no-op register) so
  // the chip is never counted or hidden, but keep sharing the parent's
  // `size`. The chip's tooltip joins the group's tooltip handoff through
  // the `TooltipGroup` context, which this does not shadow.
  setContext("carbon:UserAvatarGroup", {
    items: readable([]),
    max: readable(0),
    size: parent?.size ?? readable(undefined),
    register: noop,
    unregister: noop,
    updateName: noop,
  });
</script>

<UserAvatar
  class="bx--user-avatar-group__overflow"
  data-avatar-group-overflow="true"
  initials={label}
  tooltipText={names}
/>
