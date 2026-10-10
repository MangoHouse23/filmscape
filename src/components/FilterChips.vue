<script setup lang="ts">
defineProps<{
  options: string[]
  modelValue: string
  allLabel?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
    <button
      class="shrink-0 rounded-full border px-4 py-1.5 text-sm transition-all duration-200"
      :class="
        modelValue === ''
          ? 'border-brand bg-brand text-paper shadow-soft'
          : 'border-line text-ink2 hover:border-brand/50 hover:text-brand'
      "
      @click="emit('update:modelValue', '')"
    >
      {{ allLabel ?? '全部' }}
    </button>
    <button
      v-for="opt in options"
      :key="opt"
      class="shrink-0 rounded-full border px-4 py-1.5 text-sm transition-all duration-200"
      :class="
        modelValue === opt
          ? 'border-brand bg-brand text-paper shadow-soft'
          : 'border-line text-ink2 hover:border-brand/50 hover:text-brand'
      "
      @click="emit('update:modelValue', opt)"
    >
      {{ opt }}
    </button>
  </div>
</template>
