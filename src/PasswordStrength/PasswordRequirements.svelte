<script>
  /**
   * @restProps {div}
   */

  /**
   * Specify the password to check.
   * It is read and never stored, logged, or sent in an event.
   */
  export let value = "";

  /**
   * Specify the rules. Each is `{ id, text, test(password, context), when?(context) }`;
   * build them with `passwordRules` or write your own.
   * Defaults to length and a blocklist, which is what NIST SP 800-63B asks for.
   * @type {import("./rules.js").PasswordRequirement[] | undefined}
   */
  export let requirements = undefined;

  /**
   * Specify strings the password must not contain, such as a name or email
   * address. Used by `passwordRules.notContainingUserInput()`.
   * @type {string[]}
   */
  export let userInputs = [];

  /**
   * Replace the common-password list used by `passwordRules.notCommon()`.
   * @type {import("./blocklist.js").Blocklist | Iterable<string> | undefined}
   */
  export let blocklist = undefined;

  /**
   * Set to `true` to mark each unmet requirement as an error, for example
   * after a failed submit.
   */
  export let invalid = false;

  /** Specify the label text. */
  export let labelText = "Password requirements";

  /** Set to `true` to visually hide the label text. */
  export let hideLabel = false;

  /** Specify the text read after a requirement that is met. */
  export let metText = "met";

  /** Specify the text read after a requirement that is not met. */
  export let unmetText = "not met";

  /**
   * Override the announcement. Receives the number of requirements met and the total.
   * @type {(met: number, total: number) => string}
   */
  export let statusText = function statusText(met, total) {
    return met === total
      ? "All requirements met"
      : `${met} of ${total} requirements met`;
  };

  /** Specify the time (ms) typing must pause before the count is announced. */
  export let announceDelay = PAUSE_ANNOUNCEMENT_DELAY_MS;

  /**
   * Whether every requirement is met.
   * @bindable readonly
   */
  export let valid = false;

  /**
   * The requirements not met, as `{ id, text }`.
   * Use it to write the error for a failed submit.
   * @type {{ id: string; text: string }[]}
   * @bindable readonly
   */
  export let unmet = [];

  /**
   * Set an id for the root element, which `aria-describedby` on the input can point to.
   * The label id derives from it as `{id}-label`.
   */
  export let id = uniqueId();

  /**
   * Announce a pending count now, for example on blur of the input.
   */
  export function flush() {
    announcement.flush();
  }

  import { onMount } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import CircleDash from "../icons/CircleDash.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    createPauseAnnouncer,
    PAUSE_ANNOUNCEMENT_DELAY_MS,
  } from "../utils/pause-announcer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { checkRequirements, defaultRequirements } from "./rules.js";

  const announcement = createPauseAnnouncer(announceDelay);
  const fallbackRequirements = defaultRequirements();

  // Consumer naming and description go on the list.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  let mounted = false;

  $: checked = checkRequirements(
    value ?? "",
    requirements ?? fallbackRequirements,
    { userInputs, blocklist },
  );
  $: valid = checked.valid;
  $: unmet = checked.unmet.map(({ id, text }) => ({ id, text }));
  $: total = checked.results.length;
  $: metCount = total - checked.unmet.length;
  $: message = value ? statusText(metCount, total) : "";

  $: if (mounted) announcement.schedule(message);

  onMount(() => {
    announcement.prime(message);
    mounted = true;
    return () => announcement.cancel();
  });
</script>

<div {id} class:bx--password-requirements={true} {...wrapperProps}>
  <p
    id="{id}-label"
    class:bx--password-requirements__label={true}
    class:bx--visually-hidden={hideLabel}
  >
    {labelText}
  </p>
  <!-- Safari drops the list role of a list with no bullets. -->
  <!-- svelte-ignore a11y-no-redundant-roles -->
  <ul
    role="list"
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : `${id}-label`)}
    aria-describedby={ariaDescribedBy}
    class:bx--password-requirements__list={true}
  >
    {#each checked.results as requirement (requirement.id)}
      <li
        class:bx--password-requirements__item={true}
        class:bx--password-requirements__item--met={requirement.met}
        class:bx--password-requirements__item--invalid={invalid &&
          !requirement.met}
      >
        {#if requirement.met}
          <CheckmarkFilled class="bx--password-requirements__icon" />
        {:else if invalid}
          <ErrorFilled class="bx--password-requirements__icon" />
        {:else}
          <CircleDash class="bx--password-requirements__icon" />
        {/if}
        <span>
          {requirement.text}<span class:bx--visually-hidden={true}
            >, {requirement.met ? metText : unmetText}</span
          >
        </span>
      </li>
    {/each}
  </ul>
</div>
<div
  class:bx--visually-hidden={true}
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {$announcement}
</div>
