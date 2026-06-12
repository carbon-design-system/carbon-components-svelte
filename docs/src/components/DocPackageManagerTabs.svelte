<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
  import type { InstallCmds } from "../quick-start-snippets";
  import { packageManagerIndex } from "../store";
  import CodeBlock from "./CodeBlock.svelte";
  import DocCodeBox from "./DocCodeBox.svelte";

  export let cmds: InstallCmds;
</script>

<Tabs
  type="container"
  autoWidth
  selected={$packageManagerIndex}
  on:change={(e) => packageManagerIndex.set(e.detail)}
>
  <Tab label="npm" />
  <Tab label="pnpm" />
  <Tab label="Yarn" />
  <Tab label="Bun" />
  <svelte:fragment slot="content">
    <TabContent>
      <DocCodeBox>
        <CodeBlock type="single" language="bash" code={cmds.npm} />
      </DocCodeBox>
    </TabContent>
    <TabContent>
      <DocCodeBox>
        <CodeBlock type="single" language="bash" code={cmds.pnpm} />
      </DocCodeBox>
    </TabContent>
    <TabContent>
      <DocCodeBox>
        <CodeBlock type="single" language="bash" code={cmds.yarn} />
      </DocCodeBox>
    </TabContent>
    <TabContent>
      <DocCodeBox>
        <CodeBlock type="single" language="bash" code={cmds.bun} />
      </DocCodeBox>
    </TabContent>
  </svelte:fragment>
</Tabs>
