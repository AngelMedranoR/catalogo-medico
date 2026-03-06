<template>
  <div class="admin-layout">
    <!-- Overlay for mobile sidebar -->
    <div v-if="isSidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- Sidebar -->
    <aside :class="['admin-sidebar', { 'is-open': isSidebarOpen }]">
      <div class="sidebar-header">
        <h2 class="brand">Gaventex Admin</h2>
        <button class="close-sidebar-btn" @click="toggleSidebar">
          <XIcon class="icon" />
        </button>
      </div>

      <nav class="admin-nav">
        <NuxtLink to="/admin" @click="closeSidebarOnMobile">
          <LayoutDashboardIcon class="nav-icon" /> Dashboard
        </NuxtLink>
        <NuxtLink to="/admin/productos" @click="closeSidebarOnMobile">
          <PackageIcon class="nav-icon" /> Productos
        </NuxtLink>
        <NuxtLink to="/admin/categorias" @click="closeSidebarOnMobile">
          <TagsIcon class="nav-icon" /> Categorías
        </NuxtLink>
        <NuxtLink to="/admin/hero" @click="closeSidebarOnMobile">
          <ImageIcon class="nav-icon" /> Pantalla Inicial
        </NuxtLink>
        <NuxtLink to="/admin/ordenes" @click="closeSidebarOnMobile">
          <ShoppingCartIcon class="nav-icon" /> Órdenes
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <button @click="toggleTheme" class="theme-toggle-btn">
          <MoonIcon v-if="theme === 'light'" class="nav-icon" />
          <SunIcon v-else class="nav-icon" />
          {{ theme === 'light' ? 'Tema Oscuro' : 'Tema Claro' }}
        </button>
        <button @click="handleLogout" class="logout-button">
          <LogOutIcon class="nav-icon" /> Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <header class="mobile-header">
        <button class="open-sidebar-btn" @click="toggleSidebar">
          <MenuIcon class="icon" />
        </button>
        <h2 class="mobile-brand">Gaventex</h2>
        <button @click="toggleTheme" class="theme-toggle-btn-mobile">
          <MoonIcon v-if="theme === 'light'" class="icon-small" />
          <SunIcon v-else class="icon-small" />
        </button>
      </header>

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { 
  LayoutDashboardIcon, 
  PackageIcon, 
  TagsIcon, 
  ImageIcon, 
  ShoppingCartIcon, 
  LogOutIcon,
  MenuIcon,
  XIcon,
  MoonIcon,
  SunIcon
} from 'lucide-vue-next';

const supabase = useSupabaseClient();
const router = useRouter();

const isSidebarOpen = ref(false);
const theme = ref('light');

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 992) {
    isSidebarOpen.value = false;
  }
};

const handleResize = () => {
  if (window.innerWidth >= 992) {
    isSidebarOpen.value = true;
  } else {
    isSidebarOpen.value = false;
  }
};

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  localStorage.setItem('admin-theme', theme.value);
  applyThemeBody();
};

const applyThemeBody = () => {
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
};

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
  
  const savedTheme = localStorage.getItem('admin-theme');
  if (savedTheme) {
    theme.value = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = 'dark';
  }
  applyThemeBody();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
</script>

<style>
/* --- Global Theme Variables --- */
:root {
  --bg-main: #f1f3f5;
  --bg-card: #ffffff;
  --bg-sidebar: #ffffff;
  --text-primary: #2c3e50;
  --text-secondary: #6c757d;
  --text-body: #333333;
  --border-color: #e9ecef;
  --border-sidebar: #e9ecef;
  --bg-hover: #f8f9fa;
  --shadow-color: rgba(0,0,0,0.03);
  --btn-danger-bg: #fff1f2;
  --btn-danger-text: #e11d48;
  --btn-danger-border: #ffe4e6;
}

:root.dark-theme {
  --bg-main: #121212;
  --bg-card: #1e1e1e;
  --bg-sidebar: #1e1e1e;
  --text-primary: #e0e0e0;
  --text-secondary: #9ca3af;
  --text-body: #d1d5db;
  --border-color: #333333;
  --border-sidebar: #333333;
  --bg-hover: #2d2d2d;
  --shadow-color: rgba(0,0,0,0.3);
  --btn-danger-bg: #4c1d24;
  --btn-danger-text: #fecdd3;
  --btn-danger-border: #6b212f;
}

body {
  background-color: var(--bg-main);
  color: var(--text-body);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>

<style scoped>
/* --- Global Layout --- */
.admin-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* --- Sidebar Overlay (Mobile) --- */
.sidebar-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

/* --- Sidebar --- */
.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-sidebar);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease, background-color 0.3s, border-color 0.3s;
  box-shadow: 2px 0 10px var(--shadow-color);
}

.admin-sidebar.is-open {
  transform: translateX(0);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-sidebar);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.close-sidebar-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
}
.close-sidebar-btn:hover {
  color: #ef4444;
}

/* --- Navigation --- */
.admin-nav {
  flex: 1;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}

.admin-nav a {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  color: var(--text-body);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.admin-nav a:hover {
  background-color: var(--bg-hover);
  color: #3b82f6;
}

.admin-nav a.router-link-exact-active {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

/* --- Sidebar Footer --- */
.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-sidebar);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.theme-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--bg-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 0.8rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.90rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle-btn:hover {
  background-color: var(--border-color);
}

.logout-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--btn-danger-bg);
  color: var(--btn-danger-text);
  border: 1px solid var(--btn-danger-border);
  padding: 0.8rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background-color: var(--btn-danger-border);
}

/* --- Main Wrapper --- */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* --- Mobile Header --- */
.mobile-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 900;
  transition: background-color 0.3s, border-color 0.3s;
}

.open-sidebar-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  margin-right: 1rem;
  display: flex;
  align-items: center;
  padding: 0.2rem;
}

.mobile-brand {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.theme-toggle-btn-mobile {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  padding: 0.3rem;
  margin-left: 1rem;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-x: hidden;
}

/* --- Responsive Desktop --- */
@media (min-width: 992px) {
  .admin-sidebar {
    transform: translateX(0); /* Always open on desktop */
  }
  
  .close-sidebar-btn {
    display: none; /* Hide close button on desktop */
  }

  .mobile-header {
    display: none; /* Hide mobile header on desktop */
  }

  .main-wrapper {
    margin-left: 260px; /* Offset for sidebar */
  }

  .main-content {
    padding: 2.5rem;
  }
}
</style>