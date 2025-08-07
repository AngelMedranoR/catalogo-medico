<template>
  <div class="dashboard-container">
    <h1 class="title">Dashboard</h1>
    <p class="subtitle">Resumen general de tu catálogo y actividad.</p>

    <!-- Métricas Principales -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon products">📦</div>
        <div class="metric-info">
          <p class="metric-value">{{ summary.productsCount }}</p>
          <p class="metric-label">Productos Totales</p>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon categories">🏷️</div>
        <div class="metric-info">
          <p class="metric-value">{{ summary.categoriesCount }}</p>
          <p class="metric-label">Categorías</p>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon orders">📝</div>
        <div class="metric-info">
          <p class="metric-value">{{ summary.pendingOrdersCount }}</p>
          <p class="metric-label">Órdenes Pendientes</p>
        </div>
      </div>
    </div>

    <!-- Tablas de Resumen -->
    <div class="tables-grid">
      <div class="table-widget">
        <h2 class="widget-title">Productos Recientes</h2>
        <div class="widget-content">
          <ul v-if="recentProducts.length > 0" class="item-list">
            <li v-for="product in recentProducts" :key="product.id">
              <span>{{ product.name }}</span>
              <span class="stock-badge">Stock: {{ product.displayStock }}</span>
            </li>
          </ul>
          <p v-else class="empty-text">No hay productos para mostrar.</p>
        </div>
      </div>

      <div class="table-widget">
        <h2 class="widget-title">Categorías</h2>
        <div class="widget-content">
          <ul v-if="categories.length > 0" class="item-list">
            <li v-for="category in categories" :key="category.id">
              <span>{{ category.name }}</span>
            </li>
          </ul>
          <p v-else class="empty-text">No hay categorías registradas.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const rawRecentProducts = ref([]);
const categories = ref([]);
const summary = reactive({
  productsCount: 0,
  categoriesCount: 0,
  pendingOrdersCount: 0,
});

const recentProducts = computed(() => {
  return rawRecentProducts.value.map(product => {
    let totalStock = 0;
    if (product.product_variations && product.product_variations.length > 0) {
      totalStock = product.product_variations.reduce((sum, variation) => sum + (variation.stock || 0), 0);
    } else {
      totalStock = product.stock || 0;
    }
    return {
      ...product,
      displayStock: totalStock
    };
  });
});

async function fetchData() {
  const { data: productData } = await supabase
    .from('products')
    .select('id, name, stock, product_variations(stock)')
    .order('created_at', { ascending: false })
    .limit(5);
  rawRecentProducts.value = productData || [];

  const { data: categoryData } = await supabase.from('categories').select('id, name');
  categories.value = categoryData || [];

  const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: categoriesCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: pendingOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  summary.productsCount = productsCount || 0;
  summary.categoriesCount = categoriesCount || 0;
  summary.pendingOrdersCount = pendingOrdersCount || 0;
}

onMounted(fetchData);
</script>

<style scoped>
.dashboard-container {
  padding: 1rem;
  background-color: #121212;
  color: #e0e0e0;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 1.8rem;
  color: #fff;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #aaa;
  margin-bottom: 2rem;
}

/* --- Métricas --- */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.metric-card {
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.metric-icon {
  font-size: 2.5rem;
  padding: 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.metric-icon.products { background-color: rgba(52, 152, 219, 0.1); }
.metric-icon.categories { background-color: rgba(230, 126, 34, 0.1); }
.metric-icon.orders { background-color: rgba(241, 196, 15, 0.1); }

.metric-info .metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  margin: 0;
}

.metric-info .metric-label {
  font-size: 0.9rem;
  color: #aaa;
  margin: 0;
}

/* --- Widgets de Tablas --- */
.tables-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.table-widget {
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 12px;
}

.widget-title {
  font-size: 1.2rem;
  padding: 1rem 1.5rem;
  margin: 0;
  border-bottom: 1px solid #333;
  color: #fff;
}

.widget-content {
  padding: 1.5rem;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  border-bottom: 1px solid #2a2a2a;
}

.item-list li:last-child {
  border-bottom: none;
}

.stock-badge {
  background-color: #333;
  color: #ccc;
  padding: 0.2rem 0.6rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.empty-text {
  color: #888;
  text-align: center;
  padding: 1rem;
}

@media (min-width: 768px) {
  .dashboard-container { padding: 2rem; }
  .title { font-size: 2.2rem; }
  .tables-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>