// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['../assets/css/main.css'],
  compatibilityDate: '2025-07-15',
    modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase' // <-- Añade esta línea
  ],
  devtools: { enabled: true },
    supabase: {
    //     redirectOptions: {
    //   login: '/auth/login',
    //   callback: '/confirm', // Ruta a la que vuelve Supabase tras el login (por defecto es /confirm)
    //   exclude: ['/', '/biblioteca/*'],      // Excluye la página de inicio y la biblioteca para que no requieran login
    // },
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    clientOptions: {
      auth: {
        // Habilita la persistencia de la sesión en el almacenamiento del navegador.
        // El módulo de Nuxt se encarga de que esto funcione con cookies para el SSR.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24,
      sameSite: 'lax', // o 'none' si usas HTTPS y dominios cruzados
      secure: process.env.NODE_ENV === 'production'
    },
  },
    app: {
    head: {
      title: 'Catálogo Gaventex',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { href: 'https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Lato:wght@400;700&family=Roboto:wght@400;500;700&display=swap', rel: 'stylesheet' }
      ],
      meta: [
        { name: 'description', content: 'Explora nuestra colección de productos.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { property: 'og:image', content: 'https://gaventexve.netlify.app/FotoInicio.png'}
      ],
      htmlAttrs: {
        lang: 'es'
      }
    }
  }
})
