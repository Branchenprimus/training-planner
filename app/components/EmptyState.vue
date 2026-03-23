<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="section-card card">
    <h3 class="section-title">{{ title }}</h3>
    <p class="section-subtitle">{{ description }}</p>
  </section>
</template>
