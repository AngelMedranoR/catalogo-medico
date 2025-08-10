<template>
  <div class="orders-container">
    <h1 class="title">Gestión de Órdenes</h1>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else-if="orders.length === 0" class="empty-state">
      <p>🎉</p>
      <h2>No hay órdenes pendientes.</h2>
      <p>Cuando un cliente realice un nuevo pedido, aparecerá aquí.</p>
    </div>

    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="card-header">
          <div>
            <h3 class="customer-name">{{ order.customer_name }}</h3>
            <p class="order-date">{{ formatDate(order.created_at) }}</p>
          </div>
          <div :class="['status-badge', `status-${order.status}`]">{{ order.status }}</div>
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
            @click="confirmOrder(order)" 
            class="action-button confirm"
            :disabled="order.status === 'confirmed'"
          >
            <span class="icon">✓</span> Confirmar
          </button>
          <button @click="deleteOrder(order.id)" class="action-button delete">
            <span class="icon">×</span> Eliminar
          </button>
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
import { ref, onMounted } from 'vue';

const supabase = useSupabaseClient();
const orders = ref([]);
const loading = ref(true);

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

const confirmOrder = async (order) => {
  if (order.status === 'confirmed') return;

  try {
    for (const item of order.products) {
      // Determinar si es un producto con variación o un producto simple
      if (item.variation_id) {
        // Es una variación, actualizar el stock en product_variations
        const { data: variation, error: fetchVariationError } = await supabase
          .from('product_variations')
          .select('stock')
          .eq('id', item.variation_id)
          .single();

        if (fetchVariationError) {
          console.error(`Variación de producto no encontrada: ${item.name} (ID de Variación: ${item.variation_id})`);
          throw fetchVariationError;
        }

        const newVariationStock = variation.stock - item.quantity;

        const { error: updateVariationError } = await supabase
          .from('product_variations')
          .update({ stock: newVariationStock })
          .eq('id', item.variation_id);

        if (updateVariationError) throw updateVariationError;

      } else {
        // Es un producto simple, actualizar el stock en products
        const { data: product, error: fetchProductError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (fetchProductError) {
          console.error(`Producto no encontrado: ${item.name} (ID: ${item.id})`);
          throw fetchProductError;
        }

        const newProductStock = product.stock - item.quantity;

        const { error: updateProductError } = await supabase
          .from('products')
          .update({ stock: newProductStock })
          .eq('id', item.id);

        if (updateProductError) throw updateProductError;
      }
    }

    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', order.id);

    if (orderError) throw orderError;

    fetchOrders();
  } catch (error) {
    console.error('Error confirming order:', error.message);
    alert('Hubo un error al confirmar la orden. Revisa la consola.');
  }
};

const deleteOrder = async (orderId) => {
  if (!confirm('¿Estás seguro de que quieres eliminar esta orden? Esta acción no se puede deshacer.')) return;
  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
    fetchOrders();
  } catch (error) {
    console.error('Error deleting order:', error.message);
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
  padding: 1rem;
  background-color: #121212;
  color: #e0e0e0;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  color: #fff;
}

/* --- Estados de Carga y Vacío --- */
.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #1e1e1e;
  border-radius: 12px;
}
.empty-state h2 {
  margin: 1rem 0 0.5rem;
  color: #fff;
}
.empty-state p {
  color: #aaa;
}
.empty-state p:first-child { font-size: 2.5rem; margin: 0; }

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
  gap: 1.5rem;
}

.order-card {
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.order-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 1.5rem;
  background-color: #242424;
  border-bottom: 1px solid #333;
}

.customer-name { margin: 0; font-size: 1.2rem; color: #fff; }
.order-date { margin: 0.25rem 0 0; font-size: 0.8rem; color: #aaa; }

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}
.status-pending { background-color: #f0ad4e; color: #111; }
.status-confirmed { background-color: #5cb85c; color: #fff; }

.card-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}
.detail-label { color: #aaa; }
.detail-value { color: #fff; font-weight: 500; }
.total-price { font-size: 1.2rem; color: #5cb85c; }

.products-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}
.products-title { margin: 0 0 1rem; font-size: 1rem; color: #fff; }
.products-list-items { list-style: none; padding: 0; margin: 0; }
.products-list-items li {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  color: #ccc;
}
.product-quantity { font-weight: bold; color: #fff; }

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: #333;
}

.action-button {
  padding: 1rem;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 1rem;
  background-color: #242424;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.action-button:hover { background-color: #444; }
.action-button.confirm { color: #5cb85c; }
.action-button.confirm:disabled { color: #666; background-color: #222; cursor: not-allowed; }
.action-button.delete { color: #dc3545; }

/* --- Media Query para Tablets y Escritorios Pequeños --- */
@media (min-width: 768px) {
  .orders-container { padding: 2rem; }
  .title { font-size: 2.2rem; }
  .orders-list {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
}

</style>