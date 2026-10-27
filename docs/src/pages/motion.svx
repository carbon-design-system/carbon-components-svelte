---
title: Motion
layout: guide
description: Carbon's durations and easing curves as JavaScript, and Svelte transitions that use them and honor the reduced-motion setting.
---

<script>
  import {
    Box,
    Button,
    ContentSwitcher,
    Stack,
    Switch,
    Toggle,
  } from "carbon-components-svelte";
  import { fade, fly, slide } from "carbon-components-svelte/motion";

  const transitions = { fade, slide, fly };
  const params = {
    fade: {},
    slide: {},
    fly: { x: 32 },
  };

  let selectedIndex = 1;
  let show = true;
  let ignoreReducedMotion = false;

  $: name = ["fade", "slide", "fly"][selectedIndex];
  $: transition = transitions[name];
  $: options = {
    ...params[name],
    reducedMotion: ignoreReducedMotion ? "ignore" : "respect",
  };
</script>

Carbon's CSS already animates with its motion tokens. The `carbon-components-svelte/motion` subpath gives the same tokens to JavaScript, plus Svelte transitions that use them. Import from the subpath, not the package root: `fade`, `slide`, and `fly` share names with `svelte/transition`.

```js
import {
  duration,
  easing,
  easingCss,
  fade,
  fly,
  motion,
  slide,
} from "carbon-components-svelte/motion";
```

## Tokens

### Durations

`duration` holds Carbon's six durations in milliseconds. A test keeps them equal to the Sass the stylesheet is built from.

| Token | Milliseconds | Use |
| :--- | :--- | :--- |
| `fast01` | 70 | Micro-interactions, such as a button press |
| `fast02` | 110 | Small fades, such as an image appearing |
| `moderate01` | 150 | Small expansions and short moves |
| `moderate02` | 240 | System communication, such as a panel opening or a notification |
| `slow01` | 400 | Large expansions and elements entering or leaving the screen |
| `slow02` | 700 | Dimming the page behind an overlay |

### Easing

Each curve comes in a `productive` and an `expressive` mode. `easing[name][mode]` is a `(t) => progress` function for Svelte, `easingCss[name][mode]` is the `cubic-bezier()` string, and `motion(name, mode)` returns that string like the Sass `motion()` function.

| Curve | Use it for |
| :--- | :--- |
| `standard` | Elements that stay on screen and change |
| `entrance` | Elements that arrive |
| `exit` | Elements that leave |

```js
element.animate(keyframes, {
  duration: duration.moderate02,
  easing: motion("entrance"),
});
```

| Do | Why |
| :--- | :--- |
| Use `productive` for everyday UI and `expressive` for a moment that deserves emphasis. | Productive is quick and efficient. Expressive is more dramatic, so it stands out when used sparingly. |
| Read durations from `duration` instead of writing `240`. | The value follows Carbon, and a duration changes in one place. |

## Transitions

`fade`, `slide`, and `fly` take the same arguments as the transitions in `svelte/transition`, so they replace them in a `transition:`, `in:`, or `out:` directive. `flip` replaces the one in `svelte/animate` for `animate:`.

```svelte
<script>
  import { fly } from "carbon-components-svelte/motion";
</script>

{#if saved}
  <div transition:fly={{ y: 16, duration: "slow01" }}>Saved</div>
{/if}
```

<Stack gap={5}>
  <ContentSwitcher bind:selectedIndex>
    <Switch text="fade" />
    <Switch text="slide" />
    <Switch text="fly" />
  </ContentSwitcher>
  <Stack orientation="horizontal" gap={5}>
    <Button kind="tertiary" on:click={() => (show = !show)}>Toggle</Button>
    <Toggle
      size="sm"
      labelText="Reduced motion"
      labelA="Respect"
      labelB="Ignore"
      bind:toggled={ignoreReducedMotion}
    />
  </Stack>
  <Box padding={5}>
    {#if show}
      <div transition:transition|local={options}>
        <Box fill="layer-01" padding={5}>Content</Box>
      </div>
    {/if}
  </Box>
</Stack>

### Parameters

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `duration` | `fast02` for `fade`, `moderate02` for the others | Milliseconds, or a token name such as `"slow01"` |
| `mode` | `"productive"` | `"productive"` or `"expressive"` |
| `easing` | By direction | A curve name, or a `(t) => progress` function |
| `delay` | `0` | Milliseconds before starting |
| `reducedMotion` | `"respect"` | `"ignore"` plays the motion under the reduced-motion setting |
| `axis` (`slide`) | `"y"` | `"x"` slides the width instead of the height |
| `x`, `y` (`fly`) | `0` | Offset to move in from, as a number of pixels or a CSS length |
| `opacity` (`fly`) | `0` | Opacity to start from |
| `collapse` (`fly`) | `false` | Also shrink the height, so siblings close the gap |

`fly` offsets are physical. `x: 32` moves in from the right in both left-to-right and right-to-left layouts, as Svelte's does.

### Direction

`in:` uses the `entrance` curve and `out:` the `exit` curve. A `transition:` runs both ways and uses `standard`, on Svelte 3, 4, and 5 alike: Svelte 3 and 4 report the direction as `"both"` on every run, and fail on a transition that decides its curve later.

| Do | Why |
| :--- | :--- |
| Use `in:` and `out:` with the same parameters when the entrance and the exit should differ. | It is the only way to get both curves on Svelte 3 and 4. |
| Prefer `slide` for content that pushes the layout and `fly` for content that arrives from an edge. | `slide` animates the box, so what follows moves with it. `fly` leaves the layout alone unless you set `collapse`. |
| Add the `global` modifier (`transition:fly|global`) when a parent's `{#if}` removes the element. | In Svelte 4 and 5 a transition plays only when its own block changes. Svelte 3 ignores the modifier, because every transition there is global. |

### Content security policy

Svelte 3 and 4 run a transition by injecting a `<style>` rule with keyframes. A policy with a strict `style-src` blocks it, and the transition snaps. Svelte 5 uses the Web Animations API and is not affected.

## Reduced motion

Under `prefers-reduced-motion: reduce`, the transitions run in zero time. They skip the animation altogether instead of fading in place, so nothing moves and the element still mounts and unmounts on schedule, and `introend` and `outroend` still fire.

| Export | Use |
| :--- | :--- |
| `shouldReduceMotion()` | Read the setting once, for code that animates by hand. Returns `false` on the server. |
| `prefersReducedMotion` | A store of the setting that updates when it changes. Reads `false` on the server. |

Set `reducedMotion: "ignore"` only on motion that people need to understand the interface, such as a drag preview that shows where an item will land. A fade counts as motion here, because the setting is the user's own request to the operating system.

## Server rendering

The transitions run only in the browser, so server and client render the same markup and hydration matches. `shouldReduceMotion()` and `prefersReducedMotion` read `false` on the server and never touch `window`.
