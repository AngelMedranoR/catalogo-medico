<template>
  <div>
    <header class="navbar">
      <div class="container navbar-content">
        <NuxtLink to="/" class="brand">Gaventex</NuxtLink>

        <nav class="main-nav">
          <NuxtLink to="/">Inicio</NuxtLink>
          <NuxtLink to="/productos">Productos</NuxtLink>
        </nav>

        <NuxtLink to="/carrito" class="cart-button">
          <span class="cart-icon">🛒</span>
          <span class="cart-text">Carrito ({{ cart.totalItems }})</span>
        </NuxtLink>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { useCartStore } from '~/stores/cart';
const cart = useCartStore();
</script>

<style scoped>
.navbar {
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: 1px solid #333;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.brand {
  font-size: 1.4rem;
  font-weight: bold;
  color: #fff;
  text-decoration: none;
}
.main-nav {
  display: flex;
  gap: 0.5rem;
  /* El truco para el scroll horizontal en móvil */
  overflow-x: auto;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.main-nav::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
.main-nav a {
  color: #e0e0e0;
  text-decoration: none;
  padding: 0.5rem 0.8rem;
  border-radius: 5px;
  white-space: nowrap; /* Evita que el texto se parta en dos líneas */
  flex-shrink: 0; /* Evita que los enlaces se encojan */
  transition: all 0.2s;
}
.main-nav a.router-link-exact-active {
  color: #fff;
  background-color: #007bff;
}
.cart-button {
  color: #fff;
  text-decoration: none;
  background-color: #020a1315;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* --- Estilos para Móvil --- */
@media (max-width: 767px) {
  .main-nav {
    /* El scroll ya está activado por defecto, aquí podemos ajustar detalles */
    gap: 0.25rem; /* Reducimos el espacio entre enlaces */
  }
  .cart-text {
    /* Ocultamos el texto del botón del carrito para ahorrar espacio */
    display: none;
  }
  .cart-button {
    padding: 0.5rem; /* Hacemos el botón más compacto */
  }
}

/* En pantallas grandes, la navegación ocupa el espacio central */
@media (min-width: 768px) {
  .main-nav {
    flex: 1;
    justify-content: center;
    overflow-x: hidden; /* Desactivamos el scroll en escritorio */
    gap: 1.5rem;
  }
}
</style>