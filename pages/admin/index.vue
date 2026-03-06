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
/* --- Mejoras Responsive para Móviles --- */
@media (max-width: 479px) {
  .dashboard-container {
    padding: 0.3rem 0.1rem;
  }
  .title {
    font-size: 1.1rem;
    margin-bottom: 0.3rem;
  }
  .subtitle {
    font-size: 0.98rem;
    margin-bottom: 1rem;
  }
  .metrics-grid {
    gap: 0.7rem;
    margin-bottom: 1.2rem;
  }
  .metric-card {
    padding: 0.7rem;
    border-radius: 7px;
    gap: 0.7rem;
  }
  .metric-icon {
    font-size: 1.5rem;
    padding: 0.5rem;
    border-radius: 50%;
  }
  .metric-info .metric-value {
    font-size: 1.1rem;
  }
  .tables-grid {
    gap: 0.7rem;
  }
  .table-widget {
    border-radius: 7px;
  }
  .widget-title {
    font-size: 0.98rem;
    padding: 0.7rem 1rem;
  }
  .widget-content {
    padding: 0.7rem;
  }
  .item-list li {
    padding: 0.5rem 0;
    font-size: 0.97rem;
  }
  .stock-badge {
    font-size: 0.8rem;
    padding: 0.1rem 0.4rem;
  }
  .empty-text {
    padding: 0.7rem;
    font-size: 0.98rem;
  }
}
.dashboard-container {
  padding: 1.5rem;
  background-color: #f8f9fa; /* Lighter background for a cleaner look */
  color: #333;             /* Darker text for contrast */
  max-width: 1400px;       /* Wider layout */
  margin: 0 auto;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;         /* Deep blue-gray for titles */
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6c757d;         /* Soft gray for subtitles */
  font-size: 1.1rem;
  margin-bottom: 2.5rem;
}

/* --- Métricas --- */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Slightly wider cards */
  gap: 2rem;
  margin-bottom: 3rem;
}

.metric-card {
  background-color: #ffffff;  /* White cards */
  border: 1px solid #e9ecef;  /* Subtle border */
  border-radius: 16px;        /* Rounder corners */
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); /* Soft shadow */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  font-size: 2.5rem;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f3f5; /* Light gray fallback background */
}
.metric-icon.products { background-color: rgba(52, 152, 219, 0.15); color: #2980b9; }
.metric-icon.categories { background-color: rgba(230, 126, 34, 0.15); color: #d35400; }
.metric-icon.orders { background-color: rgba(46, 204, 113, 0.15); color: #27ae60; }

.metric-info .metric-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
}

.metric-info .metric-label {
  font-size: 1rem;
  color: #6c757d;
  font-weight: 500;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* --- Widgets de Tablas --- */
.tables-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.table-widget {
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  overflow: hidden; /* Ensure headers don't spill out */
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 600;
  padding: 1.2rem 1.5rem;
  margin: 0;
  background-color: #f8f9fa; /* Subtle header background */
  border-bottom: 1px solid #e9ecef;
  color: #2c3e50;
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
  padding: 1rem 0;
  border-bottom: 1px solid #f1f3f5;
  color: #495057;
  font-weight: 500;
}

.item-list li:last-child {
  border-bottom: none;
  padding-bottom: 0; /* Remove padding for the last item for visual balance */
}

.stock-badge {
  background-color: #e9ecef;
  color: #495057;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.empty-text {
  color: #adb5bd;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

@media (min-width: 768px) {
  .dashboard-container { padding: 2rem; }
  .title { font-size: 2.2rem; }
  .tables-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>