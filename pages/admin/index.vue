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
        <h2 class="widget-title">Resumen de Órdenes (Últimos 7 días)</h2>
        <div class="widget-content chart-container">
          <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
          <p v-else class="empty-text">No hay suficientes datos de órdenes para graficar.</p>
        </div>
      </div>

      <div class="table-widget low-stock-widget">
        <h2 class="widget-title"><AlertTriangleIcon class="icon-danger"/> Alerta de Escasez</h2>
        <div class="widget-content">
          <ul v-if="lowStockItems.length > 0" class="item-list">
            <li v-for="item in lowStockItems" :key="item.id" class="low-stock-item">
              <span>{{ item.name }} <small v-if="item.reference">({{item.reference}})</small></span>
              <span class="stock-badge danger">Stock: {{ item.stock }}</span>
            </li>
          </ul>
          <p v-else class="empty-text success-text">No hay productos con escasez (Stock < 5).</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { AlertTriangleIcon } from 'lucide-vue-next';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const lowStockItems = ref([]);
const chartData = ref({ labels: [], datasets: [] });
const summary = reactive({
  productsCount: 0,
  categoriesCount: 0,
  pendingOrdersCount: 0,
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { stepSize: 1 } }
  }
};

async function fetchData() {
  const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: categoriesCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
  const { count: pendingOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  summary.productsCount = productsCount || 0;
  summary.categoriesCount = categoriesCount || 0;
  summary.pendingOrdersCount = pendingOrdersCount || 0;

  // Process Low Stock (Threshold < 5)
  const { data: products } = await supabase.from('products').select('id, name, stock');
  const { data: variations } = await supabase.from('product_variations').select('id, product_id, reference, stock, products(name)');
  
  const lowItems = [];
  if (products) {
    products.forEach(p => { if (p.stock < 5 && p.stock > 0) lowItems.push(p); });
  }
  if (variations) {
    variations.forEach(v => { 
      if (v.stock < 5) lowItems.push({ id: `var-${v.id}`, name: v.products?.name, reference: v.reference, stock: v.stock }); 
    });
  }
  lowStockItems.value = lowItems.sort((a,b) => a.stock - b.stock).slice(0, 10);

  // Process Chart Data (Last 7 days of Orders)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 days inclusive
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString());

  const datesObj = {};
  for(let i=0; i<7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    datesObj[d.toISOString().split('T')[0]] = 0;
  }
  
  if (recentOrders) {
    recentOrders.forEach(order => {
      const dateKey = order.created_at.split('T')[0];
      if(datesObj[dateKey] !== undefined) datesObj[dateKey]++;
    });
  }

  const sortedDates = Object.keys(datesObj).sort();
  const dateLabels = sortedDates.map(d => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  });
  const dataPoints = sortedDates.map(d => datesObj[d]);

  chartData.value = {
    labels: dateLabels,
    datasets: [{
      label: 'Órdenes',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      pointBackgroundColor: '#2563eb',
      fill: true,
      tension: 0.4,
      data: dataPoints
    }]
  };
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
  background-color: var(--bg-main); 
  color: var(--text-body);          
  max-width: 1400px;       
  margin: 0 auto;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);         
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);         
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
  background-color: var(--bg-card);
  padding: 1.8rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  box-shadow: 0 4px 6px var(--shadow-color);
  border: 1px solid var(--border-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s, border-color 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 15px var(--shadow-color);
}

.metric-icon {
  font-size: 2rem;
  padding: 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.metric-icon.products { background-color: rgba(52, 152, 219, 0.15); color: #2980b9; }
.metric-icon.categories { background-color: rgba(230, 126, 34, 0.15); color: #d35400; }
.metric-icon.orders { background-color: rgba(46, 204, 113, 0.15); color: #27ae60; }

.metric-info h3 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  margin: 0.3rem 0 0 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
}

/* --- Widgets de Tablas --- */
.tables-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.table-widget {
  background-color: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 4px 6px var(--shadow-color);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s, border-color 0.3s;
  overflow: hidden; /* Ensure headers don't spill out */
}

.widget-title {
  padding: 1.2rem 1.5rem;
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.widget-content {
  padding: 0;
  flex: 1;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-list li {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;
  color: var(--text-body);
}

.item-list li:last-child {
  border-bottom: none;
}

.item-list li:hover {
  background-color: var(--bg-hover);
}

.item-name {
  font-weight: 600;
  color: var(--text-primary);
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

.stock-badge.danger {
  background-color: #fee2e2;
  color: #dc2626;
}

.empty-text {
  color: #adb5bd;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.success-text {
  color: #10b981;
  font-weight: 500;
}

.chart-container {
  height: 300px;
  position: relative;
}

.icon-danger {
  color: #e11d48;
  margin-right: 0.5rem;
  vertical-align: text-bottom;
}

.low-stock-widget .widget-title {
  color: #e11d48;
  background-color: #fff1f2;
  border-bottom-color: #ffe4e6;
}

.low-stock-item small {
  color: #6c757d;
  margin-left: 0.3rem;
}

@media (min-width: 768px) {
  .dashboard-container { padding: 2rem; }
  .title { font-size: 2.2rem; }
  .tables-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>