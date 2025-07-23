<template>
  <h1 class="word-container">
    <span v-for="(word, wordIndex) in title.split(' ')" :key="wordIndex" class="word">
      <span v-for="(char, charIndex) in word.split('')" :key="charIndex" class="char">{{ char }}</span>
    </span>
  </h1>
</template>

<script setup>
defineProps({ title: String });
</script>

<style lang="scss" scoped>
.word-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5em;
}
.word {
  display: inline-flex;
}
.char {
  position: relative;
  top: 0;
  /* La animación ahora es infinita y alterna la dirección */
  animation: bounce 2s infinite ease-in-out;
}
/* Añadimos un pequeño retraso a cada letra para un efecto más orgánico */
.char:nth-child(2) { animation-delay: 0.1s; }
.char:nth-child(3) { animation-delay: 0.2s; }
.char:nth-child(4) { animation-delay: 0.3s; }
.char:nth-child(5) { animation-delay: 0.4s; }
.char:nth-child(6) { animation-delay: 0.5s; }
.char:nth-child(7) { animation-delay: 0.6s; }
.char:nth-child(8) { animation-delay: 0.7s; }

@keyframes bounce {
  0%, 100% { top: 0; }
  50% { top: -20px; }
}
</style>