<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
  import type { InstallCmds } from "../quick-start-snippets";
  import {
    PACKAGE_MANAGERS,
    packageManagerIndex,
    packageManagerTabLabel,
  } from "../store";
  import CodeBlock from "./CodeBlock.svelte";
  import DocCodeBox from "./DocCodeBox.svelte";

  export let cmds: InstallCmds;
</script>

<Tabs
  autoWidth
  selected={$packageManagerIndex}
  on:change={(e) => packageManagerIndex.set(e.detail)}
>
  {#each PACKAGE_MANAGERS as pm (pm)}
    <Tab label={packageManagerTabLabel(pm)} />
  {/each}
  <svelte:fragment slot="content">
    {#each PACKAGE_MANAGERS as pm (pm)}
      <TabContent style="padding-left: 0; padding-right: 0;">
        <DocCodeBox>
          <CodeBlock type="single" language="bash" code={cmds[pm]} />
        </DocCodeBox>
      </TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
