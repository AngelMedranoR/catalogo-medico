<template>
  <div class="orders-container">
    <h1 class="title">Gestión de Órdenes</h1>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else>
      <!-- Filtros por Tabs -->
      <div class="tabs-container">
        <button 
          v-for="tab in ['pending', 'confirmed', 'shipped', 'cancelled', 'all']" 
          :key="tab"
          @click="currentFilter = tab"
          :class="['tab-button', { active: currentFilter === tab }]"
        >
          {{ tabLabels[tab] }}
        </button>
      </div>

      <div v-if="filteredOrders.length === 0" class="empty-state">
        <p>🎉</p>
        <h2>No hay órdenes en esta categoría.</h2>
        <p>Cuando un cliente realice un nuevo pedido o cambie de estado, aparecerá aquí.</p>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in filteredOrders" :key="order.id" class="order-card">
        <div class="card-header">
          <div>
            <h3 class="customer-name">{{ order.customer_name }}</h3>
            <p class="order-date">{{ formatDate(order.created_at) }}</p>
          </div>
          <div :class="['status-badge', `status-${order.status}`]">{{ tabLabels[order.status] || order.status }}</div>
        </div>

        <div class="card-body">
          <div class="detail-row">
            <span class="detail-label">Teléfono:</span>
            <span class="detail-value">{{ order.customer_phone }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">RIF:</span>
            <span class="detail-value">{{ order.rif }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Entrega:</span>
            <span class="detail-value">{{ order.delivery_method }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pago:</span>
            <span class="detail-value">{{ order.payment_method }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total:</span>
            <span class="detail-value total-price">${{ formatCurrency(order.total) }}</span>
          </div>

          <div class="products-section">
            <h4 class="products-title">Productos</h4>
            <ul class="products-list-items">
              <li v-for="product in order.products" :key="product.id">
                <span>{{ product.name }} <span v-if="product.reference">({{ product.reference }})</span></span>
                <span class="product-quantity">x{{ product.quantity }} - ${{ formatCurrency(product.price) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="card-actions">
          <button 
            v-if="order.status === 'pending'"
            @click="changeOrderStatus(order, 'confirmed')" 
            class="action-button confirm"
          >
            <span class="icon">✓</span> Confirmar Recepción
          </button>
          
          <button 
            v-if="order.status === 'confirmed'"
            @click="changeOrderStatus(order, 'shipped')" 
            class="action-button ship"
          >
            <span class="icon">🚚</span> Marcar Enviada
          </button>

          <button 
            v-if="order.status === 'pending' || order.status === 'confirmed'"
            @click="cancelOrder(order)" 
            class="action-button cancel"
          >
            <span class="icon">×</span> Cancelar Orden
          </button>

          <button @click="deleteOrder(order.id)" class="action-button delete">
            <span class="icon">🗑️</span> Eliminar
          </button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();
const supabase = useSupabaseClient();
const orders = ref([]);
const loading = ref(true);
const currentFilter = ref('pending');

const tabLabels = {
  'pending': 'Pendiente',
  'confirmed': 'Confirmada',
  'shipped': 'Enviada',
  'cancelled': 'Cancelada',
  'all': 'Todas las Órdenes'
};

const filteredOrders = computed(() => {
  if (currentFilter.value === 'all') return orders.value;
  return orders.value.filter(o => o.status === currentFilter.value);
});

const fetchOrders = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    orders.value = data;
  } catch (error) {
    console.error('Error fetching orders:', error.message);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOrders);

const changeOrderStatus = async (order, newStatus) => {
  try {
    // Si la orden pasa de pendiente a confirmada, descontar inventario.
    if (order.status === 'pending' && newStatus === 'confirmed') {
      for (const item of order.products) {
        if (item.variation_id) {
          const { data: variation, error: fetchVariationError } = await supabase.from('product_variations').select('stock').eq('id', item.variation_id).single();
          if (fetchVariationError) throw fetchVariationError;
          await supabase.from('product_variations').update({ stock: variation.stock - item.quantity }).eq('id', item.variation_id);
        } else {
          const { data: product, error: fetchProductError } = await supabase.from('products').select('stock').eq('id', item.id).single();
          if (fetchProductError) throw fetchProductError;
          await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.id);
        }
      }
    }

    const { error: orderError } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (orderError) throw orderError;

    toast.success(`Orden #${order.id.split('-')[0]} marcada como ${tabLabels[newStatus]}`);
    fetchOrders();
  } catch (error) {
    console.error(`Error cambiando orden a ${newStatus}:`, error.message);
    toast.error('Hubo un error al actualizar el estado de la orden');
  }
};

const cancelOrder = async (order) => {
  if (!confirm('¿Seguro quieres cancelar esta orden? (Si ya estaba confirmada, el stock se devolverá)')) return;
  
  try {
    // Si la orden ya estaba confirmada, debemos regresar su stock para no perderlo.
    if (order.status === 'confirmed') {
      for (const item of order.products) {
        if (item.variation_id) {
          const { data: variation } = await supabase.from('product_variations').select('stock').eq('id', item.variation_id).single();
          await supabase.from('product_variations').update({ stock: variation.stock + item.quantity }).eq('id', item.variation_id);
        } else {
          const { data: product } = await supabase.from('products').select('stock').eq('id', item.id).single();
          await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.id);
        }
      }
    }

    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    if (error) throw error;
    
    toast.info(`Orden #${order.id.split('-')[0]} ha sido Cancelada.`);
    fetchOrders();
  } catch(error) {
    console.error('Error canceling order:', error.message);
    toast.error('Ocurrió un error cancelando la orden');
  }
};

const deleteOrder = async (orderId) => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta orden PERMANENTEMENTE?')) return;
  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
    toast.success('Orden eliminada exitosamente');
    fetchOrders();
  } catch (error) {
    console.error('Error deleting order:', error.message);
    toast.error('Ocurrió un error al eliminar');
  }
};

const formatCurrency = (value) => (typeof value === 'number' ? value.toFixed(2) : '0.00');
const formatDate = (date) => new Date(date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' });
</script>

<style scoped>
/* --- Mejoras Responsive para Móviles --- */
@media (max-width: 479px) {
  .orders-container {
    padding: 0.3rem 0.1rem;
  }
  .title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  .loading-state, .empty-state {
    padding: 2rem 0.5rem;
    border-radius: 7px;
  }
  .orders-list {
    gap: 0.7rem;
  }
  .order-card {
    border-radius: 7px;
  }
  .card-header {
    padding: 0.7rem 0.7rem;
  }
  .customer-name {
    font-size: 1rem;
  }
  .order-date {
    font-size: 0.7rem;
  }
  .status-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
  }
  .card-body {
    padding: 0.7rem;
  }
  .detail-row {
    margin-bottom: 0.5rem;
    font-size: 0.97rem;
  }
  .total-price {
    font-size: 1rem;
  }
  .products-section {
    margin-top: 1rem;
    padding-top: 1rem;
  }
  .products-title {
    font-size: 0.95rem;
  }
  .products-list-items li {
    padding: 0.2rem 0;
    font-size: 0.97rem;
  }
  .product-quantity {
    font-size: 0.97rem;
  }
  .card-actions {
    grid-template-columns: 1fr;
  }
  .action-button {
    padding: 0.7rem;
    font-size: 0.97rem;
    border-radius: 6px;
  }
}
.orders-container {
  padding: 1.5rem;
  background-color: var(--bg-main); 
  color: var(--text-body);             
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* --- Estados de Carga y Vacío --- */
.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 6px var(--shadow-color);
}
.empty-state h2 {
  margin: 1rem 0 0.5rem;
  color: var(--text-primary);
  font-weight: 600;
}
.empty-state p {
  color: var(--text-secondary);
}
.empty-state p:first-child { font-size: 3rem; margin: 0; }

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Diseño de Tarjetas para Órdenes --- */
.orders-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.order-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px var(--shadow-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s, border-color 0.3s;
}
.order-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px var(--shadow-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.2rem 1.5rem;
  background-color: var(--bg-hover);
  border-bottom: 1px solid var(--border-color);
}

.customer-name { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
.order-date { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; }

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-pending { background-color: rgba(240, 173, 78, 0.15); color: #d35400; }
.status-confirmed { background-color: rgba(92, 184, 92, 0.15); color: #27ae60; }

.card-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 0.4rem;
}
.detail-label { color: var(--text-secondary); font-weight: 500; }
.detail-value { color: var(--text-primary); font-weight: 600; }
.total-price { font-size: 1.2rem; color: #27ae60; font-weight: 800; }

.products-section {
  margin-top: 1.5rem;
  padding-top: 1.2rem;
  border-top: 1.5px solid var(--border-color);
}
.products-title { margin: 0 0 1rem; font-size: 1.1rem; color: var(--text-primary); font-weight: 600; }
.products-list-items { list-style: none; padding: 0; margin: 0; }
.products-list-items li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: var(--text-body);
  font-weight: 500;
}
.product-quantity { font-weight: bold; color: var(--text-primary); }

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: var(--border-color);
  border-top: 1px solid var(--border-color);
}

.action-button {
  padding: 1.2rem;
  border: none;
  cursor: pointer;
  color: var(--text-body);
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--bg-hover);
  transition: all 0.2s ease, background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.action-button:hover { background-color: var(--bg-card); z-index: 1; position: relative; box-shadow: 0 0 10px var(--shadow-color); }
.action-button.confirm { color: #27ae60; }
.action-button.confirm:hover { color: #1e8449; }
.action-button.confirm:disabled { color: var(--text-secondary); background-color: var(--border-color); cursor: not-allowed; box-shadow: none; }
.action-button.delete { color: #ef4444; }
.action-button.delete:hover { color: #b91c1c; }

/* --- Tabs Filter --- */
.tabs-container {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.tab-button {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease, background-color 0.3s;
  white-space: nowrap;
}

.tab-button:hover {
  background-color: var(--bg-hover);
  color: #3b82f6;
}

.tab-button.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.status-shipped { background-color: #cff4fc; color: #055160; }
.status-cancelled { background-color: #f8d7da; color: #842029; }

.action-button.ship { color: #055160; }
.action-button.ship:hover { color: #022b33; }
.action-button.cancel { color: #842029; }
.action-button.cancel:hover { color: #400a10; }

/* --- Media Query para Tablets y Escritorios Pequeños --- */
@media (min-width: 768px) {
  .orders-container { padding: 2rem; }
  .title { font-size: 2.2rem; }
  .orders-list {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
}

</style>