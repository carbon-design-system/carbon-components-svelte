---
components: ["StarRating"]
description: Star ratings let people rate something from one to five stars, or show an average rating, with each star announced as a choice.
---

<script>
  import { StarRating } from "carbon-components-svelte";
</script>

## Basic

Each star is a radio button, so arrow keys move the rating and screen readers announce each choice. Hovering a star previews that rating.

<StarRating legendText="Overall rating" />

## Text beside the stars

`value` is `0` until a star is chosen. Content in the default slot sits beside the stars, and its `value` slot prop previews a hovered star.

<StarRating legendText="Overall rating" let:value>
  {["Poor", "Fair", "Good", "Very good", "Excellent"][value - 1] ?? "Not rated"}
</StarRating>

## Allow deselect

Set `allowDeselect` so clicking the current rating clears it.

<StarRating legendText="Your rating" value={4} allowDeselect />

## Custom value text

`valueText` names each choice for screen readers. Set `max` for a different number of stars.

<StarRating
  legendText="Difficulty"
  max={3}
  valueText={(value) => ["Easy", "Moderate", "Hard"][value - 1]}
/>

## Read-only

Set `readonly` to show a rating, such as an average, instead of asking for one. It renders as one image that screen readers announce with the legend and the value ("Average rating, 4.5 out of 5 stars"), so unlike `readonly` on other fields it isn't focusable or submitted with a form. Partial stars fill to the value.

<StarRating readonly value={4.5} legendText="Average rating">
  4.5 (212 reviews)
</StarRating>

## Sizes

Stars are 24px by default. Set `size` to `"sm"` (16px) or `"lg"` (32px).

<StarRating readonly size="sm" value={3.7} legendText="Small" />

<StarRating size="lg" legendText="Large" />

## Helper text

Use `helperText` to add guidance below the stars.

<StarRating legendText="Overall rating" helperText="Rate the product, not the delivery" />

## States

Reflect validation and interaction states.

### Invalid

<StarRating legendText="Overall rating" invalid invalidText="Choose a rating" />

### Warning

<StarRating legendText="Overall rating" value={1} warn warnText="A one-star review asks for a comment" />

### Disabled

Set `disabled` to `true` to prevent interaction.

<StarRating legendText="Overall rating" value={3} disabled />
