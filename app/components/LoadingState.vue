<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="section-card card">
    <p class="section-title">{{ t('loading.title') }}</p>
    <p class="section-subtitle">{{ t('loading.description') }}</p>
  </section>
</template>
