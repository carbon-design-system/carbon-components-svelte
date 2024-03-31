<script lang="ts">
  import { Accordion, AccordionItem, AccordionSkeleton } from "../types";
</script>

<Accordion size="lg" flush align="end">
  <AccordionItem disabled title="Natural Language Classifier">
    <p>
      Natural Language Classifier uses advanced natural language processing and
      machine learning techniques to create custom classification models. Users
      train their data and the service predicts the appropriate category for the
      inputted text.
    </p>
  </AccordionItem>
  <AccordionItem title="Natural Language Understanding">
    <svelte:fragment slot="title">
      <h6>Natural Language Understanding</h6>
      <div>AI / Machine Learning</div>
    </svelte:fragment>
  </AccordionItem>
  <AccordionItem title="Language Translator">
    <p>
      Translate text, documents, and websites from one language to another.
      Create industry or region-specific translations via the service's
      customization capability.
    </p>
  </AccordionItem>
</Accordion>



<AccordionSkeleton align="start" count="{3}" open size="lg"/>
