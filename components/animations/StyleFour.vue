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
  padding: 0 0.1em;
  min-width: 1ch;
  /* Aplicamos la animación a cada letra */
  animation-duration: 3s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;
}

/* --- Animaciones separadas para cada letra --- */
@keyframes jumble-1 {
  50% { transform: translate(-5px, -10px) rotate(-15deg); }
}
@keyframes jumble-2 {
  50% { transform: translate(5px, 10px) rotate(8deg); }
}
@keyframes jumble-3 {
  50% { transform: translate(-3px, -8px) rotate(-10deg); }
}
@keyframes jumble-4 {
  50% { transform: translate(8px, 5px) rotate(12deg); }
}
@keyframes jumble-5 {
  50% { transform: translate(-6px, 12px) rotate(-5deg); }
}
/* ... puedes añadir más si lo necesitas */

/* --- Asignamos cada animación a su letra correspondiente --- */
.char:nth-child(1) { animation-name: jumble-1; }
.char:nth-child(2) { animation-name: jumble-2; animation-delay: 0.1s; }
.char:child(3) { animation-name: jumble-3; animation-delay: 0.2s; }
.char:nth-child(4) { animation-name: jumble-4; animation-delay: 0.3s; }
.char:nth-child(5) { animation-name: jumble-5; animation-delay: 0.4s; }
</style>