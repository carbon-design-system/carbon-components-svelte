<script>
  import {
    Column,
    Grid,
    Heading,
    LayoutInspector,
    Row,
    Stack,
    Text,
  } from "carbon-components-svelte";
</script>

<Grid padding>
  <Row>
    <Column>
      <Stack gap={5}>
        <Heading type="productive-heading-04">Hover this heading</Heading>
        <Text type="body-long-01">
          Hover this paragraph. The card names the Carbon type token that
          matches its size, line height, weight, letter spacing, and family.
        </Text>
        <Text type="label-01"
          >label-01 and caption-01 share every value, so both match</Text
        >
        <p style="font-size: 15px; line-height: 22px;">
          Hand-set 15/22 text matches no token, so the card says so.
        </p>
        <Text type="code-02">code-02 uses the mono family</Text>
      </Stack>
    </Column>
  </Row>
</Grid>

<LayoutInspector open />
