<script lang="ts">
  import { Heading, Section } from "carbon-components-svelte";
</script>

<Section>
  <Heading>Default Heading 1</Heading>
</Section>

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
            <Section>
              <Heading>Nested Capped at Heading 6</Heading>
            </Section>
          </Section>
        </Section>
      </Section>
    </Section>
  </Section>
  <Section>
    <Heading>Sibling Heading 2</Heading>
  </Section>
</Section>

<!-- Custom level: should start at specified level -->
<Section level={5}>
  <Heading>Custom Level Heading 5</Heading>
  <Section>
    <Heading>Custom Level Heading 6</Heading>
    <Section>
      <Heading>Custom Level Capped at Heading 6</Heading>
    </Section>
  </Section>
</Section>

<!-- Custom tag: Section should render as specified tag -->
<div data-testid="custom-tag-wrapper">
  <Section tag="div">
    <Heading>Custom Tag Heading 1</Heading>
  </Section>
</div>

<!-- Heading without Section: should default to h1 -->
<Heading>Heading without Section</Heading>

