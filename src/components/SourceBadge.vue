<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-ink2 leading-none"
  >
    <span class="inline-block size-1.5 rounded-full bg-sage"></span>
    {{ name }}
  </span>
</template>
