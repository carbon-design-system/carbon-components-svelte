<script>
  import {
    Column,
    Grid,
    Heading,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
  import { LayoutInspector } from "carbon-components-svelte/devtools";
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={5}>
        <Heading type="heading-04">Hover this heading</Heading>
        <Text type="body-01">
          Hover this paragraph. The card names the Carbon type token that
          matches its size, line height, weight, letter spacing, and family.
        </Text>
        <Text type="label-01"
          >label-01, legal-01, and helper-text-01 share every value, so all
          match</Text
        >
        <p class="hand-set">
          Hand-set 15/22 text matches no token, so the card says so.
        </p>
        <Text type="code-02">code-02 uses the mono family</Text>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open />

<style>
  /* Off the type scale on purpose. */
  .hand-set {
    font-size: 15px;
    line-height: 22px;
  }
</style>
