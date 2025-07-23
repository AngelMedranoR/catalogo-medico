export default defineNuxtRouteMiddleware((to, from) => {
  // Primero, verificamos si la ruta a la que se intenta acceder es una del panel de admin.
  if (to.path.startsWith('/admin')) {
    const user = useSupabaseUser();

    // Si es una ruta de admin y NO hay un usuario logueado, lo redirigimos a /login.
    if (!user.value) {
      return navigateTo('/login');
    }
  }

  // Si no es una ruta que empiece con /admin, no hacemos nada y permitimos el acceso.
  // Esto deja públicas las páginas como Inicio, Productos, Carrito, etc.
});