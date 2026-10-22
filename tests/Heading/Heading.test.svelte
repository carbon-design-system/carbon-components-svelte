<script lang="ts">
  import Heading from "carbon-components-svelte/Heading/Heading.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";

  // Out of range on purpose: `level` is typed 1-6 but capped at runtime.
  const overflowLevel = 7 as unknown as 6;
</script>

<Section>
  <Heading>Nested Heading 1</Heading>
  <Section>
    <Heading>Nested Heading 2</Heading>
    <Section>
      <Heading>Nested Heading 3</Heading>
      <Section>
        <Heading>Nested Heading 4</Heading>
        <Section>
          <Heading>Nested Heading 5</Heading>
          <Section>
            <Heading>Nested Heading 6</Heading>
            <Section> <Heading>Nested Capped at Heading 6</Heading> </Section>
          </Section>
        </Section>
      </Section>
    </Section>
  </Section>
  <Section> <Heading>Sibling Heading 2</Heading> </Section>
</Section>

<Section level={5}>
  <Heading>Custom Level Heading 5</Heading>
</Section>

<Section>
  <Heading>Reset Outer Heading 1</Heading>
  <Section level={1}> <Heading>Reset Heading 1</Heading> </Section>
</Section>

<Section level={overflowLevel}>
  <Heading>Overflow Level Heading 6</Heading>
</Section>

<Section class="labelled-section" aria-labelledby="labelled-section-heading">
  <Heading id="labelled-section-heading">Labelled Section Heading 1</Heading>
</Section>

<Section level={2}>
  <Heading type="heading-03">Sized heading</Heading>
</Section>

<Heading type="heading-03" class="custom-heading"
  >Typed classed heading</Heading
>

<div data-testid="custom-tag-wrapper">
  <Section tag="div"> <Heading>Custom Tag Heading 1</Heading> </Section>
</div>

<Heading>Heading without Section</Heading>
