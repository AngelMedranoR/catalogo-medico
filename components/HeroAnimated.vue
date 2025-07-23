<template>
  <div class="hero-container">
    <div class="concept">
      <h1 class="word">
        <span v-for="(char, index) in 'GAVENTEX'.split('')" :key="index" class="char">
          {{ char }}
        </span>
      </h1>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Importa las fuentes de Google necesarias */
@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Montserrat:wght@900&display=swap');

.hero-container {
  font-family: "Comfortaa", sans-serif;
  height: 70vh; /* Ajustamos la altura para que no ocupe toda la pantalla */
  background: #000;
  overflow: hidden;
  position: relative;
}

.hover,
.word,
h1 {
  cursor: pointer;
}

h1 {
  position: relative;
  color: #fff;
  font-family: "Montserrat", sans-serif;
  font-weight: 900;
  font-size: 60px;
  text-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.concept {
  position: relative;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* CAMBIA ESTA IMAGEN DE FONDO POR UNA PROPIA */
  background: url("https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070") center center / cover;

  &:before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: radial-gradient(rgba(0, 0, 0, 0.3), transparent);
    opacity: 0;
    transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
  }
  
  &:hover:before {
    opacity: 0.5;
  }
}

// Estilos específicos para la animación del texto (Concept Five)
.word {
  max-width: 800px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    .char:nth-child(even) {
      top: -20px;
    }
    .char:nth-child(odd) {
      top: 20px;
    }
  }
}

.char {
  flex: 0; // Para que las letras no ocupen todo el espacio
  padding: 0 0.1em;
  position: relative;
  display: inline-block;
  top: 0;
  transition: 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}
</style>