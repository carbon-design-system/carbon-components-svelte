const assert = require("assert");
const { preprocess } = require("svelte/compiler");
const { optimizeCarbonImports } = require("../../preprocess");

const fixtures = [
  {
    name: "Single base import",
    input: `
      <script>
        import { Accordion } from "carbon-components-svelte";
      </script>`,
    output: `
      <script>
        import Accordion from "carbon-components-svelte/src/Accordion/Accordion.svelte";
      </script>`,
  },
  {
    name: "Single base import with markup, styles",
    input: `
      <script>
        import { Accordion } from "carbon-components-svelte";
      </script>
      
      <Accordion />
      
      <style>:global(*) {}</style>`,
    output: `
      <script>
        import Accordion from "carbon-components-svelte/src/Accordion/Accordion.svelte";
      </script>
      
      <Accordion />
      
      <style>:global(*) {}</style>`,
  },
  {
    name: "Single, aliased base import",
    input: `
      <script>
        import { Accordion as A } from "carbon-components-svelte";
      </script>`,
    output: `
      <script>
        import A from "carbon-components-svelte/src/Accordion/Accordion.svelte";
      </script>`,
  },
  {
    name: "Multiple base imports",
    input: `
      <script>
        import { Accordion, AccordionItem } from "carbon-components-svelte";
      </script>`,
    output: `
      <script>
        import Accordion from "carbon-components-svelte/src/Accordion/Accordion.svelte";
import AccordionItem from "carbon-components-svelte/src/Accordion/AccordionItem.svelte";
      </script>`,
  },
  {
    name: "Multiple imports from component folder",
    input: `
      <script>
        import { Accordion, AccordionItem } from "carbon-components-svelte/src/Accordion";
      </script>`,
    output: `
      <script>
        import { Accordion, AccordionItem } from "carbon-components-svelte/src/Accordion";
      </script>`,
  },
  {
    name: "Direct import from component source",
    input: `
      <script>
        import AccordionItem from "carbon-components-svelte/src/Accordion/AccordionItem.svelte";
      </script>`,
    output: `
      <script>
        import AccordionItem from "carbon-components-svelte/src/Accordion/AccordionItem.svelte";
      </script>`,
  },
  {
    name: "Carbon icons",
    input: `
      <script>
        import { Add16 as Add } from "carbon-icons-svelte";
        import { Add20, Add24 } from "carbon-icons-svelte";
        import ArrowRight20 from "carbon-icons-svelte/lib/ArrowRight20";
      </script>`,
    output: `
      <script>
        import Add from "carbon-icons-svelte/lib/Add16/Add16.svelte";
        import Add20 from "carbon-icons-svelte/lib/Add20/Add20.svelte";
import Add24 from "carbon-icons-svelte/lib/Add24/Add24.svelte";
        import ArrowRight20 from "carbon-icons-svelte/lib/ArrowRight20";
      </script>`,
  },
  {
    name: "Carbon pictograms",
    input: `
      <script>
        import { Airplane as Aeroplane } from "carbon-pictograms-svelte";
        import { ActiveServer, Advocate } from "carbon-pictograms-svelte";
        import Agriculture from "carbon-pictograms-svelte/lib/Agriculture";
      </script>`,
    output: `
      <script>
        import Aeroplane from "carbon-pictograms-svelte/lib/Airplane/Airplane.svelte";
        import ActiveServer from "carbon-pictograms-svelte/lib/ActiveServer/ActiveServer.svelte";
import Advocate from "carbon-pictograms-svelte/lib/Advocate/Advocate.svelte";
        import Agriculture from "carbon-pictograms-svelte/lib/Agriculture";
      </script>`,
  },
  {
    name: "Integration",
    input: `
      <script>
        import { Button, Header } from "carbon-components-svelte";
        import { Notification20 } from "carbon-icons-svelte";
        import { Airplane } from "carbon-pictograms-svelte";
      </script>`,
    output: `
      <script>
        import Button from "carbon-components-svelte/src/Button/Button.svelte";
import Header from "carbon-components-svelte/src/UIShell/GlobalHeader/Header.svelte";
        import Notification20 from "carbon-icons-svelte/lib/Notification20/Notification20.svelte";
        import Airplane from "carbon-pictograms-svelte/lib/Airplane/Airplane.svelte";
      </script>
    `,
  },
];

(async () => {
  for (const { name, input, output } of fixtures) {
    console.log("[optimizeCarbonImports]", name);

    const result = await preprocess(input.trim(), [optimizeCarbonImports()]);
    assert.strictEqual(result.toString(), output.trim());
  }
})();
