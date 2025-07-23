<template>
  <div class="title-container">
    <span>{{ textBefore }}</span>
    
    <div class="flip-wrapper" :style="{ '--word-height': wordHeight + 'px' }">
      <div 
        class="flip-content"
        :style="{ transform: `translateY(-${currentIndex * wordHeight}px)` }"
      >
        <div 
          v-for="word in words"
          :key="word.text"
          class="word"
          :style="{ color: word.color }"
        >
          {{ word.text }}
        </div>
      </div>
    </div>

    <span>{{ textAfter }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  textBefore: { type: String, default: 'Todos' },
  textAfter: { type: String, default: 'Productos' },
  words: {
    type: Array,
    default: () => [
      { text: 'Nuestros', color: '#007bff' },
      { text: 'Tus', color: '#42c58a' },
      { text: 'Los', color: '#DC143C' },
    ]
  }
});

const currentIndex = ref(0);
const wordHeight = ref(65); // Altura de cada palabra en píxeles (para escritorio)
let intervalId = null;

onMounted(() => {
  // En móvil, las palabras son más pequeñas, así que ajustamos la altura
  if (window.innerWidth < 768) {
    wordHeight.value = 50;
  }

  intervalId = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.words.length;
  }, 2500); // Cambia de palabra cada 2.5 segundos
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Roboto:700');

.title-container {
  color: #e0e0e0;
  text-transform: uppercase;
  font-size: 2.5rem;
  font-weight: bold;
  font-family: 'Roboto', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
  text-align: center;
  flex-wrap: wrap;
}

.flip-wrapper {
  /* La "ventana" a través de la cual vemos una palabra */
  height: var(--word-height);
  overflow: hidden;
}

.flip-content {
  /* Este es el contenedor que se mueve. La transición lo hace suave */
  transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.word {
  /* Cada palabra tiene la misma altura que la ventana */
  height: var(--word-height);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
}

/* --- ESTILOS RESPONSIVE PARA MÓVIL --- */
@media (max-width: 767px) {
  .title-container {
    font-size: 1.8rem;
    gap: 0.3em;
  }

  .flip-wrapper {
    /* background-color: #f7f7f7f8; */
    border-color: aliceblue;
    border-radius: 8px;
    border: #e0e0e0 solid;
    /* height: 6vh;  */
    width: 40%;
    padding: 1px 12px;
  }

}
</style>