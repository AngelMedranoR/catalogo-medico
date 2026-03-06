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
  padding: 1.5rem;
  background-color: #f8f9fa; /* Lighter background for a cleaner look */
  color: #333;             /* Darker text for contrast */
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
}

/* --- Estados de Carga y Vacío --- */
.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
}
.empty-state h2 {
  margin: 1rem 0 0.5rem;
  color: #2c3e50;
  font-weight: 600;
}
.empty-state p {
  color: #6c757d;
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
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.order-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.2rem 1.5rem;
  background-color: #f1f3f5;
  border-bottom: 1px solid #e9ecef;
}

.customer-name { margin: 0; font-size: 1.25rem; font-weight: 600; color: #2c3e50; }
.order-date { margin: 0.25rem 0 0; font-size: 0.85rem; color: #6c757d; font-weight: 500; }

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
  border-bottom: 1px dashed #f1f3f5;
  padding-bottom: 0.4rem;
}
.detail-label { color: #6c757d; font-weight: 500; }
.detail-value { color: #2c3e50; font-weight: 600; }
.total-price { font-size: 1.2rem; color: #27ae60; font-weight: 800; }

.products-section {
  margin-top: 1.5rem;
  padding-top: 1.2rem;
  border-top: 1.5px solid #e9ecef;
}
.products-title { margin: 0 0 1rem; font-size: 1.1rem; color: #2c3e50; font-weight: 600; }
.products-list-items { list-style: none; padding: 0; margin: 0; }
.products-list-items li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #495057;
  font-weight: 500;
}
.product-quantity { font-weight: bold; color: #2c3e50; }

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: #e9ecef;
  border-top: 1px solid #e9ecef;
}

.action-button {
  padding: 1.2rem;
  border: none;
  cursor: pointer;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.action-button:hover { background-color: #ffffff; z-index: 1; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
.action-button.confirm { color: #27ae60; }
.action-button.confirm:hover { color: #1e8449; }
.action-button.confirm:disabled { color: #adb5bd; background-color: #e9ecef; cursor: not-allowed; box-shadow: none; }
.action-button.delete { color: #ef4444; }
.action-button.delete:hover { color: #b91c1c; }

/* --- Media Query para Tablets y Escritorios Pequeños --- */
@media (min-width: 768px) {
  .orders-container { padding: 2rem; }
  .title { font-size: 2.2rem; }
  .orders-list {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
}

</style>