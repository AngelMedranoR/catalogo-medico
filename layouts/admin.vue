<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="header-top">
        <h2 class="brand">Admin Gaventex</h2>
        <button @click="handleLogout" class="logout-button">Cerrar Sesión</button>
      </div>
      <nav class="admin-nav">
        <NuxtLink to="/admin">Dashboard</NuxtLink>
        <NuxtLink to="/admin/productos">Productos</NuxtLink>
        <NuxtLink to="/admin/categorias">Categorías</NuxtLink>
        <NuxtLink to="/admin/hero">Hero Slider</NuxtLink>
        <NuxtLink to="/admin/ordenes">Órdenes</NuxtLink>
      </nav>
    </header>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const router = useRouter();

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
</script>

<style scoped>
.admin-layout {
  background-color: #121212;
  color: #e0e0e0;
}

.admin-header {
  background-color: #1e1e1e;
  padding-top: 1rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #333;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem 0.5rem;
}

.brand {
  margin: 0;
  font-size: 1.2rem;
}

.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
}

.admin-nav {
  display: flex;
  gap: 1rem;
  padding: 0 1.5rem 0.5rem;
  /* Habilitamos el scroll horizontal en móvil */
  overflow-x: auto;
  /* Ocultamos la barra de scroll para una apariencia más limpia */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.admin-nav::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.admin-nav a {
  color: #e0e0e0;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.2s;
  white-space: nowrap; /* Evita que el texto del enlace se parta */
  flex-shrink: 0; /* Evita que los enlaces se encojan */
  border-bottom: 3px solid transparent;
}

.admin-nav a.router-link-exact-active {
  color: #fff;
  background-color: #333;
  border-bottom-color: #007bff;
}

.main-content {
  padding: 2rem;
}

/* En pantallas más grandes, podemos centrar la navegación si cabe */
@media (min-width: 992px) {
  .admin-nav {
    justify-content: flex-start; /* o center si prefieres */
  }
  .main-content {
    padding: 2.5rem;
  }
}
</style>