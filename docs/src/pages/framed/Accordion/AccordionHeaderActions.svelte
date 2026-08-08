<script>
  import {
    Accordion,
    AccordionItem,
    OverflowMenu,
    OverflowMenuItem,
    Tag,
  } from "carbon-components-svelte";

  let lastAction = "None";
</script>

<p>Last action: {lastAction}</p>

<Accordion>
  <AccordionItem title="Natural Language Classifier">
    <Tag slot="extra" type="red">3 errors</Tag>
    <p>
      Natural Language Classifier uses advanced natural language processing and
      machine learning techniques to create custom classification models. Users
      train their data and the service predicts the appropriate category for the
      inputted text.
    </p>
  </AccordionItem>
  <AccordionItem title="Natural Language Understanding">
    <OverflowMenu slot="extra" flipped>
      <OverflowMenuItem
        text="Restart service"
        on:click={() => {
          lastAction = "Restart Natural Language Understanding";
        }}
      />
      <OverflowMenuItem
        danger
        text="Delete service"
        on:click={() => {
          lastAction = "Delete Natural Language Understanding";
        }}
      />
    </OverflowMenu>
    <p>
      Analyze text to extract meta-data from content such as concepts, entities,
      emotion, relations, sentiment and more.
    </p>
  </AccordionItem>
  <AccordionItem title="Language Translator">
    <p>
      Translate text, documents, and websites from one language to another.
      Create industry or region-specific translations via the service's
      customization capability.
    </p>
  </AccordionItem>
</Accordion>
