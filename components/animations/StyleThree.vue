<template>
  <h1 class="word">{{ title }}</h1>
</template>

<script setup>
defineProps({ title: String });
</script>

<style lang="scss" scoped>
.word {
  /* La animación alterna entre los dos estados infinitamente */
  animation: expand-spacing 3s infinite alternate ease-in-out;
}

@keyframes expand-spacing {
  from { letter-spacing: 0.5rem; transform: scale(1); }
  to { letter-spacing: 1.5rem; transform: scale(1.1); }
}
</style>