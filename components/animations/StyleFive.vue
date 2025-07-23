<template>
  <h1 class="word" :data-text="title">{{ title }}</h1>
</template>

<script setup>
defineProps({ title: String });
</script>

<style lang="scss" scoped>
.word {
  position: relative;
  text-transform: uppercase;
}
.word::before,
.word::after {
  content: attr(data-text);
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: #121212;
  overflow: hidden;
}
.word::before {
  left: 2px;
  text-shadow: -2px 0 red;
  animation: glitch-anim 2s infinite linear alternate-reverse;
}
.word::after {
  left: -2px;
  text-shadow: -2px 0 blue;
  animation: glitch-anim 3s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% { clip-path: inset(45% 0 56% 0); }
  20% { clip-path: inset(5% 0 30% 0); }
  40% { clip-path: inset(80% 0 3% 0); }
  60% { clip-path: inset(40% 0 45% 0); }
  80% { clip-path: inset(15% 0 75% 0); }
  100% { clip-path: inset(60% 0 35% 0); }
}
</style>