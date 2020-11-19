<script lang="ts">
  import { Icon } from "../types";
  import Add16 from "carbon-icons-svelte/lib/Add16";
  import Add20 from "carbon-icons-svelte/lib/Add20";
  import Add24 from "carbon-icons-svelte/lib/Add24";
  import Add32 from "carbon-icons-svelte/lib/Add32";
</script>

<Icon render="{Add16}" />

<Icon render="{Add20}" />

<Icon render="{Add24}" />

<Icon render="{Add32}" />

<Icon skeleton render="{Add16}" />

<Icon skeleton size="{20}" render="{Add20}" />

<Icon skeleton size="{24}" render="{Add24}" />

<Icon skeleton size="{32}" render="{Add32}" />
