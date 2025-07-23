<template>
  <h1 class="word">{{ title }}</h1>
</template>
<script setup>
defineProps({ title: String });
</script>


<style lang="scss" scoped>
.word {
  color: #fff;
  -webkit-text-stroke: 2px #fff;
  /* La animación es un pulso infinito */
  animation: pulse-stroke 3s infinite alternate;
}

@keyframes pulse-stroke {
  from {
    color: transparent;
    -webkit-text-stroke: 2px #fff;
    transform: scale(1);
  }
  to {
    color: #fff;
    -webkit-text-stroke: 2px transparent;
    transform: scale(1.05);
  }
}
</style>