<script lang="ts">
  import { Pagination, PaginationSkeleton } from "../types";
</script>

<Pagination
  totalItems="{102}"
  pageSizes="{[10, 15, 20]}"
  on:change="{(e) => {
    console.log(e.detail); // { pageSize?: number, page?: number }
  }}"
  on:update="{(e) => {
    console.log(e.detail); // { pageSize: number; page: number; }
  }}"
/>

<Pagination totalItems="{102}" page="{4}" />

<Pagination totalItems="{102}" pageSizes="{[16, 36, 99]}" pageSize="{36}" />

<Pagination totalItems="{102}" pageInputDisabled />

<Pagination totalItems="{102}" pageSizeInputDisabled />

<PaginationSkeleton />
